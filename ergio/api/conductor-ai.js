// ERGIO Conductor AI — Vercel-side AI endpoint
// Uses Mistral → Groq → OpenRouter → Pollinations fallback chain

import { callMistral, corsHeaders } from '../lib/ergio.js';

const CONDUCTOR_SYSTEM = `You are ERGIO Conductor, an AI business operating system for African entrepreneurs.

You help with:
- Finding leads and scanning for demand (SearXNG, Bing, Google)
- Building websites (AI-powered, Lovable-style)
- Sending personalized outreach emails (Resend)
- Analyzing competitors and pricing (web scraping + AI)
- Generating content and social media posts
- Processing payments (Paystack, Stripe)
- Managing bookings, invoices, and expenses
- WhatsApp Business automation

Be warm, practical, and actionable. Give specific Nigerian naira figures when discussing money.
Reference real Nigerian platforms (Paystack, Flutterwave, USSD, WhatsApp Business).
Be concise but thorough. Respond in plain text, NOT JSON.`;

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { message, history = [], context = '' } = body;

    if (!message) return res.status(400).json({ error: 'Message required' });

    const messages = [
      { role: 'system', content: CONDUCTOR_SYSTEM + (context ? '\n\nBusiness context: ' + context : '') },
      ...history.slice(-10).map(h => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.text || h.content || ''
      })),
      { role: 'user', content: message }
    ];

    const response = await callMistral(messages, {
      temperature: 0.7,
      maxTokens: 1500,
      timeout: 25000
    });

    return res.status(200).json({ response, provider: 'auto' });
  } catch (err) {
    console.error('[Conductor AI] Error:', err.message);
    return res.status(200).json({
      response: "I'm here to help! I can assist with finding leads, building websites, sending outreach emails, analyzing competitors, generating content, processing payments, and managing your business. What would you like to do?",
      provider: 'fallback'
    });
  }
}
