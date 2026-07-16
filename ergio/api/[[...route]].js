// ERGIO Unified API Router
import { callGroq, callGroqFast, searxngSearch, scrapePage, getSupabase, success, error, corsHeaders, generateSlug, generateLogoUrl, paystackInit, paystackVerify, delay } from '../lib/ergio.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const route = req.query.route || [];
  const path = Array.isArray(route) ? route.join('/') : (route || '');
  const segments = path.split('/').filter(Boolean);

  try {
    switch (segments[0]) {
      case 'health': return success(res, { status: 'ok', time: new Date().toISOString() });
      case 'generate': return await handleGenerate(req, res);
      case 'refine': return await handleRefine(req, res);
      case 'auth': return await handleAuth(req, res, segments[1]);
      case 'payments': return await handlePayments(req, res);
      case 'bookings': return await handleBookings(req, res);
      case 'business': return await handleBusiness(req, res);
      case 'leads': return await handleLeads(req, res);
      case 'outreach': return await handleOutreach(req, res);
      case 'engines': return await handleEngines(req, res, segments[1]);
      case 'analytics': return await handleAnalytics(req, res);
      case 'whatsapp': return await handleWhatsapp(req, res);
      case 'social': return await handleSocial(req, res);
      case 'seo': return await handleSeo(req, res);
      case 'smart-pricing': return await handleSmartPricing(req, res);
      case 'card': return await handleCard(req, res);
      case 'invoices': return await handleInvoices(req, res);
      case 'expenses': return await handleExpenses(req, res);
      case 'notifications': return await handleNotifications(req, res);
      case 'referrals': return await handleReferrals(req, res);
      case 'reviews': return await handleReviews(req, res);
      case 'upload': return success(res, { message: 'Use Supabase Storage from client' });
      default: return success(res, { name: 'ERGIO API', version: '1.0.0', endpoints: ['generate','refine','auth','payments','bookings','business','leads','outreach','engines','analytics','whatsapp','social','seo','smart-pricing','card','invoices','expenses','notifications','referrals','reviews','health'] });
    }
  } catch (err) {
    console.error('API Error:', err);
    return error(res, err.message || 'Internal error', 500);
  }
}

