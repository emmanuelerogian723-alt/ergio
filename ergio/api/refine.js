// ========================================
// ERGIO API — /api/refine
// Chat refinement: takes user's edit request + current website HTML,
// uses Groq to understand and update only the relevant parts
// Like Lovable's Chat Mode
// ========================================

import { callGroq, success, error, corsHeaders } from '../lib/ergio.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return error(res, 'Use POST', 405);

  try {
    const { message, currentHtml, businessContext } = req.body;

    if (!message) return error(res, 'Message is required', 400);
    if (!currentHtml) return error(res, 'Current HTML is required', 400);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const send = (type, data) => {
      res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
    };

    // ============ STEP 1: UNDERSTAND THE REQUEST ============
    send('status', { task: 'Understanding your request...' });

    const understandPrompt = `You are ERGIO's chat assistant. A user wants to edit their business website.

Current business: ${JSON.stringify(businessContext || {})}

User's request: "${message}"

Analyze what the user wants to change. Return JSON:
{
  "intent": "color_change | content_edit | add_section | remove_section | style_change | layout_change | other",
  "description": "clear description of what to change",
  "affectedSections": ["hero", "about", "services", "testimonials", "faq", "contact", "style", "navigation"],
  "canDo": true_or_false
}`;

    const understandResult = await callGroq([
      { role: 'system', content: 'Return only valid JSON.' },
      { role: 'user', content: understandPrompt }
    ], { temperature: 0.3, response_format: { type: 'json_object' } });

    let understanding;
    try {
      understanding = JSON.parse(understandResult);
    } catch {
      const match = understandResult.match(/\{[\s\S]*\}/);
      understanding = match ? JSON.parse(match[0]) : { intent: 'other', canDo: true };
    }

    send('understanding', { understanding });

    if (!understanding.canDo && understanding.canDo === false) {
      send('error', { message: "I can't do that yet, but I'm learning! Try asking to change colors, text, add sections, or change the layout." });
      res.end();
      return;
    }

    // ============ STEP 2: APPLY CHANGES ============
    send('status', { task: 'Applying changes...' });

    const editPrompt = `You are ERGIO's website editor. Take the current website HTML and apply the user's requested changes.

User's request: "${message}"
What to change: ${understanding.description}
Affected sections: ${(understanding.affectedSections || []).join(', ')}

CURRENT HTML:
${currentHtml.substring(0, 30000)}

Return the COMPLETE updated HTML with the changes applied. Keep the same structure and styling, only change what the user asked for. Do not remove sections unless explicitly asked. Make it look professional.

Return ONLY the raw HTML, no markdown code blocks, no explanations.`;

    const updatedHtml = await callGroq([
      { role: 'system', content: 'You are an expert web developer. Return only raw HTML code, no markdown, no explanations. Start with <!DOCTYPE html>' },
      { role: 'user', content: editPrompt }
    ], { temperature: 0.4, maxTokens: 8000 });

    // Clean up the response (remove markdown if present)
    let cleanHtml = updatedHtml;
    if (cleanHtml.includes('```html')) {
      cleanHtml = cleanHtml.replace(/```html\n?/g, '').replace(/```\n?/g, '');
    }
    if (cleanHtml.includes('```')) {
      cleanHtml = cleanHtml.replace(/```\n?/g, '');
    }

    send('updated', { html: cleanHtml });

    // ============ STEP 3: SUMMARY ============
    const summaryPrompt = `Summarize what was changed in one short sentence. The user's request was: "${message}". What was changed: ${understanding.description}. Return only the summary text, no JSON.`;

    const summary = await callGroq([
      { role: 'system', content: 'Return only a short summary sentence.' },
      { role: 'user', content: summaryPrompt }
    ], { temperature: 0.5, maxTokens: 100 });

    send('complete', { summary: summary.trim(), html: cleanHtml });

    res.end();

  } catch (err) {
    console.error('Refine error:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', data: { message: err.message } })}\n\n`);
    res.end();
  }
}
