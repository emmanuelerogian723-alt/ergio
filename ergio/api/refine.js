// ERGIO Website Refine Endpoint — returns JSON
async function callAI(messages, maxTokens) {
  const key = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY || '';
  const isOR = !process.env.GROQ_API_KEY;
  const url = isOR ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions';
  const model = 'openai/gpt-oss-20b';
  const tokens = maxTokens || 16000;
  
  // Try Groq/OpenRouter first
  if (key) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, max_tokens: tokens, temperature: 0.3 })
      });
      if (resp.ok) {
        const d = await resp.json();
        const content = d.choices?.[0]?.message?.content || '';
        if (content.length > 200) return content;
      }
    } catch(e) { console.error('Primary AI failed:', e.message); }
  }
  
  // Fallback: Pollinations.ai
  try {
    const pollResp = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'openai', messages, max_tokens: tokens, temperature: 0.3 })
    });
    const pollData = await pollResp.json().catch(() => ({}));
    return pollData.choices?.[0]?.message?.content || '';
  } catch(e2) {
    console.error('Pollinations fallback failed:', e2.message);
    return '';
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.json({ status: 'ok', service: 'Website Refine' });
  
  const editRequest = req.body.editRequest || req.body.instruction || '';
  const currentHtml = req.body.currentHtml || '';
  const businessName = req.body.businessName || 'Business';
  
  if (!editRequest) {
    return res.status(400).json({ error: 'Missing editRequest field' });
  }
  if (!currentHtml || currentHtml.length < 100) {
    return res.status(400).json({ error: 'Missing or too short currentHtml' });
  }
  
  try {
    // For large HTML, send first and last portions to preserve structure
    const htmlToSend = currentHtml.length > 15000 
      ? currentHtml.slice(0, 7500) + '\n<!-- MIDDLE TRUNCATED -->\n' + currentHtml.slice(-7500)
      : currentHtml;
    
    const systemPrompt = `You are ERGIO's website editor. You receive a complete HTML website and an edit request. You MUST return the COMPLETE updated HTML document.

ABSOLUTE RULES:
1. Return ONLY valid HTML code
2. Start with <!DOCTYPE html> or <html
3. NO markdown, NO code fences, NO explanations
4. Keep ALL existing content, CSS, and JavaScript intact
5. Only modify what the user specifically requests
6. The response must be the FULL HTML document, not a fragment
7. If fixing spacing: adjust padding, margin, gap values in CSS only
8. If improving contrast: adjust color values only
9. If restructuring: reorder <section> elements only
10. Preserve all class names, IDs, and data attributes`;

    const userPrompt = `Business: ${businessName}

EDIT REQUEST: "${editRequest}"

CURRENT HTML:
${htmlToSend}

Return the COMPLETE updated HTML with the edit applied. ONLY HTML, no explanations.`;

    const result = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], 16000);
    
    // Clean up the result
    let cleanHtml = result.trim();
    // Remove markdown code fences
    cleanHtml = cleanHtml.replace(/^```(?:html)?\s*/i, '');
    cleanHtml = cleanHtml.replace(/\s*```$/i, '');
    cleanHtml = cleanHtml.trim();
    
    // If still too short, the AI might have returned a summary — return original with error
    if (cleanHtml.length < 500) {
      // Return the original HTML unchanged with a note
      return res.json({ 
        html: currentHTML, 
        summary: 'No changes needed — the AI could not process this edit. Try being more specific.',
        success: false 
      });
    }
    
    // Validate it has HTML structure
    const hasHtml = cleanHtml.toLowerCase().includes('<html') || cleanHtml.toLowerCase().includes('<!doctype');
    const hasBody = cleanHtml.toLowerCase().includes('</body>') || cleanHtml.toLowerCase().includes('</html>');
    
    if (!hasHtml || !hasBody) {
      // If it doesn't look like full HTML, return the original
      return res.json({ 
        html: currentHtml, 
        summary: 'Edit produced incomplete HTML — original preserved. Try a more specific request.',
        success: false 
      });
    }
    
    return res.json({ 
      html: cleanHtml, 
      summary: `Applied: ${editRequest.slice(0, 50)}`,
      success: true 
    });
  } catch(e) {
    console.error('Refine error:', e);
    return res.status(500).json({ error: e.message || 'Edit failed' });
  }
}
