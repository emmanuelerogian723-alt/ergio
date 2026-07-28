// ERGIO Paystack Payment Handler
// Initializes Paystack transactions and verifies payments

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Initialize payment
    try {
      const { plan_id, plan_name, amount, email } = req.body || {};
      
      if (!amount) {
        return res.status(400).json({ error: 'amount required' });
      }
      
      const secretKey = process.env.PAYSTACK_SECRET_KEY || process.env.VITE_PAYSTACK_SECRET_KEY;
      if (!secretKey) {
        return res.status(500).json({ error: 'Paystack key not configured' });
      }
      
      const reference = `ergio_${plan_id || 'plan'}_${Date.now()}`;
      
      const payload = {
        email: email || 'demo@ergio.app',
        amount: parseInt(amount) * 100,
        currency: 'NGN',
        reference,
        callback_url: 'https://ergio.vercel.app/dashboard/index.html',
        metadata: {
          custom_fields: [
            { display_name: 'Plan', variable_name: 'plan', value: plan_id || '' },
            { display_name: 'Platform', variable_name: 'platform', value: 'ERGIO' },
            { display_name: 'Plan Name', variable_name: 'plan_name', value: plan_name || plan_id || '' }
          ]
        }
      };
      
      const resp = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await resp.json();
      
      if (data.status) {
        return res.status(200).json({
          authorization_url: data.data.authorization_url,
          reference: data.data.reference,
          access_code: data.data.access_code
        });
      } else {
        return res.status(400).json({ error: data.message || 'Paystack initialization failed' });
      }
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
  
  if (req.method === 'GET') {
    // Verify payment
    const reference = req.query.reference || req.query.trxref;
    if (!reference) {
      return res.status(400).json({ error: 'reference required' });
    }
    
    const secretKey = process.env.PAYSTACK_SECRET_KEY || process.env.VITE_PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({ error: 'Paystack key not configured' });
    }
    
    try {
      const resp = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { 'Authorization': `Bearer ${secretKey}` }
      });
      
      const data = await resp.json();
      
      if (data.status && data.data.status === 'success') {
        return res.status(200).json({
          status: 'success',
          reference: data.data.reference,
          amount: data.data.amount / 100,
          currency: data.data.currency,
          customer: data.data.customer?.email,
          plan: data.data.metadata?.custom_fields?.[0]?.value || ''
        });
      } else {
        return res.status(200).json({ status: 'failed', reference });
      }
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
