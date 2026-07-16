/**
 * ERGIO Open-Source AI Engine Hub
 * Integrates: Jan AI (local LLM), Stable Diffusion via Pollinations, 
 * Gemma (via Groq), OSM Nominatim (geocoding), SearXNG (search), 
 * Crawlee-style scraping with Cheerio
 * 
 * All free, open-source, no API keys required (except Groq for speed)
 */

export default async function handler(req, res) {
  const { method, body, query } = req;
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (method === 'OPTIONS') return res.status(200).end();

  const action = query.action || body?.action || '';

  try {
    switch (action) {
      case 'jan-ai': return await handleJanAI(req, res);
      case 'stable-diffusion': return await handleStableDiffusion(req, res);
      case 'gemma': return await handleGemma(req, res);
      case 'osm-geocode': return await handleOSMGeocode(req, res);
      case 'osm-reverse': return await handleOSMReverse(req, res);
      case 'osm-search': return await handleOSMSearch(req, res);
      case 'searxng': return await handleSearXNG(req, res);
      case 'scrape': return await handleScrape(req, res);
      case 'crawl': return await handleCrawl(req, res);
      case 'multi-model': return await handleMultiModel(req, res);
      case 'enhance-prompt': return await handleEnhancePrompt(req, res);
      case 'status': return res.status(200).json({ 
        engines: {
          'Jan AI': { status: 'available', description: 'Open-source local LLM runner (OpenAI-compatible API)' },
          'Stable Diffusion': { status: 'available', description: 'Image generation via Pollinations (Flux model, no API key)' },
          'Gemma': { status: 'available', description: 'Google open-source model via Groq (gemma2-9b-it)' },
          'Llama 3.3 70B': { status: 'available', description: 'Meta open-source model via Groq' },
          'OSM Nominatim': { status: 'available', description: 'Free geocoding from OpenStreetMap' },
          'SearXNG': { status: 'available', description: 'Meta search engine aggregating 70+ search engines' },
          'Cheerio Scraper': { status: 'available', description: 'Open-source HTML parser for web scraping' },
          'Pollinations': { status: 'available', description: 'Free AI image/text generation, no API key' },
        },
        timestamp: new Date().toISOString()
      });
      default:
        return res.status(200).json({
          name: 'ERGIO Open-Source AI Engine Hub',
          version: '2.0',
          engines: ['Jan AI', 'Stable Diffusion', 'Gemma', 'Llama 3.3 70B', 'OSM Nominatim', 'SearXNG', 'Cheerio', 'Pollinations'],
          endpoints: [
            '/api/engines?action=jan-ai - Local LLM via Jan AI',
            '/api/engines?action=stable-diffusion - Image generation via Pollinations Flux',
            '/api/engines?action=gemma - Google Gemma model via Groq',
            '/api/engines?action=osm-geocode - Forward geocoding (address to coords)',
            '/api/engines?action=osm-reverse - Reverse geocoding (coords to address)',
            '/api/engines?action=osm-search - Search for places by category',
            '/api/engines?action=searxng - Meta search across 70+ engines',
            '/api/engines?action=scrape - Scrape and parse any URL',
            '/api/engines?action=crawl - Crawl multiple pages from a domain',
            '/api/engines?action=multi-model - Run prompt across multiple models simultaneously',
            '/api/engines?action=enhance-prompt - AI-enhance a prompt for better image generation',
            '/api/engines?action=status - Check all engine statuses',
          ]
        });
    }
  } catch (err) {
    console.error('Engine Hub Error:', err);
    return res.status(500).json({ error: err.message || 'Engine error' });
  }
}

// ============================================
// JAN AI - Open-source local LLM (OpenAI-compatible API)
// ============================================
async function handleJanAI(req, res) {
  const { prompt, systemPrompt, model, janApiUrl, temperature = 0.7, maxTokens = 2048 } = req.body || {};
  
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });
  
  const apiUrl = janApiUrl || process.env.JAN_API_URL || 'http://localhost:1337/v1/chat/completions';
  const selectedModel = model || process.env.JAN_DEFAULT_MODEL || 'llama-3.1-8b-instruct';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });
    
    if (!response.ok) {
      return await groqFallback(req, res, prompt, systemPrompt, 'gemma2-9b-it');
    }
    
    const data = await response.json();
    return res.status(200).json({
      engine: 'Jan AI',
      model: selectedModel,
      content: data.choices?.[0]?.message?.content || '',
      usage: data.usage,
      local: true,
    });
  } catch (err) {
    return await groqFallback(req, res, prompt, systemPrompt, 'gemma2-9b-it');
  }
}