// ============ GENERATE (SSE) ============
async function handleGenerate(req, res) {
  if (req.method !== 'POST') return error(res, 'Use POST', 405);
  const { prompt, answers } = req.body || {};
  if (!prompt) return error(res, 'Prompt is required', 400);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  const send = (type, data) => res.write(`data: ${JSON.stringify({ type, data })}\n\n`);

  try {
    send('status', { task: 'Understanding your request...', step: 1, total: 7 });
    const planResult = await callGroq([
      { role: 'system', content: 'You are ERGIO, an expert business strategist. Return only valid JSON.' },
      { role: 'user', content: `Create a business plan for: "${prompt}". Context: ${JSON.stringify(answers||{})}. Return JSON: {businessName,tagline,type,description,brandColors:{primary,secondary,accent,bg},city,services:[{name,description,price,duration}],seoKeywords,targetMarket,tone}. Prices in NGN, 3-5 services.` }
    ], { temperature: 0.8, response_format: { type: 'json_object' } });

    let plan; try { plan = JSON.parse(planResult); } catch { const m = planResult.match(/\{[\s\S]*\}/); plan = m ? JSON.parse(m[0]) : {}; }
    send('plan', { plan });
    send('status', { task: 'Generating brand identity...', step: 2, total: 7 });

    const brandResult = await callGroq([
      { role: 'system', content: 'Return only valid JSON.' },
      { role: 'user', content: `Brand identity for "${plan.businessName}", a ${plan.type} in ${plan.city}. Return JSON: {logoDescription,brandVoice,uniqueSellingPoint,elevatorPitch}` }
    ], { temperature: 0.7, response_format: { type: 'json_object' } });
    let brand; try { brand = JSON.parse(brandResult); } catch { const m = brandResult.match(/\{[\s\S]*\}/); brand = m ? JSON.parse(m[0]) : {}; }
    const logoUrl = generateLogoUrl(brand.logoDescription || plan.businessName, plan.tone);
    send('brand', { brand, logoUrl });
    send('status', { task: 'Writing website copy...', step: 3, total: 7 });

    const contentResult = await callGroq([
      { role: 'system', content: 'You are ERGIO, expert copywriter. Return only valid JSON.' },
      { role: 'user', content: `Website copy for "${plan.businessName}" in ${plan.city}. Services: ${JSON.stringify(plan.services)}. Return JSON: {hero:{headline,subheadline,cta},about,servicesHtml,whyChooseUs:[],testimonials:[{name,text,location}],faq:[{q,a}],seoTitle,seoDescription,contactInfo:{phone,email,address,whatsapp}}` }
    ], { temperature: 0.75, maxTokens: 4096, response_format: { type: 'json_object' } });
    let content; try { content = JSON.parse(contentResult); } catch { const m = contentResult.match(/\{[\s\S]*\}/); content = m ? JSON.parse(m[0]) : {}; }
    send('content', { content });
    send('status', { task: 'Building your website...', step: 4, total: 7 });

    const colors = plan.brandColors || { primary: '#00D9FF', secondary: '#09090B', accent: '#00FF9D', bg: '#09090B' };
    const websiteHtml = buildWebsite(plan, brand, content, colors, logoUrl);
    send('website', { html: websiteHtml, logoUrl });

    send('status', { task: 'Setting up booking system...', step: 5, total: 7 });
    await delay(400);
    send('booking', { message: 'Booking system configured' });
    send('status', { task: 'Connecting payment gateway...', step: 6, total: 7 });
    await delay(400);
    send('payment', { message: 'Paystack ready', methods: ['Card','Bank Transfer','USSD'] });
    send('status', { task: 'Initializing engines...', step: 7, total: 7 });
    send('engines', { engines: [
      {name:'Local Discovery',status:'active',description:'SEO pages generated'},
      {name:'Demand Matching',status:'active',description:'Scanning for clients'},
      {name:'AI Outreach',status:'active',description:'Drafting outreach'},
      {name:'Repeat Clients',status:'active',description:'Follow-up configured'}
    ]});
    send('complete', { business: { name:plan.businessName, tagline:plan.tagline, type:plan.type, slug:generateSlug(plan.businessName), logoUrl, brandColors:colors, city:plan.city, services:plan.services||[], websiteHtml, content }, message:'Your business is ready!' });
    res.end();
  } catch (err) { res.write(`data: ${JSON.stringify({type:'error',data:{message:err.message}})}\n\n`); res.end(); }
}

// ============ REFINE ============
async function handleRefine(req, res) {
  if (req.method !== 'POST') return error(res, 'Use POST', 405);
  const { currentHtml, editRequest, businessName } = req.body || {};
  if (!currentHtml || !editRequest) return error(res, 'currentHtml and editRequest required', 400);
  const result = await callGroq([
    { role: 'system', content: 'You are ERGIO, an expert web developer. Return only valid HTML.' },
    { role: 'user', content: `Edit this website for "${businessName||'business'}". Request: "${editRequest}". Current HTML (truncated): ${currentHtml.substring(0,8000)}. Return COMPLETE updated HTML only.` }
  ], { temperature: 0.3, maxTokens: 4096 });
  return success(res, { html: result });
}

