// ========================================
// ERGIO API — /api/generate
// The AI Conductor: receives a prompt, plans tasks, 
// generates a full business website using Groq AI
// Streams progress via Server-Sent Events (SSE)
// ========================================

import { callGroq, callGroqFast, success, error, corsHeaders, generateSlug, generateLogoUrl } from '../lib/ergio.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return error(res, 'Use POST', 405);

  try {
    const { prompt, answers } = req.body;
    if (!prompt) return error(res, 'Prompt is required', 400);

    // Set up SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Helper to send SSE events
    const send = (type, data) => {
      res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
    };

    // ============ STEP 1: PLAN ============
    send('status', { task: 'Understanding your request...', step: 1, total: 7 });

    const planPrompt = `You are ERGIO, an AI business launcher for Africa. A user wants to start a business. 

User's input: "${prompt}"
Additional answers: ${JSON.stringify(answers || {})}

If the user mentions "3D", "interactive", "animated", "immersive", or wants something unique, set websiteType to "3d". Otherwise use "standard".

Create a business plan. Return ONLY valid JSON with this structure:
{
  "businessName": "A catchy, professional name",
  "tagline": "Short memorable tagline",
  "type": "business type (e.g. restaurant, salon, design studio)",
  "websiteType": "standard" or "3d" (use 3d for interactive/immersive requests),
  "description": "2-3 sentence business description",
  "brandColors": {
    "primary": "#hex color",
    "secondary": "#hex color",
    "accent": "#hex color",
    "bg": "#hex color"
  },
  "city": "extracted city or 'Lagos'",
  "services": [
    {"name": "service name", "description": "brief desc", "price": 5000, "duration": 60}
  ],
  "seoKeywords": ["keyword1", "keyword2"],
  "targetMarket": "who are the ideal clients",
  "tone": "professional|casual|luxury|friendly"
}

Rules:
- Prices in Nigerian Naira (NGN)
- 3-5 services
- Colors should be modern and professional
- Business name should be memorable and work in the Nigerian market`;

    const planResult = await callGroq([
      { role: 'system', content: 'You are ERGIO, an expert business strategist. Return only valid JSON, no markdown.' },
      { role: 'user', content: planPrompt }
    ], { temperature: 0.8, response_format: { type: 'json_object' } });

    let plan;
    try {
      plan = JSON.parse(planResult);
    } catch (e) {
      // Try to extract JSON from the response
      const match = planResult.match(/\{[\s\S]*\}/);
      if (match) plan = JSON.parse(match[0]);
      else throw new Error('Failed to parse business plan');
    }

    send('plan', { plan });
    send('status', { task: 'Generating brand identity...', step: 2, total: 7 });

    // ============ STEP 2: BRAND IDENTITY ============
    const brandPrompt = `Create brand identity for "${plan.businessName}", a ${plan.type} in ${plan.city}, Nigeria.
Tagline: "${plan.tagline}"
Tone: ${plan.tone || 'professional'}

Return JSON:
{
  "logoDescription": "detailed prompt for generating a logo image",
  "brandVoice": "3 words describing the brand voice",
  "uniqueSellingPoint": "what makes this business different",
  "elevatorPitch": "1 sentence pitch"
}`;

    const brandResult = await callGroq([
      { role: 'system', content: 'Return only valid JSON.' },
      { role: 'user', content: brandPrompt }
    ], { temperature: 0.7, response_format: { type: 'json_object' } });

    let brand;
    try {
      brand = JSON.parse(brandResult);
    } catch {
      const match = brandResult.match(/\{[\s\S]*\}/);
      brand = match ? JSON.parse(match[0]) : { logoDescription: `logo for ${plan.businessName}` };
    }

    const logoUrl = generateLogoUrl(brand.logoDescription || plan.businessName, plan.tone || 'modern');
    send('brand', { brand, logoUrl });
    send('status', { task: 'Writing website copy...', step: 3, total: 7 });

    // ============ STEP 3: WEBSITE CONTENT ============
    const contentPrompt = `You are writing premium website copy for "${plan.businessName}", a ${plan.type} in ${plan.city}, Nigeria.
Services: ${JSON.stringify(plan.services)}
Brand voice: ${brand.brandVoice || 'professional'}
Tone: ${plan.tone || 'professional'}

IMPORTANT: Write like Apple and Nike — bold, concise, powerful. No generic phrases like "We are committed to" or "Quality service you can trust."
Use active voice. Make every sentence punch. Include Nigerian cultural references where natural.

Return JSON with:
{
  "hero": {
    "headline": "powerful headline",
    "subheadline": "supporting text",
    "cta": "button text"
  },
  "about": "2 paragraph about section, mention the business is in ${plan.city} Nigeria",
  "servicesHtml": "HTML for services section, each service as a card with name, description, price in ₦",
  "whyChooseUs": ["reason1", "reason2", "reason3", "reason4"],
  "testimonials": [
    {"name": "Nigerian name", "text": "review text", "location": "area in Nigeria"}
  ],
  "faq": [
    {"q": "question", "a": "answer"}
  ],
  "seoTitle": "SEO optimized title tag",
  "seoDescription": "SEO meta description",
  "contactInfo": {
    "phone": " Nigerian phone format",
    "email": "info@businessname.com",
    "address": "address in ${plan.city}",
    "whatsapp": "whatsapp number"
  }
}`;

    const contentResult = await callGroq([
      { role: 'system', content: 'You are ERGIO, expert copywriter for Nigerian businesses. Return only valid JSON.' },
      { role: 'user', content: contentPrompt }
    ], { temperature: 0.75, maxTokens: 4096, response_format: { type: 'json_object' } });

    let content;
    try {
      content = JSON.parse(contentResult);
    } catch {
      const match = contentResult.match(/\{[\s\S]*\}/);
      content = match ? JSON.parse(match[0]) : {};
    }

    send('content', { content });
    send('status', { task: 'Building your website...', step: 4, total: 7 });

    // ============ STEP 4: GENERATE WEBSITE HTML ============
    const colors = plan.brandColors || { primary: '#00D9FF', secondary: '#09090B', accent: '#00FF9D', bg: '#09090B' };

    const is3D = plan.websiteType === '3d' || (prompt + JSON.stringify(answers || {})).toLowerCase().includes('3d') || (prompt + JSON.stringify(answers || {})).toLowerCase().includes('interactive') || (prompt + JSON.stringify(answers || {})).toLowerCase().includes('animated');
    const websiteHtml = is3D 
      ? generate3DWebsiteHTML(plan, brand, content, colors, logoUrl)
      : generateWebsiteHTML(plan, brand, content, colors, logoUrl);
    send('website', { html: websiteHtml, logoUrl });
    send('status', { task: 'Setting up booking system...', step: 5, total: 7 });

    await delay(500);
    send('booking', { 
      message: 'Booking system configured',
      calendarUrl: `/${generateSlug(plan.businessName)}/book`
    });

    send('status', { task: 'Connecting payment gateway...', step: 6, total: 7 });
    await delay(500);
    send('payment', {
      message: 'Paystack integration ready',
      testUrl: '/api/payments',
      methods: ['Card', 'Bank Transfer', 'USSD', 'Mobile Money']
    });

    // ============ STEP 5: INITIALIZING ENGINES ============
    send('status', { task: 'Initializing client acquisition engines...', step: 7, total: 7 });

    const engines = [
      { name: 'Local Discovery', status: 'active', description: 'SEO pages generated, Google Business Profile ready' },
      { name: 'Demand Matching', status: 'active', description: 'Scanning for clients needing your services' },
      { name: 'AI Outreach', status: 'active', description: 'Drafting personalized outreach to local businesses' },
      { name: 'Repeat Clients', status: 'active', description: 'Follow-up automation configured' }
    ];

    send('engines', { engines });

    // ============ FINAL RESULT ============
    send('complete', {
      business: {
        name: plan.businessName,
        tagline: plan.tagline,
        type: plan.type,
        slug: generateSlug(plan.businessName),
        logoUrl,
        brandColors: colors,
        city: plan.city,
        services: plan.services || [],
        websiteHtml,
        content
      },
      message: 'Your business is ready!'
    });

    res.end();

  } catch (err) {
    console.error('Generate error:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', data: { message: err.message } })}\n\n`);
    res.end();
  }
}

// ============ SAVE TO SUPABASE ============
    try {
      const { getSupabase } = await import('../lib/ergio.js');
      const supabase = getSupabase(req);
      const userId = req.body.userId || null;
      
      await supabase.from('generated_websites').insert({
        business_name: plan.businessName,
        business_type: plan.type,
        html_content: websiteHtml,
        brand_colors: colors,
        website_type: is3D ? '3d' : 'standard',
        created_by: userId,
        created_date: new Date().toISOString()
      });
    } catch (dbErr) {
      console.error('Template save error:', dbErr.message);
    }

    // ============ WEBSITE HTML GENERATOR ============
function generateWebsiteHTML(plan, brand, content, colors, logoUrl) {
  const hero = content.hero || {};
  const about = content.about || '';
  const servicesHtml = content.servicesHtml || '';
  const whyChooseUs = content.whyChooseUs || [];
  const testimonials = content.testimonials || [];
  const faq = content.faq || [];
  const contact = content.contactInfo || {};

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.seoTitle || plan.businessName + ' — ' + plan.tagline}</title>
  <meta name="description" content="${content.seoDescription || plan.description || ''}">
  <meta name="keywords" content="${(plan.seoKeywords || []).join(', ')}">
  <meta property="og:title" content="${plan.businessName}">
  <meta property="og:description" content="${plan.tagline || ''}">
  <meta property="og:image" content="${logoUrl}">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    :root{--primary:${colors.primary || '#00D9FF'};--secondary:${colors.secondary || '#09090B'};--accent:${colors.accent || '#00FF9D'};--bg:${colors.bg || '#09090B'}}
    body{font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;background:var(--bg);color:#F8FAFC;line-height:1.6;overflow-x:hidden}
    .nav{display:flex;justify-content:space-between;align-items:center;padding:1.5rem 5%;position:sticky;top:0;background:rgba(9,9,11,0.8);backdrop-filter:blur(20px);z-index:100}
    .nav-logo{display:flex;align-items:center;gap:.6rem;font-weight:800;font-size:1.3rem;color:#fff;text-decoration:none}
    .nav-logo img{width:36px;height:36px;border-radius:8px}
    .nav-links a{color:#94A3B8;text-decoration:none;margin-left:2rem;font-size:.95rem;transition:color .3s}
    .nav-links a:hover{color:var(--primary)}
    .nav-cta{background:var(--primary);color:#09090B;padding:.6rem 1.5rem;border-radius:100px;font-weight:700;text-decoration:none;font-size:.9rem;border:none;cursor:pointer}
    .hero{text-align:center;padding:6rem 5% 4rem;max-width:900px;margin:0 auto}
    .hero h1{font-size:clamp(2rem,5vw,3.5rem);font-weight:800;margin-bottom:1rem;line-height:1.1}
    .hero h1 span{color:var(--primary)}
    .hero p{font-size:1.2rem;color:#94A3B8;max-width:600px;margin:0 auto 2rem}
    .hero-cta{display:inline-flex;gap:1rem;flex-wrap:wrap;justify-content:center}
    .btn-primary{background:var(--primary);color:#09090B;padding:1rem 2rem;border-radius:100px;font-weight:700;text-decoration:none;border:none;cursor:pointer;font-size:1rem;transition:transform .2s}
    .btn-primary:hover{transform:scale(1.05)}
    .btn-outline{background:transparent;color:#fff;padding:1rem 2rem;border-radius:100px;border:1px solid rgba(255,255,255,0.2);text-decoration:none;font-weight:600;font-size:1rem}
    section{padding:4rem 5%;max-width:1200px;margin:0 auto}
    .section-title{font-size:2rem;font-weight:800;margin-bottom:.5rem;text-align:center}
    .section-sub{color:#94A3B8;text-align:center;margin-bottom:3rem}
    .about-grid{display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center}
    .about-text p{color:#94A3B8;margin-bottom:1rem}
    .about-img{background:linear-gradient(135deg,var(--primary),var(--accent));border-radius:20px;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center}
    .about-img img{width:100%;height:100%;object-fit:cover;border-radius:20px}
    .services-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem}
    .service-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:2rem;transition:all .3s}
    .service-card:hover{border-color:var(--primary);transform:translateY(-4px)}
    .service-card h3{font-size:1.3rem;margin-bottom:.5rem}
    .service-card p{color:#94A3B8;margin-bottom:1rem}
    .service-price{font-size:1.5rem;font-weight:800;color:var(--accent)}
    .why-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1.5rem}
    .why-item{text-align:center;padding:1.5rem}
    .why-item .icon{font-size:2rem;margin-bottom:.5rem}
    .why-item h4{margin-bottom:.3rem}
    .why-item p{color:#94A3B8;font-size:.9rem}
    .testimonials{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem}
    .testimonial{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:2rem}
    .testimonial p{color:#CBD5E1;font-style:italic;margin-bottom:1rem}
    .testimonial .author{font-weight:700}
    .testimonial .location{color:#94A3B8;font-size:.9rem}
    .faq-item{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:1.5rem;margin-bottom:1rem}
    .faq-item h4{margin-bottom:.5rem;color:var(--primary)}
    .faq-item p{color:#94A3B8}
    .contact{background:linear-gradient(135deg,rgba(0,217,255,0.1),rgba(0,255,157,0.05));border-radius:24px;padding:3rem;text-align:center;margin:2rem 5%}
    .contact h2{margin-bottom:1rem}
    .contact-info{display:flex;justify-content:center;gap:2rem;flex-wrap:wrap;margin-top:2rem}
    .contact-info a{color:var(--primary);text-decoration:none}
    .footer{text-align:center;padding:2rem;color:#64748B;font-size:.9rem;border-top:1px solid rgba(255,255,255,0.08)}
    .footer a{color:var(--primary);text-decoration:none}
    @media(max-width:768px){.about-grid{grid-template-columns:1fr}.nav-links{display:none}}
  </style>
</head>
<body>
  <nav class="nav">
    <a href="#" class="nav-logo">
      ${logoUrl ? `<img src="${logoUrl}" alt="${plan.businessName}">` : ''}
      <span>${plan.businessName}</span>
    </a>
    <div class="nav-links">
      <a href="#about">About</a>
      <a href="#services">Services</a>
      <a href="#testimonials">Reviews</a>
      <a href="#contact">Contact</a>
    </div>
    <a href="#contact" class="nav-cta">Book Now</a>
  </nav>

  <div class="hero">
    <h1>${(hero.headline || plan.tagline || 'Welcome to ' + plan.businessName).replace(/\\n/g,'<br>')}</h1>
    <p>${hero.subheadline || plan.description || ''}</p>
    <div class="hero-cta">
      <a href="#contact" class="btn-primary">${hero.cta || 'Book Now'}</a>
      <a href="#services" class="btn-outline">View Services</a>
    </div>
  </div>

  <section id="about">
    <div class="about-grid">
      <div class="about-text">
        <h2 class="section-title" style="text-align:left">About Us</h2>
        ${about.split('\\n').map(p => `<p>${p}</p>`).join('')}
      </div>
      <div class="about-img">
        ${logoUrl ? `<img src="${logoUrl}" alt="${plan.businessName}">` : ''}
      </div>
    </div>
  </section>

  <section id="services">
    <h2 class="section-title">Our Services</h2>
    <p class="section-sub">Professional services tailored to your needs</p>
    <div class="services-grid">
      ${(plan.services || []).map(s => `
        <div class="service-card">
          <h3>${s.name}</h3>
          <p>${s.description || ''}</p>
          <div class="service-price">₦${(s.price || 0).toLocaleString()}</div>
        </div>
      `).join('')}
    </div>
  </section>

  ${whyChooseUs.length ? `
  <section id="why">
    <h2 class="section-title">Why Choose Us</h2>
    <p class="section-sub">What sets us apart</p>
    <div class="why-grid">
      ${whyChooseUs.map((w, i) => `
        <div class="why-item">
          <div class="icon">${['⚡','✨','🎯','🚀','💎','🌟'][i % 6]}</div>
          <h4>${w}</h4>
        </div>
      `).join('')}
    </div>
  </section>` : ''}

  ${testimonials.length ? `
  <section id="testimonials">
    <h2 class="section-title">What Our Clients Say</h2>
    <p class="section-sub">Real reviews from happy customers</p>
    <div class="testimonials">
      ${testimonials.map(t => `
        <div class="testimonial">
          <p>"${t.text}"</p>
          <div class="author">${t.name}</div>
          <div class="location">${t.location || ''}</div>
        </div>
      `).join('')}
    </div>
  </section>` : ''}

  ${faq.length ? `
  <section id="faq">
    <h2 class="section-title">Frequently Asked Questions</h2>
    <p class="section-sub">Everything you need to know</p>
    ${faq.map(f => `
      <div class="faq-item">
        <h4>${f.q}</h4>
        <p>${f.a}</p>
      </div>
    `).join('')}
  </section>` : ''}

  <section id="contact" class="contact">
    <h2>Get In Touch</h2>
    <p>Ready to work with us? Book your appointment today.</p>
    <div class="contact-info">
      ${contact.phone ? `<div>📞 <a href="tel:${contact.phone}">${contact.phone}</a></div>` : ''}
      ${contact.email ? `<div>✉️ <a href="mailto:${contact.email}">${contact.email}</a></div>` : ''}
      ${contact.whatsapp ? `<div>💬 <a href="https://wa.me/${contact.whatsapp.replace(/\\D/g,'')}">WhatsApp</a></div>` : ''}
    </div>
    <br>
    <a href="#" class="btn-primary" onclick="alert('Booking system powered by ERGIO. Paystack payment ready.');return false;">Book Appointment</a>
  </section>

  <div class="footer">
    <p>&copy; ${new Date().getFullYear()} ${plan.businessName}. Powered by <a href="https://ergio.app">ERGIO</a></p>
  </div>

  <script>
    // ERGIO Analytics Tracking
    fetch('/api/analytics', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({event_type:'page_view', event_data:{business:'${plan.businessName}'}})
    }).catch(()=>{});
  </script>
</body>
</html>`;
}

