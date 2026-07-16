// ========================================
// ERGIO API — /api/smart-pricing
// AI-powered pricing suggestions based on market analysis
// Uses Groq + SearXNG to find competitor prices
// ========================================

import { callGroq, callGroqFast, searxngSearch, scrapePage, success, error, corsHeaders } from '../lib/ergio.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method !== 'POST') return error(res, 'Use POST', 405);

    const { service, city, currentPrice } = req.body;

    if (!service) return error(res, 'Service description required', 400);

    const location = city || 'Nigeria';

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const send = (type, data) => {
      res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
    };

    // Step 1: Search for competitors
    send('status', { task: `Searching for ${service} pricing in ${location}...` });

    const searchQuery = `${service} price cost ${location} Nigeria 2025`;
    const results = await searxngSearch(searchQuery, { count: 10 });

    // Step 2: Scrape top results for pricing info
    send('status', { task: 'Analyzing competitor prices...' });

    let competitorData = [];
    for (let i = 0; i < Math.min(results.length, 5); i++) {
      const scraped = await scrapePage(results[i].url, { timeout: 6000 });
      if (scraped && scraped.content) {
        competitorData.push({
          title: scraped.title,
          url: results[i].url,
          content: scraped.content.substring(0, 2000)
        });
      }
    }

    // Step 3: AI analysis
    send('status', { task: 'Generating smart pricing strategy...' });

    const pricingPrompt = `You are ERGIO's pricing analyst. Analyze the market for "${service}" in ${location}, Nigeria.

Market data from search:
${competitorData.map(c => `- ${c.title}: ${c.content.substring(0, 500)}`).join('\n')}

Current price: ${currentPrice ? '₦' + currentPrice : 'Not set'}

Return JSON:
{
  "suggestedPrice": number in naira,
  "minPrice": number,
  "maxPrice": number,
  "marketAverage": number,
  "analysis": "2-3 sentence explanation of why this price",
  "strategy": "budget | competitive | premium",
  "tips": ["pricing tip 1", "pricing tip 2", "pricing tip 3"],
  "packages": [
    {"name": "Basic", "price": number, "description": "what's included"},
    {"name": "Standard", "price": number, "description": "what's included"},
    {"name": "Premium", "price": number, "description": "what's included"}
  ]
}

Prices should be realistic for the Nigerian market. Consider local purchasing power.`;

    const result = await callGroq([
      { role: 'system', content: 'You are an expert pricing strategist for the Nigerian market. Return only valid JSON.' },
      { role: 'user', content: pricingPrompt }
    ], { temperature: 0.5, response_format: { type: 'json_object' } });

    let pricing;
    try {
      pricing = JSON.parse(result);
    } catch {
      const match = result.match(/\{[\s\S]*\}/);
      pricing = match ? JSON.parse(match[0]) : { suggestedPrice: 5000, analysis: 'Unable to analyze market data.' };
    }

    send('complete', { pricing, competitors: competitorData.length });
    res.end();

  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', data: { message: err.message } })}\n\n`);
    res.end();
  }
}
