// ========================================
// ERGIO API — /api/websites
// Manage generated websites from Supabase
// List, get, update, delete, deploy
// Works with minimal table schema (id, html) + optional columns
// ========================================

import { success, error, corsHeaders, getSupabase } from '../lib/ergio.js';

// Extract business name from HTML title tag as fallback
function extractBusinessName(html) {
  if (!html) return null;
  const m = html.match(/<title[^>]*>([^<]+)/i);
  if (m) return m[1].replace(/\s*[-|–—].*/,'').trim();
  const h1 = html.match(/<h1[^>]*>([^<]+)/i);
  if (h1) return h1[1].trim();
  return null;
}

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
        .select('*')
        .order('created_date', { ascending: false })
        .limit(100);

      if (dbErr) {
        // If created_date doesn't exist, try without ordering
        const { data: data2, error: err2 } = await supabase
          .from('generated_websites')
          .select('*')
          .limit(100);
        if (err2) throw new Error(err2.message);
        return res.status(200).json({ websites: normalizeWebsites(data2), total: data2?.length || 0 });
      }

      return res.status(200).json({
        websites: normalizeWebsites(data),
        total: data?.length || 0
      });
    }

    // ── GET: Fetch single website ──
    if (action === 'get') {
      let query = supabase.from('generated_websites').select('*');
      if (body.slug) {
        try {
          query = query.match({ slug: body.slug }).single();
        } catch(e) {
          // slug column might not exist — fall back to id
          query = supabase.from('generated_websites').select('*').eq('id', body.slug).single();
        }
      } else if (body.id) {
        query = query.eq('id', body.id).single();
      } else {
        query = query.limit(1).single();
      }
      const { data, error: dbErr } = await query;
      if (dbErr) throw new Error(dbErr.message);
      return res.status(200).json(data);
    }

    // ── UPDATE: Update a website ──
    if (method === 'PUT' || action === 'update') {
      const { slug, id, html, html_content, brand_colors, website_category } = body;
      const recordId = id || slug;
      if (!recordId) return res.status(400).json({ error: 'id or slug required' });

      const updates = {};
      if (html || html_content) updates.html = html || html_content;
      if (brand_colors) updates.brand_colors = brand_colors;
      if (website_category) updates.website_category = website_category;

      const { data, error: dbErr } = await supabase
        .from('generated_websites')
        .update(updates)
        .eq('id', recordId)
        .select();

      if (dbErr) throw new Error(dbErr.message);
      return res.status(200).json({ success: true, website: data?.[0] });
    }

    // ── DELETE: Delete a website ──
    if (method === 'DELETE' || action === 'delete') {
      const recordId = body.id || body.slug || req.query.id || req.query.slug;
      if (!recordId) return res.status(400).json({ error: 'id or slug required' });

      const { error: dbErr } = await supabase
        .from('generated_websites')
        .delete()
        .eq('id', recordId);

      if (dbErr) throw new Error(dbErr.message);
      return res.status(200).json({ success: true, deleted: recordId });
    }

    // ── DEPLOY: Mark website as deployed ──
    if (action === 'deploy') {
      const { id } = body;
      if (!id) return res.status(400).json({ error: 'id required' });

      const { data, error: dbErr } = await supabase
        .from('generated_websites')
        .update({ website_type: 'deployed' })
        .eq('id', id)
        .select();

      if (dbErr) throw new Error(dbErr.message);
      return res.status(200).json({
        success: true,
        deployUrl: `https://ergio.vercel.app/site/${data?.[0]?.slug || id}`,
        website: data?.[0]
      });
    }

    return res.status(400).json({ error: 'Unknown action' });

  } catch (err) {
    console.error('[websites] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

function normalizeWebsites(data) {
  return (data || []).map(w => ({
    id: w.id,
    business_name: w.business_name || w.name || extractBusinessName(w.html) || 'Untitled Website',
    business_type: w.business_type || w.type || 'unknown',
    slug: w.slug || w.id,
    website_category: w.website_category || 'landing',
    website_type: w.website_type || 'standard',
    brand_colors: w.brand_colors || null,
    created_date: w.created_date || null,
    has_html: !!w.html,
    deploy_url: w.slug ? `https://ergio.vercel.app/site/${w.slug}` : null
  }));
}
