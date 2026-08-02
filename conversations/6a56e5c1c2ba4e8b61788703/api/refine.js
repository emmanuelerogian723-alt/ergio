// ========================================
// ERGIO API — /api/refine (v2.0 JSON)
// Surgical website editing — returns clean JSON, NOT SSE
// maxDuration: 60s (set in vercel.json)
// ========================================

async function callGroq(messages, maxTokens = 16000) {
  const key = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY || '';
  if (!key) throw new Error('No AI API key configured');
  const isOR = !process.env.GROQ_API_KEY;
  const url = isOR ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions';
  const model = isOR ? 'meta-llama/llama-3.3-70b-instruct' : 'llama-3.3-70b-versatile';
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.4 })
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`AI API error ${resp.status}: ${errText.slice(0, 200)}`);
  }
  const d = await resp.json();
  return d.choices?.[0]?.message?.content || '';
}

// Surgical edit rules — the AI returns only the changed portion, not the full HTML
const SURGICAL_SYSTEM_PROMPT = `You are ERGIO's surgical website editor. You make precise, targeted edits to HTML.

RULES:
1. Return ONLY the modified HTML. No explanations, no markdown fences.
2. Keep all existing sections intact unless told to remove one.
3. Preserve all CSS classes, IDs, and structure.
4. If the instruction is about layout, fix spacing, alignment, or visual issues.
5. If the instruction is about content, update text only.
6. If the instruction is about style, modify CSS values.
7. Always return complete valid HTML document.
8. Keep the "Powered by ERGIO" footer intact.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.json({ status: 'ok', service: 'Website Refine v2', mode: 'json' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const { instruction, currentHtml, businessName, mode } = req.body;

  if (!instruction) return res.status(400).json({ error: 'Instruction is required' });
  if (!currentHtml) return res.status(400).json({ error: 'currentHtml is required' });

  try {
    // Determine edit type from instruction
    const editType = mode || detectEditType(instruction);

    const messages = [
      { role: 'system', content: SURGICAL_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Business: ${businessName || 'My Business'}
Edit Type: ${editType}
Instruction: "${instruction}"

Current HTML:
${currentHtml.slice(0, 50000)}

Apply the requested change and return the complete updated HTML.`
      }
    ];

    const result = await callGroq(messages, 16000);

    // Clean up — strip markdown fences if present
    const cleanHtml = result
      .replace(/```html\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    // Validate we got HTML back
    if (!cleanHtml.includes('<') || !cleanHtml.includes('>')) {
      return res.status(500).json({ error: 'AI did not return valid HTML', raw: result.slice(0, 500) });
    }

    return res.json({
      success: true,
      html: cleanHtml,
      instruction,
      editType,
      message: 'Website refined successfully'
    });
  } catch (e) {
    console.error('Refine error:', e);
    return res.status(500).json({ error: e.message || 'Refine failed' });
  }
}

function detectEditType(instruction) {
  const i = instruction.toLowerCase();
  if (i.match(/layout|spacing|align|center|padding|margin|grid|flex|position/)) return 'layout';
  if (i.match(/color|font|size|background|style|theme/)) return 'style';
  if (i.match(/text|word|content|heading|title|paragraph|write|change.*to/)) return 'content';
  if (i.match(/add|new|insert|create|section/)) return 'add';
  if (i.match(/remove|delete|hide/)) return 'remove';
  return 'general';
}
