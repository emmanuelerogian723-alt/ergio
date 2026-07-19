async function callGroq(prompt) {
  const key = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY || '';
  const isOR = !process.env.GROQ_API_KEY;
  const url = isOR ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions';
  const model = isOR ? 'meta-llama/llama-3.3-70b-instruct' : 'llama-3.3-70b-versatile';
  const resp = await fetch(url, { method:'POST', headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'}, body: JSON.stringify({ model, messages:[{role:'user',content:prompt}], max_tokens:1200, temperature:0.8 }) });
  const d = await resp.json();
  return d.choices?.[0]?.message?.content || '';
}
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.json({ status:'ok', service:'Social Media AI' });
  const { businessName, businessType, city, service, tone='engaging' } = req.body;
  try {
    const content = await callGroq(`Create a Nigerian-market social media content kit for:
Business: ${businessName} (${businessType}) in ${city}
Service to promote: ${service || 'general services'}
Tone: ${tone}
Return JSON with: { instagram: {caption, hashtags:[]}, twitter: {tweet}, facebook: {post}, whatsapp: {broadcast} }
Make it culturally relevant to Nigeria. Use Naira (₦). Keep it authentic.`);
    let kit = {};
    try { kit = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || '{}'); } catch(e) {}
    return res.json({ success:true, content: kit });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}
