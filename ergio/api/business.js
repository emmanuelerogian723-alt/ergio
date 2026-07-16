// ========================================
// ERGIO API — /api/business
// Create, list, update businesses in Supabase
// ========================================

import { getSupabase, getUser, success, error, corsHeaders, generateSlug } from '../lib/ergio.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const supabase = getSupabase(req);
    const user = await getUser(req);

    if (req.method === 'GET') {
      const { id, userId } = req.query;
      let query = supabase.from('businesses').select('*, services(*)');

      if (id) {
        query = query.eq('id', id).single();
      } else if (userId) {
        query = query.eq('user_id', userId);
      } else if (user) {
        query = query.eq('user_id', user.id);
      }

      const { data, error: dbErr } = await query;
      if (dbErr) return error(res, dbErr.message, 500);

      return success(res, { business: id ? data : null, businesses: !id ? data : null });
    }

    if (req.method === 'POST') {
      if (!user) return error(res, 'Authentication required', 401);

      const { name, type, description, logoUrl, brandColors, city, state, phone, whatsapp, email, socialLinks, services } = req.body;

      if (!name) return error(res, 'Business name required', 400);

      const slug = generateSlug(name);

      // Ensure slug is unique
      const existing = await supabase.from('businesses').select('id').eq('slug', slug).maybeSingle();
      const finalSlug = existing.data ? `${slug}-${Math.random().toString(36).substring(2, 6)}` : slug;

      const { data, error: dbErr } = await supabase.from('businesses').insert({
        user_id: user.id,
        name,
        slug: finalSlug,
        type: type || null,
        description: description || null,
        logo_url: logoUrl || null,
        brand_colors: brandColors || null,
        subdomain: finalSlug,
        city: city || null,
        state: state || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        email: email || null,
        social_links: socialLinks || {},
        status: 'active'
      }).select();

      if (dbErr) return error(res, dbErr.message, 500);

      // Add services if provided
      if (services && services.length > 0 && data[0]) {
        const serviceRecords = services.map(s => ({
          business_id: data[0].id,
          name: s.name,
          description: s.description,
          price: s.price,
          duration_minutes: s.duration || 60,
          category: s.category || null
        }));
        await supabase.from('services').insert(serviceRecords);
      }

      // Initialize engine statuses
      if (data[0]) {
        const engines = ['local_discovery', 'demand_matching', 'ai_outreach', 'repeat_clients'];
        await supabase.from('engine_status').insert(
          engines.map(name => ({
            business_id: data[0].id,
            engine_name: name,
            status: 'idle'
          }))
        );
      }

      // Log analytics
      if (data[0]) {
        await supabase.from('analytics_events').insert({
          business_id: data[0].id,
          event_type: 'business_created',
          event_data: { name, type }
        });
      }

      return success(res, { business: data[0] }, 201);
    }

    if (req.method === 'PUT') {
      if (!user) return error(res, 'Authentication required', 401);

      const { id, ...updates } = req.body;
      if (!id) return error(res, 'Business ID required', 400);

      const { data, error: dbErr } = await supabase.from('businesses')
        .update(updates).eq('id', id).eq('user_id', user.id).select();

      if (dbErr) return error(res, dbErr.message, 500);

      return success(res, { business: data[0] });
    }

    if (req.method === 'DELETE') {
      if (!user) return error(res, 'Authentication required', 401);

      const { id } = req.query;
      if (!id) return error(res, 'Business ID required', 400);

      const { error: dbErr } = await supabase.from('businesses')
        .delete().eq('id', id).eq('user_id', user.id);

      if (dbErr) return error(res, dbErr.message, 500);

      return success(res, { deleted: true });
    }

    return error(res, 'Method not allowed', 405);

  } catch (err) {
    return error(res, err.message, 500);
  }
}
