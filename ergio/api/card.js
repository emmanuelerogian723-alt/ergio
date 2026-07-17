// ========================================
// ERGIO API — /api/card (GET + POST)
// Digital Business Card: generates shareable card with QR code
// ========================================

import { getSupabase, success, error, corsHeaders, generateSlug } from '../lib/ergio.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const supabase = getSupabase(req);

    if (req.method === 'GET') {
      const { businessId, slug } = req.query;
      let query = supabase.from('businesses').select('*, services(*)');
      if (businessId) query = query.eq('id', businessId).single();
      else if (slug) query = query.eq('slug', slug).single();
      else return error(res, 'businessId or slug required', 400);

      const { data: business, error: dbErr } = await query;
      if (dbErr || !business) return error(res, 'Business not found', 404);

      const cardUrl = `https://ergio.vercel.app/card?slug=${business.slug || business.id}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(cardUrl)}`;

      if (req.query.format === 'json') return success(res, { business, cardUrl, qrUrl });

      const cardHtml = generateCardHTML(business, qrUrl);
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(cardHtml);
    }

    if (req.method === 'POST') {
      // Create or update business card
      const { businessId, name, type, city, phone, whatsapp, email, description, logoUrl, brandColors } = req.body;
      if (!name) return error(res, 'Business name required', 400);

      const slug = generateSlug(name);
      const cardData = {
        ...(businessId ? { id: businessId } : {}),
        name, type, city, phone, whatsapp, email, description,
        logo_url: logoUrl, brand_colors: brandColors, slug,
        updated_date: new Date().toISOString()
      };

      if (businessId) {
        const { data, error: dbErr } = await supabase.from('businesses').update(cardData).eq('id', businessId).select().single();
        if (dbErr) return error(res, dbErr.message, 500);
        return success(res, data, 200);
      } else {
        const { data, error: dbErr } = await supabase.from('businesses').insert(cardData).select().single();
        if (dbErr) return error(res, dbErr.message, 500);
        return success(res, data, 201);
      }
    }

    return error(res, 'Method not allowed', 405);
  } catch (err) {
    return error(res, err.message, 500);
  }
}

function generateCardHTML(business, qrUrl) {
  const colors = business.brand_colors || { primary: '#00D9FF', secondary: '#09090B' };
  const services = business.services || [];
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${business.name} — Digital Card</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',sans-serif;background:linear-gradient(135deg,#09090B,#111827);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1rem}
    .card{max-width:420px;width:100%;background:rgba(255,255,255,0.03);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden}
    .card-header{text-align:center;padding:2.5rem 1.5rem 1.5rem;background:linear-gradient(135deg,${colors.primary}15,${colors.primary}05)}
    .card-logo{width:80px;height:80px;border-radius:20px;margin:0 auto 1rem;background:rgba(255,255,255,0.05);overflow:hidden;display:flex;align-items:center;justify-content:center}
    .card-logo img{width:100%;height:100%;object-fit:cover}
    .card-logo-placeholder{font-size:2rem;font-weight:800;color:${colors.primary}}
    .card-name{font-size:1.4rem;font-weight:800;color:#F8FAFC;margin-bottom:.3rem}
    .card-type{color:#94A3B8;font-size:.9rem}
    .card-location{color:${colors.primary};font-size:.85rem;margin-top:.3rem}
    .card-body{padding:1.5rem}
    .card-section{margin-bottom:1.5rem}
    .card-section-title{font-size:.75rem;text-transform:uppercase;letter-spacing:1px;color:#64748B;margin-bottom:.6rem}
    .card-desc{color:#CBD5E1;font-size:.9rem;line-height:1.5}
    .services-list{display:grid;gap:.5rem}
    .service-row{display:flex;justify-content:space-between;align-items:center;padding:.7rem 1rem;background:rgba(255,255,255,0.04);border-radius:10px}
    .service-name{font-size:.85rem;font-weight:600;color:#F8FAFC}
    .service-price{font-size:.85rem;font-weight:700;color:${colors.primary}}
    .contact-row{display:flex;align-items:center;gap:.8rem;padding:.6rem 0;border-bottom:1px solid rgba(255,255,255,0.04)}
    .contact-row:last-child{border-bottom:none}
    .contact-icon{width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,0.04);display:flex;align-items:center;justify-content:center;font-size:1rem}
    .contact-info{font-size:.85rem;color:#CBD5E1}
    .contact-info a{color:${colors.primary};text-decoration:none}
    .card-actions{display:flex;gap:.5rem;padding:1rem 1.5rem}
    .card-btn{flex:1;padding:.7rem;border:none;border-radius:10px;font-size:.85rem;font-weight:700;cursor:pointer;text-decoration:none;text-align:center}
    .btn-book{background:${colors.primary};color:#09090B}
    .btn-wa{background:#25D366;color:#fff}
    .qr-section{text-align:center;padding:1rem 1.5rem 2rem}
    .qr-img{width:120px;height:120px;border-radius:12px;margin:0 auto .5rem}
    .qr-hint{color:#64748B;font-size:.75rem}
    .card-footer{text-align:center;padding:1rem;color:#475569;font-size:.75rem;border-top:1px solid rgba(255,255,255,0.04)}
    .card-footer a{color:${colors.primary};text-decoration:none}
  </style>
</head>
<body>
  <div class="card">
    <div class="card-header">
      <div class="card-logo">
        ${business.logo_url ? `<img src="${business.logo_url}" alt="${business.name}">` : `<div class="card-logo-placeholder">${business.name?.charAt(0) || 'E'}</div>`}
      </div>
      <div class="card-name">${business.name}</div>
      <div class="card-type">${business.type || 'Business'}</div>
      ${business.city ? `<div class="card-location">📍 ${business.city}, ${business.country || 'Nigeria'}</div>` : ''}
    </div>
    <div class="card-body">
      ${business.description ? `<div class="card-section"><div class="card-section-title">About</div><div class="card-desc">${business.description}</div></div>` : ''}
      ${services.length > 0 ? `<div class="card-section"><div class="card-section-title">Services & Pricing</div><div class="services-list">${services.map(s => `<div class="service-row"><span class="service-name">${s.name}</span><span class="service-price">₦${(s.price || 0).toLocaleString()}</span></div>`).join('')}</div></div>` : ''}
      <div class="card-section">
        <div class="card-section-title">Contact</div>
        ${business.phone ? `<div class="contact-row"><div class="contact-icon">📞</div><div class="contact-info"><a href="tel:${business.phone}">${business.phone}</a></div></div>` : ''}
        ${business.whatsapp ? `<div class="contact-row"><div class="contact-icon">💬</div><div class="contact-info"><a href="https://wa.me/${business.whatsapp.replace(/\\D/g,'')}">${business.whatsapp}</a></div></div>` : ''}
        ${business.email ? `<div class="contact-row"><div class="contact-icon">✉️</div><div class="contact-info"><a href="mailto:${business.email}">${business.email}</a></div></div>` : ''}
      </div>
    </div>
    <div class="card-actions">
      <a href="#" class="card-btn btn-book" onclick="alert('Booking powered by ERGIO');return false">📅 Book Now</a>
      <a href="https://wa.me/${(business.whatsapp || '').replace(/\\D/g,'')}" class="card-btn btn-wa">💬 WhatsApp</a>
    </div>
    <div class="qr-section">
      <img src="${qrUrl}" alt="QR Code" class="qr-img">
      <div class="qr-hint">Scan to save this card</div>
    </div>
    <div class="card-footer">Powered by <a href="https://ergio.vercel.app">ERGIO</a> · Built for Africa 🌍</div>
  </div>
</body>
</html>`;
}
