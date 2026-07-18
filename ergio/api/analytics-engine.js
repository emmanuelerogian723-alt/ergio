// ============================================================
// ERGIO Analytics Engine — Real-time business intelligence
// Revenue tracking, client insights, growth predictions
// ============================================================

import { getSupabase, callGroqFast, success, error, corsHeaders } from '../lib/ergio.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { action } = req.query || {};
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { businessId, period = '30d' } = { ...req.query, ...body };
  
  const sb = getSupabase(req);
  
  try {
    if (action === 'dashboard' || !action) {
      // Aggregate all key metrics
      const [bookings, payments, leads] = await Promise.all([
        sb.from('bookings').select('*').eq('business_id', businessId || '').limit(100),
        sb.from('payments').select('*').eq('business_id', businessId || '').limit(100),
        sb.from('leads').select('*').eq('business_id', businessId || '').limit(100),
      ]).then(results => results.map(r => r.data || []));
      
      const totalRevenue = payments.filter(p => p.status === 'success').reduce((s, p) => s + (p.amount || 0), 0);
      const totalBookings = bookings.length;
      const pendingBookings = bookings.filter(b => b.status === 'pending').length;
      const totalLeads = leads.length;
      const hotLeads = leads.filter(l => l.score >= 80).length;
      
      // AI-powered growth insight
      let insight = '';
      try {
        const aiInsight = await callGroqFast([
          {role:'system',content:'You are ERGIO Analytics AI. Give a brief, actionable business insight in 1-2 sentences.'},
          {role:'user',content:`Business stats: ${totalBookings} bookings, ₦${totalRevenue.toLocaleString()} revenue, ${totalLeads} leads (${hotLeads} hot). What's the single most important action they should take today?`}
        ], {temperature:0.7});
        insight = aiInsight;
      } catch {}
      
      return success(res, {
        period,
        revenue: { total: totalRevenue, currency: 'NGN', formatted: '₦' + totalRevenue.toLocaleString() },
        bookings: { total: totalBookings, pending: pendingBookings, confirmed: bookings.filter(b=>b.status==='confirmed').length },
        leads: { total: totalLeads, hot: hotLeads, converted: leads.filter(l=>l.status==='converted').length },
        insights: [insight || 'Keep following up with your leads — response rate increases by 3x with follow-ups within 24 hours.'],
        charts: {
          bookingsByDay: groupByDay(bookings, 'created_at'),
          revenueByDay: groupByDay(payments.filter(p=>p.status==='success'), 'created_at', 'amount'),
        }
      });
    }
    
    if (action === 'ai_report') {
      const { metrics } = body;
      const report = await callGroqFast([
        {role:'system',content:'You are ERGIO Business Intelligence AI for African businesses.'},
        {role:'user',content:`Generate a weekly business report for this Nigerian business with these metrics: ${JSON.stringify(metrics)}. Include: what's working, what needs improvement, and 3 specific action items. Format as JSON: {summary, wins, improvements, actions, prediction}`}
      ], {temperature:0.7, response_format:{type:'json_object'}});
      return success(res, JSON.parse(report));
    }
    
    return error(res, 'Unknown action', 400);
  } catch(e) {
    return error(res, e.message, 500);
  }
}

function groupByDay(items, dateField, valueField = null) {
  const groups = {};
  items.forEach(item => {
    const day = (item[dateField] || '').substring(0, 10);
    if (!day) return;
    if (!groups[day]) groups[day] = { date: day, count: 0, value: 0 };
    groups[day].count++;
    if (valueField) groups[day].value += (item[valueField] || 0);
  });
  return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
}
