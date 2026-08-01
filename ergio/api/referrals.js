import { createClient } from '@supabase/supabase-js';
const supabase = () => createClient(process.env.SUPABASE_URL||'', process.env.SUPABASE_SERVICE_KEY||process.env.SUPABASE_ANON_KEY||'');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const db = supabase();
  if (req.method === 'GET') {
    const { data } = await db.from('referrals').select('*').order('created_at',{ascending:false}).limit(50);
    return res.json({ referrals: data||[] });
  }
  if (req.method === 'POST') {
    const code = 'ERG-' + Math.random().toString(36).substr(2,6).toUpperCase();
    const { data, error } = await db.from('referrals').insert({...req.body, code, status:'active', reward_amount:2500}).select().single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success:true, referral: data, code });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
