// ============================================================
// ERGIO Conductor AI — Vercel-side fallback for when Render is down
// Uses Mistral (primary) → Groq → OpenRouter → Pollinations
// This ensures the Conductor ALWAYS responds, even without Render
// ============================================================

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

You have access to 10 engines, 36 MCP servers, 30 plugins, and 6 agent frameworks.

RULES:
- Be warm, practical, and actionable — like a capable colleague
- Give specific Nigerian naira figures when discussing money
- Reference real Nigerian platforms (Paystack, Flutterwave, USSD, WhatsApp Business)
- Be concise but thorough
- When asked to DO something (find leads, build website, send email), explain what you would do and what tools you'd use
- Respond in plain text, NOT JSON
- If you don't know something, say so honestly
- Suggest next steps proactively`;

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }
  
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { message, history = [], context = '', stream = false } = body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }
  
  // Build conversation messages
  const messages = [
    { role: 'system', content: CONDUCTOR_SYSTEM + (context ? '\n\nBusiness context: ' + context : '') },
    ...history.slice(-10).map(h => ({
      role: h.role === 'user' ? 'user' : 'assistant',
      content: h.text || h.content || ''
    })),
    { role: 'user', content: message }
  ];
  
  try {
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Use callGroq with stream option
      const { callGroq } = await import('../lib/ergio.js');
      const bodyStream = await callGroq(messages, { temperature: 0.7, maxTokens: 1500, stream: true });
      
      if (bodyStream) {
        const reader = bodyStream.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            res.write('data: [DONE]\n\n');
            break;
          }
          const chunk = decoder.decode(value);
          res.write(`data: ${chunk}\n\n`);
        }
        res.end();
      } else {
        res.write('data: {"error": "No stream body"}\n\n');
        res.end();
      }
    } else {
      const response = await callMistral(messages, {
        temperature: 0.7,
        maxTokens: 1500,
        timeout: 30000
      });
      
      return res.status(200).json({
        response: response,
        provider: 'mistral-fallback',
        success: true
      });
    }
  } catch (err) {
    console.error('[Conductor AI] Error:', err.message);
    return res.status(500).json({
      error: err.message,
      response: "I'm having trouble connecting to my AI providers right now. Please try again in a moment.",
      success: false
    });
  }
}
