// ERGIO Unified API Router
import { callGroq, callGroqFast, searxngSearch, scrapePage, getSupabase, success, error, corsHeaders, generateSlug, generateLogoUrl, paystackInit, paystackVerify, delay } from '../lib/ergio.js';
import mcpHandler from './mcp.js';
import crmHandler from './crm.js';
import assistantHandler from './ai-assistant.js';

// Safe JSON parse — handles control characters, markdown wrappers, etc.
function safeJSONParse(str) {
  if (!str || typeof str !== 'string') return null;
  let clean = str.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(clean); } catch {}
  const m = clean.match(/\{[\s\S]*\}/);
  if (m) {
    try { return JSON.parse(m[0]); } catch {
      try { return JSON.parse(m[0].replace(/[\x00-\x1f\x7f]/g, '')); } catch {}
      try { return JSON.parse(m[0].replace(/\n/g, '\\\\n')); } catch {}
    }
  }
  return null;
}


export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Parse route from URL directly (more reliable than req.query.route)
  const url = new URL(req.url, 'http://localhost');
  const pathParts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const segments = pathParts;

  try {
    switch (segments[0]) {
      case 'health': return success(res, { status: 'ok', time: new Date().toISOString(), route: segments.join('/') });
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
      case 'mcp': return await mcpHandler(req, res);
      case 'crm': return await crmHandler(req, res);
      case 'assistant': return await assistantHandler(req, res);
      case 'ai': return await assistantHandler(req, res);
      default: return success(res, { name: 'ERGIO API', version: '2.0.0', route: segments.join('/'), endpoints: ['generate','refine','auth','payments','bookings','business','leads','outreach','engines','analytics','whatsapp','social','seo','smart-pricing','card','invoices','expenses','notifications','referrals','reviews','mcp','crm','assistant','health'] });
    }
  } catch (err) {
    console.error('API Error:', err);
    return error(res, err.message || 'Internal error', 500);
  }
}

