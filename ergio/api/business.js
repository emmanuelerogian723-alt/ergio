import { getSupabase } from '../lib/ergio.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = getSupabase(req);
  const { method, body, query } = req;

  try {
    if (method === 'GET') {
      if (query.id) {
        const { data, error } = await supabase.from('businesses').select('*').eq('id', query.id).single();
        if (error) return res.status(404).json({ error: 'Not found' });
        return res.json(data);
      }
      // Use .then() pattern like console-data for resilience
      const businesses = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
        .then(r => r.data || [])
        .catch(() => []);
      return res.json({ businesses });
    }
    if (method === 'POST') {
      const { data, error } = await supabase.from('businesses').insert(body).select().single();
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true, business: data });
    }
    if (method === 'PUT') {
      const { data, error } = await supabase.from('businesses').update(body).eq('id', query.id).select().single();
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true, business: data });
    }
    if (method === 'DELETE') {
      const { error } = await supabase.from('businesses').delete().eq('id', query.id);
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    // Graceful fallback — return empty instead of crashing
    return res.status(200).json({ businesses: [], error: e.message });
  }
}
