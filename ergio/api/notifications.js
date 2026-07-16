/**
 * ERGIO Notifications System
 * Multi-channel notifications: in-app, email, WhatsApp, SMS
 * Free tier: Resend (email), WhatsApp Business API
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
      case 'send': return await sendNotification(req, res, body);
      case 'list': return await listNotifications(req, res, body);
      case 'mark-read': return await markRead(req, res, body);
      case 'preferences': return await handlePreferences(req, res, body);
      case 'broadcast': return await broadcastNotification(req, res, body);
      case 'send-whatsapp': return await sendWhatsApp(req, res, body);
      case 'send-email': return await sendEmail(req, res, body);
      default:
        return res.status(200).json({
          name: 'ERGIO Notifications API',
          endpoints: ['send','list','mark-read','preferences','broadcast','send-whatsapp','send-email']
        });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function sendNotification(req, res, body) {
  const { userId, type = 'info', title, message, channels = ['in-app'] } = body;
  if (!userId || !message) return res.status(400).json({ error: 'userId and message required' });

  const notification = {
    id: Date.now().toString(),
    userId,
    type,
    title: title || 'ERGIO',
    message,
    read: false,
    createdAt: new Date().toISOString(),
  };

  // Send to each channel
  const results = [];
  for (const ch of channels) {
    try {
      switch (ch) {
        case 'in-app':
          results.push({ channel: 'in-app', status: 'queued' });
          break;
        case 'email':
          if (body.email) results.push(await sendEmailInternal(body.email, title, message));
          break;
        case 'whatsapp':
          if (body.phone) results.push(await sendWhatsAppInternal(body.phone, message));
          break;
        case 'sms':
          results.push({ channel: 'sms', status: 'requires-twillio-setup' });
          break;
      }
    } catch (e) {
      results.push({ channel: ch, status: 'failed', error: e.message });
    }
  }

  return res.status(200).json({ notification, delivery: results });
}

async function listNotifications(req, res, body) {
  // Would query Supabase; returning mock structure
  return res.status(200).json({
    notifications: [
      { id: '1', type: 'success', title: 'New booking!', message: 'You have a new booking for Saturday', read: false, createdAt: new Date().toISOString() },
      { id: '2', type: 'info', title: 'Payment received', message: '₦5,000 received from client', read: false, createdAt: new Date().toISOString() },
      { id: '3', type: 'warning', title: 'Engine alert', message: 'AI Outreach sent 12 emails for you today', read: true, createdAt: new Date().toISOString() },
    ],
    unreadCount: 2,
  });
}

async function markRead(req, res, body) {
  return res.status(200).json({ success: true, message: 'Notifications marked as read' });
}

async function handlePreferences(req, res, body) {
  if (req.method === 'GET') {
    return res.status(200).json({
      preferences: {
        inApp: true,
        email: true,
        whatsapp: true,
        sms: false,
        types: {
          bookings: true,
          payments: true,
          leads: true,
          engineAlerts: true,
          marketing: false,
        },
      },
    });
  }
  return res.status(200).json({ success: true, updated: true });
}

async function broadcastNotification(req, res, body) {
  const { message, target = 'all', channels = ['in-app'] } = body;
  if (!message) return res.status(400).json({ error: 'message required' });
  return res.status(200).json({
    success: true,
    broadcastId: Date.now().toString(),
    target,
    channels,
    message: `Broadcast queued for ${target} users`,
  });
}

async function sendWhatsApp(req, res, body) {
  const { phone, message } = body;
  if (!phone || !message) return res.status(400).json({ error: 'phone and message required' });
  const result = await sendWhatsAppInternal(phone, message);
  return res.status(200).json(result);
}

async function sendEmail(req, res, body) {
  const { email, subject, html } = body;
  if (!email || !subject) return res.status(400).json({ error: 'email and subject required' });
  const result = await sendEmailInternal(email, subject, html || body.message);
  return res.status(200).json(result);
}

// Internal helpers
async function sendWhatsAppInternal(phone, message) {
  // Use WhatsApp Business API (free for 1000 conversations/month)
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  
  if (token && phoneId) {
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message },
      }),
    });
    const data = await response.json();
    return { channel: 'whatsapp', status: response.ok ? 'sent' : 'failed', data };
  }
  
  return { channel: 'whatsapp', status: 'not-configured', note: 'Set WHATSAPP_TOKEN and WHATSAPP_PHONE_ID env vars' };
}

async function sendEmailInternal(email, subject, content) {
  // Use Resend (free tier - 3000 emails/month)
  const resendKey = process.env.RESEND_API_KEY;
  
  if (resendKey) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ERGIO <noreply@ergio.app>',
        to: email,
        subject: subject,
        html: `<div style="font-family:Inter,sans-serif;background:#050508;color:#F8FAFC;padding:2rem"><h2 style="color:#00D9FF">${subject}</h2><p>${content}</p><p style="color:#94A3B8;font-size:.8rem;margin-top:2rem">Sent by ERGIO - Your AI Business Operating System</p></div>`,
      }),
    });
    const data = await response.json();
    return { channel: 'email', status: response.ok ? 'sent' : 'failed', data };
  }
  
  return { channel: 'email', status: 'not-configured', note: 'Set RESEND_API_KEY env var' };
}
