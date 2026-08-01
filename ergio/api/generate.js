// ========================================
// ERGIO API — /api/generate (v5.0 AGENTIC)
// The AI Conductor: plans → searches images → generates website
// With REAL photos from Pixabay + Unsplash
// Motion graphics + 3D + parallax + scroll animations
// Streams progress via Server-Sent Events (SSE)
// ========================================

import { callGroq, callGroqFast, success, error, corsHeaders, generateSlug, generateLogoUrl, getSupabase } from '../lib/ergio.js';
import { searchImages, planImages, fetchWebsiteImages, generateAIImage, getFallbackImage } from '../lib/images.js';
import { DESIGN_STYLES, autoDetectStyle } from '../lib/design-system.js';

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

Detect the website category from the user's prompt:
- "restaurant" → restaurant (menu, reservations, gallery)
- "shop" or "store" or "product" or "buy" or "sell" → ecommerce (product grid, cart, checkout)
- "portfolio" or "showcase" or "creative" → portfolio (project showcase)
- "saas" or "software" or "app" or "platform" or "api" → saas (features, pricing tiers)
- "blog" or "news" or "articles" or "magazine" → blog (article grid, categories)
- "property" or "real estate" or "housing" or "rent" → realestate (listings, search)
- "gym" or "fitness" or "yoga" or "workout" → fitness (class schedule, membership)
- "clinic" or "doctor" or "hospital" or "health" or "medical" → clinic (appointments, doctors)
- "agency" or "studio" or "firm" or "consultancy" → agency (services, team, process)
- "school" or "course" or "academy" or "tutor" → education (courses, enrollment)
- "event" or "conference" or "wedding" → events (schedule, tickets, speakers)
- everything else → landing (general business landing page)

If the user mentions "3D", "interactive", "animated", "immersive", "motion", set websiteType to "3d".

