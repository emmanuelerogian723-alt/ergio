async function callGroq(prompt) {
  const key = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY || '';
  const isOR = !process.env.GROQ_API_KEY;
  const url = isOR ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions';
  const model = isOR ? 'meta-llama/llama-3.1-8b-instant' : 'llama-3.1-8b-instant';
  const resp = await fetch(url, { method:'POST', headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'}, body: JSON.stringify({ model, messages:[{role:'user',content:prompt}], max_tokens:300, temperature:0.7 }) });
  const d = await resp.json();
  return d.choices?.[0]?.message?.content || '';
}
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.json({ status:'ok', service:'WhatsApp AI Bot' });
  const { message, businessName, businessType, context } = req.body;
  try {
    const reply = await callGroq(`You are a WhatsApp customer service bot for ${businessName} (${businessType}).
Context: ${context || 'Nigerian business'}
Customer message: "${message}"
Reply naturally, briefly (max 2 sentences), in a friendly Nigerian way. If they want to book or buy, direct them to do so.`);
    return res.json({ success:true, reply: reply.trim() });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}
