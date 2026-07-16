// ========================================
// ERGIO API — /api/outreach
// AI Outreach Engine: writes personalized cold emails using Groq
// Sends via Resend (or logs if no Resend key)
// ========================================

import { callGroq, success, error, corsHeaders } from '../lib/ergio.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    // Return draft outreach for a lead without sending
    const { businessName, businessType, leadName, leadContext, city } = req.query;

    if (!businessType) return error(res, 'Business type required', 400);

    try {
      const email = await generateOutreachEmail(
        businessName || 'Your Business',
        businessType,
        leadName || 'there',
        leadContext || '',
        city || 'Nigeria'
      );
      return success(res, { email });
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  if (req.method !== 'POST') return error(res, 'Use GET or POST', 405);

  try {
    const { businessName, businessType, leadName, leadEmail, leadContext, city, sendEmail } = req.body;

    if (!businessType) return error(res, 'Business type required', 400);

    // Generate personalized email
    const email = await generateOutreachEmail(
      businessName || 'Your Business',
      businessType,
      leadName || 'there',
      leadContext || '',
      city || 'Nigeria'
    );

    let sent = false;
    let sendResult = null;

    // Send via Resend if API key is available
    if (sendEmail && leadEmail && process.env.RESEND_API_KEY) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: `${businessName} <noreply@ergio.app>`,
            to: leadEmail,
            subject: email.subject,
            html: email.html
          })
        });
        const data = await response.json();
        sent = true;
        sendResult = data;
      } catch (err) {
        sendResult = { error: err.message };
      }
    }

    return success(res, { email, sent, sendResult });
  } catch (err) {
    return error(res, err.message, 500);
  }
}

async function generateOutreachEmail(businessName, businessType, leadName, leadContext, city) {
  const prompt = `You are ERGIO's AI Outreach engine. Write a personalized cold outreach email.

Business reaching out: "${businessName}" (a ${businessType} in ${city})
Recipient: ${leadName}
Context about the recipient: ${leadContext}

Rules:
1. Subject line must be catchy but not spammy
2. Keep it under 150 words
3. Personalize based on the context
4. End with a clear call-to-action (book a call or reply)
5. Sound human, not robotic
6. No generic templates - make it specific

Return JSON:
{
  "subject": "email subject",
  "body": "plain text email body",
  "html": "formatted HTML version of the body"
}`;

  const result = await callGroq([
    { role: 'system', content: 'Return only valid JSON. You write excellent cold emails that get replies.' },
    { role: 'user', content: prompt }
  ], { temperature: 0.8, response_format: { type: 'json_object' } });

  try {
    return JSON.parse(result);
  } catch {
    const match = result.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return { subject: `From ${businessName}`, body: result, html: `<p>${result}</p>` };
  }
}
