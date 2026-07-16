// ========================================
// ERGIO API — /api/bookings
// Booking CRUD: create, list, update, cancel
// ========================================

import { getSupabase, getUser, success, error, corsHeaders } from '../lib/ergio.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const supabase = getSupabase(req);
    const user = await getUser(req);

    // ============ LIST BOOKINGS ============
    if (req.method === 'GET') {
      const { businessId, status, date } = req.query;

      let query = supabase.from('bookings').select('*').order('created_at', { ascending: false });

      if (businessId) query = query.eq('business_id', businessId);
      if (status) query = query.eq('status', status);
      if (date) query = query.eq('date', date);

      const { data, error: dbErr } = await query;
      if (dbErr) return error(res, dbErr.message, 500);

      return success(res, { bookings: data || [] });
    }

    // ============ CREATE BOOKING ============
    if (req.method === 'POST') {
      const { businessId, serviceId, clientName, clientEmail, clientPhone, date, time, notes, price } = req.body;

      if (!businessId || !clientName || !date || !time) {
        return error(res, 'Missing required fields', 400);
      }

      const { data, error: dbErr } = await supabase.from('bookings').insert({
        business_id: businessId,
        service_id: serviceId || null,
        client_name: clientName,
        client_email: clientEmail || null,
        client_phone: clientPhone || null,
        date,
        time,
        status: 'pending',
        notes: notes || null,
        price: price || null,
        payment_status: 'unpaid'
      }).select();

      if (dbErr) return error(res, dbErr.message, 500);

      // Log analytics event
      await supabase.from('analytics_events').insert({
        business_id: businessId,
        event_type: 'booking_created',
        event_data: { booking_id: data[0]?.id, client_name: clientName }
      });

      return success(res, { booking: data[0] }, 201);
    }

    // ============ UPDATE BOOKING ============
    if (req.method === 'PUT') {
      const { id, status, paymentStatus } = req.body;

      if (!id) return error(res, 'Booking ID required', 400);

      const updates = {};
      if (status) updates.status = status;
      if (paymentStatus) updates.payment_status = paymentStatus;

      const { data, error: dbErr } = await supabase.from('bookings')
        .update(updates).eq('id', id).select();

      if (dbErr) return error(res, dbErr.message, 500);

      return success(res, { booking: data[0] });
    }

    // ============ CANCEL BOOKING ============
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return error(res, 'Booking ID required', 400);

      const { error: dbErr } = await supabase.from('bookings')
        .update({ status: 'cancelled' }).eq('id', id);

      if (dbErr) return error(res, dbErr.message, 500);

      return success(res, { cancelled: true });
    }

    return error(res, 'Method not allowed', 405);

  } catch (err) {
    return error(res, err.message, 500);
  }
}
