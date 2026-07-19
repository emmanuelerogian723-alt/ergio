async function callGroq(prompt) {
  const key = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY || '';
  const isOR = !process.env.GROQ_API_KEY;
  const url = isOR ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions';
  const model = isOR ? 'meta-llama/llama-3.3-70b-instruct' : 'llama-3.3-70b-versatile';
  const resp = await fetch(url, { method:'POST', headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'}, body: JSON.stringify({ model, messages:[{role:'user',content:prompt}], max_tokens:800 }) });
  const d = await resp.json();
  return d.choices?.[0]?.message?.content || '';
}
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.json({ status:'ok', service:'Smart Pricing AI' });
  const { businessType, city, services } = req.body;
  try {
    const analysis = await callGroq(`Analyze pricing for a Nigerian ${businessType} business in ${city}.
Services: ${JSON.stringify(services)}
Provide competitive pricing analysis in Naira (₦) based on Nigerian market conditions.
Return JSON: { recommendations:[{service,current_price,suggested_min,suggested_max,reasoning}], market_insight, pricing_strategy }`);
    let data = {};
    try { data = JSON.parse(analysis.match(/\{[\s\S]*\}/)?.[0] || '{}'); } catch(e) {}
    return res.json({ success:true, analysis: data });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}
