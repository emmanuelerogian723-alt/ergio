// ========================================
// ERGIO API — /api/payments
// Paystack integration: initialize payment, verify, webhook
// ========================================

import { paystackInit, paystackVerify, success, error, corsHeaders } from '../lib/ergio.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ============ INITIALIZE PAYMENT ============
  if (req.method === 'POST') {
    try {
      const { amount, email, reference, metadata, callbackUrl } = req.body;

      if (!amount || !email) return error(res, 'Amount and email required', 400);

      const result = await paystackInit(
        parseFloat(amount),
        email,
        reference || `ERGIO_${Date.now()}`,
        metadata || {},
        callbackUrl || ''
      );

      return success(res, result);
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  // ============ VERIFY PAYMENT ============
  if (req.method === 'GET') {
    try {
      const { reference } = req.query;
      if (!reference) return error(res, 'Reference required', 400);

      const result = await paystackVerify(reference);

      return success(res, {
        status: result.status,
        amount: result.amount / 100,
        currency: result.currency,
        customer: {
          email: result.customer?.email,
          phone: result.customer?.phone
        },
        reference: result.reference,
        paidAt: result.paid_at
      });
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  // ============ PAYSTACK WEBHOOK ============
  if (req.method === 'PUT') {
    // Paystack webhook handler
    try {
      const event = req.body;
      const { getSupabase } = await import('../lib/ergio.js');
      const supabase = getSupabase(req);

      if (event.event === 'charge.success') {
        const data = event.data;
        const reference = data.reference;

        // Update payment record
        await supabase.from('payments')
          .update({
            status: 'success',
            paid_at: new Date().toISOString(),
            payment_method: data.channel
          })
          .eq('paystack_ref', reference);

        // Update booking if linked
        if (data.metadata?.booking_id) {
          await supabase.from('bookings')
            .update({ payment_status: 'paid', status: 'confirmed' })
            .eq('id', data.metadata.booking_id);
        }

        return success(res, { processed: true });
      }

      return success(res, { processed: false, event: event.event });
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  return error(res, 'Method not allowed', 405);
}