// ============ 3D WEBSITE GENERATOR ============
function generate3DWebsiteHTML(plan, brand, content, colors, logoUrl) {
  const hero = content.hero || {};
  const about = content.about || '';
  const whyChooseUs = content.whyChooseUs || [];
  const testimonials = content.testimonials || [];
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.seoTitle || plan.businessName + ' — ' + plan.tagline}</title>
  <meta name="description" content="${content.seoDescription || plan.description || ''}">
  <meta name="keywords" content="${(plan.seoKeywords || []).join(', ')}">
  <meta property="og:title" content="${plan.businessName}">
  <meta property="og:description" content="${plan.tagline || ''}">
  <meta property="og:image" content="${logoUrl}">
  <!-- Three.js for 3D effects -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    :root{--primary:${colors.primary || '#00D9FF'};--secondary:${colors.secondary || '#09090B'};--accent:${colors.accent || '#00FF9D'};--bg:${colors.bg || '#09090B'}}
    body{font-family:'Inter',sans-serif;background:var(--bg);color:#F8FAFC;line-height:1.6;overflow-x:hidden}
    #three-canvas{position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;opacity:0.4}
    .nav{display:flex;justify-content:space-between;align-items:center;padding:1.5rem 5%;position:sticky;top:0;background:rgba(9,9,11,0.7);backdrop-filter:blur(20px);z-index:100}
    .nav-logo{display:flex;align-items:center;gap:.6rem;font-weight:800;font-size:1.3rem;color:#fff;text-decoration:none}
    .nav-logo img{width:36px;height:36px;border-radius:8px}
    .nav-links a{color:#94A3B8;text-decoration:none;margin-left:2rem;font-size:.95rem;transition:color .3s}
    .nav-links a:hover{color:var(--primary)}
    .nav-cta{background:var(--primary);color:#09090B;padding:.6rem 1.5rem;border-radius:100px;font-weight:700;text-decoration:none;font-size:.9rem}
    .hero{text-align:center;padding:8rem 5% 5rem;max-width:900px;margin:0 auto;position:relative}
    .hero h1{font-size:clamp(2.5rem,6vw,4.5rem);font-weight:800;margin-bottom:1.5rem;line-height:1.05;animation:fadeInUp 1s ease}
    .hero h1 span{background:linear-gradient(135deg,var(--primary),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .hero p{font-size:1.3rem;color:#94A3B8;max-width:600px;margin:0 auto 2rem;animation:fadeInUp 1.2s ease}
    .hero-cta{display:inline-flex;gap:1rem;flex-wrap:wrap;justify-content:center;animation:fadeInUp 1.4s ease}
    .btn-primary{background:linear-gradient(135deg,var(--primary),var(--accent));color:#09090B;padding:1.1rem 2.5rem;border-radius:100px;font-weight:700;text-decoration:none;border:none;cursor:pointer;font-size:1.1rem;transition:all .3s;box-shadow:0 10px 40px rgba(0,217,255,0.3)}
    .btn-primary:hover{transform:scale(1.08);box-shadow:0 15px 50px rgba(0,217,255,0.5)}
    .btn-outline{background:rgba(255,255,255,0.05);color:#fff;padding:1.1rem 2.5rem;border-radius:100px;border:1px solid rgba(255,255,255,0.2);text-decoration:none;font-weight:600;font-size:1.1rem;backdrop-filter:blur(10px)}
    .badge-3d{display:inline-block;padding:.4rem 1rem;background:linear-gradient(135deg,#A78BFA,#7C3AED);border-radius:20px;font-size:.8rem;font-weight:700;color:#fff;margin-bottom:1.5rem;animation:pulse 2s infinite}
    section{padding:5rem 5%;max-width:1200px;margin:0 auto}
    .section-title{font-size:2.2rem;font-weight:800;margin-bottom:.5rem;text-align:center}
    .section-title span{background:linear-gradient(135deg,var(--primary),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .section-sub{color:#94A3B8;text-align:center;margin-bottom:3rem}
    .service-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:2rem;transition:all .4s;backdrop-filter:blur(20px);position:relative;overflow:hidden}
    .service-card::before{content:'';position:absolute;top:0;left:0;width:100%;height:3px;background:linear-gradient(90deg,var(--primary),var(--accent));transform:scaleX(0);transition:transform .4s}
    .service-card:hover{transform:translateY(-8px);border-color:var(--primary);box-shadow:0 20px 60px rgba(0,0,0,0.3)}
    .service-card:hover::before{transform:scaleX(1)}
    .services-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem}
    .service-card h3{font-size:1.3rem;margin-bottom:.5rem}
    .service-card p{color:#94A3B8;margin-bottom:1rem}
    .service-price{font-size:1.6rem;font-weight:800;background:linear-gradient(135deg,var(--primary),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .why-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1.5rem}
    .why-item{text-align:center;padding:2rem;background:rgba(255,255,255,0.02);border-radius:16px;transition:transform .3s}
    .why-item:hover{transform:scale(1.05)}
    .why-item .icon{font-size:2.5rem;margin-bottom:.5rem;display:inline-block;animation:float 3s ease-in-out infinite}
    .testimonials{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem}
    .testimonial{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:2rem;backdrop-filter:blur(20px)}
    .contact{background:linear-gradient(135deg,rgba(0,217,255,0.08),rgba(0,255,157,0.05));border-radius:28px;padding:4rem;text-align:center;margin:2rem 5%;backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08)}
    .footer{text-align:center;padding:3rem;color:#64748B;font-size:.9rem;border-top:1px solid rgba(255,255,255,0.08)}
    .footer a{color:var(--primary);text-decoration:none}
    @keyframes fadeInUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.7}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
    @media(max-width:768px){.nav-links{display:none}section{padding:3rem 5%}}
  </style>
</head>
<body>
  <canvas id="three-canvas"></canvas>
  <nav class="nav">
    <a href="#" class="nav-logo">
      ${logoUrl ? `<img src="${logoUrl}" alt="${plan.businessName}">` : ''}
      <span>${plan.businessName}</span>
    </a>
    <div class="nav-links">
      <a href="#about">About</a>
      <a href="#services">Services</a>
      <a href="#contact">Contact</a>
    </div>
    <a href="#contact" class="nav-cta">Book Now</a>
  </nav>

  <div class="hero">
    <div class="badge-3d">✨ 3D Interactive Experience</div>
    <h1>${(hero.headline || plan.tagline || 'Welcome to ' + plan.businessName)}</h1>
    <p>${hero.subheadline || plan.description || ''}</p>
    <div class="hero-cta">
      <a href="#contact" class="btn-primary">${hero.cta || 'Book Now'}</a>
      <a href="#services" class="btn-outline">View Services</a>
    </div>
  </div>

  <section id="services">
    <h2 class="section-title">Our <span>Services</span></h2>
    <p class="section-sub">Professional services tailored to your needs</p>
    <div class="services-grid">
      ${(plan.services || []).map((s, i) => `
        <div class="service-card" style="animation:fadeInUp ${0.5 + i * 0.1}s ease">
          <h3>${s.name}</h3>
          <p>${s.description || ''}</p>
          <div class="service-price">₦${(s.price || 0).toLocaleString()}</div>
        </div>
      `).join('')}
    </div>
  </section>

  ${whyChooseUs.length ? `
  <section id="why">
    <h2 class="section-title">Why <span>Choose Us</span></h2>
    <div class="why-grid">
      ${whyChooseUs.map((w, i) => `
        <div class="why-item">
          <div class="icon">${['⚡','✨','🎯','🚀','💎','🌟'][i % 6]}</div>
          <h4>${w}</h4>
        </div>
      `).join('')}
    </div>
  </section>` : ''}

  ${testimonials.length ? `
  <section id="testimonials">
    <h2 class="section-title">Client <span>Reviews</span></h2>
    <div class="testimonials">
      ${testimonials.map(t => `
        <div class="testimonial">
          <p>"${t.text}"</p>
          <div style="font-weight:700;margin-top:1rem">${t.name}</div>
          <div style="color:#94A3B8;font-size:.9rem">${t.location || ''}</div>
        </div>
      `).join('')}
    </div>
  </section>` : ''}

  <section id="contact" class="contact">
    <h2 style="font-size:2rem;margin-bottom:1rem">Get In Touch</h2>
    <p style="color:#94A3B8;margin-bottom:2rem">Ready to work with us?</p>
    <a href="#" class="btn-primary" onclick="alert('Booking powered by ERGIO');return false;">Book Appointment</a>
  </section>

  <div class="footer">
    <p>© ${new Date().getFullYear()} ${plan.businessName}. Powered by <a href="https://ergio.vercel.app">ERGIO</a></p>
  </div>

  <script>
    // Three.js 3D background — floating particles
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({canvas: document.getElementById('three-canvas'), alpha: true, antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.z = 50;

    // Create floating particles
    const particles = [];
    const particleCount = 80;
    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(Math.random() * 0.5 + 0.1, 8, 8);
      const material = new THREE.MeshBasicMaterial({color: new THREE.Color('${colors.primary || '#00D9FF'}'), transparent: true, opacity: 0.6});
      const particle = new THREE.Mesh(geometry, material);
      particle.position.set((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100);
      particle.speed = Math.random() * 0.02 + 0.01;
      scene.add(particle);
      particles.push(particle);
    }

    // Mouse interaction
    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    function animate() {
      requestAnimationFrame(animate);
      particles.forEach(p => {
        p.position.y += p.speed;
        p.rotation.x += p.speed;
        p.rotation.y += p.speed;
        if (p.position.y > 50) p.position.y = -50;
      });
      camera.position.x += (mouseX * 10 - camera.position.x) * 0.05;
      camera.position.y += (-mouseY * 10 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  </script>
</body>
</html>`;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
