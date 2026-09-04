// ========================================
// ERGIO API — /api/notifications
// Email sending via Resend (welcome emails, owner alerts, etc.)
// ========================================

const WELCOME_HTML = (name) => `<!DOCTYPE html><html><body style="margin:0;background:#09090B;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:560px;margin:0 auto;padding:32px 16px">
  <div style="background:linear-gradient(135deg,#00d1ff 0%,#007bff 100%);border-radius:16px 16px 0 0;padding:40px 32px;text-align:center">
    <h1 style="margin:0;font-size:28px;color:#fff;letter-spacing:1px">ERGIO</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,.85);font-size:14px">AI Business Operating System for Africa</p>
  </div>
  <div style="background:#111118;border-radius:0 0 16px 16px;padding:32px;border:1px solid #222;border-top:none">
    <h2 style="color:#fff;margin:0 0 12px;font-size:20px">Welcome aboard, ${name}! 🎉</h2>
    <p style="color:#aaa;font-size:14px;line-height:1.6;margin:0 0 16px">Your ERGIO account is live. You just unlocked the fastest way to build and grow a business in Africa — websites that build themselves, AI that finds you paying clients, and tools that run your operations.</p>
    <div style="background:#181820;border-radius:12px;padding:20px;margin:0 0 20px">
      <p style="color:#00d1ff;font-size:13px;margin:0 0 10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Get started in 3 steps</p>
      <ol style="color:#ccc;font-size:14px;line-height:1.9;margin:0;padding-left:20px">
        <li>Open the <a href="https://ergio.vercel.app/build.html" style="color:#00d1ff">Website Builder</a> and describe your business in one sentence</li>
        <li>Watch ERGIO build your premium website in minutes — chatbot included</li>
        <li>Every booking and message from visitors lands in your Dashboard + email inbox</li>
      </ol>
    </div>
    <a href="https://ergio.vercel.app/dashboard/" style="display:block;background:linear-gradient(135deg,#00d1ff,#007bff);color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:700;font-size:15px">Open My Dashboard →</a>
    <p style="color:#555;font-size:12px;margin:24px 0 0;text-align:center">Questions? Just reply to this email or use the chat inside your dashboard.</p>
  </div>
</div>
</body></html>`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.json({ status: 'ok', service: 'Notifications' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { type = 'email', to, subject, message, from, name } = body;

  const RESEND_KEY = process.env.RESEND_API_KEY || '';
  if (!RESEND_KEY) return res.json({ success: false, message: 'No Resend key configured' });
  if (!to) return res.json({ success: false, message: 'Recipient (to) required' });

  let html = message || '';
  let subj = subject || 'Notification from ERGIO';
  let fromAddr = from || 'ERGIO <onboarding@resend.dev>';

  if (type === 'welcome') {
    html = WELCOME_HTML(name || 'there');
    subj = 'Welcome to ERGIO 🎉 — your business OS is live';
  }

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromAddr, to, subject: subj, html })
    });
    const data = await resp.json().catch(() => ({}));
    return res.json({ success: resp.ok, id: data.id || null, error: resp.ok ? null : (data.message || 'send failed') });
  } catch (e) {
    return res.json({ success: false, error: e.message });
  }
}
