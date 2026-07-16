/**
 * ERGIO Authentication API
 * Handles: signup, login, session management, magic links, OTP verification
 * Uses Supabase Auth (free tier - 50k users)
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;
  const body = req.body || {};

  try {
    switch (action) {
      case 'signup': return await handleSignup(req, res, body);
      case 'login': return await handleLogin(req, res, body);
      case 'magic-link': return await handleMagicLink(req, res, body);
      case 'verify-otp': return await handleVerifyOTP(req, res, body);
      case 'session': return await handleSession(req, res, body);
      case 'profile': return await handleProfile(req, res, body);
      case 'google-callback': return await handleGoogleCallback(req, res, body);
      default:
        return res.status(200).json({
          name: 'ERGIO Auth API',
          endpoints: [
            '/api/auth?action=signup - Create account',
            '/api/auth?action=login - Sign in',
            '/api/auth?action=magic-link - Send magic link',
            '/api/auth?action=verify-otp - Verify OTP code',
            '/api/auth?action=session - Get session info',
            '/api/auth?action=profile - Get/update profile',
          ]
        });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  
  // Use fetch-based approach for serverless
  return { url, key };
}

async function handleSignup(req, res, body) {
  const { email, password, fullName, bizType, city, plan = 'free' } = body;
  
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  
  const { url, key } = await getSupabaseClient();
  
  // Create auth user
  const response = await fetch(`${url}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      data: { full_name: fullName, biz_type: bizType, city, plan },
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    return res.status(400).json({ error: data.message || data.msg || 'Signup failed' });
  }
  
  // Insert profile into business_users table
  if (data.user) {
    try {
      await fetch(`${url}/rest/v1/business_users`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${data.access_token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          id: data.user.id,
          email,
          full_name: fullName,
          biz_type: bizType,
          city,
          plan,
          status: 'active',
        }),
      });
    } catch (e) {
      console.log('Profile insert deferred (email verification needed)');
    }
  }
  
  return res.status(200).json({
    message: 'Account created! Check your email for verification.',
    user: data.user ? { id: data.user.id, email: data.user.email } : null,
    session: data.session ? { token: data.session.access_token?.slice(0, 20) + '...' } : null,
    requiresVerification: !data.session,
  });
}

async function handleLogin(req, res, body) {
  const { email, password } = body;
  
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  
  const { url, key } = await getSupabaseClient();
  
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    return res.status(401).json({ error: data.message || data.msg || 'Invalid credentials' });
  }
  
  return res.status(200).json({
    message: 'Login successful',
    user: { id: data.user?.id, email: data.user?.email },
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  });
}

async function handleMagicLink(req, res, body) {
  const { email } = body;
  
  if (!email) return res.status(400).json({ error: 'Email required' });
  
  const { url, key } = await getSupabaseClient();
  
  const response = await fetch(`${url}/auth/v1/otp`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      create_user: true,
      options: {
        email_redirect_to: body.redirectTo || `${req.headers.origin}/dashboard/index.html`,
      },
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    return res.status(400).json({ error: data.message || 'Failed to send magic link' });
  }
  
  return res.status(200).json({ message: 'Magic link sent! Check your email.' });
}

async function handleVerifyOTP(req, res, body) {
  const { email, token, type = 'email' } = body;
  
  if (!email || !token) return res.status(400).json({ error: 'Email and token required' });
  
  const { url, key } = await getSupabaseClient();
  
  const response = await fetch(`${url}/auth/v1/verify`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, token, type, audience: 'authenticated' }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    return res.status(400).json({ error: data.message || 'Verification failed' });
  }
  
  return res.status(200).json({
    message: 'Email verified!',
    accessToken: data.access_token,
    user: { id: data.user?.id, email: data.user?.email },
  });
}

async function handleSession(req, res, body) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  
  const token = authHeader.replace('Bearer ', '');
  const { url, key } = await getSupabaseClient();
  
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  
  return res.status(200).json({
    user: { id: data.id, email: data.email, metadata: data.user_metadata },
  });
}

async function handleProfile(req, res, body) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  
  const token = authHeader.replace('Bearer ', '');
  const { url, key } = await getSupabaseClient();
  
  if (req.method === 'GET') {
    // Get profile
    const response = await fetch(`${url}/rest/v1/business_users?id=eq.${body.userId}`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    return res.status(200).json({ profile: data[0] || null });
  }
  
  if (req.method === 'POST' || req.method === 'PATCH') {
    // Update profile
    const { userId, ...updates } = body;
    const response = await fetch(`${url}/rest/v1/business_users?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(updates),
    });
    
    const data = await response.json();
    return res.status(200).json({ profile: data[0] || null, updated: true });
  }
}
