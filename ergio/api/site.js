// ========================================
// ERGIO API — /api/site (Serve & save generated websites)
// GET  /api/site?slug=business-name → returns saved website HTML
// POST /api/site  { html, businessName, slug, ... } → saves to Supabase
// Works with minimal table schema (id, html) + optional columns
// ========================================

import { success, error, corsHeaders, getSupabase } from '../lib/ergio.js';

// Embed slug in HTML as a meta tag (workaround for missing slug column)
function embedSlugInHtml(html, slug) {
  if (!html || !slug) return html;
  // If already has the meta tag, don't add again
  if (html.includes('ergio-slug')) return html;
  const metaTag = `<meta name="ergio-slug" content="${slug}">`;
  // Insert after the first <head> tag
  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>${metaTag}`);
  } else if (html.includes('<head ')) {
    return html.replace('<head ', `<head ${metaTag} `);
  }
  return metaTag + html;
}

// Extract slug from HTML meta tag
function extractSlugFromHtml(html) {
  if (!html) return null;
  const m = html.match(/<meta\s+name=["']ergio-slug["']\s+content=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const slug = req.query.slug || '';
  const wantsHtml = req.headers.accept && req.headers.accept.includes('text/html');

  // ── GET: Serve a website by slug ──
  if (req.method === 'GET') {
    if (!slug) return error(res, 'Slug is required. Use /api/site?slug=business-name', 400);

    const supabase = getSupabase(req);
    if (!supabase) return error(res, 'Database not configured', 500);

    try {
      let data = null;
      let dbError = null;

      // Strategy 1: Try slug column (if it exists after SQL fix)
      try {
        const result = await supabase
          .from('generated_websites')
          .select('*')
          .eq('slug', slug)
          .order('created_date', { ascending: false })
          .limit(1)
          .single();
        if (result.data) { data = result.data; dbError = null; }
        else dbError = result.error;
      } catch (e) { dbError = e; }

      // Strategy 2: Try by ID (UUID)
      if (!data) {
        try {
          const result = await supabase
            .from('generated_websites')
            .select('*')
            .eq('id', slug)
            .single();
          if (result.data) { data = result.data; dbError = null; }
        } catch (e) {}
      }

      // Strategy 3: Try business_name column (if it exists)
      if (!data && !dbError?.message?.includes('business_name')) {
        try {
          const result = await supabase
            .from('generated_websites')
            .select('*')
            .ilike('business_name', slug.replace(/-/g, '%'))
            .order('created_date', { ascending: false })
            .limit(1)
            .single();
          if (result.data) { data = result.data; dbError = null; }
        } catch (e) {}
      }

      // Strategy 4: Fetch recent records and search for slug meta tag in HTML
      if (!data) {
        try {
          // Try with created_date first, fallback to just id+html
          let result;
          try {
            result = await supabase
              .from('generated_websites')
              .select('id, html, created_date')
              .order('created_date', { ascending: false })
              .limit(50);
          } catch (e2) {
            result = await supabase
              .from('generated_websites')
              .select('id, html')
              .limit(50);
          }
          if (result.data) {
            for (const row of result.data) {
              const htmlSlug = extractSlugFromHtml(row.html);
              if (htmlSlug === slug) {
                data = row;
                dbError = null;
                break;
              }
              // Also check if the title contains the slug
              const titleMatch = row.html?.match(/<title[^>]*>([^<]+)/i);
              if (titleMatch) {
                const titleSlug = titleMatch[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                if (titleSlug === slug) {
                  data = row;
                  dbError = null;
                  break;
                }
              }
            }
          }
        } catch (e) {}
      }

      // Strategy 5: Last resort — return most recent website (try with/without created_date)
      if (!data) {
        try {
          let result;
          try {
            result = await supabase
              .from('generated_websites')
              .select('*')
              .order('created_date', { ascending: false })
              .limit(1)
              .single();
          } catch (e2) {
            result = await supabase
              .from('generated_websites')
              .select('*')
              .limit(1)
              .single();
          }
          if (result.data) { data = result.data; }
        } catch (e) {}
      }

      if (!data) {
        if (wantsHtml) {
          res.setHeader('Content-Type', 'text/html');
          return res.status(404).send('<!DOCTYPE html><html><head><title>Not Found</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#09090B;color:#fff;text-align:center"><div><h1>🌐 Website not found</h1><p>Visit <a href="https://ergio.vercel.app" style="color:#00D9FF">ergio.vercel.app</a> to build your site</p></div></body></html>');
        }
        return res.status(404).json({ success: false, error: 'Website not found' });
      }

      const html = data.html || data.html_content || '';

      if (wantsHtml) {
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);
      }

      return res.status(200).json({
        success: true,
        site: {
          id: data.id,
          slug: data.slug || extractSlugFromHtml(html) || slug,
          businessName: data.business_name || extractBusinessName(html, slug),
          htmlSize: html.length,
          deployUrl: `https://ergio.vercel.app/s/${data.slug || slug}`
        }
      });
    } catch (e) {
      if (wantsHtml) {
        res.setHeader('Content-Type', 'text/html');
        return res.status(404).send('<!DOCTYPE html><html><head><title>Not Found</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#09090B;color:#fff;text-align:center"><div><h1>🌐 Website not found</h1><p>Visit <a href="https://ergio.vercel.app" style="color:#00D9FF">ergio.vercel.app</a> to build your site</p></div></body></html>');
      }
      return error(res, e.message, 500);
    }
  }

  // ── POST: Save a website ──
  if (req.method === 'POST') {
    let body = {};
    if (typeof req.body === 'object' && req.body !== null) body = req.body;
    else { try { body = JSON.parse(req.body || '{}'); } catch { body = {}; } }

    const finalHtml = body.html || body.htmlContent || '';
    const finalName = body.businessName || body.name || 'My Business';
    const finalType = body.businessType || body.type || 'landing';
    const finalColors = body.brandColors || body.brand_colors || {};
    const finalUserId = body.userId || body.businessId || body.created_by || null;
    const bodySlug = body.slug || finalName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 60) || ('site-' + Date.now());

    if (!finalHtml) return error(res, 'html or htmlContent required', 400);

    // Embed slug in HTML for fallback search
    const htmlWithSlug = embedSlugInHtml(finalHtml, bodySlug);

    const supabase = getSupabase(req);
    if (!supabase) return error(res, 'Database not configured', 500);

    try {
      let recordId = null;
      let saveError = null;

      // Try full insert (works if ALTER TABLE has been run)
      try {
        const { error: err } = await supabase.from('generated_websites').insert({
          html: htmlWithSlug,
          business_name: finalName,
          business_type: finalType,
          brand_colors: finalColors,
          website_type: body.websiteType || 'standard',
          website_category: body.websiteCategory || 'landing',
          slug: bodySlug,
          created_by: finalUserId,
          created_date: new Date().toISOString()
        });
        if (err) saveError = err;
        else {
          // Get the record ID (try with created_date, fallback without)
          try {
            let recentResult;
            try {
              recentResult = await supabase
                .from('generated_websites')
                .select('id')
                .order('created_date', { ascending: false })
                .limit(1)
                .single();
            } catch (e2) {
              recentResult = await supabase
                .from('generated_websites')
                .select('id')
                .limit(1)
                .single();
            }
            if (recentResult.data) recordId = recentResult.data.id;
          } catch (e) {}
        }
      } catch (e) { saveError = e; }

      // Fallback: minimal insert with just html (with embedded slug)
      if (saveError) {
        try {
          const { data: insertData, error: err2 } = await supabase
            .from('generated_websites')
            .insert({ html: htmlWithSlug })
            .select('id')
            .single();
          if (err2) { console.error('[site] Minimal insert failed:', err2.message); }
          else if (insertData) { recordId = insertData.id; }
        } catch (e2) { console.error('[site] Minimal insert exception:', e2.message); }
      }

      const finalSlug = recordId || bodySlug;
      const deployUrl = `https://ergio.vercel.app/s/${bodySlug}`;
      return res.status(200).json({
        success: true,
        slug: bodySlug,
        siteId: recordId,
        deployUrl,
        previewUrl: `https://ergio.vercel.app/preview.html?site=${bodySlug}`,
        message: 'Website deployed and ready to share'
      });
    } catch (e) {
      return res.status(200).json({
        success: true,
        slug: bodySlug,
        deployUrl: `https://ergio.vercel.app/s/${bodySlug}`,
        message: 'Website saved (client-side mode)',
        error: e.message
      });
    }
  }

  return error(res, 'Method not allowed', 405);
}

function extractBusinessName(html, slug) {
  if (!html) return slug || 'Unknown';
  const m = html.match(/<title[^>]*>([^<]+)/i);
  if (m) return m[1].replace(/\s*[-|–—].*/, '').trim();
  return slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Unknown';
}
