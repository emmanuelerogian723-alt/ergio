// ========================================
// ERGIO — Shared Libraries v6.1
// AI Chain: Mistral → Groq → OpenRouter → Pollinations
// Uses Supabase for DB, Paystack for payments
// ========================================

// ============ SUPABASE CLIENT ============
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL_FALLBACK = 'https://owcxfzlanlrulflsyvlr.supabase.co';
const SUPABASE_ANON_FALLBACK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Y3hmemxhbmxydWxmbHN5dmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNzI5NDIsImV4cCI6MjA5OTc0ODk0Mn0.k6IISu8k8QoU1CGLF0U3319qqDvEIwYY8PPXXvwfbAw';

export function getSupabase(req) {
  const url = process.env.SUPABASE_URL || 'https://owcxfzlanlrulflsyvlr.supabase.co';
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Y3hmemxhbmxydWxmbHN5dmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNzI5NDIsImV4cCI6MjA5OTc0ODk0Mn0.k6IISu8k8QoU1CGLF0U3319qqDvEIwYY8PPXXvwfbAw';
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

// ============ AI CLIENT (Multi-provider) =====
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';

function getMistralModel(model) {
  if (model.includes('mistral')) return model;
  if (model.includes('gpt-oss-120b') || model.includes('llama-3.3-70b') || model.includes('large')) return 'mistral-large-latest';
  if (model.includes('gpt-oss-20b') || model.includes('llama-3.1-8b') || model.includes('small')) return 'mistral-small-latest';
  return 'mistral-small-latest';
}

export async function callGroq(messages, options = {}) {
  const model = options.model || 'openai/gpt-oss-120b';
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens || 4096;
  
  const groqKey = process.env.GROQ_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const mistralKey = process.env.MISTRAL_API_KEY;
  
  const body = { model, messages, temperature, max_tokens: maxTokens };
  if (options.response_format) body.response_format = options.response_format;
  if (options.stream) body.stream = true;
  
  // Provider chain: Mistral → Groq → OpenRouter → Pollinations
  const providers = [];
  
  if (mistralKey) {
    providers.push({
      url: MISTRAL_URL, key: mistralKey,
      model: getMistralModel(model),
      label: 'Mistral', headers: {}
    });
  }
  if (groqKey) {
    providers.push({
      url: GROQ_URL, key: groqKey,
      model: model.startsWith('openai/') ? model : (model.includes('/') ? model.split('/').pop() : model),
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
  providers.push({
    url: 'https://text.pollinations.ai/openai',
    key: '', model: model.includes('/') ? model.split('/').pop() : model,
    label: 'Pollinations', headers: {}
  });
  
  let lastErr;
  for (const prov of providers) {
    try {
      const fetchBody = { ...body, model: prov.model };
      if (prov.label === 'Mistral') {
        fetchBody.max_tokens = Math.min(maxTokens, 8192);
      }
      const response = await fetch(prov.url, {
        method: 'POST',
        headers: {
          'Authorization': prov.key ? `Bearer ${prov.key}` : '',
          'Content-Type': 'application/json',
          ...prov.headers
        },
        body: JSON.stringify(fetchBody),
        signal: AbortSignal.timeout(options.timeout || 30000)
      });
      
      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        lastErr = `${prov.label} ${response.status}: ${errText.substring(0, 100)}`;
        continue;
      }
      
      if (options.stream && response.body) return response.body;
      
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      if (!text) { lastErr = `${prov.label}: empty response`; continue; }
      return text;
    } catch(e) {
      lastErr = `${prov.label}: ${e.message}`;
    }
  }
  
  throw new Error('All AI providers failed. Last error: ' + (lastErr || 'Unknown'));
}

export async function callGroqFast(messages, options = {}) {
  return callGroq(messages, { ...options, model: 'openai/gpt-oss-20b' });
}

// Dedicated Mistral chat (for Conductor when Render is down)
export async function callMistral(messages, options = {}) {
  const mistralKey = process.env.MISTRAL_API_KEY;
  if (!mistralKey) return callGroq(messages, options);
  
  const model = options.model || 'mistral-small-latest';
  const body = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens || 4096,
  };
  if (options.response_format) body.response_format = options.response_format;
  
  try {
    const response = await fetch(MISTRAL_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mistralKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(options.timeout || 30000)
    });
    
    if (!response.ok) {
      return callGroq(messages, options);
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (e) {
    return callGroq(messages, options);
  }
}

// ============ SEARCH ENGINES =====
let currentInstance = 0;
const SEARXNG_INSTANCES = [
  'https://searx.be',
  'https://search.bus-hit.me',
  'https://searxng.site',
];

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
    } catch (err) { continue; }
  }
  return [];
}

// ============ WEB SCRAPER =====
import * as cheerio from 'cheerio';

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
    if (!response.ok) return [];
    const html = await response.text();
    const $ = cheerio.load(html);
    const results = [];
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
    return results;
  } catch (err) { return []; }
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
    const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || '';
    const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1] || '';
    const bodyText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000);
    const emailRegex = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
    const emails = [...new Set(bodyText.match(emailRegex) || [])].filter(e => !e.endsWith('.png') && !e.endsWith('.jpg') && !e.endsWith('.css'));
    const phoneRegex = /(\+?234[\s-]?\d{3}[\s-]?\d{3,4}|\+?\d{3}[\s-]?\d{3}[\s-]?\d{4}|0\d{3}[\s-]?\d{3}[\s-]?\d{4})/g;
    const phones = [...new Set(bodyText.match(phoneRegex) || [])];
    return { url, title, metaDescription: metaDesc, text: bodyText, emails, phones };
  } catch (err) { return null; }
}

// ============ UTILITIES =====
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
}

export function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

export function generateSlug(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 60);
}

export function generateLogoUrl(prompt, style = 'modern') {
  const enhanced = `professional ${style} logo for ${prompt}, minimalist, clean design, high quality, vector style`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(enhanced)}?width=512&height=512&nologo=true&seed=${Date.now()}`;
}
