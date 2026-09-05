// ========================================
// ERGIO SMS API — Termii (Nigeria) integration
// Send SMS to contacts, check balance, log to notifications
// Requires TERMII_API_KEY env var (get it at termii.com → Settings → API)
// ========================================
import { getSupabase } from '../lib/ergio.js';

function normalizePhone(raw) {
  let p = String(raw || '').replace(/[\s()-]/g, '');
  if (p.startsWith('+234')) p = '234' + p.slice(4);
  else if (p.startsWith('234')) p = p;
  else if (p.startsWith('0')) p = '234' + p.slice(1);
  return p;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.TERMII_API_KEY;
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const action = req.query.action || body.action || 'status';
  const businessId = req.query.business_id || body.business_id || null;

  // ── STATUS: is Termii configured? ──
  if (action === 'status') {
    return res.status(200).json({ configured: !!apiKey, provider: 'termii', country: 'Nigeria' });
  }

  if (!apiKey) {
    return res.status(200).json({
      error: 'TERMII_API_KEY not set',
      hint: 'Get your API key at termii.com → Settings → API, then send it to your Ergio agent to activate SMS.'
    });
  }

  try {
    const sb = getSupabase(req);

    // ── SEND ──
    if (req.method === 'POST' && action === 'send') {
      const to = normalizePhone(body.to || body.phone);
      const message = (body.message || '').trim();
      const from = (body.sender_id || 'Ergio').slice(0, 11);
      if (!to || !message) return res.status(400).json({ error: 'to and message required' });
      if (message.length > 480) return res.status(400).json({ error: 'message too long (max 480 chars = 3 SMS segments)' });

      const termiiRes = await fetch('https://api.ng.termii.com/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, from, sms: message, type: 'plain', channel: 'generic', api_key: apiKey })
      });
      const result = await termiiRes.json().catch(() => ({}));
      const ok = termiiRes.ok && (result.message_id || result.status === 'Sent');

      // log to notifications either way
      if (sb) {
        await sb.from('notifications').insert({
          business_id: businessId, type: 'sms',
          title: 'SMS to ' + to, message: message.slice(0, 500),
          channel: 'termi', status: ok ? 'sent' : 'failed: ' + JSON.stringify(result).slice(0, 120)
        }).then(() => {}, () => {});
      }
      return res.status(ok ? 200 : 502).json({ success: ok, to, result });
    }

    // ── BALANCE ──
    if (action === 'balance') {
      const r = await fetch('https://api.ng.termii.com/api/get-balance?api_key=' + apiKey);
      const result = await r.json().catch(() => ({}));
      return res.status(200).json({ balance: result.balance, currency: result.currency || 'NGN' });
    }

    return res.status(400).json({ error: 'Unknown action: ' + action });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
