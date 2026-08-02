// ERGIO Website Refine Endpoint — returns JSON (not SSE)
async function callAI(messages) {
  const key = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY || '';
  const isOR = !process.env.GROQ_API_KEY;
  const url = isOR ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions';
  const model = isOR ? 'openai/gpt-oss-20b' : 'openai/gpt-oss-20b';
  
  if (!key) {
    // Pollinations fallback
    const pollResp = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'openai', messages, max_tokens: 8000, temperature: 0.7 })
    });
    const pollData = await pollResp.json().catch(() => ({}));
    return pollData.choices?.[0]?.message?.content || '';
  }
  
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens: 8000, temperature: 0.7 })
  });
  
  if (!resp.ok) {
    // Try Pollinations fallback
    const pollResp = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'openai', messages, max_tokens: 8000, temperature: 0.7 })
    });
    const pollData = await pollResp.json().catch(() => ({}));
    return pollData.choices?.[0]?.message?.content || '';
  }
  
  const d = await resp.json();
  return d.choices?.[0]?.message?.content || '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.json({ status: 'ok', service: 'Website Refine' });
  
  // Accept both field names for compatibility
  const editRequest = req.body.editRequest || req.body.instruction || '';
  const currentHtml = req.body.currentHtml || '';
  const businessName = req.body.businessName || 'Business';
  const uploadedImages = req.body.uploadedImages || [];
  
  if (!editRequest) {
    return res.status(400).json({ error: 'Missing editRequest field' });
  }
  if (!currentHtml || currentHtml.length < 100) {
    return res.status(400).json({ error: 'Missing or too short currentHtml' });
  }
  
  try {
    // Send up to 12000 chars of HTML to the AI (enough for most websites)
    const htmlToSend = currentHtml.length > 12000 
      ? currentHtml.slice(0, 6000) + '\n<!-- ... middle truncated ... -->\n' + currentHtml.slice(-6000)
      : currentHtml;
    
    const systemPrompt = `You are ERGIO's website editor. You receive a complete HTML website and an edit instruction. You must return the COMPLETE updated HTML with the requested change applied.

CRITICAL SURGICAL EDIT RULES:
1. Preserve ALL CSS exactly as-is unless the edit explicitly asks for styling changes
2. Preserve ALL JavaScript exactly as-is
3. Only change what the user asks for — nothing more
4. Keep the same structure, sections, and layout
5. Return complete valid HTML starting with <!DOCTYPE html> or <html
6. Do NOT add markdown code fences
7. Do NOT add explanations before or after the HTML
8. If the user asks to "fix spacing", adjust padding/margins only
9. If the user asks to "improve contrast", adjust colors only
10. If the user asks to "restructure", reorder sections only
11. Keep all content (text, images, links) intact unless explicitly told to change
12. Smallest edit = safest edit
13. Return the FULL HTML document, not just the changed part`;

    const userPrompt = `Business: ${businessName}
Edit instruction: "${editRequest}"

Current HTML:
${htmlToSend}

Apply the requested change and return the FULL updated HTML. No explanations, no markdown, just the HTML.`;

    const result = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);
    
    // Clean up the result — remove markdown fences if present
    let cleanHtml = result.trim();
    if (cleanHtml.startsWith('```html')) cleanHtml = cleanHtml.slice(7);
    if (cleanHtml.startsWith('```')) cleanHtml = cleanHtml.slice(3);
    if (cleanHtml.endsWith('```')) cleanHtml = cleanHtml.slice(0, -3);
    cleanHtml = cleanHtml.trim();
    
    if (cleanHtml.length < 200) {
      return res.status(500).json({ error: 'AI returned too short result. Try being more specific.' });
    }
    
    return res.json({ 
      html: cleanHtml, 
      summary: `Applied: ${editRequest.slice(0, 60)}`,
      success: true 
    });
  } catch(e) {
    console.error('Refine error:', e);
    return res.status(500).json({ error: e.message || 'Edit failed' });
  }
}
