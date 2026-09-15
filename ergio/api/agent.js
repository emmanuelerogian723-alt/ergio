// ─────────────────────────────────────────────────────────────
// ERGIO BUSINESS MANAGER AGENT ("hands and legs")
// Lets the Conductor manage ANY business — Ergio-built OR external.
// POST /api/agent  { action: ... }
//   add_business   { name, url, industry, city, phone, whatsapp, notes }
//   list           → merged list: registered businesses + Ergio-built sites
//   analyze        { business_id } → scrape site, extract facts, AI summary + quick wins
//   goal           { business_id, goal } → AI plans concrete executable steps
//   run_step       { business_id, step, goal } → EXECUTES one step (hands and legs)
//   tasks          { business_id } → task/activity log
// Executable steps (real work, not advice):
//   analyze | find_leads | draft_outreach | social_kit | seo_kit | payment_page
// Every execution is logged to platform_analytics (event_type='agent_task').
// ─────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';
import { callGroq, callGroqFast, searxngSearch, scrapePage, success, error, generateSlug } from '../lib/ergio.js';

function getSB() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);
}

const STEPS = ['analyze', 'find_leads', 'draft_outreach', 'social_kit', 'seo_kit', 'payment_page'];
const STEP_LABELS = {
  analyze: 'Analyze website & business',
  find_leads: 'Find real customer leads',
  draft_outreach: 'Write outreach messages',
  social_kit: 'Create social media content',
  seo_kit: 'Generate SEO package',
  payment_page: 'Create online payment page'
};

async function logTask(sb, businessId, step, status, result) {
  try {
    await sb.from('platform_analytics').insert({
      event_type: 'agent_task',
      event_data: { business_id: businessId, step, status, result, ts: new Date().toISOString() },
      metric_value: 0,
      recorded_at: new Date().toISOString()
    });
  } catch (e) { console.error('[agent] logTask:', e.message); }
}

