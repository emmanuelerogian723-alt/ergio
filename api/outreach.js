// ===== ERGIO ENGINE 3 + 4: AI Outreach + Repeat Client =====
import { callGroqFast, success, error, corsHeaders, getSupabase } from '../lib/ergio.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, businessName, businessType, city, leadName, service, clientName, lastVisit } = req.body || {};

  try {
    if (action === 'generate_outreach') {
      const prompt = `Write 3 different WhatsApp outreach messages for ${businessName} (${businessType}) in ${city || 'Lagos'} reaching out to a potential client named ${leadName || 'potential client'} for their ${service || 'services'}.
      
Messages should be:
1. Casual/friendly Nigerian style
2. Professional/formal  
3. Value-focused with offer

Return JSON: { "messages": [{ "style": "casual", "message": "...", "cta": "Book now link text" }] }`;

      const result = await callGroqFast([
        { role: 'system', content: 'You are ERGIO outreach AI. Write in natural Nigerian WhatsApp style. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ], { response_format: { type: 'json_object' } });

      const data = JSON.parse(result);
      return success(res, data);
    }

    if (action === 'repeat_client') {
      const prompt = `Write a follow-up WhatsApp message for ${businessName} to re-engage client "${clientName || 'valued client'}" who last visited ${lastVisit || '30 days ago'}.

Include:
- Warm personal greeting
- Reference to their last service
- Special returning client offer
- Easy booking CTA

Return JSON: { "message": "full WhatsApp message text", "subject": "Message subject line", "offer": "special offer text" }`;

      const result = await callGroqFast([
        { role: 'system', content: 'You are ERGIO retention AI. Write warm, natural Nigerian WhatsApp style. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ], { response_format: { type: 'json_object' } });

      const data = JSON.parse(result);
      return success(res, data);
    }

    if (action === 'social_content') {
      const prompt = `Create a 7-day Instagram + WhatsApp content calendar for ${businessName} (${businessType}) in ${city || 'Lagos'}.
      
Return JSON: { "posts": [{ "day": 1, "platform": "Instagram", "caption": "...", "hashtags": ["tag1"], "type": "promotion|educational|testimonial", "image_prompt": "description for image" }] }`;

      const result = await callGroqFast([
        { role: 'system', content: 'You are ERGIO social media AI. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ], { response_format: { type: 'json_object' } });

      const data = JSON.parse(result);
      return success(res, data);
    }

    return error(res, 'Unknown action. Use: generate_outreach, repeat_client, social_content');
  } catch (err) {
    console.error('Outreach error:', err);
    return error(res, err.message);
  }
}
