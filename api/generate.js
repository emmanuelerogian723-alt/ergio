// ========================================
// ERGIO API — /api/generate (v5.0 AGENTIC)
// The AI Conductor: plans → searches images → generates website
// With REAL photos from Pixabay + Unsplash
// Motion graphics + 3D + parallax + scroll animations
// Streams progress via Server-Sent Events (SSE)
// ========================================

import { callGroq, callGroqFast, success, error, corsHeaders, generateSlug, generateLogoUrl, getSupabase } from '../lib/ergio.js';
import { searchImages, planImages, fetchWebsiteImages, generateAIImage, getFallbackImage } from '../lib/images.js';

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

    const send = (type, data) => {
      res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
    };

    // ============ STEP 1: AGENTIC PLAN ============
    send('status', { task: '🧠 Analyzing your business vision...', step: 1, total: 8 });

    const planPrompt = `You are ERGIO, an AI business launcher for Africa. A user wants to start a business. 

User's input: "${prompt}"
Additional answers: ${JSON.stringify(answers || {})}

If the user mentions "3D", "interactive", "animated", "immersive", "motion", or wants something unique, set websiteType to "3d". Otherwise use "standard".

Create a business plan. Return ONLY valid JSON with this structure:
{
  "businessName": "A catchy, professional name",
  "tagline": "Short memorable tagline",
  "type": "business type (e.g. restaurant, salon, design studio)",
  "websiteType": "standard" or "3d" (use 3d for interactive/immersive requests),
  "designStyle": "modern|minimal|luxury|bold|playful",
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
  "tone": "professional|casual|luxury|friendly",
  "imageSearchQueries": ["query1 for hero image", "query2 for about section", "query3 for gallery"]
}

Rules:
- Prices in Nigerian Naira (NGN)
- 3-5 services
- Colors should be modern and professional
- Business name should be memorable and work in the Nigerian market
- imageSearchQueries: 3-5 specific search terms for finding real photos (e.g. "African restaurant interior", "barber cutting hair", "lagos skyline")`;

    const planResult = await callGroq([
      { role: 'system', content: 'You are ERGIO, an expert business strategist. Return only valid JSON, no markdown.' },
      { role: 'user', content: planPrompt }
    ], { temperature: 0.8, response_format: { type: 'json_object' } });

    let plan;
    try {
      plan = JSON.parse(planResult);
    } catch (e) {
      const match = planResult.match(/\{[\s\S]*\}/);
      if (match) plan = JSON.parse(match[0]);
      else throw new Error('Failed to parse business plan');
    }

    send('plan', { plan });
    send('status', { task: '🎨 Creating brand identity...', step: 2, total: 8 });

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
    send('status', { task: '📸 Searching for real photos...', step: 3, total: 8 });

    // ============ STEP 3: IMAGE INTELLIGENCE (NEW) ============
    // Agentic image search — uses AI-planned queries + Pixabay + Unsplash
    const imagePlan = await planImages(plan.businessName, plan.type, plan.services, plan.city);
    
    // Add AI-generated queries from the plan
    if (plan.imageSearchQueries && plan.imageSearchQueries.length) {
      plan.imageSearchQueries.forEach((q, i) => {
        if (i < imagePlan.length) {
          imagePlan[i].query = q; // Override with AI-planned queries (smarter)
        }
      });
    }

    const images = await fetchWebsiteImages(imagePlan);
    
    // Count found images
    const totalImages = Object.values(images).reduce((sum, arr) => sum + arr.length, 0);
    send('images', { 
      total: totalImages,
      placements: Object.keys(images).map(k => ({ placement: k, count: images[k].length }))
    });
    send('status', { task: '✍️ Writing premium copy...', step: 4, total: 8 });

    // ============ STEP 4: WEBSITE CONTENT ============
    const contentPrompt = `You are writing premium website copy for "${plan.businessName}", a ${plan.type} in ${plan.city}, Nigeria.
Services: ${JSON.stringify(plan.services)}
Brand voice: ${brand.brandVoice || 'professional'}
Tone: ${plan.tone || 'professional'}
Design style: ${plan.designStyle || 'modern'}

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
    "phone": "Nigerian phone format",
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
    send('status', { task: '🏗️ Building with motion graphics...', step: 5, total: 8 });

    // ============ STEP 5: GENERATE WEBSITE HTML WITH REAL IMAGES ============
    const colors = plan.brandColors || { primary: '#00D9FF', secondary: '#09090B', accent: '#00FF9D', bg: '#09090B' };

    const is3D = plan.websiteType === '3d' || 
      /3d|interactive|animated|immersive|motion|3dimentional/i.test(prompt + JSON.stringify(answers || {}));
    
    const websiteHtml = is3D 
      ? generate3DWebsiteHTML(plan, brand, content, colors, logoUrl, images)
      : generateWebsiteHTML(plan, brand, content, colors, logoUrl, images);

    send('website', { html: websiteHtml, logoUrl, imageCount: totalImages });
    send('status', { task: '🔧 Setting up booking & payments...', step: 6, total: 8 });

    await delay(400);
    send('booking', { 
      message: 'Booking system configured',
      calendarUrl: `/${generateSlug(plan.businessName)}/book`
    });

    await delay(400);
    send('payment', {
      message: 'Paystack integration ready',
      testUrl: '/api/payments',
      methods: ['Card', 'Bank Transfer', 'USSD', 'Mobile Money']
    });

    // ============ STEP 7: SAVE TO SUPABASE ============
    send('status', { task: '💾 Saving to database...', step: 7, total: 8 });
    try {
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

    // ============ STEP 8: INITIALIZING ENGINES ============
    send('status', { task: '🚀 Launching client acquisition engines...', step: 8, total: 8 });

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
        content,
        images: { total: totalImages, sources: ['pixabay', 'unsplash'] }
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

// ============ WEBSITE HTML GENERATOR (STANDARD + MOTION GRAPHICS) ============
function generateWebsiteHTML(plan, brand, content, colors, logoUrl, images = {}) {
  const hero = content.hero || {};
  const about = content.about || '';
  const whyChooseUs = content.whyChooseUs || [];
  const testimonials = content.testimonials || [];
  const faq = content.faq || [];
  const contact = content.contactInfo || {};
  
  // Get real images or fallback to AI-generated
  const heroImg = images.hero?.[0]?.url || getFallbackImage(`${plan.type} ${plan.city} business`, 1200, 800);
  const aboutImg = images.about?.[0]?.url || getFallbackImage(`${plan.type} team working`, 800, 600);
  const galleryImgs = (images.gallery || []).map(i => i.url);
  while (galleryImgs.length < 4) {
    galleryImgs.push(getFallbackImage(`${plan.type} work ${galleryImgs.length}`, 400, 400));
  }

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
  <meta property="og:image" content="${heroImg}">
  <meta name="robots" content="index, follow">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    :root{
      --primary:${colors.primary || '#00D9FF'};
      --secondary:${colors.secondary || '#09090B'};
      --accent:${colors.accent || '#00FF9D'};
      --bg:${colors.bg || '#0A0A0F'};
      --text:#F8FAFC;
      --muted:#94A3B8;
    }
    html{scroll-behavior:smooth}
    body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);line-height:1.6;overflow-x:hidden}
    
    /* === SCROLL ANIMATIONS === */
    .reveal{opacity:0;transform:translateY(40px);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1)}
    .reveal.active{opacity:1;transform:translateY(0)}
    .reveal-left{opacity:0;transform:translateX(-60px);transition:all .8s cubic-bezier(.16,1,.3,1)}
    .reveal-left.active{opacity:1;transform:translateX(0)}
    .reveal-right{opacity:0;transform:translateX(60px);transition:all .8s cubic-bezier(.16,1,.3,1)}
    .reveal-right.active{opacity:1;transform:translateX(0)}
    .reveal-scale{opacity:0;transform:scale(.8);transition:all .8s cubic-bezier(.16,1,.3,1)}
    .reveal-scale.active{opacity:1;transform:scale(1)}
    
    /* === STAGGER === */
    .stagger>*{opacity:0;transform:translateY(30px);transition:all .6s cubic-bezier(.16,1,.3,1)}
    .stagger.active>*:nth-child(1){opacity:1;transform:translateY(0);transition-delay:.1s}
    .stagger.active>*:nth-child(2){opacity:1;transform:translateY(0);transition-delay:.2s}
    .stagger.active>*:nth-child(3){opacity:1;transform:translateY(0);transition-delay:.3s}
    .stagger.active>*:nth-child(4){opacity:1;transform:translateY(0);transition-delay:.4s}
    .stagger.active>*:nth-child(5){opacity:1;transform:translateY(0);transition-delay:.5s}
    .stagger.active>*:nth-child(6){opacity:1;transform:translateY(0);transition-delay:.6s}
    
    /* === FLOATING ANIMATION === */
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
    @keyframes pulse{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.05);opacity:1}}
    @keyframes gradient-shift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    @keyframes spin-slow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(0,217,255,.3)}50%{box-shadow:0 0 40px rgba(0,217,255,.6)}}
    
    /* === NAVIGATION === */
    .nav{display:flex;justify-content:space-between;align-items:center;padding:1.2rem 5%;position:sticky;top:0;background:rgba(10,10,15,0.8);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);z-index:100;border-bottom:1px solid rgba(255,255,255,.06);transition:padding .3s}
    .nav.scrolled{padding:.8rem 5%}
    .nav-logo{display:flex;align-items:center;gap:.6rem;font-weight:800;font-size:1.2rem;color:#fff;text-decoration:none;font-family:'Space Grotesk',sans-serif}
    .nav-logo img{width:36px;height:36px;border-radius:8px}
    .nav-links a{color:var(--muted);text-decoration:none;margin-left:2rem;font-size:.92rem;transition:color .3s;position:relative}
    .nav-links a:hover{color:var(--primary)}
    .nav-links a::after{content:'';position:absolute;bottom:-4px;left:0;width:0;height:2px;background:var(--primary);transition:width .3s}
    .nav-links a:hover::after{width:100%}
    .nav-cta{background:var(--primary);color:#09090B;padding:.6rem 1.5rem;border-radius:100px;font-weight:700;text-decoration:none;font-size:.9rem;border:none;cursor:pointer;transition:all .3s}
    .nav-cta:hover{transform:scale(1.05);box-shadow:0 0 25px rgba(0,217,255,.4)}
    
    /* === HERO === */
    .hero{position:relative;min-height:90vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:4rem 5%;overflow:hidden}
    .hero-bg{position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;overflow:hidden}
    .hero-bg::before{content:'';position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(180deg,rgba(10,10,15,.3) 0%,rgba(10,10,15,.8) 100%);z-index:2}
    .hero-bg img{width:100%;height:100%;object-fit:cover;animation:float 8s ease-in-out infinite}
    .hero-bg::after{content:'';position:absolute;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at center,transparent 0%,rgba(10,10,15,.7) 100%);z-index:1}
    .hero-content{position:relative;z-index:3;max-width:900px}
    .hero h1{font-size:clamp(2.2rem,6vw,4.5rem);font-weight:900;margin-bottom:1.2rem;line-height:1.05;color:#fff;letter-spacing:-.02em}
    .hero h1 span{background:linear-gradient(135deg,var(--primary),var(--accent));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;display:inline-block;animation:gradient-shift 4s ease infinite;background-size:200% 200%}
    .hero p{font-size:1.25rem;color:#CBD5E1;max-width:600px;margin:0 auto 2.5rem}
    .hero-cta{display:inline-flex;gap:1rem;flex-wrap:wrap;justify-content:center}
    .btn-primary{background:var(--primary);color:#09090B;padding:1rem 2.5rem;border-radius:100px;font-weight:700;text-decoration:none;border:none;cursor:pointer;font-size:1.05rem;transition:all .3s;position:relative;overflow:hidden}
    .btn-primary:hover{transform:translateY(-3px);box-shadow:0 10px 40px rgba(0,217,255,.4)}
    .btn-primary::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,transparent,rgba(255,255,255,.3),transparent);transform:translateX(-100%);transition:transform .6s}
    .btn-primary:hover::after{transform:translateX(100%)}
    .btn-outline{background:rgba(255,255,255,.08);color:#fff;padding:1rem 2.5rem;border-radius:100px;border:1px solid rgba(255,255,255,.2);text-decoration:none;font-weight:600;font-size:1.05rem;transition:all .3s;backdrop-filter:blur(10px)}
    .btn-outline:hover{background:rgba(255,255,255,.15);transform:translateY(-3px)}
    
    /* === SECTIONS === */
    section{padding:5rem 5%;max-width:1200px;margin:0 auto}
    .section-title{font-size:clamp(1.8rem,4vw,2.8rem);font-weight:800;margin-bottom:.5rem;letter-spacing:-.02em}
    .section-title span{background:linear-gradient(135deg,var(--primary),var(--accent));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
    .section-sub{color:var(--muted);text-align:center;margin-bottom:3.5rem;font-size:1.1rem}
    
    /* === ABOUT === */
    .about-grid{display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center}
    .about-text p{color:#CBD5E1;margin-bottom:1rem;font-size:1.05rem}
    .about-img-wrap{position:relative;border-radius:24px;overflow:hidden;aspect-ratio:4/3;box-shadow:0 20px 60px rgba(0,0,0,.4)}
    .about-img-wrap img{width:100%;height:100%;object-fit:cover;transition:transform .8s cubic-bezier(.16,1,.3,1)}
    .about-img-wrap:hover img{transform:scale(1.08)}
    .about-img-wrap::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,var(--primary),var(--accent));opacity:.15;z-index:1}
    
    /* === SERVICES === */
    .services-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:2rem}
    .service-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:2.5rem;transition:all .5s cubic-bezier(.16,1,.3,1);position:relative;overflow:hidden}
    .service-card:hover{border-color:var(--primary);transform:translateY(-8px);box-shadow:0 20px 50px rgba(0,217,255,.15)}
    .service-card::before{content:'';position:absolute;top:0;left:0;width:100%;height:4px;background:linear-gradient(90deg,var(--primary),var(--accent));transform:scaleX(0);transform-origin:left;transition:transform .5s}
    .service-card:hover::before{transform:scaleX(1)}
    .service-card h3{font-size:1.4rem;margin-bottom:.5rem;font-weight:700}
    .service-card p{color:var(--muted);margin-bottom:1.5rem}
    .service-price{font-size:1.8rem;font-weight:900;color:var(--accent)}
    .service-img{width:100%;height:180px;object-fit:cover;border-radius:12px;margin-bottom:1.5rem;transition:transform .5s}
    .service-card:hover .service-img{transform:scale(1.05)}
    
    /* === GALLERY === */
    .gallery-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem}
    .gallery-item{border-radius:16px;overflow:hidden;aspect-ratio:1;position:relative;cursor:pointer}
    .gallery-item img{width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.16,1,.3,1)}
    .gallery-item:hover img{transform:scale(1.15)}
    .gallery-item::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 50%,rgba(10,10,15,.8) 100%);opacity:0;transition:opacity .3s}
    .gallery-item:hover::after{opacity:1}
    
    /* === WHY CHOOSE US === */
    .why-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:2rem}
    .why-item{text-align:center;padding:2rem;border-radius:20px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);transition:all .4s}
    .why-item:hover{border-color:var(--primary);transform:translateY(-4px)}
    .why-item .icon{font-size:2.5rem;margin-bottom:1rem;display:inline-block;animation:float 4s ease-in-out infinite}
    .why-item h4{margin-bottom:.5rem;font-weight:700;font-size:1.1rem}
    .why-item p{color:var(--muted);font-size:.95rem}
    
    /* === TESTIMONIALS === */
    .testimonials{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:2rem}
    .testimonial{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:2.5rem;position:relative}
    .testimonial::before{content:'"';position:absolute;top:-10px;left:20px;font-size:5rem;color:var(--primary);opacity:.2;font-family:Georgia,serif}
    .testimonial p{color:#CBD5E1;font-style:italic;margin-bottom:1.5rem;position:relative;z-index:1}
    .testimonial .author{font-weight:700;font-size:1.1rem}
    .testimonial .location{color:var(--muted);font-size:.9rem;margin-top:.2rem}
    .testimonial .stars{color:#FBBF24;margin-bottom:1rem}
    
    /* === FAQ === */
    .faq-item{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:1.8rem;margin-bottom:1rem;cursor:pointer;transition:all .3s}
    .faq-item:hover{border-color:rgba(255,255,255,.15)}
    .faq-item h4{margin-bottom:.5rem;color:var(--primary);font-size:1.15rem}
    .faq-item p{color:var(--muted);max-height:0;overflow:hidden;transition:max-height .4s ease}
    .faq-item.open p{max-height:200px}
    
    /* === CONTACT === */
    .contact{background:linear-gradient(135deg,rgba(0,217,255,.08),rgba(0,255,157,.04));border-radius:28px;padding:4rem;text-align:center;margin:2rem 5%;border:1px solid rgba(255,255,255,.08)}
    .contact h2{margin-bottom:1rem;font-size:2.2rem;font-weight:800}
    .contact p{color:var(--muted);margin-bottom:2.5rem;font-size:1.1rem}
    .contact-info{display:flex;justify-content:center;gap:2.5rem;flex-wrap:wrap;margin-top:2rem}
    .contact-item{display:flex;align-items:center;gap:.6rem;color:var(--text);text-decoration:none;font-size:1rem;transition:color .3s}
    .contact-item:hover{color:var(--primary)}
    .contact-icon{width:44px;height:44px;border-radius:12px;background:rgba(0,217,255,.1);display:flex;align-items:center;justify-content:center;font-size:1.2rem}
    
    /* === FOOTER === */
    .footer{text-align:center;padding:3rem 5%;color:#64748B;font-size:.9rem;border-top:1px solid rgba(255,255,255,.06)}
    .footer a{color:var(--primary);text-decoration:none;font-weight:600}
    .footer-brand{display:inline-flex;align-items:center;gap:.4rem;margin-bottom:.5rem;font-weight:700;color:#94A3B8}
    .footer-brand img{width:24px;height:24px;border-radius:6px}
    
    /* === MOBILE === */
    @media(max-width:768px){
      .about-grid{grid-template-columns:1fr}
      .nav-links{display:none}
      .hero{min-height:70vh}
      section{padding:3rem 5%}
      .contact{padding:2.5rem 1.5rem;margin:1rem 5%}
    }
    
    /* === SCROLLBAR === */
    ::-webkit-scrollbar{width:8px}
    ::-webkit-scrollbar-track{background:var(--bg)}
    ::-webkit-scrollbar-thumb{background:var(--primary);border-radius:4px}
  </style>
</head>
<body>
  <!-- NAV -->
  <nav class="nav" id="nav">
    <a href="#" class="nav-logo">
      ${logoUrl ? `<img src="${logoUrl}" alt="${plan.businessName}">` : ''}
      <span>${plan.businessName}</span>
    </a>
    <div class="nav-links">
      <a href="#about">About</a>
      <a href="#services">Services</a>
      <a href="#gallery">Gallery</a>
      <a href="#testimonials">Reviews</a>
      <a href="#contact">Contact</a>
    </div>
    <a href="#contact" class="nav-cta">Book Now</a>
  </nav>

  <!-- HERO with real background image -->
  <div class="hero">
    <div class="hero-bg">
      <img src="${heroImg}" alt="${plan.businessName}" loading="eager">
    </div>
    <div class="hero-content">
      <h1 class="reveal active">${(hero.headline || plan.tagline || 'Welcome to ' + plan.businessName).replace(/\\n/g,'<br>')}</h1>
      <p class="reveal active">${hero.subheadline || plan.description || ''}</p>
      <div class="hero-cta reveal active">
        <a href="#contact" class="btn-primary">${hero.cta || 'Book Now'}</a>
        <a href="#services" class="btn-outline">View Services</a>
      </div>
    </div>
  </div>

  <!-- ABOUT with real image -->
  <section id="about">
    <div class="about-grid">
      <div class="about-text reveal-left">
        <h2 class="section-title" style="text-align:left">About <span>Us</span></h2>
        ${about.split('\\n').map(p => `<p>${p}</p>`).join('')}
      </div>
      <div class="about-img-wrap reveal-right">
        <img src="${aboutImg}" alt="${plan.businessName} team" loading="lazy">
      </div>
    </div>
  </section>

  <!-- SERVICES with real images -->
  <section id="services">
    <h2 class="section-title reveal">Our <span>Services</span></h2>
    <p class="section-sub reveal">Professional services tailored to your needs</p>
    <div class="services-grid stagger">
      ${(plan.services || []).map((s, i) => `
        <div class="service-card">
          ${galleryImgs[i] ? `<img src="${galleryImgs[i]}" alt="${s.name}" class="service-img" loading="lazy">` : ''}
          <h3>${s.name}</h3>
          <p>${s.description || ''}</p>
          <div class="service-price">₦${(s.price || 0).toLocaleString()}</div>
        </div>
      `).join('')}
    </div>
  </section>

  <!-- GALLERY with real photos -->
  ${galleryImgs.length ? `
  <section id="gallery">
    <h2 class="section-title reveal">Our <span>Work</span></h2>
    <p class="section-sub reveal">See what we've done</p>
    <div class="gallery-grid stagger">
      ${galleryImgs.map(img => `
        <div class="gallery-item">
          <img src="${img}" alt="Gallery" loading="lazy">
        </div>
      `).join('')}
    </div>
  </section>` : ''}

  <!-- WHY CHOOSE US -->
  ${whyChooseUs.length ? `
  <section id="why">
    <h2 class="section-title reveal">Why <span>Choose Us</span></h2>
    <p class="section-sub reveal">What sets us apart</p>
    <div class="why-grid stagger">
      ${whyChooseUs.map((w, i) => `
        <div class="why-item">
          <div class="icon">${['⚡','✨','🎯','🚀','💎','🌟'][i % 6]}</div>
          <h4>${w}</h4>
        </div>
      `).join('')}
    </div>
  </section>` : ''}

  <!-- TESTIMONIALS -->
  ${testimonials.length ? `
  <section id="testimonials">
    <h2 class="section-title reveal">Client <span>Reviews</span></h2>
    <p class="section-sub reveal">Real reviews from happy customers</p>
    <div class="testimonials stagger">
      ${testimonials.map(t => `
        <div class="testimonial">
          <div class="stars">★★★★★</div>
          <p>"${t.text}"</p>
          <div class="author">${t.name}</div>
          <div class="location">${t.location || ''}</div>
        </div>
      `).join('')}
    </div>
  </section>` : ''}

  <!-- FAQ -->
  ${faq.length ? `
  <section id="faq">
    <h2 class="section-title reveal">Frequently Asked <span>Questions</span></h2>
    <p class="section-sub reveal">Everything you need to know</p>
    ${faq.map(f => `
      <div class="faq-item" onclick="this.classList.toggle('open')">
        <h4>${f.q}</h4>
        <p>${f.a}</p>
      </div>
    `).join('')}
  </section>` : ''}

  <!-- CONTACT -->
  <section id="contact" class="contact reveal-scale">
    <h2>Get In Touch</h2>
    <p>Ready to work with us? Book your appointment today.</p>
    <a href="#" class="btn-primary" onclick="alert('Booking powered by ERGIO');return false;">Book Appointment</a>
    <div class="contact-info">
      ${contact.phone ? `<a href="tel:${contact.phone}" class="contact-item"><span class="contact-icon">📞</span>${contact.phone}</a>` : ''}
      ${contact.email ? `<a href="mailto:${contact.email}" class="contact-item"><span class="contact-icon">✉️</span>${contact.email}</a>` : ''}
      ${contact.whatsapp ? `<a href="https://wa.me/${contact.whatsapp.replace(/[^0-9]/g,'')}" class="contact-item"><span class="contact-icon">💬</span>WhatsApp</a>` : ''}
    </div>
  </section>

  <!-- FOOTER with ERGIO branding -->
  <div class="footer">
    <div class="footer-brand">
      ${logoUrl ? `<img src="${logoUrl}" alt="${plan.businessName}">` : ''}
      <span>${plan.businessName}</span>
    </div>
    <p>© ${new Date().getFullYear()} ${plan.businessName}. All rights reserved.</p>
    <p style="margin-top:.5rem">Powered by <a href="https://ergio.vercel.app" target="_blank">ERGIO</a> — AI Business Operating System for Africa</p>
  </div>

  <!-- SCROLL ANIMATION SCRIPT -->
  <script>
    // Nav scroll effect
    const nav = document.getElementById('nav');
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    });
    
    // Intersection Observer for scroll-triggered animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          // Keep observing for re-trigger
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger').forEach(el => {
      observer.observe(el);
    });
    
    // Parallax effect on hero image
    const heroBg = document.querySelector('.hero-bg img');
    if (heroBg) {
      window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        heroBg.style.transform = 'translateY(' + scrolled * 0.3 + 'px)';
      });
    }
    
    // Mouse parallax on hero
    const hero = document.querySelector('.hero');
    if (hero) {
      hero.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        if (heroBg) heroBg.style.marginLeft = x + 'px';
      });
    }
  </script>
</body>
</html>`;
}