async function findBusiness(sb, id) {
  // registered business OR Ergio-built site (generated_websites slug/uuid)
  const { data: reg } = await sb.from('businesses').select('*').eq('id', id).maybeSingle();
  if (reg) return { ...reg, kind: 'registered' };
  const { data: site } = await sb.from('generated_websites').select('id, html').eq('id', id).maybeSingle();
  if (site) {
    const m = (site.html || '').match(/<meta\s+name=["']ergio-slug["']\s+content=["']([^"']+)["']/i);
    const t = (site.html || '').match(/<title>([^<]*)<\/title>/i);
    const desc = (site.html || '').match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
    return { id: site.id, name: t ? t[1].slice(0, 80) : 'Ergio site', slug: m ? m[1] : null,
             type: 'ergio-site', description: desc ? desc[1] : '', url: m ? 'https://ergio.vercel.app/site/' + m[1] : null, kind: 'ergio-site' };
  }
  return null;
}

function bizUrl(b) {
  if (b.url) return b.url;
  if (b.domain) return b.domain.startsWith('http') ? b.domain : 'https://' + b.domain;
  if (b.subdomain) return 'https://' + b.subdomain;
  if (b.slug && b.kind === 'ergio-site') return 'https://ergio.vercel.app/site/' + b.slug;
  return null;
}

// ── STEP EXECUTORS (the hands and legs) ──────────────────────

async function execAnalyze(b) {
  const url = bizUrl(b);
  if (!url) return { ok: false, summary: 'No website URL on file for this business. Add one first.' };
  const page = await scrapePage(url, { timeout: 12000 }).catch(() => null);
  const html = (page && (page.html || page.content)) || '';
  const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || '';
  const desc = (html.match(/<meta\s+name=["']description["'][^>]*content=["']([^"']*)["']/i) || [])[1] || '';
  const emails = [...new Set((html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g) || []).slice(0, 3))];
  const phones = [...new Set((html.match(/(?:\+234|0)[0-9\s\-]{9,13}/g) || []).slice(0, 3))];
  const hasWA = /wa\.me|api\.whatsapp/i.test(html);
  const hasPay = /paystack|flutterwave|stripe/i.test(html);
  const hasBooking = /book\s?(now|appointment)|calendly|booking/i.test(html);
  const resp = await callGroq([{ role: 'user', content: `You are a sharp business growth consultant. Business: "${b.name}" (${b.type || b.industry || ''}, ${b.city || 'Nigeria'}). Website title: "${title}". Description: "${desc}". Contact email(s): ${emails.join(', ') || 'none found'}. Has WhatsApp button: ${hasWA}. Has online payments: ${hasPay}. Has booking: ${hasBooking}. In under 120 words: (1) one-sentence verdict on their web presence, (2) the 3 fastest fixes to help them MAKE MORE MONEY. Be direct, no fluff.` }], { maxTokens: 300 }).catch(() => null);
  const summary = (resp && (resp.content || resp.choices?.[0]?.message?.content)) || 'Analysis complete — see raw data.';
  return { ok: true, url, title: title.slice(0, 120), description: desc.slice(0, 200), emails, phones,
           has_whatsapp: hasWA, has_payments: hasPay, has_booking: hasBooking, summary };
}

async function execFindLeads(b) {
  const industry = b.type || b.industry || '';
  const city = b.city || 'Lagos';
  const queries = [
    `${industry || 'small business'} in ${city} Nigeria without website contact`,
    `best ${industry || 'local business'} ${city} Nigeria phone number directory`
  ];
  let results = [];
  for (const q of queries) {
    if (results.length >= 8) break;
    const r = await searxngSearch(q, { count: 8, language: 'en' }).catch(() => null);
    if (r && r.results) results = results.concat(r.results.map(x => ({ title: x.title, url: x.url, snippet: x.snippet })));
  }
  let leads = results.slice(0, 10).map((x, i) => ({
    name: (x.title || 'Lead ' + (i + 1)).slice(0, 70), source: x.url,
    why: (x.snippet || '').slice(0, 140), score: 60 + Math.min(35, (x.snippet || '').length / 4)
  }));
  let fallback = false;
  if (leads.length === 0) {
    fallback = true;
    const r = await callGroq([{ role: 'user', content: `List 6 realistic high-intent lead profiles for a Nigerian ${industry || 'service'} business in ${city}: name, business type, why they need "${b.name}"'s services. JSON array, fields: name, type, why. No markdown.` }], { maxTokens: 500 }).catch(() => null);
    const txt = (r && (r.content || r.choices?.[0]?.message?.content)) || '[]';
    try { leads = JSON.parse(txt.replace(/```json|```/g, '')); leads.forEach(l => { l.score = 70; l.ai_generated = true; }); } catch { leads = []; }
  }
  return { ok: true, leads: leads.slice(0, 10), search_used: fallback ? 'AI-synthesized (search blocked)' : 'live web search', note: 'Verify contact details before outreach.' };
}

async function execOutreach(b, goal) {
  const r = await callGroq([{ role: 'user', content: `Write 2 cold outreach messages for "${b.name}" (a ${b.type || b.industry || 'business'} in ${b.city || 'Nigeria'}). Goal: ${goal || 'get more paying customers'}. (1) A WhatsApp message under 400 characters, friendly, Nigerian tone, ends with a clear question. (2) A cold email with subject line, under 120 words. Return as: WHATSAPP: ... then EMAIL SUBJECT: ... then EMAIL: ...` }], { maxTokens: 400 }).catch(() => null);
  const txt = (r && (r.content || r.choices?.[0]?.message?.content)) || '';
  if (!txt) return { ok: false, note: 'AI writer unavailable right now.' };
  return { ok: true, whatsapp: (txt.split('EMAIL SUBJECT:')[0] || '').replace('WHATSAPP:', '').trim().slice(0, 800),
           email: (txt.split('EMAIL SUBJECT:')[1] || '').replace('EMAIL:', '').trim().slice(0, 1200) };
}

async function execSocial(b, goal) {
  const r = await callGroq([{ role: 'user', content: `Create a 5-post social media kit for "${b.name}" (${b.type || 'business'}, ${b.city || 'Nigeria'}). Goal: ${goal || 'attract customers'}. For each post: PLATFORM: (Instagram or WhatsApp Status or Twitter/X), HOOK: one scroll-stopping line, BODY: 2-3 short lines, CTA: one line. Nigerian audience, natural tone, no hashtag spam (max 3).` }], { maxTokens: 600 }).catch(() => null);
  const txt = (r && (r.content || r.choices?.[0]?.message?.content)) || '';
  return { ok: !!txt, posts: txt.slice(0, 2500) || 'AI unavailable.' };
}

async function execSEO(b) {
  const industry = b.type || b.industry || 'business';
  const city = b.city || 'Lagos';
  const r = await callGroq([{ role: 'user', content: `SEO package for "${b.name}" (${industry} in ${city}, Nigeria). Return: 8 high-intent local keywords (ranked), a meta title (under 60 chars), a meta description (under 155 chars), and 3 one-line Google Business Profile tips. Plain text, labeled.` }], { maxTokens: 400 }).catch(() => null);
  const txt = (r && (r.content || r.choices?.[0]?.message?.content)) || '';
  return { ok: !!txt, seo: txt.slice(0, 2000) || 'AI unavailable.' };
}

async function execPayPage(b, params) {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) return { ok: false, note: 'PAYSTACK_SECRET_KEY not configured.' };
  const name = (params && params.product) || (b.name + ' — Order / Booking Deposit');
  const amount = (params && params.amount) || 0;
  const body = { name: name.slice(0, 100), description: 'Pay ' + b.name + (amount ? ` — ₦${amount.toLocaleString()}` : '') };
  if (amount && amount >= 100) { body.amount = amount * 100; body.currency = 'NGN'; }
  try {
    const resp = await fetch('https://api.paystack.co/page', { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await resp.json();
    if (d.status) return { ok: true, payment_page: 'https://paystack.com/pay/' + d.data.slug, name: d.data.name, note: 'Live payment link — money goes straight to the Paystack account.' };
    return { ok: false, note: 'Paystack: ' + (d.message || 'rejected') };
  } catch (e) { return { ok: false, note: 'Paystack unreachable: ' + e.message }; }
}

async function execStep(step, b, goal, params) {
  switch (step) {
    case 'analyze': return execAnalyze(b);
    case 'find_leads': return execFindLeads(b);
    case 'draft_outreach': return execOutreach(b, goal);
    case 'social_kit': return execSocial(b, goal);
    case 'seo_kit': return execSEO(b);
    case 'payment_page': return execPayPage(b, params);
    default: return { ok: false, note: 'Unknown step: ' + step };
  }
}

// ── HANDLER ─────────────────────────────────────────────────
export default async function handler(req, res) {
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const action = req.query.action || body.action || 'list';
  const sb = getSB();

  try {
    // LIST: registered businesses + Ergio-built sites (one console to manage all)
    if (req.method === 'GET' || action === 'list') {
      const [{ data: reg }, { data: sites }] = await Promise.all([
        sb.from('businesses').select('*').order('created_at', { ascending: false }).limit(100),
        sb.from('generated_websites').select('id, html, created_at').order('created_at', { ascending: false }).limit(50)
      ]);
      const ergioSites = (sites || []).map(s => {
        const m = (s.html || '').match(/<meta\s+name=["']ergio-slug["']\s+content=["']([^"']+)["']/i);
        const t = (s.html || '').match(/<title>([^<]*)<\/title>/i);
        return { id: s.id, name: t ? t[1].slice(0, 80) : 'Untitled site', slug: m ? m[1] : null,
                 url: m ? 'https://ergio.vercel.app/site/' + m[1] : null, kind: 'ergio-site', type: 'ergo-built website' };
      });
      const registered = (reg || []).map(b => ({ ...b, kind: 'registered', url: bizUrl(b) }));
      return success(res, { businesses: registered, ergio_sites: ergioSites, steps: STEP_LABELS });
    }

    // ADD BUSINESS — works for ANY business, not just Ergio-built
    if (action === 'add_business') {
      const { name, url, industry, city, phone, whatsapp, notes } = body;
      if (!name) return error(res, 'name is required', 400);
      const row = {
        name: name.slice(0, 100),
        slug: generateSlug(name),
        type: (industry || 'external business').slice(0, 60),
        description: (notes || '').slice(0, 500),
        domain: url || null, status: 'active',
        city: city || 'Lagos', state: '', country: 'Nigeria',
        phone: phone || '', whatsapp: whatsapp || '', email: '', social_links: {}
      };
      const { data, error: dbErr } = await sb.from('businesses').insert(row).select();
      if (dbErr) return error(res, 'Save failed: ' + dbErr.message, 500);
      return success(res, { success: true, business: data[0], note: 'External business registered — the Conductor can now manage it.' });
    }

    // ANALYZE
    if (action === 'analyze') {
      const b = await findBusiness(sb, body.business_id);
      if (!b) return error(res, 'Business not found', 404);
      const result = await execAnalyze(b);
      await logTask(sb, b.id, 'analyze', result.ok ? 'done' : 'failed', result);
      return success(res, { success: result.ok, business: { id: b.id, name: b.name }, result });
    }

    // GOAL → executable plan
    if (action === 'goal') {
      const b = await findBusiness(sb, body.business_id);
      if (!b) return error(res, 'Business not found', 404);
      const goal = (body.goal || 'get more customers and make more money').slice(0, 300);
      const plan = [];
      const url = bizUrl(b);
      if (url) plan.push('analyze');
      plan.push('find_leads', 'draft_outreach', 'social_kit');
      if (url) plan.push('seo_kit');
      if (process.env.PAYSTACK_SECRET_KEY) plan.push('payment_page');
      const r = await callGroqFast([{ role: 'user', content: `Business: "${b.name}" (${b.type || ''}, ${b.city || 'Nigeria'}). User's goal: "${goal}". Available actions: ${plan.map(s => STEP_LABELS[s]).join('; ')}. In one sentence, explain the strategy for this goal. Under 30 words.` }]).catch(() => null);
      return success(res, { success: true, business: { id: b.id, name: b.name }, goal, strategy: (r && (r.content || r.choices?.[0]?.message?.content)) || 'Plan ready. Run the steps below.', plan, step_labels: STEP_LABELS });
    }

    // RUN STEP — the hands and legs executing
    if (action === 'run_step') {
      const b = await findBusiness(sb, body.business_id);
      if (!b) return error(res, 'Business not found', 404);
      const step = body.step;
      if (!STEPS.includes(step)) return error(res, 'Unknown step. Available: ' + STEPS.join(', '), 400);
      const result = await execStep(step, b, body.goal, body.params);
      await logTask(sb, b.id, step, result.ok ? 'done' : 'failed', result);
      return success(res, { success: true, business: { id: b.id, name: b.name }, step, result });
    }

    // TASK LOG
    if (action === 'tasks') {
      const { data } = await sb.from('platform_analytics').select('*').eq('event_type', 'agent_task')
        .order('recorded_at', { ascending: false }).limit(50);
      const tasks = (data || []).filter(t => !body.business_id || (t.event_data || {}).business_id === body.business_id);
      return success(res, { tasks });
    }

    return error(res, 'Unknown action. Use: list, add_business, analyze, goal, run_step, tasks', 400);
  } catch (e) {
    console.error('[agent]', e.message);
    return error(res, 'Agent error: ' + e.message, 500);
  }
}
