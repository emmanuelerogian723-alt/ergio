// ========================================
// ERGIO — Shared Libraries
// ========================================

// ============ SUPABASE CLIENT ============
import { createClient } from '@supabase/supabase-js';

// Fallback credentials (Ergio project) — used when Vercel env vars are not set
const SUPABASE_URL_FALLBACK = 'https://owcxfzlanlrulflsyvlr.supabase.co';
const SUPABASE_ANON_FALLBACK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Y3hmemxhbmxydWxmbHN5dmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNzI5NDIsImV4cCI6MjA5OTc0ODk0Mn0.k6IISu8k8QoU1CGLF0U3319qqDvEIwYY8PPXXvwfbAw';

export function getSupabase(req) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL_FALLBACK;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || SUPABASE_ANON_FALLBACK;

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

// ============ AI CLIENT (Groq + OpenRouter fallback) ============
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function callGroq(messages, options = {}) {
  const groqKey = process.env.GROQ_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;

  const model = options.model || 'llama-3.3-70b-versatile';
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens || 4096;
  const stream = options.stream || false;

  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream
  };

  if (options.response_format) {
    body.response_format = options.response_format;
  }

  // Try Groq first, then OpenRouter
  const providers = [];
  if (groqKey) {
    providers.push({ url: GROQ_URL, key: groqKey, model });
  }
  if (openrouterKey) {
    // OpenRouter uses different model names
    const orModel = model.includes('llama-3.3-70b') ? 'meta-llama/llama-3.3-70b-instruct'
      : model.includes('llama-3.1-8b') ? 'meta-llama/llama-3.1-8b-instruct'
      : model.includes('gemma2') ? 'google/gemma-2-9b-it:free'
      : 'meta-llama/llama-3.3-70b-instruct';
    providers.push({ url: OPENROUTER_URL, key: openrouterKey, model: orModel });
  }

  if (providers.length === 0) {
    throw new Error('Missing AI API key. Set GROQ_API_KEY or OPENROUTER_API_KEY in Vercel environment variables.');
  }

  for (const provider of providers) {
    try {
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider.key}`,
          'Content-Type': 'application/json',
          ...(provider.url === OPENROUTER_URL && {
            'HTTP-Referer': 'https://ergio.vercel.app',
            'X-Title': 'ERGIO'
          })
        },
        body: JSON.stringify({ ...body, model: provider.model })
      });

      if (!response.ok) {
        const err = await response.text();
        console.error(`AI provider error (${provider.url}): ${response.status} ${err}`);
        continue; // Try next provider
      }

      if (stream) {
        return response.body;
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (err) {
      console.error(`AI provider error: ${err.message}`);
      continue;
    }
  }

  // Final fallback: Pollinations text API (no key needed, completely free)
  try {
    const pollinationsPrompt = messages.map(m => m.content).join(' ');
    const response = await fetch('https://text.pollinations.ai/' + encodeURIComponent(pollinationsPrompt));
    if (response.ok) {
      return await response.text();
    }
  } catch (e) {}

  throw new Error('All AI providers failed. Set GROQ_API_KEY or OPENROUTER_API_KEY on Vercel.');
}

// Fast model for simple tasks
export async function callGroqFast(messages, options = {}) {
  return callGroq(messages, { ...options, model: 'llama-3.1-8b-instant' });
}

// ============ SEARXNG SEARCH ENGINE ============
const SEARXNG_INSTANCES = [
  'https://search.sapti.me',
  'https://searx.be',
  'https://searx.tiekoetter.com',
  'https://search.ononoki.org',
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

  return googleFallback(query, resultsCount);
}

async function googleFallback(query, count) {
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${count}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    const html = await response.text();

    const results = [];
    const linkRegex = /<a href="\/url\?q=([^"&]+)&[^"]*"[^>]*>([^<]+)<\/a>/g;
    let match;
    while ((match = linkRegex.exec(html)) !== null && results.length < count) {
      results.push({
        title: match[2].replace(/<[^>]+>/g, '').trim(),
        url: decodeURIComponent(match[1]),
        content: '',
        engine: 'google-fallback',
        score: results.length,
        publishedDate: null,
        category: 'general'
      });
    }
    return results;
  } catch (err) {
    return [];
  }
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
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    clearTimeout(timer);

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('title').text().trim() || '';
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const h1 = $('h1').first().text().trim() || '';

    $('script, style, nav, footer, header, aside, noscript').remove();
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000);

    const emailRegex = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
    const emails = [...new Set(bodyText.match(emailRegex) || [])].filter(e =>
      !e.endsWith('.png') && !e.endsWith('.jpg') && !e.endsWith('.css')
    );

    const phoneRegex = /(\+?234[\s-]?\d{3}[\s-]?\d{3,4}|\+?\d{3}[\s-]?\d{3}[\s-]?\d{4}|0\d{3}[\s-]?\d{3}[\s-]?\d{4})/g;
    const phones = [...new Set(bodyText.match(phoneRegex) || [])];

    const socials = {};
    $('a[href*="twitter.com"], a[href*="x.com"]').each((_, el) => { socials.twitter = $(el).attr('href'); });
    $('a[href*="instagram.com"]').each((_, el) => { socials.instagram = $(el).attr('href'); });
    $('a[href*="facebook.com"]').each((_, el) => { socials.facebook = $(el).attr('href'); });
    $('a[href*="wa.me"], a[href*="whatsapp.com"]').each((_, el) => { socials.whatsapp = $(el).attr('href'); });

    return { url, title, metaDescription: metaDesc, h1, content: bodyText, emails, phones, socials, scrapedAt: new Date().toISOString() };
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
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 50);
}

// ============ LOGO GENERATION (Pollinations - Free, no key) ============
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
      'Authorization': `Bearer ${secretKey}`
    }
  });

  const data = await response.json();
  if (!data.status) throw new Error(data.message || 'Paystack verification failed');

  return data.data;
}