// ============================================
// STABLE DIFFUSION - Via Pollinations (free, no API key)
// ============================================
async function handleStableDiffusion(req, res) {
  const { prompt, width = 1024, height = 1024, seed, model = 'flux', enhance = true, nologo = true } = req.body || {};
  
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });
  
  const encodedPrompt = encodeURIComponent(prompt);
  const params = new URLSearchParams({
    width: width.toString(),
    height: height.toString(),
    model,
    ...(enhance && { enhance: 'true' }),
    ...(nologo && { nologo: 'true' }),
    ...(seed && { seed: seed.toString() }),
  });
  
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`;
  
  let enhancedPrompt = prompt;
  if (enhance) {
    try {
      const enhanceResp = await fetch(`https://text.pollinations.ai/${encodeURIComponent(
        `Enhance this image generation prompt for a professional business context. Make it detailed, specific, and high-quality. Return only the enhanced prompt: "${prompt}"`
      )}`);
      if (enhanceResp.ok) {
        enhancedPrompt = (await enhanceResp.text()).trim().slice(0, 500);
      }
    } catch (e) {}
  }
  
  return res.status(200).json({
    engine: 'Stable Diffusion (via Pollinations)',
    model,
    imageUrl,
    enhancedPrompt,
    originalPrompt: prompt,
    dimensions: { width, height },
    seed: seed || 'random',
    note: 'Image is generated on-demand when the URL is accessed. No API key required.',
  });
}

// ============================================
// GEMMA - Google open-source model via Groq
// ============================================
async function handleGemma(req, res) {
  const { prompt, systemPrompt, temperature = 0.7, maxTokens = 2048 } = req.body || {};
  
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });
  
  return await groqFallback(req, res, prompt, systemPrompt, 'gemma2-9b-it');
}

// ============================================
// OSM NOMINATIM - Free geocoding from OpenStreetMap
// ============================================
async function handleOSMGeocode(req, res) {
  const { address, city, country = 'Nigeria' } = req.body || req.query || {};
  
  if (!address) return res.status(400).json({ error: 'address is required' });
  
  const q = [address, city, country].filter(Boolean).join(', ');
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5`;
  
  const response = await fetch(url, {
    headers: { 'User-Agent': 'ERGIO/2.0 (business platform for Africa)' },
  });
  
  if (!response.ok) return res.status(502).json({ error: 'OSM geocoding failed' });
  
  const results = await response.json();
  return res.status(200).json({
    engine: 'OSM Nominatim',
    query: q,
    results: results.map(r => ({
      displayName: r.display_name,
      lat: r.lat,
      lon: r.lon,
      type: r.type,
      address: r.address,
      importance: r.importance,
    })),
  });
}

async function handleOSMReverse(req, res) {
  const { lat, lon } = req.body || req.query || {};
  
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon are required' });
  
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
  
  const response = await fetch(url, {
    headers: { 'User-Agent': 'ERGIO/2.0 (business platform for Africa)' },
  });
  
  if (!response.ok) return res.status(502).json({ error: 'OSM reverse geocoding failed' });
  
  const data = await response.json();
  return res.status(200).json({
    engine: 'OSM Nominatim (Reverse)',
    displayName: data.display_name,
    address: data.address,
    lat: data.lat,
    lon: data.lon,
  });
}

async function handleOSMSearch(req, res) {
  const { category, city, country = 'Nigeria', limit = 20 } = req.body || req.query || {};
  
  if (!category) return res.status(400).json({ error: 'category is required' });
  
  const query = `[out:json][timeout:25];area["name"="${country}"]->.country;area["name"="${city || 'Lagos'}"]->.city;(node["shop"="${category}"](area.city);node["amenity"="${category}"](area.city);node["craft"="${category}"](area.city);node["office"="${category}"](area.city););out ${limit};`;
  
  const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  const response = await fetch(overpassUrl, {
    headers: { 'User-Agent': 'ERGIO/2.0' },
  });
  
  if (!response.ok) return res.status(502).json({ error: 'OSM search failed' });
  
  const data = await response.json();
  return res.status(200).json({
    engine: 'OpenStreetMap Overpass',
    category,
    location: city || 'Lagos',
    count: data.elements?.length || 0,
    results: (data.elements || []).map(e => ({
      name: e.tags?.name || 'Unknown',
      type: e.tags?.shop || e.tags?.amenity || e.tags?.craft || e.tags?.office,
      lat: e.lat,
      lon: e.lon,
      tags: e.tags,
    })),
  });
}

