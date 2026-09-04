// ============================================================
// ERGIO Lead Capture — public endpoint for published websites
// Receives bookings, contacts and chatbot conversations from
// every published site. Saves to Supabase + notifies the owner
// by email (best-effort via Resend).
// ============================================================

import { getSupabase } from '../lib/ergio.js';

const rateMap = new Map(); // basic in-memory rate limiting per IP+slug

function rateLimited(ip, slug) {
  const now = Date.now();
  const key = ip + ':' + slug;
  const last = rateMap.get(key) || 0;
  if (now - last < 3000) return true; // max 1 per 3s per IP+slug
  rateMap.set(key, now);
  if (rateMap.size > 5000) rateMap.clear();
  return false;
}

async function adaptiveInsert(supabase, table, row) {
  // Try the full row first; on unknown-column errors, drop the offending column and retry
  let current = { ...row };
  for (let i = 0; i < 8; i++) {
    const { data, error } = await supabase.from(table).insert([current]).select('id').single();
    if (!error) return { ok: true, data };
    const msg = (error && error.message) || '';
    const m = msg.match(/column "?([a-z_]+)"? of relation/i) || msg.match(/Could not find the '?([a-z_]+)'? column/i);
    if (m && m[1] && current[m[1]] !== undefined) {
      delete current[m[1]];
      continue;
    }
    return { ok: false, error: msg };
  }
  return { ok: false, error: 'too many retries' };
}

async function sendOwnerEmail({ to, businessName, type, details }) {
  try {
    const RESEND_KEY = process.env.RESEND_API_KEY || '';
    if (!RESEND_KEY || !to) return { sent: false, reason: 'no-key-or-recipient' };
    const typeLabel = type === 'booking' ? 'New Booking' : type === 'chat' ? 'Chatbot Conversation' : 'New Contact Message';
    const rows = Object.entries(details).filter(([k, v]) => v && k !== 'siteUrl').slice(0, 8)
      .map(([k, v]) => '<tr><td style="padding:6px 12px;color:#666;font-size:13px;text-transform:capitalize">' + String(k).replace(/_/g, ' ') + '</td><td style="padding:6px 12px;color:#111;font-size:13px;font-weight:600">' + String(v).substring(0, 200) + '</td></tr>').join('');
    const html = `<div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#00d1ff,#007bff);padding:20px 24px;color:#fff"><h2 style="margin:0;font-size:18px">🔔 ${typeLabel}</h2><p style="margin:4px 0 0;font-size:13px;opacity:.9">${businessName || 'Your website'} — via ERGIO</p></div>
  <table style="width:100%;border-collapse:collapse">${rows}</table>
  <div style="padding:16px 24px;background:#f8f9fa"><p style="margin:0;font-size:12px;color:#888">Open your <a href="https://ergio.vercel.app/dashboard/" style="color:#007bff">ERGIO Dashboard</a> to see it in Bookings &amp; Leads.</p></div>
</div>`;
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'ERGIO <onboarding@resend.dev>', to, subject: '🔔 ' + typeLabel + ' — ' + (businessName || 'your website'), html })
    });
    const d = await resp.json().catch(() => ({}));
    return { sent: resp.ok, id: d.id || null, error: resp.ok ? null : (d.message || 'send failed') };
  } catch (e) {
    return { sent: false, error: e.message };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.json({ status: 'ok', service: 'ERGIO Lead Capture' });
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Use POST' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const {
      type = 'contact',
      businessName = '', businessSlug = '', siteUrl = '', ownerEmail = '', session = '',
      name = '', email = '', phone = '', date = '', service = '', message = ''
    } = body;

    if (!name && !email && !phone && !message) {
      return res.status(400).json({ success: false, error: 'Nothing to capture' });
    }

    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'anon';
    if (rateLimited(ip, businessSlug || 'x')) {
      return res.status(429).json({ success: false, error: 'Too fast' });
    }

    const supabase = getSupabase(req);
    let saved = false, saveError = null;

    if (type === 'booking') {
      // bookings table: client_name, client_email, client_phone, date, time, notes, status, price, payment_status
      const r = await adaptiveInsert(supabase, 'bookings', {
        client_name: name || 'Website Visitor',
        client_email: email || null,
        client_phone: phone || null,
        date: date || null,
        notes: [service ? 'Service: ' + service : null, message || null, businessName ? 'Business: ' + businessName : null].filter(Boolean).join(' | ') || null,
        status: 'pending'
      });
      saved = r.ok; saveError = r.error;
      if (!r.ok) {
        const r2 = await adaptiveInsert(supabase, 'bookings', { client_name: name || 'Website Visitor' });
        saved = r2.ok; saveError = r2.ok ? null : r2.error;
      }
    } else {
      // leads table: name, email, phone, message, source, source_url, intent, location, status
      const r = await adaptiveInsert(supabase, 'leads', {
        name: name || (type === 'chat' ? 'Chatbot Visitor' : 'Website Visitor'),
        email: email || null,
        phone: phone || null,
        message: (message || '').substring(0, 1000),
        source: type === 'chat' ? 'ergio_chatbot' : 'ergio_contact_form',
        source_url: siteUrl || null,
        intent: type === 'chat' ? 'chat_inquiry' : 'contact_form',
        status: 'new'
      });
      saved = r.ok; saveError = r.error;
      if (!r.ok) {
        const r2 = await adaptiveInsert(supabase, 'leads', { name: name || 'Visitor', message: (message || '').substring(0, 1000) });
        saved = r2.ok; saveError = r2.ok ? null : r2.error;
      }
    }

    // Best-effort owner email — only for bookings & contacts (avoid chat spam)
    let mail = { sent: false };
    if (type !== 'chat' && (email || phone || name)) {
      mail = await sendOwnerEmail({ to: ownerEmail, businessName, type, details: { name, email, phone, service, date, message, website: siteUrl } });
    }

    return res.json({ success: true, saved, emailSent: mail.sent, emailError: mail.error || null, saveError: saveError || null });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
}
