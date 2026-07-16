// ========================================
// ERGIO Review & Testimonial Collector
// Auto-request reviews after completed jobs
// Collects, moderates, and displays testimonials
// ========================================

const supabase = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
    const url = new URL(req.url, `http://${req.headers.host}`);
    const action = url.searchParams.get('action') || 'list';
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const businessId = url.searchParams.get('business_id') || body.business_id;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const sb = supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ---- LIST REVIEWS ----
    if (req.method === 'GET' && action === 'list') {
      let query = sb.from('reviews').select('*').order('created_at', { ascending: false }).limit(50);
      if (businessId) query = query.eq('business_id', businessId);
      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });

      const reviews = (data || []).filter(r => r.status === 'approved');
      const avgRating = reviews.length
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

      return res.status(200).json({
        reviews: reviews,
        summary: {
          total: reviews.length,
          avg_rating: parseFloat(avgRating),
          five_star: reviews.filter(r => r.rating === 5).length,
          four_star: reviews.filter(r => r.rating === 4).length
        }
      });
    }

    // ---- SUBMIT REVIEW ----
    if (req.method === 'POST' && action === 'create') {
      const { client_name, rating, text, booking_id } = body;

      if (!client_name || !rating || !text) {
        return res.status(400).json({ error: 'Name, rating, and text required' });
      }

      const { data, error } = await sb.from('reviews').insert({
        business_id: businessId,
        client_name,
        rating: Math.min(5, Math.max(1, parseInt(rating))),
        text,
        booking_id,
        status: 'pending',
        created_at: new Date().toISOString()
      }).select();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true, review: data?.[0] });
    }

    // ---- APPROVE REVIEW (business owner) ----
    if (req.method === 'POST' && action === 'approve') {
      const reviewId = body.review_id;
      const { error } = await sb.from('reviews').update({ status: 'approved' }).eq('id', reviewId);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    // ---- GENERATE REVIEW REQUEST LINK ----
    if (req.method === 'POST' && action === 'request') {
      const { client_name, client_phone, booking_id } = body;
      const token = Math.random().toString(36).substring(2, 15);

      // Generate WhatsApp message with review link
      const reviewLink = `${process.env.VERCEL_URL || 'https://ergio.app'}/review?token=${token}&b=${businessId}`;
      const waMessage = `Hi ${client_name}! Thanks for working with us. We'd love your feedback. Rate us here: ${reviewLink}`;
      const waLink = `https://wa.me/${client_phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMessage)}`;

      return res.status(200).json({
        success: true,
        review_link: reviewLink,
        whatsapp_link: waLink
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('Review error:', err);
    return res.status(500).json({ error: err.message });
  }
};
