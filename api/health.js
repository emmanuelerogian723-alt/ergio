export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'ok',
    service: 'ergio-api',
    timestamp: new Date().toISOString(),
    version: '5.2',
    engines: 'https://ergio-engines.onrender.com',
    supabase: process.env.SUPABASE_URL ? 'connected' : 'missing',
    ai: process.env.GROQ_API_KEY ? 'groq' : process.env.OPENROUTER_API_KEY ? 'openrouter' : 'pollinations'
  });
}