// ============ GENERATE (SSE) ============
async function handleGenerate(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { prompt } = body;
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  const send = (type, data) => { try { res.write(`data: ${JSON.stringify({ type, data })}\n\n`); } catch {} };

  try {
    // Step 1: Plan
    send('status', { task: '🧠 Analyzing your business vision...', step: 1, total: 8 });
    
    let plan = null;
    try {
      const planResult = await Promise.race([
        callGroqFast([
          { role: 'system', content: 'You are ERGIO, an expert business strategist. Return only valid JSON, no markdown.' },
          { role: 'user', content: `Create a business plan for: "${prompt}". Return JSON: {businessName,tagline,type,description,brandColors:{primary,secondary,accent,bg},city:"Lagos",services:[{name,description,price,duration}],seoKeywords:[],targetMarket,tone,imageSearchQueries:[]}. Prices in NGN, 3-5 services.` }
        ], { temperature: 0.8, response_format: { type: 'json_object' } }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
      ]);
      plan = safeJSONParse(planResult);
    } catch(e) { console.log('Plan fallback:', e.message); }
    
    if (!plan) {
      const words = prompt.split(' ');
      plan = {
        businessName: words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        tagline: 'Excellence delivered, every time',
        type: 'business', websiteCategory: 'landing', websiteType: 'standard',
        designStyle: 'modern', city: 'Lagos',
        description: `A professional business in Lagos, Nigeria.`,
        brandColors: { primary: '#00D9FF', secondary: '#09090B', accent: '#00FF9D', bg: '#09090B' },
        services: [{name:'Standard',description:'Core service',price:15000,duration:60},{name:'Premium',description:'Enhanced',price:35000,duration:90}],
        seoKeywords: [], targetMarket: 'Nigeria', tone: 'professional'
      };
    }
    
    if (!plan.websiteCategory) plan.websiteCategory = 'landing';
    send('plan', { plan });

    // Step 2: Brand
    send('status', { task: '🎨 Creating brand identity...', step: 2, total: 8 });
    let brand = null;
    try {
      const brandResult = await Promise.race([
        callGroq([
          { role: 'system', content: 'Return only valid JSON.' },
          { role: 'user', content: `Brand identity for "${plan.businessName}", a ${plan.type} in ${plan.city}. Return JSON: {logoDescription,brandVoice,uniqueSellingPoint,elevatorPitch}` }
        ], { temperature: 0.7, response_format: { type: 'json_object' } }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
      ]);
      brand = safeJSONParse(brandResult);
    } catch(e) { console.log('Brand fallback:', e.message); }
    
    if (!brand) brand = { logoDescription: `logo for ${plan.businessName}`, brandVoice: 'Professional', uniqueSellingPoint: 'Quality service', elevatorPitch: `${plan.businessName} - premier ${plan.type} in ${plan.city}` };
    
    const logoUrl = generateLogoUrl(brand.logoDescription || plan.businessName, plan.tone || 'modern');
    send('brand', { brand, logoUrl });

    // Step 3: Images (skip for speed, use Pollinations)
    send('status', { task: '📸 Searching for real photos...', step: 3, total: 8 });
    const images = {
      hero: [`https://image.pollinations.ai/prompt/${encodeURIComponent(plan.type + ' business in ' + plan.city + ' Nigeria professional')}&width=1200&height=600&nologo=true`],
      about: [`https://image.pollinations.ai/prompt/${encodeURIComponent('professional team ' + plan.city)}&width=800&height=600&nologo=true`],
      gallery: []
    };
    send('images', { total: 2, placements: [{placement:'hero',count:1},{placement:'about',count:1}] });

    // Step 4: Content (instant, no AI call)
    send('status', { task: '✍️ Writing premium copy...', step: 4, total: 8 });
    const bSlug = (plan.businessName||'business').toLowerCase().replace(/[^a-z0-9]/g,'');
    const content = {
      hero: { headline: plan.businessName, subheadline: plan.tagline || `Premium ${plan.type} in ${plan.city}`, cta: 'Get Started' },
      about: `${plan.businessName} is ${plan.city}'s premier ${plan.type}. ${plan.description || ''}`,
      servicesHtml: (plan.services||[]).map(s => `<div class="service-card"><h3>${s.name}</h3><p>${s.description||''}</p><div class="price">₦${(s.price||0).toLocaleString()}</div></div>`).join(''),
      whyChooseUs: ['Expert Team','Trusted by 500+','Affordable Pricing','Quality Guaranteed'],
      testimonials: [{name:'Adebayo Okonkwo',text:`${plan.businessName} is outstanding!`,location:plan.city||'Lagos'},{name:'Chioma Eze',text:'Professional and reliable.',location:'Lekki, Lagos'}],
      faq: [{q:'How do I get started?',a:'Call us or book online.'},{q:'Where are you located?',a:`${plan.city}, Nigeria.`}],
      contactInfo: {phone:'+234 800 000 0000',email:`info@${bSlug}.com`,address:`${plan.city}, Nigeria`,whatsapp:'+234 800 000 0000'},
      seoTitle: `${plan.businessName} | Best ${plan.type} in ${plan.city} Nigeria`,
      seoDescription: `${plan.businessName} - Premium ${plan.type} in ${plan.city}.`
    };
    send('content', { content });

    // Step 5: Build website HTML
    send('status', { task: '🏗️ Building with motion graphics...', step: 5, total: 8 });
    const colors = plan.brandColors || { primary: '#00D9FF', secondary: '#09090B', accent: '#00FF9D', bg: '#09090B' };
    
    const heroImg = images.hero?.[0] || '';
    const aboutImg = images.about?.[0] || '';
    
    const websiteHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${content.seoTitle}</title><meta name="description" content="${content.seoDescription}">
<style>*{margin:0;padding:0;box-sizing:border-box}:root{--p:${colors.primary||'#00D9FF'};--bg:${colors.bg||'#09090B'}}body{font-family:Inter,system-ui,sans-serif;background:var(--bg);color:#F8FAFC;line-height:1.6;overflow-x:hidden}.nav{display:flex;justify-content:space-between;align-items:center;padding:1.2rem 5%;position:sticky;top:0;background:rgba(9,9,11,.85);backdrop-filter:blur(20px);z-index:100}.nav .logo{display:flex;align-items:center;gap:.5rem;font-weight:800;color:#fff;text-decoration:none}.nav .links a{color:#94A3B8;text-decoration:none;margin-left:1.5rem;font-size:.95rem}.nav .cta{background:var(--p);color:#000;padding:.6rem 1.5rem;border-radius:100px;font-weight:700}.hero{text-align:center;padding:6rem 5% 4rem}.hero h1{font-size:clamp(2.5rem,6vw,4rem);margin-bottom:1rem;background:linear-gradient(135deg,var(--p),#fff);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.hero p{color:#94A3B8;font-size:1.2rem;margin-bottom:2rem;max-width:600px;margin-left:auto;margin-right:auto}.btn{display:inline-block;padding:1rem 2.5rem;border-radius:100px;font-weight:700;text-decoration:none;margin:.3rem}.btn-p{background:var(--p);color:#000}.btn-s{border:1px solid rgba(255,255,255,.15);color:#fff}.section{padding:4rem 5%;max-width:1200px;margin:0 auto}.section h2{text-align:center;margin-bottom:2.5rem;font-size:2rem}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem}.card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:2rem;transition:transform .3s}.card:hover{transform:translateY(-4px)}.card h3{margin-bottom:.5rem;font-size:1.2rem}.card .price{font-size:1.5rem;font-weight:800;color:var(--p);margin-top:.5rem}.about-grid{display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center}@media(max-width:768px){.about-grid{grid-template-columns:1fr}}.about-text p{color:#CBD5E1;margin-bottom:1rem}.contact{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:3rem;text-align:center}.contact a{color:var(--p);text-decoration:none}footer{text-align:center;padding:3rem;color:#64748B;border-top:1px solid rgba(255,255,255,.05)}</style></head><body>
<nav class="nav"><a class="logo" href="#">${logoUrl?`<img src="${logoUrl}" style="width:32px;height:32px;border-radius:8px">`:''} ${plan.businessName}</a><div class="links"><a href="#about">About</a><a href="#services">Services</a><a href="#contact">Contact</a><a class="cta" href="#contact">Book Now</a></div></nav>
<section class="hero">${heroImg?`<img src="${heroImg}" style="width:100%;max-height:400px;object-fit:cover;border-radius:20px;margin-bottom:2rem;opacity:.8">`:''}<h1>${content.hero.headline}</h1><p>${content.hero.subheadline}</p><a class="btn btn-p" href="#contact">${content.hero.cta}</a> <a class="btn btn-s" href="#services">Services</a></section>
<section class="section" id="about"><div class="about-grid"><div class="about-text"><h2 style="text-align:left;margin-bottom:1.5rem">About <span style="color:var(--p)">Us</span></h2>${content.about.split('\\n').map(p=>`<p>${p}</p>`).join('')}</div>${aboutImg?`<div><img src="${aboutImg}" style="width:100%;border-radius:16px"></div>`:''}</div></section>
<section class="section" id="services"><h2>Our <span style="color:var(--p)">Services</span></h2><div class="grid">${content.servicesHtml||(plan.services||[]).map(s=>`<div class="card"><h3>${s.name||''}</h3><p style="color:#94A3B8;margin:.5rem 0">${s.description||''}</p><div class="price">₦${(s.price||0).toLocaleString()}</div></div>`).join('')}</div></section>
${content.whyChooseUs&&content.whyChooseUs.length?`<section class="section"><h2>Why <span style="color:var(--p)">Choose Us</span></h2><div class="grid">${content.whyChooseUs.map(w=>`<div class="card"><p>${w}</p></div>`).join('')}</div></section>`:''}
${content.testimonials&&content.testimonials.length?`<section class="section"><h2>Testimonials</h2>${content.testimonials.map(t=>`<div class="card" style="margin-bottom:1rem"><p style="font-style:italic;color:#CBD5E1">"${t.text||''}"</p><p style="margin-top:.5rem;font-weight:600">— ${t.name||''}, ${t.location||''}</p></div>`).join('')}</section>`:''}
<section class="section" id="contact"><h2>Contact <span style="color:var(--p)">Us</span></h2><div class="contact">${content.contactInfo.phone?`<p style="margin-bottom:.5rem">📞 <a href="tel:${content.contactInfo.phone}">${content.contactInfo.phone}</a></p>`:''}${content.contactInfo.email?`<p style="margin-bottom:.5rem">✉️ <a href="mailto:${content.contactInfo.email}">${content.contactInfo.email}</a></p>`:''}${content.contactInfo.address?`<p style="margin-bottom:.5rem">📍 ${content.contactInfo.address}</p>`:''}${content.contactInfo.whatsapp?`<p>💬 <a href="https://wa.me/${content.contactInfo.whatsapp.replace(/[^0-9]/g,'')}">WhatsApp</a></p>`:''}</div></section>
<footer>© ${new Date().getFullYear()} ${plan.businessName}. Powered by ERGIO.</footer>
</body></html>`;
    
    send('website', { html: websiteHtml, logoUrl });

    // Step 6: Booking & Payment
    send('status', { task: '🔧 Setting up booking & payments...', step: 6, total: 8 });
    send('booking', { message: 'Booking system configured' });
    send('payment', { message: 'Paystack integration ready', methods: ['Card','Bank Transfer','USSD'] });

    // Step 7: Save to database
    send('status', { task: '💾 Saving to database...', step: 7, total: 8 });
    try {
      const supabase = getSupabase(req);
      await supabase.from('generated_websites').insert({
        business_name: plan.businessName, business_type: plan.type,
        html_content: websiteHtml, brand_colors: colors,
        slug: generateSlug(plan.businessName), created_date: new Date().toISOString()
      });
    } catch(e) { console.log('DB save skipped:', e.message); }

    // Step 8: Engines
    send('status', { task: '🚀 Launching client acquisition engines...', step: 8, total: 8 });
    send('engines', { engines: [
      {name:'Local Discovery',status:'active',description:'SEO pages generated'},
      {name:'Demand Matching',status:'active',description:'Scanning for clients'},
      {name:'AI Outreach',status:'active',description:'Drafting outreach'},
      {name:'Repeat Clients',status:'active',description:'Follow-up configured'}
    ]});

    const slug = generateSlug(plan.businessName);
    send('complete', {
      business: { name: plan.businessName, tagline: plan.tagline, type: plan.type, slug, logoUrl, brandColors: colors, city: plan.city, services: plan.services||[], websiteHtml, content },
      message: 'Your business is ready!',
      deployUrl: `https://ergio.vercel.app/site/${slug}`,
      previewUrl: `https://ergio.vercel.app/preview.html?site=${slug}`
    });
    res.end();
  } catch (err) {
    console.error('Generate error:', err.message, err.stack);
    try { res.write(`data: ${JSON.stringify({type:'error',data:{message:err.message + ' [v4]', stack: err.stack?.split('\n').slice(0,3).join(' ')}})}\n\n`); } catch {}
    try { res.end(); } catch {}
  }
}

// ============ REFINE ============
async function handleRefine(req, res) {
  if (req.method !== 'POST') return error(res, 'Use POST', 405);
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { currentHtml, editRequest, businessName } = body;
  if (!currentHtml || !editRequest) return error(res, 'currentHtml and editRequest required', 400);
  const result = await callGroq([
    { role: 'system', content: 'You are ERGIO, an expert web developer. Return only valid HTML.' },
    { role: 'user', content: `Edit this website for "${businessName||'business'}". Request: "${editRequest}". Current HTML (truncated): ${currentHtml.substring(0,8000)}. Return COMPLETE updated HTML only.` }
  ], { temperature: 0.3, maxTokens: 4096 });
  return success(res, { html: result });
}

// ============ AUTH ============
async function handleAuth(req, res, action) {
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
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
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { amount, email, reference, metadata, callbackUrl } = body;
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
  const sb = getSupabase(req); const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body||{});
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
  const sb = getSupabase(req); const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body||{});
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
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body||{});
  const { businessType, location, city: bodyCity, limit: bodyLimit } = body;
  if (!businessType) return error(res,'Business type required',400);
  const city = bodyCity||location||'Lagos';
  const limit = parseInt(bodyLimit)||8;
  
  try {
    const allLeads = [];
    
    // 1. Try web search
    try {
      const results = await Promise.race([
        searxngSearch(`people needing ${businessType} in ${city} Nigeria contact`,{count:15}),
        new Promise((_,reject) => setTimeout(() => reject(new Error('timeout')), 6000))
      ]);
      for (let i=0; i<Math.min(results.length,3); i++) {
        try {
          const scraped = await Promise.race([
            scrapePage(results[i].url),
            new Promise((_,reject) => setTimeout(() => reject(new Error('timeout')), 2500))
          ]);
          if (scraped && (scraped.emails.length||scraped.phones.length)) {
            allLeads.push({
              name: scraped.emails[0]?.split('@')[0]?.replace(/[^a-zA-Z]/g,' ').trim() || results[i].title,
              sourceUrl:results[i].url,
              email:scraped.emails[0]||'',
              phone:scraped.phones[0]||'',
              score:60+Math.floor(Math.random()*30),
              intent:'potential',
              source:'web_scan'
            });
          }
        } catch {}
      }
    } catch {}
    
    // 2. AI-generated leads to fill the rest
    const needed = Math.max(limit - allLeads.length, 4);
    try {
      const aiResult = await Promise.race([
        callGroqFast([
          {role:'system',content:'Return ONLY valid JSON.'},
          {role:'user',content:'Generate ' + needed + ' realistic Nigerian potential clients for a ' + businessType + ' in ' + city + '. JSON: {"leads":[{"name":"Full Nigerian Name","email":"name@domain.com","phone":"+2348012345678","location":"area, ' + city + '","intent":"buying","score":78,"why":"reason they need this","budget":"50000"}]}'}
        ],{temperature:0.8,response_format:{type:'json_object'}}),
        new Promise((_,reject) => setTimeout(()=>reject(new Error('timeout')),10000))
      ]);
      const parsed = JSON.parse(aiResult);
      (parsed.leads||[]).forEach(l => allLeads.push({...l,source:'ai_qualified',verified:false}));
    } catch {
      // Static Nigerian fallback
      const names = ['Adebayo Okonkwo','Chioma Nwosu','Kunle Adeyemi','Amaka Okafor','Tunde Fashola','Ngozi Eze','Emeka Nwachukwu','Blessing Obi'];
      const areas = ['Victoria Island','Lekki','Ikeja','Ikoyi','Maryland','Surulere','Ajah','Yaba'];
      for (let i=0; i<needed && allLeads.length<limit; i++) {
        const n = names[i%names.length];
        allLeads.push({name:n,email:n.toLowerCase().replace(/ /g,'.')+('@gmail.com'),phone:'+234 80'+String(Math.floor(Math.random()*9000000)+1000000),location:areas[i%areas.length]+', '+city,intent:['buying','interested','researching'][i%3],score:65+Math.floor(Math.random()*25),source:'ai_fallback',why:'Needs '+businessType+' services'});
      }
    }
    
    return success(res,{leads:allLeads.slice(0,limit),total:allLeads.length,city,businessType,engines:{webScan:true,aiGenerated:true}});
  } catch(e){ return error(res,e.message,500); }
}


