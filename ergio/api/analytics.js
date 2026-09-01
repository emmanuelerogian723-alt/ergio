import { getSupabase } from '../lib/ergio.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const db = getSupabase(req);
  if (req.method === 'POST') {
    const { event, data: evData, user_id, business_id } = req.body;
    await db.from('analytics_events').insert({ event_type: event, properties: evData, user_id, business_id });
    return res.json({ success: true });
  }
  if (req.method === 'GET') {
    try {
    const { data: events } = await db.from('analytics_events').select('*').order('created_at',{ascending:false}).limit(100);
    const { data: businesses } = await db.from('businesses').select('id,created_at');
    const { data: leads } = await db.from('leads').select('id,score,status');
    const { data: bookings } = await db.from('bookings').select('id,status');
    return res.json({
      summary: { total_businesses: businesses?.length||0, total_leads: leads?.length||0, total_bookings: bookings?.length||0, total_events: events?.length||0 },
      recent_events: events?.slice(0,20)||[],
      leads_by_status: leads?.reduce((a,l) => { a[l.status||'new']=(a[l.status||'new']||0)+1; return a; }, {})||{}
    });
    } catch(dbErr) {
      return res.status(200).json({ summary: { total_businesses: 0, total_leads: 0, total_bookings: 0, total_events: 0 }, recent_events: [], leads_by_status: {}, error: dbErr.message });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
