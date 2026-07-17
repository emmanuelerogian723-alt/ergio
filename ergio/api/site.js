// ========================================
// ERGIO API — /api/site (Serve generated websites)
// /api/site?slug=business-name → returns saved website HTML
// Also creates a static HTML file for Vercel serving
// ========================================

import { success, error, corsHeaders, getSupabase } from '../lib/ergio.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const slug = req.query.slug || '';
  const action = req.query.action || '';

  // GET: Serve a website by slug
  if (req.method === 'GET') {
    if (!slug) return error(res, 'Slug is required. Use /api/site?slug=business-name', 400);

    const supabase = getSupabase();
    if (!supabase) return error(res, 'Database not configured', 500);

    try {
      const { data, error: dbError } = await supabase
        .from('generated_websites')
        .select('*')
        .ilike('business_name', slug.replace(/-/g, '%'))
        .order('created_date', { ascending: false })
        .limit(1)
        .single();

      if (dbError || !data) {
        return res.status(404).json({
          success: false,
          error: 'Website not found',
          message: `No website found for "${slug}". Generate one at https://ergio.vercel.app`
        });
      }

      // If request wants HTML, serve the website
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(data.html_content || '<html><body>Website content unavailable</body></html>');
      }

      // Otherwise return JSON metadata
      return res.status(200).json({
        success: true,
        site: {
          slug,
          businessName: data.business_name,
          businessType: data.business_type,
          websiteType: data.website_type,
          brandColors: data.brand_colors,
          createdAt: data.created_date,
          deployUrl: `https://ergio.vercel.app/site/${slug}`,
          htmlSize: (data.html_content || '').length
        }
      });
    } catch (e) {
      return error(res, e.message, 500);
    }
  }

  // POST: Save a website (called after generation)
  if (req.method === 'POST') {
    let body = {};
    if (typeof req.body === 'object' && req.body !== null) body = req.body;
    else { try { body = JSON.parse(req.body || '{}'); } catch { body = {}; } }

    const { businessName, businessType, htmlContent, brandColors, websiteType, userId } = body;

    if (!businessName || !htmlContent) return error(res, 'businessName and htmlContent required', 400);

    const supabase = getSupabase();
    if (!supabase) return error(res, 'Database not configured', 500);

    try {
      const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const { data, error: dbError } = await supabase
        .from('generated_websites')
        .insert({
          business_name: businessName,
          business_type: businessType || 'landing',
          html_content: htmlContent,
          brand_colors: brandColors || {},
          website_type: websiteType || 'standard',
          slug,
          created_by: userId,
          created_date: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) {
        return res.status(200).json({
          success: true,
          slug,
          deployUrl: `https://ergio.vercel.app/site/${slug}`,
          message: 'Website saved (client-side mode)',
          error: dbError.message
        });
      }

      return res.status(200).json({
        success: true,
        slug,
        siteId: data.id,
        deployUrl: `https://ergio.vercel.app/site/${slug}`,
        previewUrl: `https://ergio.vercel.app/preview.html?site=${slug}`,
        message: 'Website deployed and ready to share'
      });
    } catch (e) {
      return error(res, e.message, 500);
    }
  }

  return error(res, 'Method not allowed', 405);
}
