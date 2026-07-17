// ========================================
// ERGIO — Shared Libraries (v4.0)
// Updated: DuckDuckGo fallback search, multi-engine lead scanner
// ========================================

// ============ SUPABASE CLIENT ============
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL_FALLBACK = 'https://owcxfzlanlrulflsyvlr.supabase.co';
const SUPABASE_ANON_FALLBACK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Y3hmemxhbmxydWxmbHN5dmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNzI5NDIsImV4cCI6MjA5OTc0ODk0Mn0.k6IISu8k8QoU1CGLF0U3319qqDvEIwYY8PPXXvwfbAw';

export function getSupabase(req) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL_FALLBACK;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || SUPABASE_ANON_FALLBACK;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function getUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const supabase = getSupabase(req);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error) return null;
  return user;
}

// ============ AI CLIENT (Groq + OpenRouter + Pollinations fallback) ============
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function callGroq(messages, options = {}) {
  const groqKey = process.env.GROQ_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;

  const model = options.model || 'llama-3.3-70b-versatile';
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens || 8000;
  const stream = options.stream || false;

  const body = { messages, temperature, max_tokens: maxTokens, stream };


  // Provider chain: Groq (Llama 3.3 70B) → Groq (Gemma 2 9B) → OpenRouter (Llama 3.3 70B)
  const providers = [];
  
  // 1. Groq with Llama 3.3 70B (primary — best quality)
  if (groqKey) {
    providers.push({ 
      url: GROQ_URL, key: groqKey, model: 'llama-3.3-70b-versatile',
      label: 'Groq/Llama-3.3-70B'
    });
    // 2. Groq with Gemma 2 9B (fast fallback — good for code generation)
    providers.push({ 
      url: GROQ_URL, key: groqKey, model: 'gemma2-9b-it',
      label: 'Groq/Gemma-2-9B'
    });
  }
  
  // 3. OpenRouter with Llama 3.3 70B (external fallback)
  if (openrouterKey) {
    providers.push({ 
      url: OPENROUTER_URL, key: openrouterKey, model: 'meta-llama/llama-3.3-70b-instruct',
      label: 'OpenRouter/Llama-3.3-70B',
      extraHeaders: { 'HTTP-Referer': 'https://ergio.vercel.app', 'X-Title': 'ERGIO' }
    });
    // 4. OpenRouter with Gemma 2 (free fallback)
    providers.push({ 
      url: OPENROUTER_URL, key: openrouterKey, model: 'google/gemma-2-9b-it:free',
      label: 'OpenRouter/Gemma-2-9B',
      extraHeaders: { 'HTTP-Referer': 'https://ergio.vercel.app', 'X-Title': 'ERGIO' }
    });
  }

  if (providers.length === 0) throw new Error('Missing AI API key. Set GROQ_API_KEY or OPENROUTER_API_KEY.');

  for (const provider of providers) {
    try {
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider.key}`,
          'Content-Type': 'application/json',
          ...(provider.extraHeaders || {})
        },
        body: JSON.stringify({ 
          ...body, 
          model: provider.model,
          ...(options.response_format && !provider.model.includes('gemma') ? 
            { response_format: options.response_format } : {})
        })
      });
      if (!response.ok) { 
        console.error(`AI error (${provider.label}): ${response.status}`);
        continue; 
      }
      if (stream) return response.body;
      const data = await response.json();
      const result = data.choices[0].message.content;
      console.log(`✅ AI success via ${provider.label} (${result.length} chars)`);
      return result;
    } catch (err) { 
      console.error(`AI error (${provider.label}): ${err.message}`); 
      continue; 
    }
  }

  throw new Error('All AI providers failed. Set GROQ_API_KEY or OPENROUTER_API_KEY.');
}

export async function callGroqFast(messages, options = {}) {
  return callGroq(messages, { ...options, model: 'llama-3.1-8b-instant' });
}

// ============ SEARCH ENGINES (Multi-engine fallback) ============
const SEARXNG_INSTANCES = [
  'https://search.sapti.me', 'https://searx.be', 'https://search.bus-hit.me',
  'https://searx.tiekoetter.com', 'https://search.ononoki.org', 'https://searxng.site',
  'https://search.mpty.live', 'https://searx.work', 'https://paulgo.io'
];

let currentInstance = 0;

export async function searxngSearch(query, options = {}) {
  const resultsCount = options.count || 20;

  // Try SearXNG instances first (max 3, 2s timeout each)
  for (let i = 0; i < Math.min(3, SEARXNG_INSTANCES.length); i++) {
    const instance = SEARXNG_INSTANCES[(currentInstance + i) % SEARXNG_INSTANCES.length];
    try {
      const url = `${instance}/search?q=${encodeURIComponent(query)}&categories=general&language=en&format=json&safesearch=1`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json', 'User-Agent': 'ERGIO/1.0 (+https://ergio.app)' }
      });
      clearTimeout(timeout);
      if (!response.ok) continue;
      const data = await response.json();
      currentInstance = (currentInstance + i) % SEARXNG_INSTANCES.length;
      return (data.results || []).slice(0, resultsCount).map(r => ({
        title: r.title || '', url: r.url || '', content: r.content || '',
        engine: r.engine || 'searxng', score: r.score || 0
      }));
    } catch (err) { continue; }
  }

  // Fallback 1: DuckDuckGo HTML
  const ddgResults = await duckDuckGoSearch(query, resultsCount);
  if (ddgResults.length > 0) return ddgResults;

  // Fallback 2: Bing HTML search (very reliable on serverless)
  const bingResults = await bingSearch(query, resultsCount);
  if (bingResults.length > 0) return bingResults;

  // Fallback 3: Google scraping
  return googleFallback(query, resultsCount);
}

// DuckDuckGo HTML search (reliable, rarely blocked)
async function duckDuckGoSearch(query, count) {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://duckduckgo.com/'
      }
    });
    clearTimeout(timeout);
    if (!response.ok) { console.error('DDG response not ok:', response.status); return []; }

    const html = await response.text();
    const $ = cheerio.load(html);
    const results = [];
    
    // Use cheerio to parse results
    $('.result__a').each((i, el) => {
      if (results.length >= count) return;
      let href = $(el).attr('href') || '';
      const title = $(el).text().trim();
      
      // DDG wraps URLs in redirect links
      if (href.includes('uddg=')) {
        href = decodeURIComponent(href.split('uddg=')[1].split('&')[0]);
      } else if (href.startsWith('//duckduckgo.com')) {
        href = 'https:' + href;
      }
      
      if (title && href && !href.includes('duckduckgo.com') && href.startsWith('http')) {
        results.push({ title, url: href, content: '', engine: 'duckduckgo', score: results.length });
      }
    });

    // Extract snippets
    $('.result__snippet').each((i, el) => {
      if (i < results.length) {
        results[i].content = $(el).text().trim();
      }
    });

    return results;
  } catch (err) { console.error('DDG error:', err.message); return []; }
}


// Bing HTML search (reliable on serverless, rarely blocked)
async function bingSearch(query, count) {
  try {
    const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=${count}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    clearTimeout(timeout);
    if (!response.ok) { console.error('Bing not ok:', response.status); return []; }

    const html = await response.text();
    const $ = cheerio.load(html);
    const results = [];

    // Bing organic results
    $('li.b_algo').each((i, el) => {
      if (results.length >= count) return;
      const linkEl = $(el).find('h2 a').first();
      const href = linkEl.attr('href') || '';
      const title = linkEl.text().trim();
      const snippet = $(el).find('.b_caption p, .b_lineclamp2').first().text().trim();

      if (title && href && href.startsWith('http')) {
        results.push({ title, url: href, content: snippet, engine: 'bing', score: results.length });
      }
    });

    // Alternative Bing result format
    if (results.length === 0) {
      $('.b_algo h2 a, .b_title a').each((i, el) => {
        if (results.length >= count) return;
        const href = $(el).attr('href') || '';
        const title = $(el).text().trim();
        if (title && href && href.startsWith('http')) {
          results.push({ title, url: href, content: '', engine: 'bing', score: results.length });
        }
      });
    }

    return results;
  } catch (err) { console.error('Bing error:', err.message); return []; }
}

async function googleFallback(query, count) {
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${count}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
    });
    const html = await response.text();
    const results = [];
    const linkRegex = /<a href="\/url\?q=([^"&]+)&[^"]*"[^>]*>([^<]+)<\/a>/g;
    let match;
    while ((match = linkRegex.exec(html)) !== null && results.length < count) {
      results.push({ title: match[2].replace(/<[^>]+>/g, '').trim(), url: decodeURIComponent(match[1]), content: '', engine: 'google', score: results.length });
    }
    return results;
  } catch (err) { return []; }
}

// ============ WEB SCRAPER (Cheerio-based) ============
import * as cheerio from 'cheerio';

export async function scrapePage(url, options = {}) {
  const timeout = options.timeout || 8000;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    clearTimeout(timer);
    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);
    const title = $('title').text().trim() || '';
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    $('script, style, nav, footer, header, aside, noscript').remove();
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000);

    const emailRegex = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
    const emails = [...new Set(bodyText.match(emailRegex) || [])].filter(e => !e.endsWith('.png') && !e.endsWith('.jpg') && !e.endsWith('.css'));

    const phoneRegex = /(\+?234[\s-]?\d{3}[\s-]?\d{3,4}|\+?\d{3}[\s-]?\d{3}[\s-]?\d{4}|0\d{3}[\s-]?\d{3}[\s-]?\d{4})/g;
    const phones = [...new Set(bodyText.match(phoneRegex) || [])];

    const socials = {};
    $('a[href*="twitter.com"], a[href*="x.com"]').each((_, el) => { socials.twitter = $(el).attr('href'); });
    $('a[href*="instagram.com"]').each((_, el) => { socials.instagram = $(el).attr('href'); });
    $('a[href*="facebook.com"]').each((_, el) => { socials.facebook = $(el).attr('href'); });
    $('a[href*="wa.me"], a[href*="whatsapp.com"]').each((_, el) => { socials.whatsapp = $(el).attr('href'); });

    return { url, title, metaDescription: metaDesc, content: bodyText, emails, phones, socials, scrapedAt: new Date().toISOString() };
  } catch (err) { return null; }
}

// ============ RESPONSE HELPERS ============
export function success(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function error(res, message, status = 400) {
  return res.status(status).json({ success: false, error: message });
}

export function corsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (res.req?.method === 'OPTIONS') return res.status(200).end();
}

export function generateSlug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 50);
}

export function generateLogoUrl(prompt, style = 'modern') {
  const enhanced = `professional ${style} logo for ${prompt}, minimalist, clean, vector style, centered, white background`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(enhanced)}?width=512&height=512&nologo=true&seed=${Date.now()}`;
}

// ============ PAYSTACK CLIENT ============
export async function paystackInit(amount, email, reference, metadata = {}, callbackUrl = '') {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error('Missing PAYSTACK_SECRET_KEY');
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: Math.round(amount * 100), email, reference, callback_url: callbackUrl, metadata })
  });
  const data = await response.json();
  if (!data.status) throw new Error(data.message || 'Paystack init failed');
  return { reference: data.data.reference, authorizationUrl: data.data.authorization_url, accessCode: data.data.access_code };
}

export async function paystackVerify(reference) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error('Missing PAYSTACK_SECRET_KEY');
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { 'Authorization': `Bearer ${secretKey}` }
  });
  const data = await response.json();
  if (!data.status) throw new Error(data.message || 'Paystack verify failed');
  return data.data;
}