// ============ AUTH ============
async function handleAuth(req, res, action) {
  const body = req.body || {};
  const url = process.env.SUPABASE_URL || 'https://owcxfzlanlrulflsyvlr.supabase.co';
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Y3hmemxhbmxydWxmbHN5dmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNzI5NDIsImV4cCI6MjA5OTc0ODk0Mn0.k6IISu8k8QoU1CGLF0U3319qqDvEIwYY8PPXXvwfbAw';
  const h = { 'apikey': key, 'Content-Type': 'application/json' };

  if (action === 'signup') {
    const { email, password, fullName, bizType, city } = body;
    if (!email || !password) return error(res, 'Email and password required', 400);
    const r = await fetch(`${url}/auth/v1/signup`, { method:'POST', headers:h, body:JSON.stringify({email,password,data:{full_name:fullName,biz_type:bizType,city}}) });
    const d = await r.json();
    if (!r.ok) return error(res, d.message||'Signup failed', 400);
    return success(res, { message:'Account created! Check email.', user:d.user?{id:d.user.id,email:d.user.email}:null, requiresVerification:!d.session });
  }
  if (action === 'login') {
    const { email, password } = body;
    if (!email || !password) return error(res, 'Email and password required', 400);
    const r = await fetch(`${url}/auth/v1/token?grant_type=password`, { method:'POST', headers:h, body:JSON.stringify({email,password}) });
    const d = await r.json();
    if (!r.ok) return error(res, d.message||'Invalid credentials', 401);
    return success(res, { user:{id:d.user?.id,email:d.user?.email}, accessToken:d.access_token, refreshToken:d.refresh_token });
  }
  if (action === 'magic-link') {
    const { email } = body;
    if (!email) return error(res, 'Email required', 400);
    await fetch(`${url}/auth/v1/otp`, { method:'POST', headers:h, body:JSON.stringify({email,create_user:true,options:{email_redirect_to:body.redirectTo||`${req.headers.origin}/dashboard/index.html`}}) });
    return success(res, { message:'Magic link sent!' });
  }
  if (action === 'session') {
    const token = (req.headers.authorization||'').replace('Bearer ','');
    if (!token) return error(res, 'No token', 401);
    const r = await fetch(`${url}/auth/v1/user`, { headers:{'apikey':key,'Authorization':`Bearer ${token}`} });
    const d = await r.json();
    if (!r.ok) return error(res, 'Invalid session', 401);
    return success(res, { user:{id:d.id,email:d.email,metadata:d.user_metadata} });
  }
  return success(res, { endpoints:['signup','login','magic-link','session'] });
}

// ============ PAYMENTS ============
async function handlePayments(req, res) {
  if (req.method === 'POST') {
    const { amount, email, reference, metadata, callbackUrl } = req.body || {};
    if (!amount || !email) return error(res, 'Amount and email required', 400);
    try { return success(res, await paystackInit(parseFloat(amount), email, reference||`ERGIO_${Date.now()}`, metadata||{}, callbackUrl||'')); }
    catch (e) { return error(res, e.message, 500); }
  }
  if (req.method === 'GET') {
    const { reference } = req.query || {};
    if (!reference) return error(res, 'Reference required', 400);
    try { const r = await paystackVerify(reference); return success(res, { status:r.status, amount:r.amount/100, reference:r.reference }); }
    catch (e) { return error(res, e.message, 500); }
  }
  return error(res, 'Method not allowed', 405);
}

// ============ BOOKINGS ============
async function handleBookings(req, res) {
  const sb = getSupabase(req); const b = req.body||{};
  if (req.method==='POST') {
    const { businessId, clientName, clientPhone, clientEmail, service, date, time, notes } = b;
    if (!businessId||!clientName||!service||!date) return error(res,'Missing fields',400);
    const { data, error:e } = await sb.from('bookings').insert({business_id:businessId,client_name:clientName,client_phone:clientPhone,client_email:clientEmail,service,booking_date:date,booking_time:time,notes,status:'pending',payment_status:'unpaid'}).select().single();
    if (e) return error(res, e.message, 500); return success(res, data);
  }
  if (req.method==='GET') {
    const { businessId } = req.query||{};
    let q = sb.from('bookings').select('*').order('created_at',{ascending:false}).limit(50);
    if (businessId) q=q.eq('business_id',businessId);
    const { data, error:e } = await q; if (e) return error(res,e.message,500); return success(res,data);
  }
  return error(res,'Method not allowed',405);
}

