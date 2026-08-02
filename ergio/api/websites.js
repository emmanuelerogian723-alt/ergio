// ========================================
// ERGIO API — /api/websites
// Manage generated websites from Supabase
// List, get, update, delete, deploy
// ========================================

import { success, error, corsHeaders, getSupabase } from '../lib/ergio.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const supabase = getSupabase(req);
    const method = req.method;
    const body = method === 'GET' ? req.query : (req.body || {});
    const action = body.action || (method === 'GET' ? 'list' : method.toLowerCase());

    // ── LIST: Get all generated websites ──
    if (method === 'GET' || action === 'list') {
      const { data, error: dbErr } = await supabase
        .from('generated_websites')
        .select('id, business_name, business_type, slug, website_category, website_type, brand_colors, created_date, created_by')
        .order('created_date', { ascending: false })
        .limit(100);

      if (dbErr) throw new Error(dbErr.message);

      return res.status(200).json({
        websites: data || [],
        total: data?.length || 0
      });
    }

    // ── GET: Fetch single website by slug or id ──
    if (action === 'get' || body.slug || body.id) {
      const filter = body.slug ? { slug: body.slug } : { id: body.id };
      const { data, error: dbErr } = await supabase
        .from('generated_websites')
        .select('*')
        .match(filter)
        .single();

      if (dbErr) throw new Error(dbErr.message);

      return res.status(200).json(data);
    }

    // ── UPDATE: Update a website's HTML content ──
    if (method === 'PUT' || action === 'update') {
      const { slug, html_content, brand_colors, website_category } = body;
      if (!slug) return res.status(400).json({ error: 'slug required' });

      const updates = {};
      if (html_content) updates.html_content = html_content;
      if (brand_colors) updates.brand_colors = brand_colors;
      if (website_category) updates.website_category = website_category;
      updates.updated_date = new Date().toISOString();

      const { data, error: dbErr } = await supabase
        .from('generated_websites')
        .update(updates)
        .match({ slug })
        .select();

      if (dbErr) throw new Error(dbErr.message);

      return res.status(200).json({ success: true, website: data?.[0] });
    }

    // ── DELETE: Delete a website by slug ──
    if (method === 'DELETE' || action === 'delete') {
      const slug = body.slug || req.query.slug;
      if (!slug) return res.status(400).json({ error: 'slug required' });

      const { error: dbErr } = await supabase
        .from('generated_websites')
        .delete()
        .match({ slug });

      if (dbErr) throw new Error(dbErr.message);

      return res.status(200).json({ success: true, deleted: slug });
    }

    // ── DEPLOY: Mark website as deployed ──
    if (action === 'deploy') {
      const { slug } = body;
      if (!slug) return res.status(400).json({ error: 'slug required' });

      const { data, error: dbErr } = await supabase
        .from('generated_websites')
        .update({
          website_type: 'deployed',
          updated_date: new Date().toISOString()
        })
        .match({ slug })
        .select();

      if (dbErr) throw new Error(dbErr.message);

      return res.status(200).json({
        success: true,
        deployUrl: `https://ergio.vercel.app/site/${slug}`,
        website: data?.[0]
      });
    }

    return res.status(400).json({ error: 'Unknown action' });

  } catch (err) {
    console.error('[websites] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
