// ERGIO AI — Mistral API Proxy
// Uses MISTRAL_API_KEY from environment (set on Vercel)
// Supports chat completions, JSON mode, and streaming

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const MISTRAL_KEY = process.env.MISTRAL_API_KEY;
  if (!MISTRAL_KEY) {
    return res.status(503).json({ 
      error: 'Mistral API not configured. Set MISTRAL_API_KEY environment variable.' 
    });
  }

  const { messages, model, temperature, max_tokens, json_mode, stream } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const body = {
    model: model || 'mistral-small-latest',
    messages,
    temperature: temperature ?? 0.7,
    max_tokens: max_tokens ?? 4096,
  };

  if (json_mode) {
    body.response_format = { type: 'json_object' };
  }

  try {
    const resp = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MISTRAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ 
        error: `Mistral API error: ${resp.status}`,
        details: errText.substring(0, 500)
      });
    }

    if (stream) {
      // Stream response via SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        res.write(`data: ${chunk}\n\n`);
      }
      res.end();
    } else {
      const data = await resp.json();
      return res.status(200).json({
        content: data.choices?.[0]?.message?.content || '',
        model: data.model,
        usage: data.usage,
      });
    }
  } catch (err) {
    console.error('Mistral API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