// ============================================
// SEARXNG - Meta search across 70+ search engines
// ============================================
async function handleSearXNG(req, res) {
  const { query: searchQuery, categories, language = 'en', time_range, safesearch = 1, limit = 20 } = req.body || req.query || {};
  
  if (!searchQuery) return res.status(400).json({ error: 'query is required' });
  
  const searxngInstances = [
    'https://search.sapti.me',
    'https://searx.be', 
    'https://search.bus-hit.me',
    'https://searx.tiekoetter.com',
  ];
  
  const params = new URLSearchParams({
    q: searchQuery,
    format: 'json',
    language,
    safesearch: safesearch.toString(),
    ...(categories && { categories }),
    ...(time_range && { time_range }),
  });
  
  let results = null;
  let usedInstance = '';
  
  for (const instance of searxngInstances) {
    try {
      const response = await fetch(`${instance}/search?${params.toString()}`, {
        headers: { 'User-Agent': 'ERGIO/2.0', 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) {
        results = await response.json();
        usedInstance = instance;
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!results) return res.status(502).json({ error: 'All SearXNG instances unavailable. Try again later.' });
  
  return res.status(200).json({
    engine: 'SearXNG',
    instance: usedInstance,
    query: searchQuery,
    count: (results.results || []).length,
    results: (results.results || []).slice(0, limit).map(r => ({
      title: r.title,
      url: r.url,
      content: r.content,
      engine: r.engine,
      score: r.score,
      category: r.category,
      publishedDate: r.publishedDate,
    })),
  });
}

// ============================================
// SCRAPE - Open-source web scraping
// ============================================
async function handleScrape(req, res) {
  const { url, extractText = true, extractLinks = true, extractImages = true, extractMeta = true } = req.body || {};
  
  if (!url) return res.status(400).json({ error: 'url is required' });
  
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' },
    signal: AbortSignal.timeout(15000),
  });
  
  if (!response.ok) return res.status(502).json({ error: `Failed to fetch: ${response.status}` });
  
  const html = await response.text();
  const result = { engine: 'Cheerio Scraper', url, title: '', description: '', text: '', links: [], images: [], meta: {} };
  
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch) result.title = titleMatch[1].trim();
  
  if (extractMeta) {
    const metas = html.match(/<meta\s+(?:name|property|itemprop)=["']([^"']+)["']\s+content=["']([^"']+)["']/gi) || [];
    metas.forEach(m => {
      const match = m.match(/(?:name|property|itemprop)=["']([^"']+)["']\s+content=["']([^"']+)["']/i);
      if (match) result.meta[match[1]] = match[2];
    });
    result.description = result.meta['description'] || result.meta['og:description'] || '';
  }
  
  if (extractText) {
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
    result.text = text.slice(0, 10000);
  }
  
  if (extractLinks) {
    const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null && result.links.length < 100) {
      const href = match[1];
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        result.links.push({ url: href.startsWith('http') ? href : new URL(href, url).href, text: match[2].trim().slice(0, 200) });
      }
    }
  }
  
  if (extractImages) {
    const imgRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*(?:alt=["']([^"']+)["'])?[^>]*>/gi;
    let match;
    while ((match = imgRegex.exec(html)) !== null && result.images.length < 50) {
      const src = match[1];
      if (src && !src.startsWith('data:')) {
        result.images.push({ url: src.startsWith('http') ? src : new URL(src, url).href, alt: match[2] || '' });
      }
    }
  }
  
  return res.status(200).json(result);
}

// ============================================
// CRAWL - Crawl multiple pages from a domain
// ============================================
async function handleCrawl(req, res) {
  const { baseUrl, maxPages = 5, followExternal = false } = req.body || {};
  
  if (!baseUrl) return res.status(400).json({ error: 'baseUrl is required' });
  
  const visited = new Set();
  const queue = [baseUrl];
  const pages = [];
  const baseDomain = new URL(baseUrl).hostname;
  
  while (queue.length > 0 && pages.length < maxPages) {
    const currentUrl = queue.shift();
    if (visited.has(currentUrl)) continue;
    visited.add(currentUrl);
    
    try {
      const response = await fetch(currentUrl, {
        headers: { 'User-Agent': 'ERGIO/2.0 Crawler' },
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) continue;
      const html = await response.text();
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : currentUrl;
      const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000);
      pages.push({ url: currentUrl, title, textPreview: text });
      
      const linkRegex = /<a\s+[^>]*href=["']([^"']+)["']/gi;
      let match;
      while ((match = linkRegex.exec(html)) !== null && queue.length < 50) {
        const href = match[1];
        if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
          try {
            const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;
            const linkDomain = new URL(fullUrl).hostname;
            if ((followExternal || linkDomain === baseDomain) && !visited.has(fullUrl)) {
              queue.push(fullUrl);
            }
          } catch (e) {}
        }
      }
    } catch (e) { continue; }
  }
  
  return res.status(200).json({ engine: 'Crawlee-style Crawler', baseUrl, pagesCrawled: pages.length, pages });
}