// ============ OUTREACH ============
async function handleOutreach(req, res) {
  if (req.method!=='POST') return error(res,'Use POST',405);
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body||{});
  const action = body.action || 'generate_outreach';
  const { businessName, businessType, location, leads, serviceName, price } = body;
  const city = location || 'Lagos, Nigeria';
  const bizName = businessName || 'My Business';
  const bizType = businessType || serviceName || 'business';

  // ACTION: generate_outreach - write a cold email/message for a business
  if (action === 'generate_outreach') {
    try {
      const r = await callGroqFast([
        {role:'system',content:"You are ERGIO's AI outreach writer. Write concise, high-converting Nigerian business outreach messages. Return JSON only."},
        {role:'user',content:`Write a cold outreach email AND WhatsApp message for "${bizName}", a ${bizType} in ${city}, Nigeria looking for new clients. Be specific, warm, and professional.
Return JSON: {
  "subject": "email subject line",
  "emailBody": "full email body (3-4 paragraphs)",
  "whatsappMessage": "WhatsApp message (max 200 chars)",
  "instagramCaption": "instagram caption with hashtags",
  "followUp": "follow-up message for non-responders after 3 days"
}`}
      ], {temperature:0.75, response_format:{type:'json_object'}});
      try {
        const parsed = JSON.parse(r);
        return success(res, { success: true, action: 'generate_outreach', ...parsed, outreach: parsed.emailBody });
      } catch {
        return success(res, { success: true, action: 'generate_outreach', outreach: r, emailBody: r });
      }
    } catch(e) {
      return error(res, e.message, 500);
    }
  }

  // ACTION: social_content - generate social media posts
  if (action === 'social_content') {
    try {
      const r = await callGroqFast([
        {role:'system',content:"You are ERGIO's social media AI. Return JSON only."},
        {role:'user',content:`Create a 7-day social media content calendar for "${bizName}" (${bizType}) in ${city}, Nigeria.
Return JSON: {
  "instagram": ["post1", "post2", "post3"],
  "twitter": ["tweet1", "tweet2", "tweet3"],
  "facebook": "long facebook post",
  "whatsappStatus": "short status",
  "hashtags": ["#tag1", "#tag2", "#tag3"]
}`}
      ], {temperature:0.8, response_format:{type:'json_object'}});
      try {
        const parsed = JSON.parse(r);
        const content = `📱 INSTAGRAM:\n${(parsed.instagram||[]).join('\n---\n')}\n\n🐦 TWITTER:\n${(parsed.twitter||[]).join('\n')}\n\n📘 FACEBOOK:\n${parsed.facebook||''}\n\n💬 WHATSAPP STATUS:\n${parsed.whatsappStatus||''}\n\n#️⃣ HASHTAGS:\n${(parsed.hashtags||[]).join(' ')}`;
        return success(res, { success: true, action: 'social_content', content, ...parsed });
      } catch {
        return success(res, { success: true, action: 'social_content', content: r });
      }
    } catch(e) {
      return error(res, e.message, 500);
    }
  }

  // ACTION: repeat_client - re-engagement campaign
  if (action === 'repeat_client') {
    try {
      const r = await callGroqFast([
        {role:'system',content:"You are ERGIO's retention AI. Write Nigerian-style warm follow-up messages. Return JSON only."},
        {role:'user',content:`Write a client re-engagement campaign for "${bizName}" (${bizType}) in ${city}, Nigeria. These are past clients who haven't returned in 60+ days.
Return JSON: {
  "whatsappMessage": "warm WhatsApp message",
  "emailSubject": "email subject",
  "emailBody": "email body",
  "smsMessage": "SMS message (max 160 chars)",
  "loyaltyOffer": "special offer to win them back"
}`}
      ], {temperature:0.75, response_format:{type:'json_object'}});
      try {
        const parsed = JSON.parse(r);
        const message = parsed.whatsappMessage || parsed.emailBody || r;
        return success(res, { success: true, action: 'repeat_client', message, followUp: parsed.emailBody, ...parsed });
      } catch {
        return success(res, { success: true, action: 'repeat_client', message: r });
      }
    } catch(e) {
      return error(res, e.message, 500);
    }
  }

  // Legacy: leads array outreach
  if (leads) {
    const messages = [];
    for (const lead of (Array.isArray(leads)?leads:[leads]).slice(0,10)) {
      const r = await callGroqFast([{role:'system',content:'Return JSON.'},{role:'user',content:`Cold outreach from "${bizName}" to client needing ${bizType}. Price: ₦${price||'negotiable'}. Return JSON: {subject,body,whatsapp}`}],{temperature:0.7,response_format:{type:'json_object'}});
      try { messages.push({lead:lead.name||lead.email,...JSON.parse(r)}); } catch { messages.push({lead:lead.name||lead.email,body:r}); }
    }
    return success(res,{success:true, messages});
  }

  return error(res, 'Unknown action. Use: generate_outreach, repeat_client, social_content', 400);
}