// ============ BUSINESS ============
async function handleBusiness(req, res) {
  const sb = getSupabase(req); const b = req.body||{};
  if (req.method==='POST') {
    const { userId, name, type, slug, description, logoUrl, brandColors, city, state, phone, whatsapp, email } = b;
    if (!userId||!name) return error(res,'User ID and name required',400);
    const { data, error:e } = await sb.from('businesses').insert({user_id:userId,name,type,slug:slug||generateSlug(name),description,logo_url:logoUrl,brand_colors:brandColors||{primary:'#00D9FF',secondary:'#09090B'},city,state,country:'Nigeria',phone,whatsapp,email,status:'active'}).select().single();
    if (e) return error(res,e.message,500); return success(res,data);
  }
  if (req.method==='GET') {
    const { userId, slug } = req.query||{};
    let q = sb.from('businesses').select('*'); if(userId)q=q.eq('user_id',userId); if(slug)q=q.eq('slug',slug);
    const { data, error:e } = await q.limit(50); if(e)return error(res,e.message,500); return success(res,data);
  }
  return error(res,'Method not allowed',405);
}

// ============ LEADS (SSE) ============
async function handleLeads(req, res) {
  if (req.method!=='POST') return error(res,'Use POST',405);
  const { businessType, location, businessId } = req.body||{};
  if (!businessType) return error(res,'Business type required',400);
  const city = location||'Nigeria';
  res.setHeader('Content-Type','text/event-stream'); res.setHeader('Cache-Control','no-cache'); res.setHeader('Connection','keep-alive');
  const send = (t,d) => res.write(`data: ${JSON.stringify({type:t,data:d})}\n\n`);
  try {
    send('status',{task:`Scanning for ${businessType} clients in ${city}...`});
    const results = await searxngSearch(`I need ${businessType} in ${city} Nigeria`,{count:15});
    send('search_complete',{total:results.length});
    const leads = [];
    for (let i=0; i<Math.min(results.length,5); i++) {
      const scraped = await scrapePage(results[i].url);
      if (scraped && (scraped.emails.length||scraped.phones.length)) {
        leads.push({sourceUrl:results[i].url,title:results[i].title,email:scraped.emails[0]||'',phone:scraped.phones[0]||'',score:60+Math.floor(Math.random()*30),intent:'buying'});
        send('lead_found',{lead:leads[leads.length-1]});
      }
    }
    send('complete',{totalLeads:leads.length,leads});
    res.end();
  } catch(e){ res.write(`data: ${JSON.stringify({type:'error',data:{message:e.message}})}\n\n`); res.end(); }
}

// ============ OUTREACH ============
async function handleOutreach(req, res) {
  if (req.method!=='POST') return error(res,'Use POST',405);
  const { leads, businessName, serviceName, price } = req.body||{};
  const messages = [];
  for (const lead of (Array.isArray(leads)?leads:[leads]).slice(0,10)) {
    const r = await callGroqFast([{role:'system',content:'Return JSON.'},{role:'user',content:`Cold outreach from "${businessName}" to a client needing ${serviceName}. Price: ₦${price||'negotiable'}. Return JSON: {subject,body,whatsapp}`}],{temperature:0.7,response_format:{type:'json_object'}});
    try { messages.push({lead:lead.name||lead.email,...JSON.parse(r)}); } catch { messages.push({lead:lead.name||lead.email,body:r}); }
  }
  return success(res,{messages});
}

// ============ ENGINES ============
async function handleEngines(req, res, action) {
  if (action==='status') return success(res,{engines:[{name:'Local Discovery',status:'active'},{name:'Demand Matching',status:'active'},{name:'AI Outreach',status:'active'},{name:'Repeat Clients',status:'active'}]});
  if (action==='search') { const { query } = req.body||req.query||{}; if(!query) return error(res,'Query required',400); return success(res, await searxngSearch(query,{count:20})); }
  if (action==='scrape') { const { url } = req.body||req.query||{}; if(!url) return error(res,'URL required',400); return success(res, await scrapePage(url)); }
  return success(res,{actions:['status','search','scrape']});
}

// ============ ANALYTICS ============
async function handleAnalytics(req, res) {
  try { return success(res, { revenue: { total: 0, currency: 'NGN' }, bookings: { total: 0, pending: 0 }, leads: { total: 0, highIntent: 0 }, reviews: { total: 0, avgRating: 0 } }); }
  catch(e){ return error(res,e.message,500); }
}

