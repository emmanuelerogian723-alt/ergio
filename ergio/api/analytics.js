import { getSupabase } from '../lib/ergio.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = getSupabase(req);

  if (req.method === 'POST') {
    try {
      const { event, data: evData, user_id, business_id } = req.body;
      await supabase.from('analytics_events').insert({ event_type: event, properties: evData, user_id, business_id });
      return res.json({ success: true });
    } catch (e) {
      return res.json({ success: false, error: e.message });
    }
  }

  if (req.method === 'GET') {
    // Use same resilient pattern as console-data
    const [events, businesses, leads, bookings] = await Promise.all([
      supabase.from('analytics_events').select('*').order('created_at', { ascending: false }).limit(100)
        .then(r => r.data || []).catch(() => []),
      supabase.from('businesses').select('id,created_at')
        .then(r => r.data || []).catch(() => []),
      supabase.from('leads').select('id,score,status')
        .then(r => r.data || []).catch(() => []),
      supabase.from('bookings').select('id,status')
        .then(r => r.data || []).catch(() => [])
    ]);

    return res.json({
      summary: {
        total_businesses: businesses.length,
        total_leads: leads.length,
        total_bookings: bookings.length,
        total_events: events.length
      },
      recent_events: events.slice(0, 20),
      leads_by_status: leads.reduce((a, l) => {
        a[l.status || 'new'] = (a[l.status || 'new'] || 0) + 1;
        return a;
      }, {})
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
