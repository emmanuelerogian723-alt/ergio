async function callGroq(prompt) {
  const key = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY || '';
  const isOR = !process.env.GROQ_API_KEY;
  const url = isOR ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions';
  const model = isOR ? 'meta-llama/llama-3.3-70b-instruct' : 'llama-3.3-70b-versatile';
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 800, temperature: 0.7 })
  });
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { body, method } = req;
  if (method === 'GET') return res.json({ status: 'ok', service: 'AI Outreach' });

  try {
    const { businessName, leadName, leadBusiness, yourService, tone = 'professional' } = body;
    const email = await callGroq(`Write a short, personalized cold outreach email (max 150 words).
Business writing the email: ${businessName}
Service offered: ${yourService}
Recipient: ${leadName} at ${leadBusiness}
Tone: ${tone}
Make it natural, not salesy. Nigerian context. Include subject line.`);
    return res.json({ success: true, email, subject: email.split('\n')[0].replace(/^Subject:\s*/i, '') });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
