// ERGIO API — /api/websites — Manage generated websites
import { getSupabase } from '../lib/ergio.js';

function extractBusinessName(html) {
  if (!html) return null;
  const m = html.match(/<title[^>]*>([^<]+)/i);
  if (m) return m[1].replace(/\s*[-|–—].*/,'').trim();
  const h1 = html.match(/<h1[^>]*>([^<]+)/i);
  if (h1) return h1[1].trim();
  return null;
}

function normalizeWebsites(data) {
  return (data || []).map(w => ({
    id: w.id,
    business_name: w.business_name || w.name || extractBusinessName(w.html || w.html_content) || 'Untitled Website',
    business_type: w.business_type || w.type || 'unknown',
    slug: w.slug || w.id,
    website_category: w.website_category || 'landing',
    website_type: w.website_type || 'standard',
    brand_colors: w.brand_colors || null,
    created_date: w.created_date || w.created_at || null,
    has_html: !!(w.html || w.html_content),
    deploy_url: w.slug ? `https://ergio.vercel.app/site/${w.slug}` : null
  }));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = getSupabase(req);
  const method = req.method;
  const body = method === 'GET' ? req.query : (req.body || {});
  const action = body.action || (method === 'GET' ? 'list' : method.toLowerCase());

  try {
    // LIST
    if (method === 'GET' || action === 'list') {
      const { data, error: dbErr } = await supabase
        .from('generated_websites').select('*').order('created_at', { ascending: false }).limit(100);
      if (dbErr) {
        const { data: data2 } = await supabase.from('generated_websites').select('*').limit(100);
        return res.status(200).json({ websites: normalizeWebsites(data2), total: data2?.length || 0 });
      }
      return res.status(200).json({ websites: normalizeWebsites(data), total: data?.length || 0 });
    }

    // GET single
    if (action === 'get') {
      let query = supabase.from('generated_websites').select('*');
      if (body.slug) query = query.eq('slug', body.slug).single();
      else if (body.id) query = query.eq('id', body.id).single();
      else query = query.limit(1).single();
      const { data, error: dbErr } = await query;
      if (dbErr) return res.status(200).json({ website: null });
      return res.status(200).json(data);
    }

    // UPDATE
    if (method === 'PUT' || action === 'update') {
      const { slug, id, html, html_content, brand_colors, website_category } = body;
      const recordId = id || slug;
      if (!recordId) return res.status(400).json({ error: 'id or slug required' });
      const updates = {};
      if (html || html_content) updates.html = html || html_content;
      if (brand_colors) updates.brand_colors = brand_colors;
      if (website_category) updates.website_category = website_category;
      const { data, error: dbErr } = await supabase.from('generated_websites').update(updates).eq('id', recordId).select();
      if (dbErr) return res.status(200).json({ success: false, error: dbErr.message });
      return res.status(200).json({ success: true, website: data?.[0] });
    }

    // DELETE
    if (method === 'DELETE' || action === 'delete') {
      const recordId = body.id || body.slug || req.query.id || req.query.slug;
      if (!recordId) return res.status(400).json({ error: 'id or slug required' });
      const { error: dbErr } = await supabase.from('generated_websites').delete().eq('id', recordId);
      if (dbErr) return res.status(200).json({ success: false, error: dbErr.message });
      return res.status(200).json({ success: true, deleted: recordId });
    }

    // DEPLOY
    if (action === 'deploy') {
      const { id } = body;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { data, error: dbErr } = await supabase.from('generated_websites').update({ website_type: 'deployed' }).eq('id', id).select();
      if (dbErr) return res.status(200).json({ success: false, error: dbErr.message });
      return res.status(200).json({ success: true, deployUrl: `https://ergio.vercel.app/site/${data?.[0]?.slug || id}`, website: data?.[0] });
    }

    return res.status(200).json({ websites: [] });
  } catch (err) {
    return res.status(200).json({ websites: [], error: err.message });
  }
}
