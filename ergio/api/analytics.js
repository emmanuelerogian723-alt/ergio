// ========================================
// ERGIO API — /api/analytics
// Dashboard analytics: aggregates data from all tables
// Returns real stats for the ERGIO dashboard
// ========================================

import { getSupabase, getUser, success, error, corsHeaders } from '../lib/ergio.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // ============ TRACK EVENT (anyone can POST) ============
    if (req.method === 'POST') {
      const { event_type, event_data, business_id } = req.body;

      if (!event_type) return error(res, 'Event type required', 400);

      const supabase = getSupabase(req);
      await supabase.from('analytics_events').insert({
        business_id: business_id || null,
        event_type,
        event_data: event_data || {},
        visitor_ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress
      });

      return success(res, { tracked: true });
    }

    // ============ GET ANALYTICS ============
    if (req.method === 'GET') {
      const { businessId, timeframe } = req.query;

      if (!businessId) {
        // Global platform analytics (for ERGIO admin dashboard)
        return getPlatformAnalytics(req, res);
      }

      const supabase = getSupabase(req);

      // Get business stats
      const [bookings, payments, leads, clients, events] = await Promise.all([
        supabase.from('bookings').select('*').eq('business_id', businessId),
        supabase.from('payments').select('*').eq('business_id', businessId).eq('status', 'success'),
        supabase.from('leads').select('*').eq('business_id', businessId),
        supabase.from('clients').select('*').eq('business_id', businessId),
        supabase.from('analytics_events').select('*').eq('business_id', businessId).order('created_at', { ascending: false }).limit(100)
      ]);

      const allBookings = bookings.data || [];
      const allPayments = payments.data || [];
      const allLeads = leads.data || [];
      const allClients = clients.data || [];
      const allEvents = events.data || [];

      // Calculate stats
      const totalRevenue = allPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      const confirmedBookings = allBookings.filter(b => b.status === 'confirmed').length;
      const pendingBookings = allBookings.filter(b => b.status === 'pending').length;
      const newLeads = allLeads.filter(l => l.status === 'new').length;
      const convertedLeads = allLeads.filter(l => l.converted).length;
      const pageViews = allEvents.filter(e => e.event_type === 'page_view').length;

      // Revenue by day (last 7 days)
      const revenueByDay = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayRevenue = allPayments
          .filter(p => p.paid_at?.startsWith(dateStr))
          .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        revenueByDay.push({ date: dateStr, revenue: dayRevenue });
      }

      // Leads by source
      const leadsBySource = {};
      allLeads.forEach(l => {
        leadsBySource[l.source] = (leadsBySource[l.source] || 0) + 1;
      });

      // Engine statuses
      const engineStatus = await supabase.from('engine_status').select('*').eq('business_id', businessId);

      return success(res, {
        stats: {
          totalRevenue,
          confirmedBookings,
          pendingBookings,
          totalLeads: allLeads.length,
          newLeads,
          convertedLeads,
          totalClients: allClients.length,
          pageViews,
          conversionRate: allLeads.length ? (convertedLeads / allLeads.length * 100).toFixed(1) : 0
        },
        revenueByDay,
        leadsBySource,
        recentActivity: allEvents.slice(0, 20).map(e => ({
          type: e.event_type,
          data: e.event_data,
          time: e.created_at
        })),
        engines: engineStatus.data || [],
        recentBookings: allBookings.slice(0, 10),
        recentLeads: allLeads.sort((a, b) => b.score - a.score).slice(0, 10)
      });
    }

    return error(res, 'Method not allowed', 405);

  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============ PLATFORM-WIDE ANALYTICS ============
async function getPlatformAnalytics(req, res) {
  const supabase = getSupabase(req);

  const [businesses, profiles, allPayments, allBookings, allLeads] = await Promise.all([
    supabase.from('businesses').select('*'),
    supabase.from('profiles').select('*'),
    supabase.from('payments').select('*').eq('status', 'success'),
    supabase.from('bookings').select('*'),
    supabase.from('leads').select('*')
  ]);

  const bizData = businesses.data || [];
  const profileData = profiles.data || [];
  const paymentData = allPayments.data || [];
  const bookingData = allBookings.data || [];
  const leadData = allLeads.data || [];

  const totalRevenue = paymentData.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  // Revenue by day (last 7 days)
  const revenueByDay = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayRevenue = paymentData
      .filter(p => p.paid_at?.startsWith(dateStr))
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    revenueByDay.push({ date: dateStr, revenue: dayRevenue });
  }

  // Top businesses by revenue
  const businessRevenue = {};
  paymentData.forEach(p => {
    businessRevenue[p.business_id] = (businessRevenue[p.business_id] || 0) + parseFloat(p.amount || 0);
  });

  const topBusinesses = bizData
    .map(b => ({ ...b, revenue: businessRevenue[b.id] || 0 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Business types distribution
  const typesDistribution = {};
  bizData.forEach(b => {
    typesDistribution[b.type] = (typesDistribution[b.type] || 0) + 1;
  });

  // Cities distribution
  const citiesDistribution = {};
  bizData.forEach(b => {
    const city = b.city || 'Unknown';
    citiesDistribution[city] = (citiesDistribution[city] || 0) + 1;
  });

  // New users per day (last 7 days)
  const newUsersByDay = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayUsers = profileData.filter(p => p.created_at?.startsWith(dateStr)).length;
    newUsersByDay.push({ date: dateStr, users: dayUsers });
  }

  return success(res, {
    platform: {
      totalBusinesses: bizData.length,
      totalUsers: profileData.length,
      totalRevenue,
      totalBookings: bookingData.length,
      totalLeads: leadData.length,
      activeBusinesses: bizData.filter(b => b.status === 'active').length,
      payingUsers: profileData.filter(p => p.plan !== 'free').length
    },
    revenueByDay,
    newUsersByDay,
    topBusinesses: topBusinesses.map(b => ({
      name: b.name,
      type: b.type,
      city: b.city,
      revenue: b.revenue
    })),
    typesDistribution,
    citiesDistribution,
    recentBusinesses: bizData.slice(-10).reverse().map(b => ({
      name: b.name,
      type: b.type,
      city: b.city,
      created: b.created_at
    }))
  });
}