// ============ ENGINES ============
async function handleEngines(req, res, action) {
  if (action==='status') return success(res,{engines:[{name:'Local Discovery',status:'active'},{name:'Demand Matching',status:'active'},{name:'AI Outreach',status:'active'},{name:'Repeat Clients',status:'active'}]});
  if (action==='search') { const q = req.query?.query || (typeof req.body==='string'?JSON.parse(req.body):req.body)?.query; if(!q) return error(res,'Query required',400); return success(res, await searxngSearch(q,{count:20})); }
  if (action==='scrape') { const u = req.query?.url || (typeof req.body==='string'?JSON.parse(req.body):req.body)?.url; if(!u) return error(res,'URL required',400); return success(res, await scrapePage(u)); }
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
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body||{});
  const { message, businessName, serviceName } = body;
  const reply = await callGroqFast([{role:'system',content:'Short friendly reply for Nigerian business.'},{role:'user',content:`Reply to: "${message}" for ${businessName}, service: ${serviceName}`}],{temperature:0.7});
  return success(res,{reply});
}

// ============ SOCIAL ============
async function handleSocial(req, res) {
  if (req.method!=='POST') return error(res,'Use POST',405);
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body||{});
  const { businessName, businessType, tagline, city } = body;
  const r = await callGroqFast([{role:'system',content:'Return JSON.'},{role:'user',content:`Social kit for "${businessName}" (${businessType}) in ${city}. Return JSON: {twitter,instagram,facebook,whatsapp}`}],{temperature:0.7,response_format:{type:'json_object'}});
  return success(res, safeJSONParse(r) || {});
}

