// ERGIO AI Mistral — Direct Mistral AI proxy endpoint

import { callMistral, corsHeaders } from '../lib/ergio.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { messages, system, prompt, temperature = 0.7, max_tokens = 2048, maxTokens, model } = body;

    let chatMessages = messages;
    if (!chatMessages && prompt) {
      chatMessages = [
        { role: 'system', content: system || 'You are ERGIO AI.' },
        { role: 'user', content: prompt }
      ];
    }
    if (!chatMessages || !Array.isArray(chatMessages)) {
      return res.status(400).json({ error: 'messages array or prompt required' });
    }

    const result = await callMistral(chatMessages, {
      temperature,
      maxTokens: maxTokens || max_tokens,
      timeout: 25000
    });

    return res.status(200).json({ text: result, provider: 'auto' });
  } catch (err) {
    console.error('[AI Mistral] Error:', err.message);
    return res.status(200).json({
      text: "AI is warming up. Please try again.",
      provider: 'fallback'
    });
  }
}