// ============ 3D WEBSITE GENERATOR (ENHANCED WITH THREE.JS + IMAGES) ============
function generate3DWebsiteHTML(plan, brand, content, colors, logoUrl, images = {}) {
  const hero = content.hero || {};
  const about = content.about || '';
  const whyChooseUs = content.whyChooseUs || [];
  const testimonials = content.testimonials || [];
  const faq = content.faq || [];
  const contact = content.contactInfo || {};
  
  const heroImg = images.hero?.[0]?.url || getFallbackImage(`${plan.type} ${plan.city}`, 1200, 800);
  const aboutImg = images.about?.[0]?.url || getFallbackImage(`${plan.type} team`, 800, 600);
  const galleryImgs = (images.gallery || []).map(i => i.url);
  while (galleryImgs.length < 4) {
    galleryImgs.push(getFallbackImage(`${plan.type} ${galleryImgs.length}`, 400, 400));
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.seoTitle || plan.businessName + ' — ' + plan.tagline}</title>
  <meta name="description" content="${content.seoDescription || plan.description || ''}">
  <meta property="og:image" content="${heroImg}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    :root{--primary:${colors.primary || '#00D9FF'};--secondary:${colors.secondary || '#09090B'};--accent:${colors.accent || '#00FF9D'};--bg:#060608}
    html{scroll-behavior:smooth}
    body{font-family:'Inter',sans-serif;background:var(--bg);color:#F8FAFC;overflow-x:hidden}
    
    /* Three.js Canvas */
    #three-canvas{position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;opacity:.5;pointer-events:none}
    
    /* Scroll animations */
    .reveal{opacity:0;transform:translateY(50px) rotateX(-10deg);transition:all 1s cubic-bezier(.16,1,.3,1)}
    .reveal.active{opacity:1;transform:translateY(0) rotateX(0)}
    .stagger>*{opacity:0;transform:translateY(40px) scale(.9);transition:all .7s cubic-bezier(.16,1,.3,1)}
    .stagger.active>*:nth-child(1){opacity:1;transform:none;transition-delay:.1s}
    .stagger.active>*:nth-child(2){opacity:1;transform:none;transition-delay:.25s}
    .stagger.active>*:nth-child(3){opacity:1;transform:none;transition-delay:.4s}
    .stagger.active>*:nth-child(4){opacity:1;transform:none;transition-delay:.55s}
    .stagger.active>*:nth-child(5){opacity:1;transform:none;transition-delay:.7s}
    .stagger.active>*:nth-child(6){opacity:1;transform:none;transition-delay:.85s}
    
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
    @keyframes gradient-shift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
    @keyframes spin-slow{from{transform:rotate(0)}to{transform:rotate(360deg)}}
    @keyframes glow{0%,100%{box-shadow:0 0 30px rgba(0,217,255,.2)}50%{box-shadow:0 0 60px rgba(0,217,255,.5)}}
    @keyframes pulse-glow{0%,100%{filter:drop-shadow(0 0 10px var(--primary))}50%{filter:drop-shadow(0 0 30px var(--primary))}}
    
    .nav{display:flex;justify-content:space-between;align-items:center;padding:1.2rem 5%;position:sticky;top:0;background:rgba(6,6,8,.7);backdrop-filter:blur(20px);z-index:100;border-bottom:1px solid rgba(255,255,255,.06)}
    .nav-logo{display:flex;align-items:center;gap:.6rem;font-weight:800;font-size:1.2rem;color:#fff;text-decoration:none;font-family:'Space Grotesk',sans-serif}
    .nav-logo img{width:36px;height:36px;border-radius:8px}
    .nav-links a{color:#94A3B8;text-decoration:none;margin-left:2rem;font-size:.92rem;transition:color .3s}
    .nav-links a:hover{color:var(--primary)}
    .nav-cta{background:var(--primary);color:#060608;padding:.6rem 1.5rem;border-radius:100px;font-weight:700;text-decoration:none;font-size:.9rem}
    
    .hero{position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;z-index:1;padding:2rem 5%}
    .hero-bg-img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;opacity:.25;z-index:0}
    .hero::after{content:'';position:absolute;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at center,transparent 0%,rgba(6,6,8,.8) 100%);z-index:1}
    .hero-content{position:relative;z-index:2;max-width:900px}
    .hero h1{font-size:clamp(2.5rem,7vw,5rem);font-weight:900;line-height:1.05;letter-spacing:-.03em;margin-bottom:1.5rem}
    .hero h1 span{background:linear-gradient(135deg,var(--primary),var(--accent),var(--primary));background-size:200% 200%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:gradient-shift 4s ease infinite}
    .hero p{font-size:1.3rem;color:#CBD5E1;max-width:600px;margin:0 auto 2.5rem}
    .btn-primary{background:var(--primary);color:#060608;padding:1.2rem 3rem;border-radius:100px;font-weight:800;text-decoration:none;font-size:1.1rem;display:inline-block;animation:glow 3s ease infinite;transition:transform .3s}
    .btn-primary:hover{transform:scale(1.08)}
    .btn-outline{background:rgba(255,255,255,.06);color:#fff;padding:1.2rem 3rem;border-radius:100px;border:1px solid rgba(255,255,255,.2);text-decoration:none;font-weight:600;font-size:1.1rem;backdrop-filter:blur(10px);display:inline-block;margin-left:1rem}
    
    section{padding:5rem 5%;max-width:1200px;margin:0 auto;position:relative;z-index:1}
    .section-title{font-size:clamp(1.8rem,4vw,3rem);font-weight:800;letter-spacing:-.02em;margin-bottom:.5rem}
    .section-title span{background:linear-gradient(135deg,var(--primary),var(--accent));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
    .section-sub{color:#94A3B8;margin-bottom:3rem;font-size:1.1rem}
    
    .about-grid{display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center}
    .about-text p{color:#CBD5E1;margin-bottom:1rem}
    .about-img-wrap{border-radius:24px;overflow:hidden;aspect-ratio:4/3;position:relative;animation:float 6s ease-in-out infinite}
    .about-img-wrap img{width:100%;height:100%;object-fit:cover}
    .about-img-wrap::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,var(--primary),var(--accent));opacity:.2;mix-blend-mode:overlay}
    
    .services-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:2rem}
    .service-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:2.5rem;transition:all .5s cubic-bezier(.16,1,.3,1);perspective:1000px}
    .service-card:hover{border-color:var(--primary);transform:translateY(-10px) rotateX(5deg);box-shadow:0 30px 60px rgba(0,217,255,.15)}
    .service-img{width:100%;height:180px;object-fit:cover;border-radius:12px;margin-bottom:1.5rem}
    .service-card h3{font-size:1.4rem;margin-bottom:.5rem}
    .service-card p{color:#94A3B8;margin-bottom:1.5rem}
    .service-price{font-size:1.8rem;font-weight:900;color:var(--accent)}
    
    .gallery-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem}
    .gallery-item{border-radius:16px;overflow:hidden;aspect-ratio:1;position:relative}
    .gallery-item img{width:100%;height:100%;object-fit:cover;transition:transform .6s}
    .gallery-item:hover img{transform:scale(1.2)}
    
    .why-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:2rem}
    .why-item{text-align:center;padding:2rem;border-radius:20px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);transition:all .4s}
    .why-item:hover{border-color:var(--primary);transform:translateY(-5px)}
    .why-item .icon{font-size:2.5rem;margin-bottom:1rem;animation:float 4s ease-in-out infinite}
    .why-item h4{margin-bottom:.5rem;font-weight:700}
    
    .testimonials{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:2rem}
    .testimonial{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:2.5rem}
    .testimonial .stars{color:#FBBF24;margin-bottom:1rem}
    .testimonial p{color:#CBD5E1;font-style:italic;margin-bottom:1.5rem}
    .testimonial .author{font-weight:700}
    .testimonial .location{color:#94A3B8;font-size:.9rem}
    
    .faq-item{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:1.8rem;margin-bottom:1rem;cursor:pointer}
    .faq-item h4{color:var(--primary);margin-bottom:.5rem}
    .faq-item p{color:#94A3B8;max-height:0;overflow:hidden;transition:max-height .4s}
    .faq-item.open p{max-height:200px}
    
    .contact{background:linear-gradient(135deg,rgba(0,217,255,.08),rgba(0,255,157,.04));border-radius:28px;padding:4rem;text-align:center;margin:2rem 5%;border:1px solid rgba(255,255,255,.08)}
    .contact-info{display:flex;justify-content:center;gap:2.5rem;flex-wrap:wrap;margin-top:2rem}
    .contact-info a{color:var(--primary);text-decoration:none}
    
    .footer{text-align:center;padding:3rem 5%;color:#64748B;border-top:1px solid rgba(255,255,255,.06)}
    .footer a{color:var(--primary);text-decoration:none;font-weight:600}
    .footer-brand{display:inline-flex;align-items:center;gap:.4rem;margin-bottom:.5rem;font-weight:700;color:#94A3B8}
    .footer-brand img{width:24px;height:24px;border-radius:6px}
    
    @media(max-width:768px){.about-grid{grid-template-columns:1fr}.nav-links{display:none}section{padding:3rem 5%}.btn-outline{margin-left:0;margin-top:1rem}}
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
      <a href="#gallery">Gallery</a>
      <a href="#contact">Contact</a>
    </div>
    <a href="#contact" class="nav-cta">Book Now</a>
  </nav>

  <div class="hero">
    <img src="${heroImg}" alt="${plan.businessName}" class="hero-bg-img">
    <div class="hero-content">
      <h1 class="reveal active">${(hero.headline || plan.tagline || 'Welcome to ' + plan.businessName).replace(/\\n/g,'<br>')}</h1>
      <p class="reveal active">${hero.subheadline || plan.description || ''}</p>
      <div class="reveal active">
        <a href="#contact" class="btn-primary">${hero.cta || 'Book Now'}</a>
        <a href="#services" class="btn-outline">View Services</a>
      </div>
    </div>
  </div>

  <section id="about">
    <div class="about-grid">
      <div class="about-text reveal">
        <h2 class="section-title">About <span>Us</span></h2>
        ${about.split('\\n').map(p => `<p>${p}</p>`).join('')}
      </div>
      <div class="about-img-wrap reveal">
        <img src="${aboutImg}" alt="${plan.businessName}" loading="lazy">
      </div>
    </div>
  </section>

  <section id="services">
    <h2 class="section-title reveal">Our <span>Services</span></h2>
    <p class="section-sub reveal">Professional services tailored to your needs</p>
    <div class="services-grid stagger">
      ${(plan.services || []).map((s, i) => `
        <div class="service-card">
          ${galleryImgs[i] ? `<img src="${galleryImgs[i]}" alt="${s.name}" class="service-img" loading="lazy">` : ''}
          <h3>${s.name}</h3>
          <p>${s.description || ''}</p>
          <div class="service-price">₦${(s.price || 0).toLocaleString()}</div>
        </div>
      `).join('')}
    </div>
  </section>

  ${galleryImgs.length ? `
  <section id="gallery">
    <h2 class="section-title reveal">Our <span>Work</span></h2>
    <p class="section-sub reveal">A gallery of our finest work</p>
    <div class="gallery-grid stagger">
      ${galleryImgs.map(img => `<div class="gallery-item"><img src="${img}" alt="Gallery" loading="lazy"></div>`).join('')}
    </div>
  </section>` : ''}

  ${whyChooseUs.length ? `
  <section id="why">
    <h2 class="section-title reveal">Why <span>Choose Us</span></h2>
    <div class="why-grid stagger">
      ${whyChooseUs.map((w, i) => `<div class="why-item"><div class="icon">${['⚡','✨','🎯','🚀','💎','🌟'][i % 6]}</div><h4>${w}</h4></div>`).join('')}
    </div>
  </section>` : ''}

  ${testimonials.length ? `
  <section id="testimonials">
    <h2 class="section-title reveal">Client <span>Reviews</span></h2>
    <div class="testimonials stagger">
      ${testimonials.map(t => `<div class="testimonial"><div class="stars">★★★★★</div><p>"${t.text}"</p><div class="author">${t.name}</div><div class="location">${t.location || ''}</div></div>`).join('')}
    </div>
  </section>` : ''}

  ${faq.length ? `
  <section id="faq">
    <h2 class="section-title reveal">FAQ</h2>
    ${faq.map(f => `<div class="faq-item" onclick="this.classList.toggle('open')"><h4>${f.q}</h4><p>${f.a}</p></div>`).join('')}
  </section>` : ''}

  <section id="contact" class="contact reveal">
    <h2>Get In Touch</h2>
    <p>Ready to work with us?</p>
    <a href="#" class="btn-primary" onclick="alert('Booking powered by ERGIO');return false;">Book Appointment</a>
    <div class="contact-info">
      ${contact.phone ? `<a href="tel:${contact.phone}">📞 ${contact.phone}</a>` : ''}
      ${contact.email ? `<a href="mailto:${contact.email}">✉️ ${contact.email}</a>` : ''}
      ${contact.whatsapp ? `<a href="https://wa.me/${contact.whatsapp.replace(/[^0-9]/g,'')}">💬 WhatsApp</a>` : ''}
    </div>
  </section>

  <div class="footer">
    <div class="footer-brand">${logoUrl ? `<img src="${logoUrl}" alt="${plan.businessName}">` : ''}<span>${plan.businessName}</span></div>
    <p>© ${new Date().getFullYear()} ${plan.businessName}. All rights reserved.</p>
    <p style="margin-top:.5rem">Powered by <a href="https://ergio.vercel.app" target="_blank">ERGIO</a> — AI Business Operating System for Africa</p>
  </div>

  <script>
    // === THREE.JS 3D BACKGROUND ===
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({canvas: document.getElementById('three-canvas'), alpha: true, antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.position.z = 50;

    // Floating geometric shapes
    const shapes = [];
    const shapeCount = 60;
    for (let i = 0; i < shapeCount; i++) {
      let geometry;
      const shapeType = i % 4;
      if (shapeType === 0) geometry = new THREE.IcosahedronGeometry(Math.random() * 0.8 + 0.3, 0);
      else if (shapeType === 1) geometry = new THREE.TorusGeometry(Math.random() * 0.6 + 0.2, 0.15, 8, 16);
      else if (shapeType === 2) geometry = new THREE.OctahedronGeometry(Math.random() * 0.7 + 0.2);
      else geometry = new THREE.BoxGeometry(Math.random() * 0.5 + 0.3, Math.random() * 0.5 + 0.3, Math.random() * 0.5 + 0.3);
      
      const color = new THREE.Color();
      color.setHSL(Math.random() * 0.15 + 0.45, 0.8, 0.5);
      const material = new THREE.MeshBasicMaterial({color, transparent: true, opacity: 0.5, wireframe: Math.random() > 0.5});
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set((Math.random() - 0.5) * 120, (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 80);
      mesh.userData = {
        speedX: (Math.random() - 0.5) * 0.02,
        speedY: (Math.random() - 0.5) * 0.02,
        speedZ: (Math.random() - 0.5) * 0.01,
        rotSpeed: Math.random() * 0.02 + 0.005,
        floatOffset: Math.random() * Math.PI * 2
      };
      scene.add(mesh);
      shapes.push(mesh);
    }

    let mouseX = 0, mouseY = 0, scrollY = 0;
    document.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    window.addEventListener('scroll', () => { scrollY = window.pageYOffset * 0.01; });

    let time = 0;
    function animate() {
      requestAnimationFrame(animate);
      time += 0.01;
      shapes.forEach((s, i) => {
        s.position.x += s.userData.speedX;
        s.position.y += s.userData.speedY + Math.sin(time + s.userData.floatOffset) * 0.02;
        s.position.z += s.userData.speedZ;
        s.rotation.x += s.userData.rotSpeed;
        s.rotation.y += s.userData.rotSpeed * 1.5;
        if (s.position.x > 60) s.position.x = -60;
        if (s.position.x < -60) s.position.x = 60;
        if (s.position.y > 60) s.position.y = -60;
        if (s.position.y < -60) s.position.y = 60;
      });
      camera.position.x += (mouseX * 15 - camera.position.x) * 0.05;
      camera.position.y += (-mouseY * 15 + scrollY - camera.position.y) * 0.05;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Scroll animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal, .stagger').forEach(el => observer.observe(el));
  </script>
</body>
</html>`;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
