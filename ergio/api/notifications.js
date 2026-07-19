export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.json({ status:'ok', service:'Notifications' });
  const { type, to, subject, message, from } = req.body;
  if (type === 'email') {
    const RESEND_KEY = process.env.RESEND_API_KEY || '';
    if (!RESEND_KEY) return res.json({ success:false, message:'No Resend key configured' });
    const resp = await fetch('https://api.resend.com/emails', {
      method:'POST', headers:{'Authorization':`Bearer ${RESEND_KEY}`,'Content-Type':'application/json'},
      body: JSON.stringify({ from: from||'ERGIO <notifications@ergio.app>', to, subject, html: message })
    });
    const data = await resp.json();
    return res.json({ success: resp.ok, data });
  }
  return res.json({ success:true, message:'Notification queued', type, to });
}