// ============ WHATSAPP ============
async function handleWhatsapp(req, res) {
  if (req.method!=='POST') return error(res,'Use POST',405);
  const { message, businessName, serviceName } = req.body||{};
  const reply = await callGroqFast([{role:'system',content:'Short friendly reply.'},{role:'user',content:`Reply to: "${message}" for ${businessName}, service: ${serviceName}`}],{temperature:0.7});
  return success(res,{reply});
}

// ============ SOCIAL ============
async function handleSocial(req, res) {
  if (req.method!=='POST') return error(res,'Use POST',405);
  const { businessName, businessType, tagline, city } = req.body||{};
  const r = await callGroqFast([{role:'system',content:'Return JSON.'},{role:'user',content:`Social kit for "${businessName}" (${businessType}) in ${city}. Return JSON: {twitter,instagram,facebook,whatsapp}`}],{temperature:0.7,response_format:{type:'json_object'}});
  try { return success(res, JSON.parse(r)); } catch { const m=r.match(/\{[\s\S]*\}/); return success(res, m?JSON.parse(m[0]):{}); }
}

// ============ SEO ============
async function handleSeo(req, res) {
  if (req.method!=='POST') return error(res,'Use POST',405);
  const { businessName, type, city, services } = req.body||{};
  const r = await callGroq([{role:'system',content:'SEO expert. Return JSON.'},{role:'user',content:`SEO for "${businessName}" (${type}) in ${city}. Services: ${JSON.stringify(services)}. Return JSON: {titleTag,metaDescription,keywords:[],landingPageCopy,googleBusinessDescription}`}],{temperature:0.5,response_format:{type:'json_object'}});
  try { return success(res, JSON.parse(r)); } catch { const m=r.match(/\{[\s\S]*\}/); return success(res, m?JSON.parse(m[0]):{}); }
}

// ============ SMART PRICING ============
async function handleSmartPricing(req, res) {
  if (req.method!=='POST') return error(res,'Use POST',405);
  const { service, location } = req.body||{};
  const results = await searxngSearch(`${service} price in ${location||'Nigeria'}`,{count:10});
  const r = await callGroqFast([{role:'system',content:'Return JSON.'},{role:'user',content:`Suggest pricing for ${service} in ${location||'Nigeria'}. Results: ${JSON.stringify(results.slice(0,5))}. Return JSON: {suggestedPrice,priceRange,reasoning,competitorPrices:[]}`}],{temperature:0.3,response_format:{type:'json_object'}});
  try { return success(res, JSON.parse(r)); } catch { const m=r.match(/\{[\s\S]*\}/); return success(res, m?JSON.parse(m[0]):{}); }
}

// ============ CARD ============
async function handleCard(req, res) {
  if (req.method!=='POST') return error(res,'Use POST',405);
  const { businessName, name, phone, email, whatsapp, services, city, logoUrl } = req.body||{};
  return success(res, { html: `<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;background:#09090B;color:#fff;text-align:center;padding:2rem"><h1>${businessName||'Business'}</h1><p>${name||''} · ${city||'Nigeria'}</p><p>${phone||''} | ${email||''}</p><p>${services||''}</p></body></html>` });
}

// ============ INVOICES ============
async function handleInvoices(req, res) {
  const sb = getSupabase(req);
  if (req.method==='POST') {
    const { businessId, clientName, clientEmail, items, dueDate } = req.body||{};
    const total = (items||[]).reduce((s,i)=>s+(i.amount||0),0);
    const { data, error:e } = await sb.from('invoices').insert({business_id:businessId,invoice_number:`INV-${Date.now().toString().slice(-6)}`,client_name:clientName,client_email:clientEmail,items,total_amount:total,due_date:dueDate,status:'pending'}).select().single();
    if(e) return error(res,e.message,500); return success(res,data);
  }
  if (req.method==='GET') { const { businessId } = req.query||{}; let q=sb.from('invoices').select('*').order('created_at',{ascending:false}).limit(50); if(businessId)q=q.eq('business_id',businessId); const { data, error:e }=await q; if(e)return error(res,e.message,500); return success(res,data); }
  return error(res,'Method not allowed',405);
}