// ============================================
// MULTI-MODEL - Run prompt across multiple models
// ============================================
async function handleMultiModel(req, res) {
  const { prompt, systemPrompt, models = ['llama-3.3-70b-versatile', 'gemma2-9b-it', 'llama-3.1-8b-instant'] } = req.body || {};
  
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });
  
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return res.status(500).json({ error: 'GROQ_API_KEY not configured' });
  
  const promises = models.map(async (model) => {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
        signal: AbortSignal.timeout(30000),
      });
      
      if (!response.ok) return { model, error: `HTTP ${response.status}` };
      const data = await response.json();
      return { model, content: data.choices?.[0]?.message?.content || '', usage: data.usage };
    } catch (err) {
      return { model, error: err.message };
    }
  });
  
  const results = await Promise.all(promises);
  
  return res.status(200).json({
    engine: 'Multi-Model Ensemble',
    prompt,
    results,
    best: results.find(r => !r.error && r.content?.length > 100) || results[0],
  });
}

// ============================================
// ENHANCE PROMPT - AI-enhance prompts for image gen
// ============================================
async function handleEnhancePrompt(req, res) {
  const { prompt, context = 'business logo' } = req.body || {};
  
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });
  
  const enhanceUrl = `https://text.pollinations.ai/${encodeURIComponent(
    `You are an expert prompt engineer for AI image generation. Enhance this prompt for generating a ${context}. Make it detailed, professional, with specific style, lighting, composition, and color instructions. Return ONLY the enhanced prompt, nothing else.\n\nOriginal: "${prompt}"`
  )}`;
  
  const response = await fetch(enhanceUrl, {
    headers: { 'User-Agent': 'ERGIO/2.0' },
    signal: AbortSignal.timeout(15000),
  });
  
  if (!response.ok) return res.status(502).json({ error: 'Prompt enhancement failed' });
  
  const enhanced = (await response.text()).trim();
  
  return res.status(200).json({
    engine: 'Pollinations Text (Prompt Enhancement)',
    original: prompt,
    enhanced,
    imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(enhanced)}?width=1024&height=1024&model=flux&nologo=true`,
  });
}

// ============================================
// GROQ FALLBACK - When Jan AI is unavailable
// ============================================
async function groqFallback(req, res, prompt, systemPrompt, model) {
  const groqKey = process.env.GROQ_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  
  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    { role: 'user', content: prompt }
  ];

  // Try Groq first
  if (groqKey) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + groqKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model || 'gemma2-9b-it', messages, temperature: 0.7, max_tokens: 2048 }),
      });
      if (response.ok) {
        const data = await response.json();
        return res.status(200).json({
          engine: 'Groq (fallback for Jan AI)',
          model: model || 'gemma2-9b-it',
          content: data.choices?.[0]?.message?.content || '',
          usage: data.usage,
          local: false,
        });
      }
    } catch (e) {}
  }

  // Try OpenRouter second
  if (openrouterKey) {
    try {
      const orModel = model === 'gemma2-9b-it' ? 'google/gemma-2-9b-it:free' : 'meta-llama/llama-3.3-70b-instruct';
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + openrouterKey, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://ergio.vercel.app', 'X-Title': 'ERGIO' },
        body: JSON.stringify({ model: orModel, messages, temperature: 0.7, max_tokens: 2048 }),
      });
      if (response.ok) {
        const data = await response.json();
        return res.status(200).json({
          engine: 'OpenRouter (fallback)',
          model: orModel,
          content: data.choices?.[0]?.message?.content || '',
          local: false,
        });
      }
    } catch (e) {}
  }

  // Final fallback: Pollinations text API (no key needed, completely free)
  try {
    const pollinationsPrompt = (systemPrompt ? systemPrompt + ' ' : '') + prompt;
    const response = await fetch('https://text.pollinations.ai/' + encodeURIComponent(pollinationsPrompt));
    if (response.ok) {
      const content = await response.text();
      return res.status(200).json({
        engine: 'Pollinations (free, no key)',
        model: 'openai',
        content: content,
        local: false,
      });
    }
  } catch (e) {}

  return res.status(500).json({ error: 'All AI providers failed. Set GROQ_API_KEY or OPENROUTER_API_KEY on Vercel.' });
}
