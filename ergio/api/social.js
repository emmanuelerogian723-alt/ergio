// ========================================
// ERGIO API — /api/social
// AI Social Media Kit: generates posts for Twitter, Instagram,
// Facebook, and WhatsApp status from the business profile
// ========================================

import { callGroq, success, error, corsHeaders } from '../lib/ergio.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method !== 'POST') return error(res, 'Use POST', 405);

    const { businessName, businessType, city, services, tone } = req.body;

    if (!businessName) return error(res, 'Business name required', 400);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const send = (type, data) => {
      res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
    };

    send('status', { task: 'Generating social media content...' });

    const prompt = `You are ERGIO's social media expert. Create a full social media kit for this business:

Business: ${businessName}
Type: ${businessType || 'service'}
Location: ${city || 'Nigeria'}
Services: ${JSON.stringify(services || [])}
Tone: ${tone || 'professional but warm'}

Return JSON:
{
  "twitter": [
    "tweet 1 (max 280 chars, with hashtags)",
    "tweet 2",
    "tweet 3"
  ],
  "instagram": [
    {"caption": "caption 1 with hashtags", "imagePrompt": "what image to post"},
    {"caption": "caption 2", "imagePrompt": "what image"},
    {"caption": "caption 3", "imagePrompt": "what image"}
  ],
  "facebook": [
    "post 1 (longer, engaging)",
    "post 2"
  ],
  "whatsapp": [
    "short status update 1",
    "short status update 2",
    "short status update 3"
  ],
  "bio": "one-line bio for social profiles",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"]
}

Rules:
1. Use Nigerian English and context
2. Make posts engaging, not salesy
3. Include emojis where appropriate
4. Hashtags should be relevant to Nigerian market
5. WhatsApp statuses should be very short (under 100 chars)`;

    const result = await callGroq([
      { role: 'system', content: 'You are a social media expert for Nigerian businesses. Return only valid JSON.' },
      { role: 'user', content: prompt }
    ], { temperature: 0.8, maxTokens: 3000, response_format: { type: 'json_object' } });

    let socialKit;
    try {
      socialKit = JSON.parse(result);
    } catch {
      const match = result.match(/\{[\s\S]*\}/);
      socialKit = match ? JSON.parse(match[0]) : {};
    }

    send('complete', { socialKit });
    res.end();

  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', data: { message: err.message } })}\n\n`);
    res.end();
  }
}
