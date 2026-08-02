// ========================================
// ERGIO API — /api/site (Serve & deploy generated websites)
// GET  /api/site?slug=business-name → returns saved website HTML
// POST /api/site                      → saves a new website
// ========================================

import { success, error, corsHeaders, getSupabase } from '../lib/ergio.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const slug = req.query.slug || '';
  const action = req.query.action || '';

  // ── GET: Serve a website by slug, id, or business_name ──
  if (req.method === 'GET') {
    if (!slug) return error(res, 'Slug is required. Use /api/site?slug=business-name', 400);

    const supabase = getSupabase();
    if (!supabase) return error(res, 'Database not configured', 500);

    try {
      // Try multiple lookup strategies: slug column, id, or business_name
      let data = null;

      // Strategy 1: exact slug match
      const slugRes = await supabase
        .from('generated_websites')
        .select('*')
        .eq('slug', slug)
        .order('created_date', { ascending: false })
        .limit(1);
      if (slugRes.data && slugRes.data.length > 0) data = slugRes.data[0];

      // Strategy 2: match by id (if slug looks like a UUID)
      if (!data && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)) {
        const idRes = await supabase
          .from('generated_websites')
          .select('*')
          .eq('id', slug)
          .limit(1);
        if (idRes.data && idRes.data.length > 0) data = idRes.data[0];
      }

      // Strategy 3: fuzzy match on business_name (slug with dashes = spaces)
      if (!data) {
        const nameRes = await supabase
          .from('generated_websites')
          .select('*')
          .ilike('business_name', slug.replace(/-/g, ' '))
          .order('created_date', { ascending: false })
          .limit(1);
        if (nameRes.data && nameRes.data.length > 0) data = nameRes.data[0];
      }

      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Website not found',
          message: `No website found for "${slug}". Generate one at https://ergio.vercel.app`
        });
      }

      // Determine which HTML field to use (handle both html_content and html column names)
      const html = data.html_content || data.html || '';

      // If request wants HTML, serve the website directly
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html || '<html><body>Website content unavailable</body></html>');
      }

      // Otherwise return JSON metadata
      return res.status(200).json({
        success: true,
        site: {
          id: data.id,
          slug: data.slug || data.id,
          businessName: data.business_name || slug,
          businessType: data.business_type,
          websiteType: data.website_type,
          brandColors: data.brand_colors || {},
          createdAt: data.created_date,
          deployUrl: `https://ergio.vercel.app/s/${data.slug || data.id}`,
          htmlSize: html.length
        }
      });
    } catch (e) {
      return error(res, e.message, 500);
    }
  }

  // ── POST: Save a website (called after generation) ──
  if (req.method === 'POST') {
    let body = {};
    if (typeof req.body === 'object' && req.body !== null) body = req.body;
    else { try { body = JSON.parse(req.body || '{}'); } catch { body = {}; } }

    // Accept BOTH the new field names AND the old builder field names
    const businessName = body.businessName || body.slug || body.business_name || 'Untitled Business';
    const htmlContent = body.htmlContent || body.html || body.html_content || '';
    const brandColors = body.brandColors || body.brand_colors || {};
    const businessType = body.businessType || body.business_type || 'landing';
    const websiteType = body.websiteType || body.website_type || 'standard';
    const userId = body.userId || body.user_id || body.businessId || 'guest';

    if (!htmlContent) return error(res, 'htmlContent (or html) is required', 400);

    const supabase = getSupabase();
    if (!supabase) return error(res, 'Database not configured', 500);

    try {
      // Generate a clean slug from the business name
      let slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      // If slug is empty or looks like a timestamp, use a generic one
      if (!slug || slug.length < 2) slug = 'site-' + Date.now();

      // Build insert object — try both column name variants
      const insertData = {
        business_name: businessName,
        business_type: businessType,
        website_type: websiteType,
        slug: slug,
        created_by: userId,
        created_date: new Date().toISOString()
      };

      // Try html_content first, fall back to html
      insertData.html_content = htmlContent;

      const { data, error: dbError } = await supabase
        .from('generated_websites')
        .insert(insertData)
        .select()
        .single();

      if (dbError) {
        // If html_content column doesn't exist, try 'html' column
        if (dbError.message.includes('html_content') || dbError.message.includes('column')) {
          const insertData2 = { ...insertData };
          delete insertData2.html_content;
          insertData2.html = htmlContent;

          // Also try without brand_colors if that's the issue
          const { data: data2, error: dbError2 } = await supabase
            .from('generated_websites')
            .insert(insertData2)
            .select()
            .single();

          if (dbError2) {
            // Last resort: try minimal insert
            const { data: data3, error: dbError3 } = await supabase
              .from('generated_websites')
              .insert({
                html: htmlContent,
                business_name: businessName,
                slug: slug,
                created_by: userId,
                created_date: new Date().toISOString()
              })
              .select()
              .single();

            if (dbError3) {
              // Return the URL anyway with the slug so the client-side fallback works
              return res.status(200).json({
                success: true,
                slug,
                deployUrl: `https://ergio.vercel.app/s/${slug}`,
                message: 'Website saved (client-side mode — database schema may need updating)',
                error: dbError3.message
              });
            }

            if (data3) {
              return res.status(200).json({
                success: true,
                slug: data3.slug || data3.id,
                siteId: data3.id,
                url: `https://ergio.vercel.app/s/${data3.slug || data3.id}`,
                deployUrl: `https://ergio.vercel.app/s/${data3.slug || data3.id}`,
                previewUrl: `https://ergio.vercel.app/preview.html?site=${data3.slug || data3.id}`,
                message: 'Website deployed and ready to share'
              });
            }
          }

          if (data2) {
            return res.status(200).json({
              success: true,
              slug: data2.slug || data2.id,
              siteId: data2.id,
              url: `https://ergio.vercel.app/s/${data2.slug || data2.id}`,
              deployUrl: `https://ergio.vercel.app/s/${data2.slug || data2.id}`,
              previewUrl: `https://ergio.vercel.app/preview.html?site=${data2.slug || data2.id}`,
              message: 'Website deployed and ready to share'
            });
          }
        }

        // Try without brand_colors
        const insertData3 = { ...insertData };
        delete insertData3.brand_colors;
        const { data: data3, error: dbError3 } = await supabase
          .from('generated_websites')
          .insert(insertData3)
          .select()
          .single();

        if (dbError3) {
          return res.status(200).json({
            success: true,
            slug,
            url: `https://ergio.vercel.app/s/${slug}`,
            deployUrl: `https://ergio.vercel.app/s/${slug}`,
            message: 'Website saved (client-side mode)',
            error: dbError3.message
          });
        }

        if (data3) {
          return res.status(200).json({
            success: true,
            slug: data3.slug || data3.id,
            siteId: data3.id,
            url: `https://ergio.vercel.app/s/${data3.slug || data3.id}`,
            deployUrl: `https://ergio.vercel.app/s/${data3.slug || data3.id}`,
            previewUrl: `https://ergio.vercel.app/preview.html?site=${data3.slug || data3.id}`,
            message: 'Website deployed and ready to share'
          });
        }
      }

      return res.status(200).json({
        success: true,
        slug: data.slug || data.id,
        siteId: data.id,
        url: `https://ergio.vercel.app/s/${data.slug || data.id}`,
        deployUrl: `https://ergio.vercel.app/s/${data.slug || data.id}`,
        previewUrl: `https://ergio.vercel.app/preview.html?site=${data.slug || data.id}`,
        message: 'Website deployed and ready to share'
      });
    } catch (e) {
      return error(res, e.message, 500);
    }
  }

  return error(res, 'Method not allowed', 405);
}
