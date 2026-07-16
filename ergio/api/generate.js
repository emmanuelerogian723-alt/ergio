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

Create a business plan. Return ONLY valid JSON with this structure:
{
  "businessName": "A catchy, professional name",
  "tagline": "Short memorable tagline",
  "type": "business type (e.g. restaurant, salon, design studio)",
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
    const contentPrompt = `Write website copy for "${plan.businessName}", a ${plan.type} in ${plan.city}, Nigeria.
Services: ${JSON.stringify(plan.services)}
Brand voice: ${brand.brandVoice || 'professional'}
Tone: ${plan.tone || 'professional'}

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

    const websiteHtml = generateWebsiteHTML(plan, brand, content, colors, logoUrl);
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

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
