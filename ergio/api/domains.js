// ========================================
// ERGIO API — /api/domains (Subdomain + Custom Domain Management)
// POST: Register/update subdomain or custom domain
// GET: Lookup domain → redirect to website
// DELETE: Remove custom domain
// ========================================

import { success, error, corsHeaders, getSupabase } from '../lib/ergio.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = getSupabase();

  // POST: Register or update domain
  if (req.method === 'POST') {
    let body = {};
    if (typeof req.body === 'object' && req.body !== null) body = req.body;
    else { try { body = JSON.parse(req.body || '{}'); } catch { body = {}; } }

    const { type, slug, customDomain, businessName, userId } = body;

    if (!type) return error(res, 'type is required (subdomain | custom)', 400);

    try {
      if (type === 'subdomain') {
        if (!slug) return error(res, 'slug is required for subdomain', 400);
        const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');
        if (cleanSlug.length < 3) return error(res, 'Subdomain must be at least 3 characters', 400);
        if (cleanSlug.length > 63) return error(res, 'Subdomain must be less than 63 characters', 400);

        const fullDomain = `${cleanSlug}.ergio.app`;
        const deployUrl = `https://${fullDomain}`;

        if (supabase) {
          await supabase.from('domains').upsert({
            type: 'subdomain',
            slug: cleanSlug,
            domain: fullDomain,
            business_name: businessName,
            user_id: userId,
            status: 'active',
            created_date: new Date().toISOString()
          }).eq('slug', cleanSlug);
        }

        return success(res, {
          type: 'subdomain',
          slug: cleanSlug,
          domain: fullDomain,
          url: deployUrl,
          status: 'active'
        });
      }

      if (type === 'custom') {
        if (!customDomain) return error(res, 'customDomain is required', 400);
        const cleanDomain = customDomain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
        
        if (!/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/.test(cleanDomain)) {
          return error(res, 'Invalid domain format. Example: www.yourbusiness.com', 400);
        }

        const ergioSubdomain = slug ? `${slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')}.ergio.app` : null;

        if (supabase) {
          await supabase.from('domains').upsert({
            type: 'custom',
            domain: cleanDomain,
            ergio_subdomain: ergioSubdomain,
            business_name: businessName,
            user_id: userId,
            status: 'pending_dns',
            ssl_status: 'pending',
            created_date: new Date().toISOString()
          }).eq('domain', cleanDomain);
        }

        return success(res, {
          type: 'custom',
          domain: cleanDomain,
          ergioSubdomain,
          dnsRecords: {
            A: '76.76.19.61',
            CNAME: 'cname.ergio.app',
            TXT: 'ergio-verify=' + Buffer.from(cleanDomain).toString('base64').substring(0, 20)
          },
          sslStatus: 'pending',
          status: 'pending_dns',
          message: 'Add the DNS records at your registrar. SSL auto-provisions in 2-5 minutes.'
        });
      }

      return error(res, 'Invalid type. Use subdomain or custom.', 400);
    } catch (e) {
      return error(res, e.message, 500);
    }
  }

  // GET: Lookup domain
  if (req.method === 'GET') {
    const domain = req.query.domain || '';
    const slug = req.query.slug || '';

    if (!domain && !slug) return error(res, 'domain or slug is required', 400);

    try {
      if (supabase) {
        let query = supabase.from('domains').select('*');
        if (domain) query = query.eq('domain', domain);
        else query = query.eq('slug', slug);

        const { data, error: dbError } = await query.order('created_date', { ascending: false }).limit(1).single();

        if (data) {
          return success(res, { domain: data });
        }
      }

      if (slug) {
        return success(res, {
          domain: {
            slug,
            domain: `${slug}.ergio.app`,
            url: `https://${slug}.ergio.app`,
            status: 'active'
          }
        });
      }

      return error(res, 'Domain not found', 404);
    } catch (e) {
      return error(res, e.message, 500);
    }
  }

  // DELETE: Remove custom domain
  if (req.method === 'DELETE') {
    const domain = req.query.domain;
    if (!domain) return error(res, 'domain is required', 400);

    try {
      if (supabase) {
        await supabase.from('domains').delete().eq('domain', domain);
      }
      return success(res, { message: 'Domain removed', domain });
    } catch (e) {
      return error(res, e.message, 500);
    }
  }

  return error(res, 'Method not allowed', 405);
}
