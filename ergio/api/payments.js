export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const PAYSTACK_KEY = process.env.PAYSTACK_SECRET_KEY || '';
  const { method, body, query } = req;

  try {
    // Create payment link with user's OWN Paystack key
    if (method === 'POST' && body && body.action === 'create_payment_link') {
      const userKey = body.api_key || body.user_key;
      if (!userKey) {
        return res.status(400).json({ error: 'Payment key required. Connect your Paystack account first.' });
      }
      const amount = body.amount;
      const currency = body.currency || 'NGN';
      const description = body.description || 'Payment';
      
      // Create a Paystack payment link / transaction
      const resp = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${userKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: body.email || 'customer@ergio.app',
          amount: Math.round(amount * 100),
          currency: currency,
          metadata: {
            custom_fields: [
              { display_name: 'Product', variable_name: 'product', value: description },
              { display_name: 'Platform', variable_name: 'platform', value: 'ERGIO' }
            ]
          },
          callback_url: body.callback_url || 'https://ergio.vercel.app/pay.html?status=success'
        })
      });
      const data = await resp.json();
      if (data.status) {
        return res.status(200).json({
          authorization_url: data.data.authorization_url,
          reference: data.data.reference,
          access_code: data.data.access_code
        });
      } else {
        return res.status(400).json({ error: data.message || 'Failed to create payment link' });
      }
    }

    // Initialize ERGIO subscription payment (uses platform key)
    if (method === 'POST' && query.action !== 'verify') {
      const { email, amount, metadata } = body;
      if (!email || !amount) return res.status(400).json({ error: 'email and amount required' });
      
      // Use user's key if provided, otherwise use platform key
      const keyToUse = (body.user_key || body.api_key) || PAYSTACK_KEY;
      if (!keyToUse) {
        return res.status(500).json({ error: 'Paystack key not configured' });
      }
      
      const resp = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${keyToUse}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          amount: Math.round(amount * 100),
          metadata,
          callback_url: body.callback_url || 'https://ergio.vercel.app/dashboard/index.html'
        })
      });
      const data = await resp.json();
      return res.json(data);
    }

    // Verify payment
    if (method === 'GET' && query.reference) {
      const keyToUse = PAYSTACK_KEY;
      const resp = await fetch(`https://api.paystack.co/transaction/verify/${query.reference}`, {
        headers: { 'Authorization': `Bearer ${keyToUse}` }
      });
      const data = await resp.json();
      return res.json(data);
    }

    // Status check
    return res.json({ status: 'ok', provider: 'Paystack', configured: !!PAYSTACK_KEY });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