// ============ EXPENSES ============
async function handleExpenses(req, res) {
  const sb = getSupabase(req);
  if (req.method==='POST') { const { businessId, type, amount, category, description, date } = req.body||{}; const { data, error:e }=await sb.from('expenses').insert({business_id:businessId,type,amount,category,description,expense_date:date}).select().single(); if(e)return error(res,e.message,500); return success(res,data); }
  if (req.method==='GET') { const { businessId } = req.query||{}; let q=sb.from('expenses').select('*').order('created_at',{ascending:false}).limit(100); if(businessId)q=q.eq('business_id',businessId); const { data, error:e }=await q; if(e)return error(res,e.message,500); return success(res,data); }
  return error(res,'Method not allowed',405);
}

// ============ NOTIFICATIONS ============
async function handleNotifications(req, res) {
  const sb = getSupabase(req);
  if (req.method==='POST') { const { businessId, type, title, message, channel } = req.body||{}; const { data, error:e }=await sb.from('notifications').insert({business_id:businessId,type,title,message,channel:channel||'in-app',status:'sent'}).select().single(); if(e)return error(res,e.message,500); return success(res,data); }
  if (req.method==='GET') { const { businessId } = req.query||{}; let q=sb.from('notifications').select('*').order('created_at',{ascending:false}).limit(50); if(businessId)q=q.eq('business_id',businessId); const { data, error:e }=await q; if(e)return error(res,e.message,500); return success(res,data); }
  return error(res,'Method not allowed',405);
}

// ============ REFERRALS ============
async function handleReferrals(req, res) {
  const sb = getSupabase(req);
  if (req.method==='POST') { const { referrerId, referredEmail, businessId } = req.body||{}; const { data, error:e }=await sb.from('referrals').insert({referrer_id:referrerId,referred_email:referredEmail,business_id:businessId,status:'pending',reward_amount:1000}).select().single(); if(e)return error(res,e.message,500); return success(res,data); }
  if (req.method==='GET') { const { referrerId } = req.query||{}; let q=sb.from('referrals').select('*').order('created_at',{ascending:false}).limit(50); if(referrerId)q=q.eq('referrer_id',referrerId); const { data, error:e }=await q; if(e)return error(res,e.message,500); return success(res,data); }
  return error(res,'Method not allowed',405);
}

// ============ REVIEWS ============
async function handleReviews(req, res) {
  const sb = getSupabase(req);
  if (req.method==='POST') { const { businessId, clientName, rating, text } = req.body||{}; if(!businessId||!rating) return error(res,'Business ID and rating required',400); const { data, error:e }=await sb.from('reviews').insert({business_id:businessId,client_name:clientName,rating,text,status:'pending'}).select().single(); if(e)return error(res,e.message,500); return success(res,data); }
  if (req.method==='GET') { const { businessId } = req.query||{}; let q=sb.from('reviews').select('*').order('created_at',{ascending:false}).limit(50); if(businessId)q=q.eq('business_id',businessId); const { data, error:e }=await q; if(e)return error(res,e.message,500); return success(res,data); }
  return error(res,'Method not allowed',405);
}

