// ========================================
// ERGIO — Shared Libraries
// Uses OpenRouter for AI, Supabase for DB, Paystack for payments
// ========================================

// ============ SUPABASE CLIENT ============
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL_FALLBACK = 'https://owcxfzlanlrulflsyvlr.supabase.co';
const SUPABASE_ANON_FALLBACK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Y3hmemxhbmxydWxmbHN5dmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNzI5NDIsImV4cCI6MjA5OTc0ODk0Mn0.k6IISu8k8QoU1CGLF0U3319qqDvEIwYY8PPXXvwfbAw';

export function getSupabase(req) {
  const url = process.env.SUPABASE_URL || 'https://owcxfzlanlrulflsyvlr.supabase.co';
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Y3hmemxhbmxydWxmbHN5dmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNzI5NDIsImV4cCI6MjA5OTc0ODk0Mn0.k6IISu8k8QoU1CGLF0U3319qqDvEIwYY8PPXXvwfbAw';

  const supabase = createClient(url, key, {
    auth: { persistSession: false }
  });

  return supabase;
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

// ============ AI CLIENT (Multi-provider) =====
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function callGroq(messages, options = {}) {
  const model = options.model || 'meta-llama/llama-3.3-70b-instruct';
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens || 4096;
  
  const groqKey = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  
  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };
  if (options.response_format) body.response_format = options.response_format;
  if (options.stream) body.stream = true;
  
  // Build provider chain
  const providers = [];
  
  if (groqKey) {
    providers.push({
      url: GROQ_URL, key: groqKey,
      model: model.includes('/') ? model.split('/').pop() : model,
      label: 'Groq', headers: {}
    });
  }
  if (openrouterKey) {
    providers.push({
      url: OPENROUTER_URL, key: openrouterKey,
      model: model.includes('/') ? model : 'meta-llama/' + model,
      label: 'OpenRouter',
      headers: { 'HTTP-Referer': 'https://ergio.vercel.app', 'X-Title': 'ERGIO' }
    });
  }
  // Pollinations fallback (free, no key)
  providers.push({
    url: 'https://text.pollinations.ai/openai',
    key: '', model: model.includes('/') ? model.split('/').pop() : model,
    label: 'Pollinations', headers: {}
  });
  
  let lastErr;
  for (const prov of providers) {
    try {
      const fetchBody = { ...body, model: prov.model };
      const response = await fetch(prov.url, {
        method: 'POST',
        headers: {
          'Authorization': prov.key ? `Bearer ${prov.key}` : '',
          'Content-Type': 'application/json',
          ...prov.headers
        },
        body: JSON.stringify(fetchBody),
        signal: AbortSignal.timeout(options.timeout || 15000)
      });
      
      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        lastErr = `${prov.label} ${response.status}: ${errText.substring(0, 100)}`;
        continue;
      }
      
      // Handle streaming
      if (options.stream && response.body) {
        return response.body;
      }
      
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      if (!text) {
        lastErr = `${prov.label}: empty response`;
        continue;
      }
      return text;
    } catch(e) {
      lastErr = `${prov.label}: ${e.message}`;
    }
  }
  
  throw new Error('All AI providers failed. Last error: ' + (lastErr || 'Unknown'));
}

export async function callGroqFast(messages, options = {}) {
  return callGroq(messages, { ...options, model: 'meta-llama/llama-3.1-8b-instruct' });
}

// ============ SEARXNG SEARCH ENGINE =====

let currentInstance = 0;

export async function searxngSearch(query, options = {}) {
  const resultsCount = options.count || 20;

  for (let i = 0; i < SEARXNG_INSTANCES.length; i++) {
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

    } catch (err) {
      continue;
    }
  }

  return [];
}

// ============ WEB SCRAPER =====
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

    // Lightweight parsing without cheerio (avoid dependency issues)
    const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || '';
    const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1] || '';
    
    // Clean text
    const bodyText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000);

    const emailRegex = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
    const emails = [...new Set(bodyText.match(emailRegex) || [])].filter(e => !e.endsWith('.png') && !e.endsWith('.jpg') && !e.endsWith('.css'));

    // Extract phone numbers
    const phoneRegex = /(\+?234[\s-]?\d{3}[\s-]?\d{3,4}|\+?\d{3}[\s-]?\d{3}[\s-]?\d{4}|0\d{3}[\s-]?\d{3}[\s-]?\d{4})/g;
    const phones = [...new Set(bodyText.match(phoneRegex) || [])];

    return {
      url,
      title,
      metaDescription: metaDesc,
      content: bodyText,
      emails,
      phones,
      scrapedAt: new Date().toISOString()
    };
  } catch (err) {
    return null;
  }
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


export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateSlug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 50);
}

// ============ LOGO GENERATION (Pollinations - Free) =====
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
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      email,
      reference,
      callback_url: callbackUrl,
      metadata
    })
  });
  const data = await response.json();
  if (!data.status) throw new Error(data.message || 'Paystack init failed');
  return { reference: data.data.reference, authorizationUrl: data.data.authorization_url, accessCode: data.data.access_code };
}

export async function paystackVerify(reference) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error('Missing PAYSTACK_SECRET_KEY');
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      'Authorization': `Bearer ${secretKey}`,
    }
  });
  const data = await response.json();
  return data;
}

// ============ DELAY HELPER =====}
// redeploy trigger 1784282722
