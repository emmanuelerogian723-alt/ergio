import { createClient } from '@supabase/supabase-js';

const supabase = () => createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || ''
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = supabase();
  const { method, body, query } = req;

  try {
    if (method === 'GET') {
      if (query.id) {
        const { data, error } = await db.from('businesses').select('*').eq('id', query.id).single();
        if (error) return res.status(404).json({ error: 'Not found' });
        return res.json(data);
      }
      const { data, error } = await db.from('businesses').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ businesses: data || [] });
    }
    if (method === 'POST') {
      const { data, error } = await db.from('businesses').insert(body).select().single();
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true, business: data });
    }
    if (method === 'PUT') {
      const { data, error } = await db.from('businesses').update(body).eq('id', query.id).select().single();
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true, business: data });
    }
    if (method === 'DELETE') {
      const { error } = await db.from('businesses').delete().eq('id', query.id);
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
