async function callGroq(messages) {
  const key = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY || '';
  const isOR = !process.env.GROQ_API_KEY;
  const url = isOR ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions';
  const model = isOR ? 'meta-llama/llama-3.3-70b-instruct' : 'llama-3.3-70b-versatile';
  const resp = await fetch(url, { method:'POST', headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'}, body: JSON.stringify({ model, messages, max_tokens:2000, temperature:0.7 }) });
  const d = await resp.json();
  return d.choices?.[0]?.message?.content || '';
}
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.json({ status:'ok', service:'Website Refine' });
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  const send = (type, data) => res.write(`data: ${JSON.stringify({type,data})}\n\n`);
  const { instruction, currentHtml, businessName } = req.body;
  try {
    send('status', { message: 'Refining your website...' });
    const result = await callGroq([
      { role:'system', content:`You are ERGIO website editor. The user has a business website and wants to refine it. Return only the complete updated HTML. No explanations.` },
      { role:'user', content:`Business: ${businessName}\nInstruction: "${instruction}"\nCurrent HTML (first 3000 chars): ${(currentHtml||'').slice(0,3000)}\n\nApply the requested change and return the full updated HTML.` }
    ]);
    send('refined', { html: result, instruction });
    send('done', { success: true });
    res.end();
  } catch(e) {
    send('error', { message: e.message });
    res.end();
  }
}
