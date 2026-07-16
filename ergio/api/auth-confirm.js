// Auto-confirms new users after signup — bypasses email confirmation requirement
// Uses service role key (server-side only, never exposed to client)
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { email, userId } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://owcxfzlanlrulflsyvlr.supabase.co';
    const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_KEY;

    if (!SUPABASE_SERVICE) {
      return res.status(500).json({ error: 'Service key not configured' });
    }

    // If we have userId, confirm directly. Otherwise search by email.
    const userIdParam = userId || email;

    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userIdParam}`, {
      method: 'PUT',
      headers: {
        'apikey': SUPABASE_SERVICE,
        'Authorization': `Bearer ${SUPABASE_SERVICE}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email_confirm: true
      })
    });

    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({
        success: true,
        message: 'Email confirmed',
        userId: data.id,
        email: data.email
      });
    } else {
      // Try listing users and finding by email
      const listResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_SERVICE,
          'Authorization': `Bearer ${SUPABASE_SERVICE}`
        }
      });

      if (listResponse.ok) {
        const users = await listResponse.json();
        const user = users.find(u => u.email === email);
        if (user) {
          const confirmResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
            method: 'PUT',
            headers: {
              'apikey': SUPABASE_SERVICE,
              'Authorization': `Bearer ${SUPABASE_SERVICE}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email_confirm: true })
          });
          if (confirmResponse.ok) {
            return res.status(200).json({ success: true, message: 'Email confirmed', userId: user.id });
          }
        }
      }
      return res.status(500).json({ error: 'Could not confirm user' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
