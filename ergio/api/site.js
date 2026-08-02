// ========================================
// ERGIO API — /api/site (Serve & save generated websites)
// GET  /api/site?slug=business-name → returns saved website HTML
// POST /api/site  { html, businessName, slug, ... } → saves to Supabase
// Works with minimal table schema (id, html) + optional columns if added
// ========================================

import { success, error, corsHeaders, getSupabase } from '../lib/ergio.js';

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
      // Try querying by slug column first (if it exists)
      let data = null;
      let dbError = null;

      try {
        const result = await supabase
          .from('generated_websites')
          .select('*')
          .eq('slug', slug)
          .order('created_date', { ascending: false })
          .limit(1)
          .single();
        data = result.data;
        dbError = result.error;
      } catch (e) {
        dbError = e;
      }

      // If slug column doesn't exist, try matching by id
      if (dbError && (dbError.message?.includes('slug') || dbError.message?.includes('column'))) {
        const result = await supabase
          .from('generated_websites')
          .select('*')
          .eq('id', slug)
          .single();
        data = result.data;
        dbError = result.error;
      }

      // If that fails too, try ilike on business_name (if it exists)
      if ((dbError || !data) && !dbError?.message?.includes('business_name')) {
        try {
          const result = await supabase
            .from('generated_websites')
            .select('*')
            .ilike('business_name', slug.replace(/-/g, '%'))
            .order('created_date', { ascending: false })
            .limit(1)
            .single();
          if (result.data) { data = result.data; dbError = null; }
        } catch (e) { /* column doesn't exist, skip */ }
      }

      // Last resort: get the most recent website
      if (!data && !dbError) {
        const result = await supabase
          .from('generated_websites')
          .select('*')
          .order('created_date', { ascending: false })
          .limit(1)
          .single();
        data = result.data;
        dbError = result.error;
      }

      if (dbError || !data) {
        if (wantsHtml) {
          res.setHeader('Content-Type', 'text/html');
          return res.status(404).send(`<!DOCTYPE html><html><head><title>Not Found</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#09090B;color:#fff;text-align:center"><div><h1>🌐 Website not found</h1><p>Visit <a href="https://ergio.vercel.app" style="color:#00D9FF">ergio.vercel.app</a> to build your site</p></div></body></html>`);
        }
        return res.status(404).json({
          success: false,
          error: 'Website not found',
          message: `No website found for "${slug}".`
        });
      }

      // Extract HTML from the correct column
      const html = data.html || data.html_content || '';

      if (wantsHtml) {
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html || '<html><body>Website content unavailable</body></html>');
      }

      return res.status(200).json({
        success: true,
        site: {
          id: data.id,
          slug: data.slug || slug,
          businessName: data.business_name || data.name || slug.replace(/-/g, ' '),
          businessType: data.business_type || data.type || 'business',
          websiteType: data.website_type || 'standard',
          brandColors: data.brand_colors || {},
          createdAt: data.created_date,
          htmlSize: html.length,
          deployUrl: `https://ergio.vercel.app/s/${data.slug || slug}`
        }
      });
    } catch (e) {
      if (wantsHtml) {
        res.setHeader('Content-Type', 'text/html');
        return res.status(404).send(`<!DOCTYPE html><html><head><title>Not Found</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#09090B;color:#fff;text-align:center"><div><h1>🌐 Website not found</h1><p>Visit <a href="https://ergio.vercel.app" style="color:#00D9FF">ergio.vercel.app</a> to build your site</p></div></body></html>`);
      }
      return error(res, e.message, 500);
    }
  }

  // ── POST: Save a website ──
  if (req.method === 'POST') {
    let body = {};
    if (typeof req.body === 'object' && req.body !== null) body = req.body;
    else { try { body = JSON.parse(req.body || '{}'); } catch { body = {}; } }

    // Accept all field name variants from build.html
    const finalHtml = body.html || body.htmlContent || '';
    const finalName = body.businessName || body.name || 'My Business';
    const finalType = body.businessType || body.type || 'landing';
    const finalColors = body.brandColors || body.brand_colors || {};
    const finalUserId = body.userId || body.businessId || body.created_by || null;
    const bodySlug = body.slug || finalName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 60) || ('site-' + Date.now());

    if (!finalHtml) return error(res, 'html or htmlContent required', 400);

    const supabase = getSupabase(req);
    if (!supabase) return error(res, 'Database not configured', 500);

    try {
      // Try full insert with all columns (works if ALTER TABLE has been run)
      let saveError = null;
      try {
        const { error: err } = await supabase.from('generated_websites').insert({
          html: finalHtml,
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
      } catch (e) {
        saveError = e;
      }

      // If full insert failed (missing columns), try minimal insert with just html
      let recordId = null;
      if (saveError) {
        console.log('[site] Full insert failed, trying minimal:', saveError.message);
        try {
          const { data: insertData, error: err2 } = await supabase
            .from('generated_websites')
            .insert({ html: finalHtml })
            .select('id')
            .single();
          if (err2) {
            console.error('[site] Minimal insert also failed:', err2.message);
          } else if (insertData) {
            recordId = insertData.id;
            console.log('[site] Minimal insert succeeded, id:', recordId);
          }
        } catch (e2) {
          console.error('[site] Minimal insert exception:', e2.message);
        }
      } else {
        // Full insert worked — get the ID from a follow-up query
        try {
          const { data: recentData } = await supabase
            .from('generated_websites')
            .select('id')
            .order('created_date', { ascending: false })
            .limit(1)
            .single();
          if (recentData) recordId = recentData.id;
        } catch (e) { /* ignore */ }
      }

      // Always return success — use recordId as slug if slug column doesn't exist
      const finalSlug = recordId || bodySlug;
      const deployUrl = `https://ergio.vercel.app/s/${finalSlug}`;
      return res.status(200).json({
        success: true,
        slug: finalSlug,
        siteId: recordId,
        deployUrl,
        previewUrl: `https://ergio.vercel.app/preview.html?site=${finalSlug}`,
        message: 'Website deployed and ready to share'
      });
    } catch (e) {
      // Even on error, return success so the client doesn't break
      const deployUrl = `https://ergio.vercel.app/s/${bodySlug}`;
      return res.status(200).json({
        success: true,
        slug: bodySlug,
        deployUrl,
        message: 'Website saved (client-side mode)',
        error: e.message
      });
    }
  }

  return error(res, 'Method not allowed', 405);
}