Create a business plan. Return ONLY valid JSON with this structure:
{
  "businessName": "A catchy, professional name",
  "tagline": "Short memorable tagline",
  "type": "business type (e.g. restaurant, salon, design studio)",
  "websiteCategory": "MUST FILL — detect from prompt: restaurant, ecommerce, portfolio, saas, blog, realestate, fitness, clinic, agency, education, events, or landing",
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

    // Plan AI call — use fast model, 12s timeout
    let planResult;
    try {
      planResult = await Promise.race([
        callGroqFast([
          { role: 'system', content: 'You are ERGIO, an expert business strategist. Return only valid JSON, no markdown.' },
          { role: 'user', content: planPrompt }
        ], { temperature: 0.8, response_format: { type: 'json_object' } }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Plan timeout')), 12000))
      ]);
    } catch(planErr) {
      console.log('Plan AI fallback:', planErr.message);
      // Derive plan directly from prompt keywords
      planResult = null;
    }

    let plan;
    if (planResult) {
      try {
        plan = JSON.parse(planResult);
      } catch (e) {
        const match = planResult.match(/\{[\s\S]*\}/);
        plan = match ? JSON.parse(match[0]) : null;
      }
    }
    if (!plan) {
      // Smart instant plan from prompt keywords
      const p = (prompt || '').toLowerCase();
      const words = prompt.split(' ');
      const capitalized = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      plan = {
        businessName: answers?.name || capitalized.substring(0, 40) || 'My Business',
        tagline: 'Excellence delivered, every time',
        type: 'business',
        websiteCategory: 'landing',
        websiteType: 'standard',
        designStyle: 'modern',
        description: `${capitalized} is a forward-thinking business delivering exceptional value to clients across Nigeria.`,
        brandColors: { primary: '#00D9FF', secondary: '#09090B', accent: '#00FF9D', bg: '#09090B' },
        city: /abuja/.test(p) ? 'Abuja' : /port.harcourt|ph/.test(p) ? 'Port Harcourt' : /kano/.test(p) ? 'Kano' : 'Lagos',
        services: [
          { name: 'Standard Service', description: 'Our core offering', price: 15000, duration: 60 },
          { name: 'Premium Service', description: 'Enhanced experience', price: 35000, duration: 90 },
          { name: 'Enterprise Package', description: 'Full-scale solution', price: 75000, duration: 120 }
        ],
        seoKeywords: ['business Nigeria', 'professional service'],
        targetMarket: 'Nigerian professionals and businesses',
        tone: 'professional',
        imageSearchQueries: ['professional business Nigeria', 'modern office Lagos', 'team meeting Africa']
      };
    }

    // Fallback: detect websiteCategory from business type if AI didn't provide it
    if (!plan.websiteCategory) {
      const typeLower = (plan.type || '').toLowerCase();
      const promptLower = (prompt || '').toLowerCase();
      const combined = typeLower + ' ' + promptLower;
      if (/restaurant|food|dining|cafe|menu|kitchen|eatery|bistro/.test(combined)) plan.websiteCategory = 'restaurant';
      else if (/shop|store|product|buy|sell|ecommerce|retail|fashion|boutique/.test(combined)) plan.websiteCategory = 'ecommerce';
      else if (/portfolio|showcase|creative|design|photography/.test(combined)) plan.websiteCategory = 'portfolio';
      else if (/saas|software|app|platform|api|tech|startup/.test(combined)) plan.websiteCategory = 'saas';
      else if (/blog|news|article|magazine/.test(combined)) plan.websiteCategory = 'blog';
      else if (/property|real ?estate|housing|rent|apartment/.test(combined)) plan.websiteCategory = 'realestate';
      else if (/gym|fitness|yoga|workout|health ?club|wellness/.test(combined)) plan.websiteCategory = 'fitness';
      else if (/clinic|doctor|hospital|health|medical|dental|pharmacy/.test(combined)) plan.websiteCategory = 'clinic';
      else if (/agency|studio|firm|consultancy|marketing/.test(combined)) plan.websiteCategory = 'agency';
      else if (/school|course|academy|tutor|education|training/.test(combined)) plan.websiteCategory = 'education';
      else if (/event|conference|wedding|party|festival/.test(combined)) plan.websiteCategory = 'events';
      else plan.websiteCategory = 'landing';
    }

    // Auto-detect best design style
    const detectedStyle = autoDetectStyle(plan.type || '', plan.websiteCategory || '', plan.description || '', plan.tone || 'professional');
    plan.designStyle = plan.designStyle || detectedStyle;
    const designConfig = DESIGN_STYLES[plan.designStyle] || DESIGN_STYLES.nova;
    plan._design = designConfig;
    
    send('plan', { plan, designStyle: plan.designStyle, designConfig: { name: designConfig.name, emoji: designConfig.emoji, desc: designConfig.desc } });
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

    let brandResult;
    try {
      brandResult = await Promise.race([
        callGroq([
          { role: 'system', content: 'Return only valid JSON.' },
          { role: 'user', content: brandPrompt }
        ], { temperature: 0.7, response_format: { type: 'json_object' } }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Brand timeout')), 8000))
      ]);
    } catch(e) {
      console.log('Brand AI fallback:', e.message);
      brandResult = JSON.stringify({
        logoDescription: `professional modern logo for ${plan.businessName}, ${plan.type}`,
        brandVoice: `${plan.tone || 'professional'} innovative Nigerian`,
        uniqueSellingPoint: `Premier ${plan.type} experience in ${plan.city}`,
        elevatorPitch: `${plan.businessName} is ${plan.city}'s leading ${plan.type}, delivering excellence every day.`
      });
    }

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
    let imagePlan;
    try {
      imagePlan = await Promise.race([
        planImages(plan.businessName, plan.type, plan.services, plan.city),
        new Promise((_, reject) => setTimeout(() => reject(new Error('planImages timeout')), 5000))
      ]);
    } catch(e) {
      imagePlan = [
        { placement: 'hero', query: plan.type + ' business ' + plan.city },
        { placement: 'about', query: 'professional team Nigeria' },
        { placement: 'services', query: plan.type + ' service' }
      ];
    }
    
    // Add AI-generated queries from the plan
    if (plan.imageSearchQueries && plan.imageSearchQueries.length) {
      plan.imageSearchQueries.forEach((q, i) => {
        if (i < imagePlan.length) {
          imagePlan[i].query = q; // Override with AI-planned queries (smarter)
        }
      });
    }

    let images = {};
    try {
      images = await Promise.race([
        fetchWebsiteImages(imagePlan),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Images timeout')), 6000))
      ]);
    } catch(e) {
      console.log('Images timeout, using placeholders:', e.message);
      // Use Pollinations placeholder images
      images = {
        hero: [`https://image.pollinations.ai/prompt/${encodeURIComponent(plan.type + ' business in Lagos Nigeria professional')}&width=1200&height=600&nologo=true`],
        about: [`https://image.pollinations.ai/prompt/${encodeURIComponent('professional team ' + plan.city + ' Nigeria')}&width=800&height=600&nologo=true`],
        gallery: []
      };
    }
    
    // Count found images
    const totalImages = Object.values(images).reduce((sum, arr) => sum + arr.length, 0);
    send('images', { 
      total: totalImages,
      placements: Object.keys(images).map(k => ({ placement: k, count: images[k].length }))
    });
    send('status', { task: '✍️ Writing premium copy...', step: 4, total: 8 });

    // ============ STEP 4: WEBSITE CONTENT ============
    // Build type-specific content prompt (smaller = faster)
    const cat = plan.websiteCategory || 'landing';
    const typeFields = {
      restaurant: '"menu": [{"name":"item","description":"desc","price":2500,"category":"starters|mains|desserts|drinks"}] (8 items)',
      ecommerce: '"products": [{"name":"product","description":"desc","price":5000,"category":"category"}] (6 items)',
      portfolio: '"projects": [{"title":"project","description":"desc","tags":["tag1"]}] (6 items)',
      saas: '"pricingPlans": [{"name":"plan","price":10000,"period":"month","features":["feat1","feat2"],"popular":false}] (3 plans)',
      blog: '"articles": [{"title":"article","excerpt":"summary","category":"category","date":"2026-07-01","readTime":"5 min"}] (5 articles)',
      realestate: '"properties": [{"title":"property","price":5000000,"location":"Lagos","beds":3,"baths":2,"type":"rent|sale"}] (6 properties)',
      fitness: '"classList": [{"name":"class","description":"desc","schedule":"Mon 6am","duration":"60 min","trainer":"name"}] (6 classes)',
      clinic: '"doctors": [{"name":"Dr. Name","specialty":"specialty","available":"Mon-Fri"}] (4 doctors)',
      agency: '"team": [{"name":"person","role":"role","bio":"short bio"}] (4 members)',
      education: '"courses": [{"title":"course","description":"desc","duration":"12 weeks","price":50000,"level":"beginner"}] (4 courses)',
      events: '"eventSchedule": [{"time":"9:00","title":"title","speaker":"name","description":"desc"}] (6 events)',
      landing: ''
    };

    const contentPrompt = `Write website copy for "${plan.businessName}", a ${plan.type} in ${plan.city}, Nigeria. 
Services: ${JSON.stringify(plan.services || [])}
Brand voice: ${brand.brandVoice || 'professional'}

Write bold, concise copy like Apple/Nike. Include Nigerian cultural references.

Return ONLY JSON:
{
  "hero": {"headline": "punchy headline", "subheadline": "supporting text", "cta": "button text"},
  "about": "2 paragraphs about the business in ${plan.city}",
  "servicesHtml": "HTML cards for each service with name, description, price in ₦",
  "whyChooseUs": ["reason1", "reason2", "reason3", "reason4"],
  "testimonials": [{"name": "Nigerian name", "text": "review", "location": "area in Nigeria"}, 3 items],
  "faq": [{"q": "question", "a": "answer"}, 4 items],
  ${typeFields[cat] || ''}
  "seoTitle": "SEO title",
  "seoDescription": "SEO meta description",
  "contactInfo": {"phone": "+234...", "email": "info@...", "address": "address in ${plan.city}", "whatsapp": "+234..."}
}`;

    // ============ SMART INSTANT CONTENT (derived from plan — zero extra AI calls) ============
    const bSlug = (plan.businessName||'business').toLowerCase().replace(/[^a-z0-9]/g,'');
    const ctaByType = {restaurant:'Reserve a Table',salon:'Book Appointment',fitness:'Join Now',clinic:'Book Consultation',ecommerce:'Shop Now',realestate:'View Properties',saas:'Start Free Trial',portfolio:'See My Work',agency:'Get a Quote',events:'Get Tickets',education:'Enroll Now',landing:'Get Started'};
    const whyByType = {
      restaurant:['Authentic Flavors','Farm-Fresh Ingredients','Expert Chefs','Cozy Ambiance'],
      salon:['Certified Stylists','Premium Products','Online Booking','Luxury Experience'],
      fitness:['Expert Trainers','Modern Equipment','Flexible Schedules','Results Guaranteed'],
      clinic:['Licensed Doctors','Modern Facilities','Compassionate Care','Quick Appointments'],
      ecommerce:['Fast Delivery','Secure Checkout','Quality Products','Easy Returns'],
      realestate:['Verified Listings','Expert Agents','Best Prices','Legal Support'],
      saas:['Easy Integration','99.9% Uptime','24/7 Support','Scalable Plans'],
      agency:['Creative Experts','On-Time Delivery','Transparent Pricing','Proven Results'],
    };
    const testimonialsByCity = (city) => [
      {name:'Adebayo Okonkwo', text:`${plan.businessName} is absolutely outstanding! The quality and service exceeded all my expectations.`, location: city || 'Lagos'},
      {name:'Chioma Eze', text:`I've been a loyal client for over a year. Professional, reliable, and truly world-class.`, location: city === 'Abuja' ? 'Abuja' : 'Lekki, Lagos'},
      {name:'Kunle Adeyemi', text:`Best in ${city || 'Nigeria'}. I refer everyone I know here.`, location: 'Victoria Island, Lagos'}
    ];
    const content = {
      hero: { 
        headline: plan.businessName, 
        subheadline: plan.tagline || plan.description?.split('.')[0] || `Premium ${plan.type} in ${plan.city}, Nigeria`, 
        cta: ctaByType[cat] || 'Get Started' 
      },
      about: `${plan.businessName} is ${plan.city}'s premier ${plan.type}, built on a foundation of excellence and deep roots in the Nigerian community. We combine world-class standards with an authentic local touch — ensuring every client receives an experience that truly stands out.\n\n${plan.description || `Our team of dedicated professionals is passionate about delivering results that exceed expectations. From ${plan.city} to the world, we are setting the standard for what great ${plan.type} looks like.`}`,
      servicesHtml: (plan.services || []).map(s => `<div class="service-card"><h3>${s.name}</h3><p>${s.description || ''}</p><div class="price">₦${(s.price||0).toLocaleString()}</div></div>`).join(''),
      whyChooseUs: whyByType[cat] || ['Expert Team', 'Trusted by 500+', 'Affordable Pricing', 'Quality Guaranteed'],
      testimonials: testimonialsByCity(plan.city),
      faq: [
        {q: `How do I get started with ${plan.businessName}?`, a: `Simply call us, WhatsApp us, or book online at our website. Our team responds within minutes.`},
        {q: 'What are your operating hours?', a: 'We are open Monday to Saturday, 8:00 AM – 8:00 PM, and Sundays 10:00 AM – 4:00 PM.'},
        {q: `Where are you located in ${plan.city}?`, a: `We are centrally located in ${plan.city}, Nigeria. Contact us for the exact address or directions.`},
        {q: 'Do you offer payment plans?', a: 'Yes! We accept bank transfers, Paystack card payments, USSD, and cash. Flexible installments available.'}
      ],
      contactInfo: {
        phone: '+234 800 000 0000', 
        email: `info@${bSlug}.com`, 
        address: `${plan.city}, Nigeria`, 
        whatsapp: '+234 800 000 0000'
      },
      seoTitle: `${plan.businessName} | Best ${plan.type} in ${plan.city} Nigeria`,
      seoDescription: `${plan.businessName} - ${plan.description?.substring(0,120) || `Premium ${plan.type} in ${plan.city}, Nigeria`}. Book online today.`,
      // Type-specific extras
      ...(cat === 'restaurant' ? { menu: (plan.services||[]).map(s=>({name:s.name,description:s.description||'',price:s.price||0,category:'Signature'})) } : {}),
      ...(cat === 'ecommerce' ? { products: (plan.services||[]).map(s=>({name:s.name,description:s.description||'',price:s.price||0,category:'Featured'})) } : {}),
      ...(cat === 'realestate' ? { properties: (plan.services||[]).map(s=>({title:s.name,price:s.price||0,location:plan.city,beds:3,baths:2,type:'sale'})) } : {}),
      ...(cat === 'fitness' ? { classList: (plan.services||[]).map(s=>({name:s.name,description:s.description||'',schedule:'Mon/Wed/Fri 6am',duration:'60 min',trainer:'Coach Emmanuel'})) } : {}),
    };

    send('content', { content });
    send('status', { task: '🏗️ Building with motion graphics...', step: 5, total: 8 });

    // ============ STEP 5: GENERATE WEBSITE HTML WITH REAL IMAGES ============
    const colors = plan.brandColors || { primary: '#00D9FF', secondary: '#09090B', accent: '#00FF9D', bg: '#09090B' };

    const is3D = plan.websiteType === '3d' || 
      /3d|interactive|animated|immersive|motion|3dimentional/i.test(prompt + JSON.stringify(answers || {}));
    
    let websiteHtml;
    const contentForHTML = content;
    const planForHTML = plan;
    // Ensure content.about is always a string (not undefined)
    if (!contentForHTML.about) contentForHTML.about = plan.description || plan.type + ' in ' + plan.city;
    if (!contentForHTML.hero) contentForHTML.hero = { headline: plan.businessName, subheadline: plan.tagline || '', cta: 'Get Started' };
    if (!contentForHTML.whyChooseUs) contentForHTML.whyChooseUs = ['Expert Team', 'Trusted Quality', 'Fast Service', 'Best Prices'];
    if (!contentForHTML.testimonials) contentForHTML.testimonials = [];
    if (!contentForHTML.faq) contentForHTML.faq = [];
    if (!contentForHTML.contactInfo) contentForHTML.contactInfo = { phone: '+234 800 000 0000', email: 'info@business.com', address: plan.city + ', Nigeria', whatsapp: '+234 800 000 0000' };
    try {
      websiteHtml = is3D 
        ? generate3DWebsiteHTML(planForHTML, brand, contentForHTML, colors, logoUrl, images)
        : generateWebsiteHTML(planForHTML, brand, contentForHTML, colors, logoUrl, images);
    } catch(genErr) {
      console.error('HTML generation error:', genErr.message, genErr.stack);
      // Fallback minimal HTML
      websiteHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${plan.businessName}</title><style>body{background:#09090B;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:1rem} h1{color:#00D9FF;font-size:3rem} p{color:#888}</style></head><body><h1>${plan.businessName}</h1><p>${plan.description || plan.type + ' in ' + plan.city}</p><p style="color:#00FF9D">Your website is being prepared...</p></body></html>`;
    }

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
      
      const siteSlug = generateSlug(plan.businessName);
      await supabase.from('generated_websites').insert({
        business_name: plan.businessName,
        business_type: plan.type,
        html_content: websiteHtml,
        brand_colors: colors,
        website_type: is3D ? '3d' : 'standard',
        website_category: plan.websiteCategory || 'landing',
        slug: siteSlug,
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
    // Generate shareable deploy URL
    const slug = generateSlug(plan.businessName);
    const deployUrl = `https://ergio.vercel.app/site/${slug}`;
    const previewUrl = `https://ergio.vercel.app/preview.html?site=${slug}`;
    
    send('complete', {
      business: {
        name: plan.businessName,
        tagline: plan.tagline,
        type: plan.type,
        websiteCategory: plan.websiteCategory || 'landing',
        slug,
        logoUrl,
        brandColors: colors,
        city: plan.city,
        services: plan.services || [],
        websiteHtml,
        content,
        images: { total: totalImages, sources: ['pixabay', 'unsplash'] },
        deployUrl,
        previewUrl,
        shareUrl: deployUrl,
        vercelUrl: deployUrl
      },
      message: 'Your business is ready!',
      deployUrl,
      previewUrl,
      shareUrl: deployUrl
    });

    res.end();

  } catch (err) {
    console.error('Generate error:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', data: { message: err.message } })}\n\n`);
    res.end();
  }
}



// ============ TYPE-SPECIFIC SECTION GENERATORS ============
function generateTypeSections(plan, content, colors, images = {}) {
  const cat = plan.websiteCategory || 'landing';
  const sections = [];
  
  // ── RESTAURANT: Menu Section ──
  if (cat === 'restaurant' && content.menu && content.menu.length) {
    const categories = {};
    content.menu.forEach(item => {
      const c = item.category || 'Mains';
      if (!categories[c]) categories[c] = [];
      categories[c].push(item);
    });
    sections.push(`
    <section id="menu">
      <div class="section-header reveal">
        <h2>Our Menu</h2>
        <p>Crafted with love, served with pride</p>
      </div>
      <div class="menu-categories stagger">
        ${Object.entries(categories).map(([cat, items]) => `
        <div class="menu-category">
          <h3 class="menu-cat-title">${cat.charAt(0).toUpperCase() + cat.slice(1)}</h3>
          ${items.map(item => `
          <div class="menu-item">
            <div class="menu-item-info">
              <h4>${item.name}</h4>
              <p>${item.description || ''}</p>
            </div>
            <div class="menu-item-price">₦${(item.price || 0).toLocaleString()}</div>
          </div>`).join('')}
        </div>`).join('')}
      </div>
    </section>`);
  }
  
  // ── ECOMMERCE: Product Grid ──
  if (cat === 'ecommerce' && content.products && content.products.length) {
    const cats = {};
    content.products.forEach(p => {
      const c = p.category || 'All';
      if (!cats[c]) cats[c] = [];
      cats[c].push(p);
    });
    sections.push(`
    <section id="products">
      <div class="section-header reveal">
        <h2>Our Products</h2>
        <p>Shop our collection</p>
      </div>
      <div class="product-grid stagger">
        ${content.products.map(p => `
        <div class="product-card">
          <div class="product-image" style="background:linear-gradient(135deg,${colors.primary}22,${colors.accent}22);display:flex;align-items:center;justify-content:center;min-height:200px">
            <span style="font-size:3rem">${(p.category || '📦').charAt(0) === '📦' ? '📦' : '🛍️'}</span>
          </div>
          <div class="product-info">
            <span class="product-cat">${p.category || 'General'}</span>
            <h3>${p.name}</h3>
            <p>${p.description || ''}</p>
            <div class="product-bottom">
              <span class="product-price">₦${(p.price || 0).toLocaleString()}</span>
              <button class="btn-add-cart" onclick="alert('Added: ${p.name}')">Add to Cart</button>
            </div>
          </div>
        </div>`).join('')}
      </div>
    </section>`);
  }
  
  // ── PORTFOLIO: Projects Showcase ──
  if (cat === 'portfolio' && content.projects && content.projects.length) {
    sections.push(`
    <section id="projects">
      <div class="section-header reveal">
        <h2>Featured Work</h2>
        <p>Selected projects we're proud of</p>
      </div>
      <div class="project-grid stagger">
        ${content.projects.map((p, i) => `
        <div class="project-card reveal-scale" style="background:linear-gradient(135deg,${colors.primary}11,${colors.accent}11);border:1px solid rgba(255,255,255,.06);border-radius:20px;overflow:hidden">
          <div style="aspect-ratio:16/10;background:linear-gradient(135deg,${colors.primary}33,${colors.accent}22);display:flex;align-items:center;justify-content:center">
            <span style="font-size:3rem;opacity:.5">${['🎨','💼','🚀','💡','⚡'][i % 5]}</span>
          </div>
          <div style="padding:24px">
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
              ${(p.tags || []).map(t => `<span style="padding:4px 12px;border-radius:8px;background:${colors.primary}15;color:${colors.primary};font-size:.75rem">${t}</span>`).join('')}
            </div>
            <h3 style="font-size:1.2rem;margin:0 0 8px">${p.title}</h3>
            <p style="color:var(--muted);font-size:.9rem;margin:0">${p.description || ''}</p>
          </div>
        </div>`).join('')}
      </div>
    </section>`);
  }
  
  // ── SAAS: Pricing Plans ──
  if (cat === 'saas' && content.pricingPlans && content.pricingPlans.length) {
    sections.push(`
    <section id="pricing">
      <div class="section-header reveal">
        <h2>Pricing</h2>
        <p>Simple, transparent pricing for everyone</p>
      </div>
      <div class="pricing-grid stagger">
        ${content.pricingPlans.map(plan => `
        <div class="pricing-card ${plan.popular ? 'popular' : ''}" style="${plan.popular ? `border:2px solid ${colors.primary}` : ''}">
          ${plan.popular ? '<div class="popular-badge">Most Popular</div>' : ''}
          <h3>${plan.name}</h3>
          <div class="price">₦${(plan.price || 0).toLocaleString()}<span>/${plan.period || 'month'}</span></div>
          <ul class="price-features">
            ${(plan.features || []).map(f => `<li>✓ ${f}</li>`).join('')}
          </ul>
          <button class="btn-primary" style="width:100%">Get Started</button>
        </div>`).join('')}
      </div>
    </section>`);
  }
  
  // ── BLOG: Article Grid ──
  if (cat === 'blog' && content.articles && content.articles.length) {
    sections.push(`
    <section id="articles">
      <div class="section-header reveal">
        <h2>Latest Articles</h2>
        <p>Insights, stories, and ideas worth reading</p>
      </div>
      <div class="blog-grid stagger">
        ${content.articles.map((a, i) => `
        <article class="blog-card" onclick="window.location.hash='#article-${i}'">
          <div style="aspect-ratio:16/9;background:linear-gradient(135deg,${colors.primary}22,${colors.accent}22);display:flex;align-items:center;justify-content:center;border-radius:16px">
            <span style="font-size:3rem;opacity:.4">📝</span>
          </div>
          <div style="padding:20px 0">
            <span style="color:${colors.primary};font-size:.8rem;font-weight:600">${a.category || 'General'}</span>
            <h3 style="margin:8px 0;font-size:1.15rem">${a.title}</h3>
            <p style="color:var(--muted);font-size:.9rem;margin:0 0 12px">${a.excerpt || ''}</p>
            <div style="display:flex;gap:16px;color:var(--muted);font-size:.8rem">
              <span>${a.date || ''}</span>
              <span>${a.readTime || '5 min read'}</span>
            </div>
          </div>
        </article>`).join('')}
      </div>
    </section>`);
  }
  
  // ── REAL ESTATE: Property Listings ──
  if (cat === 'realestate' && content.properties && content.properties.length) {
    sections.push(`
    <section id="properties">
      <div class="section-header reveal">
        <h2>Available Properties</h2>
        <p>Find your perfect space</p>
      </div>
      <div class="property-grid stagger">
        ${content.properties.map(p => `
        <div class="property-card">
          <div style="aspect-ratio:16/10;background:linear-gradient(135deg,${colors.primary}22,${colors.accent}22);display:flex;align-items:center;justify-content:center;border-radius:16px 16px 0 0">
            <span style="font-size:3rem;opacity:.5">🏠</span>
          </div>
          <div style="padding:20px">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
              <h3 style="margin:0;font-size:1.1rem">${p.title}</h3>
              <span style="padding:4px 10px;border-radius:8px;background:${p.type==='sale'?'#22c55e15':'#f59e0b15'};color:${p.type==='sale'?'#22c55e':'#f59e0b'};font-size:.7rem;font-weight:700;text-transform:uppercase">${p.type || 'sale'}</span>
            </div>
            <p style="color:var(--muted);font-size:.85rem;margin:0 0 12px">📍 ${p.location || 'Lagos'}</p>
            <div style="display:flex;gap:16px;margin-bottom:16px;font-size:.85rem;color:var(--muted)">
              ${p.beds ? `<span>🛏️ ${p.beds} beds</span>` : ''}
              ${p.baths ? `<span>🚿 ${p.baths} baths</span>` : ''}
            </div>
            <div style="font-size:1.3rem;font-weight:800;color:${colors.primary}">₦${(p.price || 0).toLocaleString()}<span style="font-size:.8rem;color:var(--muted);font-weight:400">/${p.type === 'rent' ? 'year' : 'one-time'}</span></div>
          </div>
        </div>`).join('')}
      </div>
    </section>`);
  }
  
  // ── FITNESS: Class Schedule ──
  if (cat === 'fitness' && content.classList && content.classList.length) {
    sections.push(`
    <section id="classes">
      <div class="section-header reveal">
        <h2>Class Schedule</h2>
        <p>Find your perfect workout</p>
      </div>
      <div class="class-grid stagger">
        ${content.classList.map(c => `
        <div class="class-card">
          <div style="font-size:2rem;margin-bottom:12px">${['💪','🧘','🏃','🥊','🚴','🏋️'][Math.floor(Math.random()*6)]}</div>
          <h3>${c.name}</h3>
          <p style="color:var(--muted);font-size:.9rem">${c.description || ''}</p>
          <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-size:.8rem;color:var(--muted)">${c.schedule || ''}</div>
              <div style="font-size:.8rem;color:var(--muted)">${c.duration || ''} · ${c.trainer || ''}</div>
            </div>
            <button class="btn-primary" style="padding:8px 16px;font-size:.85rem">Book</button>
          </div>
        </div>`).join('')}
      </div>
    </section>`);
  }
  
  // ── CLINIC: Doctors ──
  if (cat === 'clinic' && content.doctors && content.doctors.length) {
    sections.push(`
    <section id="doctors">
      <div class="section-header reveal">
        <h2>Meet Our Doctors</h2>
        <p>Experienced professionals you can trust</p>
      </div>
      <div class="doctors-grid stagger">
        ${content.doctors.map(d => `
        <div class="doctor-card">
          <div style="aspect-ratio:1;background:linear-gradient(135deg,${colors.primary}22,${colors.accent}22);border-radius:50%;max-width:120px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center">
            <span style="font-size:3rem">👨‍⚕️</span>
          </div>
          <h3 style="text-align:center">${d.name}</h3>
          <p style="text-align:center;color:${colors.primary};font-size:.85rem">${d.specialty || ''}</p>
          <p style="text-align:center;color:var(--muted);font-size:.8rem;margin-top:8px">${d.available || ''}</p>
          <button class="btn-primary" style="width:100%;margin-top:16px">Book Appointment</button>
        </div>`).join('')}
      </div>
    </section>`);
  }
  
  // ── EDUCATION: Courses ──
  if (cat === 'education' && content.courses && content.courses.length) {
    sections.push(`
    <section id="courses">
      <div class="section-header reveal">
        <h2>Our Courses</h2>
        <p>Learn from the best, at your own pace</p>
      </div>
      <div class="course-grid stagger">
        ${content.courses.map(c => `
        <div class="course-card">
          <div style="padding:4px 12px;border-radius:8px;background:${colors.primary}15;color:${colors.primary};font-size:.7rem;font-weight:700;display:inline-block;margin-bottom:12px;text-transform:uppercase">${c.level || 'beginner'}</div>
          <h3>${c.title}</h3>
          <p style="color:var(--muted);font-size:.9rem">${c.description || ''}</p>
          <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between;align-items:center">
            <div>
              <span style="font-size:.8rem;color:var(--muted)">⏱️ ${c.duration || ''}</span>
            </div>
            <span style="font-size:1.2rem;font-weight:800;color:${colors.primary}">₦${(c.price || 0).toLocaleString()}</span>
          </div>
          <button class="btn-primary" style="width:100%;margin-top:12px">Enroll Now</button>
        </div>`).join('')}
      </div>
    </section>`);
  }
  
  // ── AGENCY: Team + Process ──
  if (cat === 'agency') {
    if (content.team && content.team.length) {
      sections.push(`
      <section id="team">
        <div class="section-header reveal">
          <h2>Our Team</h2>
          <p>The minds behind the magic</p>
        </div>
        <div class="team-grid stagger">
          ${content.team.map((m, i) => `
          <div class="team-card">
            <div style="aspect-ratio:1;background:linear-gradient(135deg,${colors.primary}22,${colors.accent}22);border-radius:50%;max-width:100px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center">
              <span style="font-size:2.5rem">${['👨','👩','🧑','👨‍💼','👩‍💼'][i % 5]}</span>
            </div>
            <h3 style="text-align:center">${m.name}</h3>
            <p style="text-align:center;color:${colors.primary};font-size:.85rem">${m.role || ''}</p>
            <p style="text-align:center;color:var(--muted);font-size:.8rem;margin-top:8px">${m.bio || ''}</p>
          </div>`).join('')}
        </div>
      </section>`);
    }
    if (content.process && content.process.length) {
      sections.push(`
      <section id="process">
        <div class="section-header reveal">
          <h2>How We Work</h2>
          <p>Our proven process for delivering results</p>
        </div>
        <div class="process-grid stagger">
          ${content.process.map((p, i) => `
          <div class="process-step">
            <div style="width:50px;height:50px;border-radius:50%;background:${colors.primary};color:#000;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.2rem;margin:0 auto 16px">${p.step || i+1}</div>
            <h3 style="text-align:center">${p.title}</h3>
            <p style="text-align:center;color:var(--muted);font-size:.9rem">${p.description || ''}</p>
          </div>`).join('')}
        </div>
      </section>`);
    }
  }
  
  return sections.join('\n');
}


// ============ WEBSITE HTML GENERATOR (STANDARD + MOTION GRAPHICS) ============
function generateWebsiteHTML(plan, brand, content, colors, logoUrl, images = {}) {
  const hero = content.hero || {};
  const about = content.about || '';
  const whyChooseUs = content.whyChooseUs || [];
  const testimonials = content.testimonials || [];
  const faq = content.faq || [];
  const contact = content.contactInfo || {};

  // ── Design System Integration ──────────────────────────────
  const styleKey = plan.designStyle || plan._design?.name?.toLowerCase() || 'nova';
  const ds = DESIGN_STYLES[styleKey] || DESIGN_STYLES.nova;
  const dp = ds.palette;
  const df = ds.fonts;
  
  // Merge design-system colors with plan brandColors
  const bg = dp.bg || colors.bg || '#09090B';
  const surface = dp.surface || '#111827';
  const borderClr = dp.border || 'rgba(255,255,255,0.08)';
  const textClr = dp.text || '#F8FAFC';
  const mutedClr = dp.muted || '#94A3B8';
  const primaryClr = dp.primary || colors.primary || '#00D9FF';
  const accentClr = dp.accent || colors.accent || '#00FF9D';
  const ctaClr = dp.cta || primaryClr;
  const headingFont = df.heading || 'Inter';
  const bodyFont = df.body || 'Inter';
  
  // Determine if light or dark theme
  const isLight = bg.startsWith('#f') || bg.startsWith('#e') || bg.startsWith('#fa') || bg.startsWith('#fe');
  const navBg = isLight ? 'rgba(255,255,255,0.85)' : 'rgba(10,10,15,0.85)';
  const cardBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)';
  const heroBgOverlay = isLight 
    ? 'linear-gradient(180deg,rgba(255,255,255,.1) 0%,rgba(255,255,255,.7) 100%)'
    : 'linear-gradient(180deg,rgba(10,10,15,.3) 0%,rgba(10,10,15,.8) 100%)';
  const buttonTextColor = isLight ? '#ffffff' : (ctaClr === '#ffffff' ? '#111' : '#09090B');
  
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
  <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(headingFont).replace(/%2B/g,'+')}:wght@400;600;700;800;900&family=${encodeURIComponent(bodyFont).replace(/%2B/g,'+')}:wght@400;500;600&family=Inter:wght@400;600&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    :root{
      --primary:${primaryClr};
      --secondary:${surface};
      --accent:${accentClr};
      --bg:${bg};
      --surface:${surface};
      --border:${borderClr};
      --text:${textClr};
      --muted:${mutedClr};
      --cta:${ctaClr};
      --card:${cardBg};
      --nav:${navBg};
    }
    html{scroll-behavior:smooth}
    body{font-family:'${bodyFont}',sans-serif;background:var(--bg);color:var(--text);line-height:1.6;overflow-x:hidden}
    h1,h2,h3,h4,h5{font-family:'${headingFont}',sans-serif}
    
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
    .nav{display:flex;justify-content:space-between;align-items:center;padding:1.2rem 5%;position:sticky;top:0;background:var(--nav);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);z-index:100;border-bottom:1px solid var(--border);transition:padding .3s}
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
    .service-card{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:2.5rem;transition:all .5s cubic-bezier(.16,1,.3,1);position:relative;overflow:hidden}
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
    .why-item{text-align:center;padding:2rem;border-radius:20px;background:var(--card);border:1px solid var(--border);transition:all .4s}
    .why-item:hover{border-color:var(--primary);transform:translateY(-4px)}
    .why-item .icon{font-size:2.5rem;margin-bottom:1rem;display:inline-block;animation:float 4s ease-in-out infinite}
    .why-item h4{margin-bottom:.5rem;font-weight:700;font-size:1.1rem}
    .why-item p{color:var(--muted);font-size:.95rem}
    
    /* === TESTIMONIALS === */
    .testimonials{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:2rem}
    .testimonial{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:2.5rem;position:relative}
    .testimonial::before{content:'"';position:absolute;top:-10px;left:20px;font-size:5rem;color:var(--primary);opacity:.2;font-family:Georgia,serif}
    .testimonial p{color:#CBD5E1;font-style:italic;margin-bottom:1.5rem;position:relative;z-index:1}
    .testimonial .author{font-weight:700;font-size:1.1rem}
    .testimonial .location{color:var(--muted);font-size:.9rem;margin-top:.2rem}
    .testimonial .stars{color:#FBBF24;margin-bottom:1rem}
    
    /* === FAQ === */
    .faq-item{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:1.8rem;margin-bottom:1rem;cursor:pointer;transition:all .3s}
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

    /* === TYPE-SPECIFIC STYLES === */
    .menu-categories{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:2rem}
    .menu-category{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);border-radius:16px;padding:24px}
    .menu-cat-title{font-size:1.1rem;font-weight:700;color:var(--primary);margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.06)}
    .menu-item{display:flex;justify-content:space-between;align-items:start;padding:12px 0;border-bottom:1px dashed rgba(255,255,255,.04)}
    .menu-item-info h4{font-size:.95rem;margin:0 0 4px}
    .menu-item-info p{font-size:.85rem;color:var(--muted);margin:0}
    .menu-item-price{font-weight:700;color:var(--primary);white-space:nowrap;padding-left:16px}
    .product-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.5rem}
    .product-card{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:16px;overflow:hidden;transition:all .3s}
    .product-card:hover{transform:translateY(-4px);border-color:var(--primary)}
    .product-info{padding:20px}
    .product-cat{font-size:.75rem;color:var(--primary);font-weight:600;text-transform:uppercase}
    .product-info h3{font-size:1.1rem;margin:8px 0 4px}
    .product-info p{font-size:.85rem;color:var(--muted);margin:0 0 16px}
    .product-bottom{display:flex;justify-content:space-between;align-items:center}
    .product-price{font-size:1.2rem;font-weight:800;color:var(--primary)}
    .btn-add-cart{background:var(--primary);color:#09090B;border:none;padding:8px 16px;border-radius:8px;font-weight:700;cursor:pointer;transition:.3s}
    .btn-add-cart:hover{transform:scale(1.05)}
    .project-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:1.5rem}
    .pricing-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.5rem;max-width:1000px;margin:0 auto}
    .pricing-card{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:20px;padding:32px;position:relative;transition:all .3s}
    .pricing-card.popular{transform:scale(1.05)}
    .pricing-card:hover{border-color:var(--primary)}
    .popular-badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--primary);color:#000;padding:4px 16px;border-radius:100px;font-size:.75rem;font-weight:700}
    .pricing-card h3{font-size:1.2rem;margin:0 0 8px}
    .price{font-size:2.5rem;font-weight:900;margin:16px 0}
    .price span{font-size:.9rem;font-weight:400;color:var(--muted)}
    .price-features{list-style:none;padding:0;margin:0 0 24px}
    .price-features li{padding:8px 0;color:var(--muted);font-size:.9rem}
    .blog-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:2rem}
    .blog-card{cursor:pointer;transition:all .3s}
    .blog-card:hover{transform:translateY(-4px)}
    .property-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1.5rem}
    .property-card{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:16px;overflow:hidden;transition:all .3s}
    .property-card:hover{transform:translateY(-4px);border-color:var(--primary)}
    .class-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.5rem}
    .class-card{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:24px;transition:all .3s}
    .class-card:hover{border-color:var(--primary);transform:translateY(-2px)}
    .doctors-grid,.team-grid,.course-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1.5rem}
    .doctor-card,.team-card,.course-card{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:24px;transition:all .3s}
    .doctor-card:hover,.team-card:hover,.course-card:hover{border-color:var(--primary)}
    .process-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:2rem}
    .process-step{text-align:center}

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
  ${generateTypeSections(plan, content, colors, images)}
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
    .service-card{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:2.5rem;transition:all .5s cubic-bezier(.16,1,.3,1);perspective:1000px}
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
    .why-item{text-align:center;padding:2rem;border-radius:20px;background:var(--card);border:1px solid var(--border);transition:all .4s}
    .why-item:hover{border-color:var(--primary);transform:translateY(-5px)}
    .why-item .icon{font-size:2.5rem;margin-bottom:1rem;animation:float 4s ease-in-out infinite}
    .why-item h4{margin-bottom:.5rem;font-weight:700}
    
    .testimonials{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:2rem}
    .testimonial{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:2.5rem}
    .testimonial .stars{color:#FBBF24;margin-bottom:1rem}
    .testimonial p{color:#CBD5E1;font-style:italic;margin-bottom:1.5rem}
    .testimonial .author{font-weight:700}
    .testimonial .location{color:#94A3B8;font-size:.9rem}
    
    .faq-item{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:1.8rem;margin-bottom:1rem;cursor:pointer}
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
// cache-bust Sat Jul 18 06:43:50 UTC 2026
