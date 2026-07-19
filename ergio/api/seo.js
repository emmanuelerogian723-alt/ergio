async function callGroq(prompt) {
  const key = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY || '';
  const isOR = !process.env.GROQ_API_KEY;
  const url = isOR ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions';
  const model = isOR ? 'meta-llama/llama-3.3-70b-instruct' : 'llama-3.3-70b-versatile';
  const resp = await fetch(url, { method:'POST', headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'}, body: JSON.stringify({ model, messages:[{role:'user',content:prompt}], max_tokens:1000 }) });
  const d = await resp.json();
  return d.choices?.[0]?.message?.content || '';
}
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.json({ status:'ok', service:'SEO Engine' });
  const { businessName, businessType, city, keywords } = req.body;
  try {
    const result = await callGroq(`Generate SEO optimization for this Nigerian business:
Business: ${businessName}, Type: ${businessType}, City: ${city}
Keywords to target: ${keywords || businessType + ' in ' + city}
Return JSON: { title, description, keywords:[], localKeywords:[], metaTags:{}, structuredData:{} }`);
    let seo = {};
    try { seo = JSON.parse(result.match(/\{[\s\S]*\}/)?.[0] || '{}'); } catch(e) {}
    return res.json({ success:true, seo });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}