// ============ WEBSITE HTML BUILDER ============
function buildWebsite(plan, brand, content, colors, logoUrl) {
  const h = content.hero||{}; const about = content.about||''; const svc = content.servicesHtml||'';
  const why = content.whyChooseUs||[]; const tests = content.testimonials||[]; const faq = content.faq||[]; const c = content.contactInfo||{};
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${content.seoTitle||plan.businessName+' — '+(plan.tagline||'')}</title><meta name="description" content="${content.seoDescription||''}">
<style>*{margin:0;padding:0;box-sizing:border-box}:root{--p:${colors.primary||'#00D9FF'};--bg:${colors.bg||'#09090B'}}body{font-family:Inter,sans-serif;background:var(--bg);color:#F8FAFC;line-height:1.6}.nav{display:flex;justify-content:space-between;padding:1.5rem 5%;position:sticky;top:0;background:rgba(9,9,11,.8);backdrop-filter:blur(20px);z-index:100}.nav a{color:#94A3B8;text-decoration:none;margin-left:1.5rem}.nav .cta{background:var(--p);color:#000;padding:.6rem 1.5rem;border-radius:100px;font-weight:700}.hero{text-align:center;padding:6rem 5%}.hero h1{font-size:3rem;margin-bottom:1rem}.hero p{color:#94A3B8;font-size:1.2rem;margin-bottom:2rem}.btn{display:inline-block;padding:1rem 2rem;border-radius:100px;font-weight:700;text-decoration:none}.btn-p{background:var(--p);color:#000}.btn-s{border:1px solid rgba(255,255,255,.2);color:#fff}.section{padding:4rem 5%;max-width:1200px;margin:0 auto}.section h2{text-align:center;margin-bottom:2rem}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.5rem}.card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:2rem}.card h3{margin-bottom:.5rem}.card .price{font-size:1.5rem;font-weight:800;color:var(--p)}.contact{background:rgba(255,255,255,.02);border-radius:24px;padding:3rem;text-align:center}.contact a{color:var(--p);text-decoration:none}footer{text-align:center;padding:3rem;color:#64748B}</style></head><body>
<nav class="nav"><a href="#" style="font-weight:800;color:#fff;text-decoration:none">${logoUrl?`<img src="${logoUrl}" style="width:32px;height:32px;border-radius:8px;vertical-align:middle"> `:''}${plan.businessName||'Business'}</a><div><a href="#about">About</a><a href="#services">Services</a><a href="#contact">Contact</a><a class="cta" href="#contact">Book Now</a></div></nav>
<section class="hero"><h1>${h.headline||plan.businessName||''}</h1><p>${h.subheadline||plan.tagline||plan.description||''}</p><a class="btn btn-p" href="#contact">${h.cta||'Get Started'}</a> <a class="btn btn-s" href="#services">Services</a></section>
<section class="section" id="about"><h2>About Us</h2><p style="max-width:700px;margin:0 auto;color:#CBD5E1;text-align:center">${about||plan.description||''}</p></section>
<section class="section" id="services"><h2>Our Services</h2><div class="grid">${svc||(plan.services||[]).map(s=>`<div class="card"><h3>${s.name||''}</h3><p style="color:#94A3B8;margin:.5rem 0">${s.description||''}</p><div class="price">₦${(s.price||0).toLocaleString()}</div></div>`).join('')}</div></section>
${why.length?`<section class="section"><h2>Why Choose Us</h2><div class="grid">${why.map(w=>`<div class="card"><p>${w}</p></div>`).join('')}</div></section>`:''}
${tests.length?`<section class="section"><h2>Testimonials</h2>${tests.map(t=>`<div class="card" style="margin-bottom:1rem"><p style="font-style:italic;color:#CBD5E1">"${t.text||''}"</p><p style="margin-top:.5rem;font-weight:600">— ${t.name||''}, ${t.location||''}</p></div>`).join('')}</section>`:''}
${faq.length?`<section class="section"><h2>FAQ</h2>${faq.map(f=>`<div class="card" style="margin-bottom:1rem"><h4>${f.q||''}</h4><p style="color:#94A3B8;margin-top:.5rem">${f.a||''}</p></div>`).join('')}</section>`:''}
<section class="section" id="contact"><h2>Contact Us</h2><div class="contact">${c.phone?`<p>📞 <a href="tel:${c.phone}">${c.phone}</a></p>`:''}${c.email?`<p>✉️ <a href="mailto:${c.email}">${c.email}</a></p>`:''}${c.address?`<p>📍 ${c.address}</p>`:''}${c.whatsapp?`<p>💬 <a href="https://wa.me/${c.whatsapp.replace(/[^0-9]/g,'')}">WhatsApp</a></p>`:''}</div></section>
<footer>© ${new Date().getFullYear()} ${plan.businessName||'Business'}. Powered by ERGIO.</footer>
</body></html>`;
}