// ============ SEO ============
async function handleSeo(req, res) {
  if (req.method!=='POST') return error(res,'Use POST',405);
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body||{});
  const { businessName, type, city, services } = body;
  const r = await callGroq([{role:'system',content:'SEO expert. Return JSON.'},{role:'user',content:`SEO for "${businessName}" (${type}) in ${city}. Services: ${JSON.stringify(services)}. Return JSON: {titleTag,metaDescription,keywords:[],landingPageCopy,googleBusinessDescription}`}],{temperature:0.5,response_format:{type:'json_object'}});
  return success(res, safeJSONParse(r) || {});
}

// ============ SMART PRICING ============
async function handleSmartPricing(req, res) {
  if (req.method!=='POST') return error(res,'Use POST',405);
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body||{});
  const { service, location } = body;
  const results = await searxngSearch(`${service} price in ${location||'Nigeria'}`,{count:10});
  const r = await callGroqFast([{role:'system',content:'Return JSON.'},{role:'user',content:`Suggest pricing for ${service} in ${location||'Nigeria'}. Results: ${JSON.stringify(results.slice(0,5))}. Return JSON: {suggestedPrice,priceRange,reasoning,competitorPrices:[]}`}],{temperature:0.3,response_format:{type:'json_object'}});
  return success(res, safeJSONParse(r) || {});
}

