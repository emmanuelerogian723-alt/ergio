// ========================================
// ERGIO — Shared Libraries
// Uses OpenRouter for AI, Supabase for DB, Paystack for payments
// ========================================

// ============ SUPABASE CLIENT ============
import { createClient } from '@supabase/supabase-js';

export function getSupabase(req) {
  const url = process.env.SUPABASE_URL || 'https://owcxfzlanlrulflsyvlr.supabase.co';
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Y3hmemxhbmxydWxmbHN5dmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNzI5NDIsImV4cCI6MjA5OTc0ODk0Mn0.k6IISu8k8QoU1CGLF0U3319qqDvEIwYY8PPXXvwfbAw';

  const supabase = createClient(url, key, {
    auth: { persistSession: false }
  });

  return supabase;
}

// Get user from auth header
export async function getUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.replace('Bearer ', '');
  const supabase = getSupabase(req);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error) return null;
  return user;
}

// ============ AI CLIENT (OpenRouter) ============
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function callGroq(messages, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY');

  const model = options.model || 'meta-llama/llama-3.3-70b-instruct';
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens || 4096;

  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (options.response_format) {
    body.response_format = options.response_format;
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://ergio.vercel.app',
      'X-Title': 'ERGIO'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI API error: ${response.status} ${err.substring(0, 200)}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Fast model for simple tasks
export async function callGroqFast(messages, options = {}) {
  return callGroq(messages, { ...options, model: 'meta-llama/llama-3.1-8b-instruct' });
}

// ============ SEARXNG SEARCH ENGINE ============
const SEARXNG_INSTANCES = [
  'https://search.sapti.me',
  'https://searx.be',
  'https://searxng.site',
  'https://search.mpty.live',
  'https://searx.work',
  'https://paulgo.io'
];

let currentInstance = 0;

export async function searxngSearch(query, options = {}) {
  const categories = options.categories || 'general';
  const language = options.language || 'en';
  const resultsCount = options.count || 20;

  for (let i = 0; i < SEARXNG_INSTANCES.length; i++) {
    const instance = SEARXNG_INSTANCES[(currentInstance + i) % SEARXNG_INSTANCES.length];

    try {
      const url = `${instance}/search?q=${encodeURIComponent(query)}&categories=${categories}&language=${language}&format=json&safesearch=1`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ERGIO/1.0 (+https://ergio.app)'
        }
      });

      clearTimeout(timeout);

      if (!response.ok) continue;

      const data = await response.json();
      currentInstance = (currentInstance + i) % SEARXNG_INSTANCES.length;

      return (data.results || []).slice(0, resultsCount).map(r => ({
        title: r.title || '',
        url: r.url || '',
        content: r.content || '',
        engine: r.engine || 'unknown',
        score: r.score || 0,
        publishedDate: r.publishedDate || null,
        category: r.category || 'general'
      }));

    } catch (err) {
      continue;
    }
  }

  return [];
}

// ============ WEB SCRAPER ============
export async function scrapePage(url, options = {}) {
  const timeout = options.timeout || 8000;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
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

    // Extract emails
    const emailRegex = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
    const emails = [...new Set(bodyText.match(emailRegex) || [])].filter(e =>
      !e.endsWith('.png') && !e.endsWith('.jpg') && !e.endsWith('.css')
    );

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
  if (res.req?.method === 'OPTIONS') {
    return res.status(200).end();
  }
}

// ============ SLUG GENERATOR ============
export function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

// ============ LOGO GENERATION (Pollinations - Free) ============
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
  if (!data.status) throw new Error(data.message || 'Paystack initialization failed');

  return {
    reference: data.data.reference,
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code
  };
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

// ============ DELAY HELPER ============
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============ POLLINATIONS TEXT API (Free, no key) ============
export async function pollText(prompt) {
  try {
    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (resp.ok) return await resp.text();
    return '';
  } catch (e) {
    return '';
  }
}
