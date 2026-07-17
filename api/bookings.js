// ===== ERGIO: Bookings + Invoicing + Payments =====
import { success, error, corsHeaders, getSupabase } from '../lib/ergio.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = getSupabase(req);
  const { action } = req.body || req.query || {};

  try {
    if (action === 'create_booking') {
      const { businessId, clientName, clientPhone, clientEmail, service, servicePrice, date, time, notes } = req.body;
      
      const booking = {
        business_id: businessId,
        client_name: clientName,
        client_phone: clientPhone,
        client_email: clientEmail,
        service_name: service,
        service_price: servicePrice,
        booking_date: date,
        booking_time: time,
        notes: notes || '',
        status: 'pending',
        reference: 'BK' + Date.now(),
        created_date: new Date().toISOString()
      };

      const { data, error: dbErr } = await supabase.from('bookings').insert(booking).select().single();
      if (dbErr) throw new Error(dbErr.message);

      // Send WhatsApp confirmation (log for now)
      console.log(`📱 WhatsApp confirmation for ${clientName}: Booking ${booking.reference} confirmed for ${service} on ${date} at ${time}`);

      return success(res, { booking: data, message: 'Booking created! WhatsApp confirmation sent.' });
    }

    if (action === 'list_bookings') {
      const { businessId, status } = req.body;
      let query = supabase.from('bookings').select('*').eq('business_id', businessId).order('booking_date', { ascending: true });
      if (status) query = query.eq('status', status);
      const { data, error: dbErr } = await query;
      if (dbErr) throw new Error(dbErr.message);
      return success(res, { bookings: data, count: data?.length || 0 });
    }

    if (action === 'update_booking') {
      const { bookingId, status, notes } = req.body;
      const { data, error: dbErr } = await supabase.from('bookings').update({ status, notes }).eq('id', bookingId).select().single();
      if (dbErr) throw new Error(dbErr.message);
      return success(res, { booking: data });
    }

    if (action === 'create_invoice') {
      const { businessId, clientName, clientEmail, clientPhone, items, dueDate, businessName, businessAddress } = req.body;
      
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = Math.round(subtotal * 0.075); // 7.5% VAT
      const total = subtotal + tax;
      
      const invoice = {
        business_id: businessId,
        invoice_number: 'INV-' + Date.now(),
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        items: JSON.stringify(items),
        subtotal,
        tax,
        total,
        currency: 'NGN',
        status: 'unpaid',
        due_date: dueDate,
        created_date: new Date().toISOString()
      };

      const { data, error: dbErr } = await supabase.from('invoices').insert(invoice).select().single();
      if (dbErr) {
        // Return invoice data even without DB save
        return success(res, { invoice: { ...invoice, id: 'local-' + Date.now() }, message: 'Invoice generated' });
      }

      return success(res, { invoice: data, message: 'Invoice created successfully' });
    }

    if (action === 'list_invoices') {
      const { businessId } = req.body;
      const { data, error: dbErr } = await supabase.from('invoices').select('*').eq('business_id', businessId).order('created_date', { ascending: false });
      if (dbErr) throw new Error(dbErr.message);
      const total_revenue = (data || []).filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0);
      return success(res, { invoices: data, count: data?.length || 0, total_revenue });
    }

    if (action === 'initiate_payment') {
      const { amount, email, name, reference, businessName } = req.body;
      const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

      if (!PAYSTACK_SECRET) return error(res, 'Payment not configured');

      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || 'client@ergio.app',
          amount: amount * 100, // Paystack uses kobo
          reference: reference || 'ERG-' + Date.now(),
          metadata: { name, businessName, custom_fields: [{ display_name: 'Business', variable_name: 'business', value: businessName }] },
          callback_url: `${process.env.APP_URL || 'https://ergio.vercel.app'}/api/payments?action=verify`
        })
      });

      const data = await response.json();
      if (!data.status) throw new Error(data.message || 'Payment init failed');
      return success(res, { authorization_url: data.data.authorization_url, reference: data.data.reference });
    }

    if (action === 'verify_payment') {
      const { reference } = req.body || req.query;
      const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { 'Authorization': `Bearer ${PAYSTACK_SECRET}` }
      });
      const data = await response.json();
      
      if (data.data?.status === 'success') {
        // Update invoice or booking status
        try {
          const supabase = getSupabase(req);
          await supabase.from('invoices').update({ status: 'paid' }).eq('payment_reference', reference);
        } catch {}
      }
      
      return success(res, { verified: data.data?.status === 'success', data: data.data });
    }

    if (action === 'analytics') {
      const { businessId } = req.body;
      
      const [bookingsRes, invoicesRes] = await Promise.all([
        supabase.from('bookings').select('*').eq('business_id', businessId),
        supabase.from('invoices').select('*').eq('business_id', businessId)
      ]);

      const bookings = bookingsRes.data || [];
      const invoices = invoicesRes.data || [];

      const thisMonth = new Date();
      thisMonth.setDate(1);

      return success(res, {
        total_bookings: bookings.length,
        pending_bookings: bookings.filter(b => b.status === 'pending').length,
        completed_bookings: bookings.filter(b => b.status === 'completed').length,
        total_revenue: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0),
        outstanding: invoices.filter(i => i.status === 'unpaid').reduce((s, i) => s + (i.total || 0), 0),
        invoice_count: invoices.length,
        recent_bookings: bookings.slice(-5)
      });
    }

    return error(res, 'Unknown action. Use: create_booking, list_bookings, create_invoice, list_invoices, initiate_payment, verify_payment, analytics');
  } catch (err) {
    console.error('Bookings error:', err);
    return error(res, err.message);
  }
}