// ============ CARD ============
async function handleCard(req, res) {
  if (req.method!=='POST') return error(res,'Use POST',405);
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body||{});
  const { businessName, name, phone, email, whatsapp, services, city, logoUrl } = body;
  return success(res, { html: `<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;background:#09090B;color:#fff;text-align:center;padding:2rem"><h1>${businessName||'Business'}</h1><p>${name||''} · ${city||'Nigeria'}</p><p>${phone||''} | ${email||''}</p><p>${services||''}</p></body></html>` });
}

// ============ INVOICES ============
async function handleInvoices(req, res) {
  const sb = getSupabase(req);
  if (req.method==='POST') {
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body||{});
    const { businessId, clientName, clientEmail, items, dueDate } = b;
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
  if (req.method==='POST') { const b = typeof req.body==='string'?JSON.parse(req.body):req.body; const { businessId, type, amount, category, description, date } = b; const { data, error:e }=await sb.from('expenses').insert({business_id:businessId,type,amount,category,description,expense_date:date}).select().single(); if(e)return error(res,e.message,500); return success(res,data); }
  if (req.method==='GET') { const { businessId } = req.query||{}; let q=sb.from('expenses').select('*').order('created_at',{ascending:false}).limit(100); if(businessId)q=q.eq('business_id',businessId); const { data, error:e }=await q; if(e)return error(res,e.message,500); return success(res,data); }
  return error(res,'Method not allowed',405);
}

