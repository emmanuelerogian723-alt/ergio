export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const PAYSTACK_KEY = process.env.PAYSTACK_SECRET_KEY || '';
  const { method, body, query } = req;

  try {
    if (method === 'POST' && query.action !== 'verify') {
      // Initialize payment
      const { email, amount, metadata } = body;
      if (!email || !amount) return res.status(400).json({ error: 'email and amount required' });
      const resp = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${PAYSTACK_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, amount: Math.round(amount * 100), metadata, callback_url: body.callback_url })
      });
      const data = await resp.json();
      return res.json(data);
    }
    if (method === 'GET' && query.reference) {
      // Verify payment
      const resp = await fetch(`https://api.paystack.co/transaction/verify/${query.reference}`, {
        headers: { 'Authorization': `Bearer ${PAYSTACK_KEY}` }
      });
      const data = await resp.json();
      return res.json(data);
    }
    return res.json({ status: 'ok', provider: 'Paystack', configured: !!PAYSTACK_KEY });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