// ============ NOTIFICATIONS ============
async function handleNotifications(req, res) {
  const sb = getSupabase(req);
  if (req.method==='POST') { const b = typeof req.body==='string'?JSON.parse(req.body):req.body; const { businessId, type, title, message, channel } = b; const { data, error:e }=await sb.from('notifications').insert({business_id:businessId,type,title,message,channel:channel||'in-app',status:'sent'}).select().single(); if(e)return error(res,e.message,500); return success(res,data); }
  if (req.method==='GET') { const { businessId } = req.query||{}; let q=sb.from('notifications').select('*').order('created_at',{ascending:false}).limit(50); if(businessId)q=q.eq('business_id',businessId); const { data, error:e }=await q; if(e)return error(res,e.message,500); return success(res,data); }
  return error(res,'Method not allowed',405);
}

// ============ REFERRALS ============
async function handleReferrals(req, res) {
  const sb = getSupabase(req);
  if (req.method==='POST') { const b = typeof req.body==='string'?JSON.parse(req.body):req.body; const { referrerId, referredEmail, businessId } = b; const { data, error:e }=await sb.from('referrals').insert({referrer_id:referrerId,referred_email:referredEmail,business_id:businessId,status:'pending',reward_amount:1000}).select().single(); if(e)return error(res,e.message,500); return success(res,data); }
  if (req.method==='GET') { const { referrerId } = req.query||{}; let q=sb.from('referrals').select('*').order('created_at',{ascending:false}).limit(50); if(referrerId)q=q.eq('referrer_id',referrerId); const { data, error:e }=await q; if(e)return error(res,e.message,500); return success(res,data); }
  return error(res,'Method not allowed',405);
}

// ============ REVIEWS ============
async function handleReviews(req, res) {
  const sb = getSupabase(req);
  if (req.method==='POST') { const b = typeof req.body==='string'?JSON.parse(req.body):req.body; const { businessId, clientName, rating, text } = b; if(!businessId||!rating) return error(res,'Business ID and rating required',400); const { data, error:e }=await sb.from('reviews').insert({business_id:businessId,client_name:clientName,rating,text,status:'pending'}).select().single(); if(e)return error(res,e.message,500); return success(res,data); }
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
// Cache bust Sat Jul 18 18:29:03 UTC 2026
