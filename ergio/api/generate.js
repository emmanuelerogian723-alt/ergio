// ========================================
import { assemblePremiumWebsite, assemblePremiumWebsiteV4, selectLayout, LAYOUT_ARCHETYPES, generateMultiPageSite, generateSitemapMultiPage, generateRobotsTxt } from '../lib/premium-engine.js';
// ERGIO API — /api/generate (v5.0 AGENTIC)
// The AI Conductor: plans → searches images → generates website
// With REAL photos from Pixabay + Unsplash
// Motion graphics + 3D + parallax + scroll animations
// Streams progress via Server-Sent Events (SSE)
// ========================================

import { callGroq, callGroqFast, success, error, corsHeaders, generateSlug, generateLogoUrl, getSupabase } from '../lib/ergio.js';
import { searchImages, planImages, fetchWebsiteImages, generateAIImage, getFallbackImage } from '../lib/images.js';
import { DESIGN_STYLES as _BASE_STYLES, EXTRA_DESIGN_STYLES, autoDetectStyle } from '../lib/design-system.js';

// Merge all design styles into one lookup
const DESIGN_STYLES = { ..._BASE_STYLES, ...EXTRA_DESIGN_STYLES };

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
  "designStyle": "nova|aria|onyx|pulse|flame|bloom|terra|ivory|slate|zinc|naija|kente|medcare|feast|market|canvas|estate|scholar|iron|gradient|editorial|split|bento (pick the most fitting key)",
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

    // Auto-detect best design style — always prefer our detection system over AI's choice
    // AI often picks generic styles; our autoDetect knows the right vertical match
    const detectedStyle = autoDetectStyle(plan.type || '', plan.websiteCategory || '', plan.description || '', plan.tone || 'professional');
    const validStyleKeys = Object.keys(DESIGN_STYLES);
    // Use autoDetect result if it's a valid key; only fall back to AI choice if autoDetect returns 'nova' (default) AND AI picked a specific valid key
    if (validStyleKeys.includes(detectedStyle) && detectedStyle !== 'nova') {
      plan.designStyle = detectedStyle;
    } else if (!validStyleKeys.includes(plan.designStyle)) {
      plan.designStyle = detectedStyle;
    }
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
    const designStyleKey = plan.designStyle || plan._design?.name?.toLowerCase() || 'nova';
    const isEditorial = ['editorial', 'split', 'bento'].includes(designStyleKey);
    const isTransix = ['transix', 'aurora', 'darkglass'].includes(designStyleKey);
    const isClay = designStyleKey === 'clay';
    
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
      // === PREMIUM ENGINE v3.0 ===
      const layoutKey = selectLayout(planForHTML.websiteCategory, designStyleKey, planForHTML.websiteType);
      const usePremium = !is3D && !isClay; // Premium handles most styles; 3D and clay keep dedicated generators
      if (usePremium) {
        try {
          // Premium Engine v4.0 — all 15 features
          const v4Options = {
            megaMenu: true,
            lottie: true,
            beforeAfter: planForHTML.websiteCategory === 'realestate' || planForHTML.websiteCategory === 'fitness' || planForHTML.websiteCategory === 'clinic',
            virtualTour: planForHTML.websiteCategory === 'realestate' || planForHTML.websiteCategory === 'restaurant',
            interactiveMap: true,
            bookingForm: ['restaurant','clinic','fitness','salon','agency','events'].includes(planForHTML.websiteCategory),
            minifyCSS: true,
            heroVideo: contentForHTML.hero?.videoUrl || '',
            gltfModel: planForHTML.websiteType === '3d' ? 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf' : '',
          };
          websiteHtml = assemblePremiumWebsiteV4(planForHTML, contentForHTML, colors, logoUrl, images, layoutKey, v4Options);
          send('status', { task: `✨ Layout: ${LAYOUT_ARCHETYPES[layoutKey]?.name || layoutKey} — premium engine v4 with ${Object.values(v4Options).filter(Boolean).length} features`, step: 5, total: 8 });
        } catch(premiumErr) {
          console.error('Premium engine v4 error, falling back to v3:', premiumErr.message);
          try {
            websiteHtml = assemblePremiumWebsite(planForHTML, contentForHTML, colors, logoUrl, images, layoutKey);
          } catch(e) {
            console.error('V3 fallback also failed:', e.message);
          }
        }
      }
      if (!websiteHtml) {
      websiteHtml = is3D 
        ? generate3DWebsiteHTML(planForHTML, brand, contentForHTML, colors, logoUrl, images)
        : isTransix
          ? generateTransixHTML(planForHTML, brand, contentForHTML, colors, logoUrl, images)
          : isEditorial
            ? generateEditorialHTML(planForHTML, brand, contentForHTML, colors, logoUrl, images)
            : isClay
              ? generateClayHTML(planForHTML, brand, contentForHTML, colors, logoUrl, images)
              : generateWebsiteHTML(planForHTML, brand, contentForHTML, colors, logoUrl, images);
      }
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


// ============ CLAY MORPHISM WEBSITE GENERATOR ============
function generateClayHTML(plan, brand, content, colors, logoUrl, images = {}) {
  const hero = content.hero || {};
  const about = content.about || '';
  const whyChooseUs = content.whyChooseUs || [];
  const testimonials = content.testimonials || [];
  const faq = content.faq || [];
  const contact = content.contactInfo || {};
  const businessName = plan.businessName || 'Your Business';

  const heroImg = images.hero?.[0]?.url || '';
  const galleryImgs = (images.gallery || []).map(i => i.url);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${content.seoTitle || businessName}</title>
<meta name="description" content="${content.seoDescription || plan.description || ''}">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#F0EDE8;--surface:#E8E4DE;--text:#1a1a1a;--muted:#6b6b6b;--primary:#FF6B47;--accent:#4ECDC4;--shadow:0 8px 32px rgba(0,0,0,0.06),0 2px 8px rgba(0,0,0,0.04);--shadow-lg:0 20px 60px rgba(0,0,0,0.08),0 8px 24px rgba(0,0,0,0.06)}
html{scroll-behavior:smooth}
body{font-family:'Nunito',sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden;line-height:1.6}
h1,h2,h3,h4,h5{font-family:'Nunito',sans-serif;font-weight:800}
.reveal{opacity:0;transform:translateY(28px);transition:all .7s cubic-bezier(.16,1,.3,1)}
.reveal.active{opacity:1;transform:translateY(0)}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}

.nav{display:flex;justify-content:space-between;align-items:center;padding:1.2rem 5%;position:sticky;top:0;z-index:100;backdrop-filter:blur(20px);background:rgba(240,237,232,0.85);border-bottom:1px solid rgba(0,0,0,0.06)}
.nav-logo{display:flex;align-items:center;gap:.5rem;font-weight:800;font-size:1.1rem;text-decoration:none;color:var(--text)}
.nav-logo-mark{width:36px;height:36px;background:var(--primary);border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.1rem;box-shadow:var(--shadow)}
.nav-links{display:flex;gap:2rem}
.nav-links a{color:var(--muted);text-decoration:none;font-weight:600;font-size:.9rem;transition:color .2s}
.nav-links a:hover{color:var(--primary)}
.nav-cta{background:var(--primary);color:#fff;padding:.5rem 1.3rem;border-radius:100px;font-weight:700;font-size:.88rem;text-decoration:none;box-shadow:var(--shadow);transition:all .25s}
.nav-cta:hover{transform:translateY(-2px);box-shadow:var(--shadow-lg)}

.hero{padding:3rem 5%;display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center;min-height:75vh}
.hero-badge{display:inline-flex;align-items:center;gap:.5rem;background:#fff;border:1px solid rgba(0,0,0,0.06);padding:.4rem 1rem;border-radius:100px;font-size:.78rem;font-weight:700;color:var(--primary);box-shadow:var(--shadow);width:fit-content}
.hero-title{font-size:clamp(2.5rem,6vw,4.5rem);font-weight:900;line-height:1;letter-spacing:-.03em}
.hero-title .accent{color:var(--primary)}
.hero-desc{color:var(--muted);font-size:1.1rem;max-width:420px;margin-top:1rem}
.hero-cta{display:flex;gap:1rem;margin-top:1.5rem;flex-wrap:wrap}
.btn-primary{background:var(--primary);color:#fff;padding:.9rem 2rem;border-radius:100px;font-weight:800;font-size:.95rem;text-decoration:none;box-shadow:var(--shadow-lg);transition:all .25s;border:none;cursor:pointer}
.btn-primary:hover{transform:translateY(-3px)}
.btn-ghost{background:#fff;color:var(--text);padding:.9rem 2rem;border-radius:100px;font-weight:700;font-size:.95rem;text-decoration:none;border:1px solid rgba(0,0,0,0.06);box-shadow:var(--shadow);transition:all .25s}
.btn-ghost:hover{transform:translateY(-3px)}
.hero-visual{display:flex;align-items:center;justify-content:center;position:relative}
.hero-card{background:#fff;border-radius:28px;padding:2rem;box-shadow:var(--shadow-lg);width:100%;max-width:380px;animation:float 5s ease-in-out infinite}
.hero-card-img{width:100%;height:200px;border-radius:20px;object-fit:cover;margin-bottom:1.5rem}
.hero-card-row{display:flex;justify-content:space-between;align-items:center;padding:.6rem 0;border-bottom:1px solid rgba(0,0,0,0.06)}
.hero-card-row:last-child{border:none}
.hero-card-label{font-size:.85rem;color:var(--muted);font-weight:600}
.hero-card-val{font-weight:800;color:var(--primary)}
.hero-float{position:absolute;background:#fff;border-radius:16px;padding:.8rem 1.2rem;box-shadow:var(--shadow-lg);animation:float 4s ease-in-out infinite}
.hero-float.f1{top:5%;left:-5%}
.hero-float.f2{bottom:10%;right:-5%;animation-delay:1s}
.float-emoji{font-size:1.5rem}
.float-text{font-size:.75rem;font-weight:700;color:var(--text);margin-top:.2rem}

.features{padding:4rem 5%;max-width:1200px;margin:0 auto}
.features h2{font-size:clamp(1.8rem,4vw,2.8rem);font-weight:900;text-align:center;margin-bottom:.5rem}
.features .sub{text-align:center;color:var(--muted);margin-bottom:2.5rem}
.feat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.5rem}
.feat-card{background:#fff;border-radius:24px;padding:2rem;box-shadow:var(--shadow);transition:all .3s;cursor:pointer}
.feat-card:hover{transform:translateY(-6px);box-shadow:var(--shadow-lg)}
.feat-icon{width:52px;height:52px;border-radius:16px;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:#fff;margin-bottom:1rem;box-shadow:var(--shadow)}
.feat-title{font-size:1.2rem;font-weight:800;margin-bottom:.4rem}
.feat-desc{font-size:.9rem;color:var(--muted);line-height:1.6}

.svc-list{padding:4rem 5%;max-width:1200px;margin:0 auto}
.svc-list h2{font-size:clamp(1.8rem,4vw,2.8rem);font-weight:900;text-align:center;margin-bottom:.5rem}
.svc-list .sub{text-align:center;color:var(--muted);margin-bottom:2.5rem}
.svc-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem}
.svc-card{background:#fff;border-radius:24px;padding:1.8rem;box-shadow:var(--shadow);transition:all .3s}
.svc-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg)}
.svc-card-name{font-weight:800;font-size:1.1rem;margin-bottom:.3rem}
.svc-card-desc{font-size:.85rem;color:var(--muted);margin-bottom:1rem}
.svc-card-price{font-size:1.4rem;font-weight:900;color:var(--primary)}
.svc-card-btn{display:block;text-align:center;background:var(--bg);color:var(--text);padding:.7rem;border-radius:100px;font-weight:700;font-size:.88rem;text-decoration:none;margin-top:1rem;transition:background .2s}
.svc-card-btn:hover{background:var(--primary);color:#fff}

.testi{padding:4rem 5%;max-width:1200px;margin:0 auto}
.testi h2{font-size:clamp(1.8rem,4vw,2.8rem);font-weight:900;text-align:center;margin-bottom:2.5rem}
.testi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem}
.testi-card{background:#fff;border-radius:24px;padding:2rem;box-shadow:var(--shadow)}
.testi-stars{color:var(--primary);font-size:1.1rem;margin-bottom:1rem}
.testi-text{font-size:.95rem;line-height:1.7;margin-bottom:1.2rem}
.testi-author{display:flex;align-items:center;gap:.8rem}
.testi-avatar{width:42px;height:42px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff}
.testi-name{font-weight:700}
.testi-loc{font-size:.8rem;color:var(--muted)}

.faq{padding:4rem 5%;max-width:1200px;margin:0 auto}
.faq h2{font-size:clamp(1.8rem,4vw,2.8rem);font-weight:900;text-align:center;margin-bottom:2.5rem}
.faq-list{display:flex;flex-direction:column;gap:.75rem;max-width:700px;margin:0 auto}
.faq-item{background:#fff;border-radius:16px;overflow:hidden;box-shadow:var(--shadow)}
.faq-q{display:flex;justify-content:space-between;align-items:center;padding:1.3rem 1.5rem;cursor:pointer;font-weight:700;font-size:.95rem;gap:1rem}
.faq-icon{font-size:1.2rem;color:var(--muted);transition:transform .3s}
.faq-item.open .faq-icon{transform:rotate(45deg);color:var(--primary)}
.faq-a{padding:0 1.5rem;max-height:0;overflow:hidden;transition:max-height .4s ease,padding .4s ease;color:var(--muted);font-size:.9rem;line-height:1.7}
.faq-item.open .faq-a{max-height:300px;padding-bottom:1.3rem}

.cta{margin:0 5% 4rem;padding:3rem;border-radius:28px;background:var(--primary);text-align:center;box-shadow:var(--shadow-lg)}
.cta h2{font-size:clamp(1.6rem,3vw,2.4rem);font-weight:900;color:#fff;margin-bottom:.5rem}
.cta p{color:rgba(255,255,255,0.8);margin-bottom:1.5rem}
.cta .btn-white{background:#fff;color:var(--primary);padding:.9rem 2.5rem;border-radius:100px;font-weight:800;font-size:.95rem;text-decoration:none;display:inline-block;transition:transform .2s}
.cta .btn-white:hover{transform:scale(1.05)}

.footer{padding:2rem 5%;border-top:1px solid rgba(0,0,0,0.06);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem}
.footer-left{font-weight:800}
.footer-right{font-size:.8rem;color:var(--muted)}
.footer-right a{color:var(--primary);text-decoration:none;font-weight:700}

@media(max-width:768px){
.hero{grid-template-columns:1fr}
.hero-visual{display:none}
.nav-links{display:none}
.footer{flex-direction:column;text-align:center}
}
</style>
</head>
<body>
<nav class="nav">
<a href="#" class="nav-logo"><div class="nav-logo-mark">${businessName.charAt(0)}</div>${businessName}</a>
<div class="nav-links"><a href="#features">Features</a><a href="#services">Services</a><a href="#faq">FAQ</a></div>
<a href="#contact" class="nav-cta">Get Started</a>
</nav>

<section class="hero">
<div>
<div class="hero-badge reveal active">✨ ${plan.tagline || 'Trusted by 500+ happy clients'}</div>
<h1 class="hero-title reveal active">${businessName.split(' ').slice(0,2).join(' ')}<br><span class="accent">${businessName.split(' ').slice(2).join(' ') || 'Made Easy'}</span></h1>
<p class="hero-desc reveal">${hero.subheadline || plan.description || 'Premium quality service you can trust.'}</p>
<div class="hero-cta reveal">
<a href="#contact" class="btn-primary">Get Started →</a>
<a href="#services" class="btn-ghost">View Services</a>
</div>
</div>
<div class="hero-visual">
<div class="hero-card reveal-scale">
${heroImg ? `<img src="${heroImg}" class="hero-card-img" alt="${businessName}">` : ''}
<div class="hero-card-row"><span class="hero-card-label">Happy Clients</span><span class="hero-card-val">500+</span></div>
<div class="hero-card-row"><span class="hero-card-label">Rating</span><span class="hero-card-val">★ 4.9</span></div>
<div class="hero-card-row"><span class="hero-card-label">Response</span><span class="hero-card-val">Fast</span></div>
</div>
<div class="hero-float f1"><div class="float-emoji">⭐</div><div class="float-text">Top Rated</div></div>
<div class="hero-float f2"><div class="float-emoji">✅</div><div class="float-text">Verified</div></div>
</div>
</section>

<section class="features" id="features">
<h2 class="reveal">Why choose <span style="color:var(--primary)">us</span>?</h2>
<p class="sub reveal">Everything you need, all in one place</p>
<div class="feat-grid">
${(whyChooseUs.length ? whyChooseUs : ['Expert Team','Trusted Quality','Fast Service','Best Prices']).map((w,i) => `
<div class="feat-card reveal">
<div class="feat-icon">${['🎯','⭐','⚡','💎'][i] || '✨'}</div>
<div class="feat-title">${w}</div>
<div class="feat-desc">Professional quality you can count on, every single time.</div>
</div>`).join('')}
</div>
</section>

<section class="svc-list" id="services">
<h2 class="reveal">Our <span style="color:var(--primary)">Services</span></h2>
<p class="sub reveal">Simple, transparent pricing</p>
<div class="svc-cards">
${(plan.services || []).map(s => `
<div class="svc-card reveal">
<div class="svc-card-name">${s.name}</div>
<div class="svc-card-desc">${s.description || ''}</div>
<div class="svc-card-price">₦${(s.price||0).toLocaleString()}</div>
<a href="#contact" class="svc-card-btn">Book Now</a>
</div>`).join('')}
</div>
</section>

${testimonials.length > 0 ? `
<section class="testi">
<h2 class="reveal">What clients <span style="color:var(--primary)">say</span></h2>
<div class="testi-grid">
${testimonials.map(t => `
<div class="testi-card reveal">
<div class="testi-stars">★★★★★</div>
<div class="testi-text">"${t.text}"</div>
<div class="testi-author"><div class="testi-avatar">${(t.name||'C').charAt(0)}</div><div><div class="testi-name">${t.name}</div><div class="testi-loc">${t.location||plan.city||'Lagos'}</div></div></div>
</div>`).join('')}
</div>
</section>` : ''}

${faq.length > 0 ? `
<section class="faq">
<h2 class="reveal">Common <span style="color:var(--primary)">Questions</span></h2>
<div class="faq-list">
${faq.map(f => `
<div class="faq-item reveal" onclick="this.classList.toggle('open')">
<div class="faq-q">${f.q}<span class="faq-icon">+</span></div>
<div class="faq-a">${f.a}</div>
</div>`).join('')}
</div>
</section>` : ''}

<div class="cta reveal" id="contact">
<h2>Ready to get started?</h2>
<p>Join 500+ happy clients in ${plan.city || 'Lagos'}</p>
<a href="tel:${contact.phone||''}" class="btn-white">📞 Call Now</a>
</div>

<footer class="footer">
<div class="footer-left">${businessName}</div>
<div class="footer-right">© ${new Date().getFullYear()} ${businessName}. Built with <a href="https://ergio.vercel.app">ERGIO</a></div>
</footer>

<script>
const observer = new IntersectionObserver((entries) => {
entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('active'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal,.reveal-scale').forEach(el => observer.observe(el));
</script>
</body>
</html>`;
}

// ============ TRANSIX / AURORA / DARKGLASS WEBSITE GENERATOR ============
// Inspired by: Transix, Stripe, Vercel, Linear — asymmetric grid, floating UI cards,
// bold data viz, cobalt/yellow accents, glassmorphism overlays
function generateTransixHTML(plan, brand, content, colors, logoUrl, images = {}) {
  const hero = content.hero || {};
  const about = content.about || '';
  const whyChooseUs = content.whyChooseUs || [];
  const testimonials = content.testimonials || [];
  const faq = content.faq || [];
  const contact = content.contactInfo || {};

  const ds = DESIGN_STYLES[plan.designStyle] || DESIGN_STYLES.transix;
  const dp = ds.palette;
  const df = ds.fonts;

  const bg = dp.bg;
  const surface = dp.surface;
  const borderClr = dp.border;
  const textClr = dp.text;
  const mutedClr = dp.muted;
  const primaryClr = dp.primary;
  const accentClr = dp.accent;
  const ctaClr = dp.cta;
  const headingFont = df.heading || 'Space Grotesk';
  const bodyFont = df.body || 'DM Sans';

  const isDark = !bg.startsWith('#f') && !bg.startsWith('#F') && !bg.startsWith('#e') && !bg.startsWith('#E');
  const heroImg = images.hero?.[0]?.url || '';
  const aboutImg = images.about?.[0]?.url || '';
  const galleryImgs = (images.gallery || []).map(i => i.url);

  const businessName = plan.businessName || 'Your Business';
  const words = businessName.split(' ');
  const heroWord1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
  const heroWord2 = words.slice(Math.ceil(words.length / 2)).join(' ');

  // Build floating stats cards
  const floatStats = [
    { label: 'Active Users', value: '12.4K', trend: '+24%', icon: '📈' },
    { label: 'Uptime', value: '99.9%', trend: 'SLA', icon: '⚡' },
    { label: 'Revenue', value: '₦8.2M', trend: '+18%', icon: '💰' },
  ];

  // Build feature grid
  const features = (plan.services || []).slice(0, 6).map((s, i) => ({
    title: s.name,
    desc: s.description || 'Premium service tailored to your needs',
    num: '0' + (i + 1),
    icon: ['⚙️', '📊', '🛡️', '🚀', '🔗', '🎯'][i] || '✨',
  }));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.seoTitle || businessName + ' — ' + (plan.tagline || '')}</title>
  <meta name="description" content="${content.seoDescription || plan.description || ''}">
  <meta property="og:title" content="${businessName}">
  <meta property="og:description" content="${plan.tagline || ''}">
  ${heroImg ? `<meta property="og:image" content="${heroImg}">` : ''}
  <meta name="robots" content="index, follow">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    :root{
      --bg:${bg};
      --surface:${surface};
      --border:${borderClr};
      --text:${textClr};
      --muted:${mutedClr};
      --primary:${primaryClr};
      --accent:${accentClr};
      --cta:${ctaClr};
      --glass:${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)'};
      --glass-border:${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)'};
    }
    html{scroll-behavior:smooth}
    body{font-family:'${bodyFont}',sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden;line-height:1.6}
    h1,h2,h3,h4,h5,h6{font-family:'${headingFont}',sans-serif}

    ::-webkit-scrollbar{width:6px}
    ::-webkit-scrollbar-track{background:var(--bg)}
    ::-webkit-scrollbar-thumb{background:var(--primary);border-radius:3px}

    /* ANIMATIONS */
    .reveal{opacity:0;transform:translateY(32px);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1)}
    .reveal.active{opacity:1;transform:translateY(0)}
    .reveal-scale{opacity:0;transform:scale(.85);transition:all .8s cubic-bezier(.16,1,.3,1)}
    .reveal-scale.active{opacity:1;transform:scale(1)}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
    @keyframes floatRotate{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-8px) rotate(2deg)}}
    @keyframes pulseGlow{0%,100%{box-shadow:0 0 20px color-mix(in srgb,var(--primary) 30%,transparent)}50%{box-shadow:0 0 40px color-mix(in srgb,var(--primary) 50%,transparent)}}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
    @keyframes gradientMove{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
    @keyframes spinSlow{from{transform:rotate(0)}to{transform:rotate(360deg)}}

    /* AMBIENT BG */
    .ambient{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
    .blob{position:absolute;border-radius:50%;filter:blur(120px);opacity:.3;animation:gradientMove 12s ease-in-out infinite}
    .blob.b1{width:500px;height:500px;background:var(--primary);top:-150px;right:-100px;background-size:300% 300%}
    .blob.b2{width:400px;height:400px;background:var(--accent);bottom:-100px;left:-50px;animation-delay:4s;background-size:300% 300%}

    /* NAV */
    .nav{display:flex;justify-content:space-between;align-items:center;padding:1.2rem 5%;position:sticky;top:0;z-index:100;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);background:${isDark ? 'rgba(27,31,138,0.6)' : 'rgba(255,255,255,0.8)'};border-bottom:1px solid var(--glass-border)}
    .nav-logo{display:flex;align-items:center;gap:.6rem;font-weight:800;font-size:1.15rem;color:var(--text);text-decoration:none;font-family:'${headingFont}',sans-serif}
    .nav-logo-mark{width:32px;height:32px;background:var(--primary);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:900;color:${isDark ? '#1B1F8A' : '#fff'};box-shadow:0 4px 16px color-mix(in srgb,var(--primary) 40%,transparent)}
    .nav-links{display:flex;gap:2rem;align-items:center}
    .nav-links a{color:var(--muted);text-decoration:none;font-size:.9rem;font-weight:500;transition:color .2s}
    .nav-links a:hover{color:var(--text)}
    .nav-cta{background:var(--primary);color:${isDark ? '#1B1F8A' : '#fff'};padding:.55rem 1.3rem;border-radius:100px;font-weight:700;font-size:.88rem;text-decoration:none;border:none;cursor:pointer;transition:all .25s;font-family:'${headingFont}',sans-serif;box-shadow:0 4px 16px color-mix(in srgb,var(--primary) 30%,transparent)}
    .nav-cta:hover{transform:translateY(-2px);box-shadow:0 8px 24px color-mix(in srgb,var(--primary) 50%,transparent)}

    /* HERO — ASYMMETRIC */
    .hero{position:relative;z-index:1;padding:4rem 5% 2rem;overflow:hidden}
    .hero-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:3rem;align-items:center;min-height:75vh}
    .hero-left{display:flex;flex-direction:column;gap:1.5rem}
    .hero-badge{display:inline-flex;align-items:center;gap:.5rem;background:var(--glass);border:1px solid var(--glass-border);padding:.4rem 1rem;border-radius:100px;font-size:.78rem;font-weight:600;color:var(--primary);width:fit-content;backdrop-filter:blur(10px)}
    .hero-badge .dot{width:6px;height:6px;background:var(--primary);border-radius:50%;animation:pulseGlow 2s infinite}
    .hero-title{font-size:clamp(2.5rem,6vw,5rem);font-weight:800;line-height:1;letter-spacing:-.04em;color:var(--text)}
    .hero-title .accent{color:var(--primary);position:relative}
    .hero-title .accent::after{content:'';position:absolute;bottom:4px;left:0;right:0;height:6px;background:var(--accent);opacity:.4;z-index:-1;border-radius:3px}
    .hero-desc{color:var(--muted);font-size:1.05rem;max-width:440px;line-height:1.65}
    .hero-cta-row{display:flex;gap:1rem;align-items:center;flex-wrap:wrap}
    .btn-primary{background:var(--primary);color:${isDark ? '#1B1F8A' : '#fff'};padding:.8rem 2rem;border-radius:100px;font-weight:700;font-size:.95rem;text-decoration:none;border:none;cursor:pointer;transition:all .25s;font-family:'${headingFont}',sans-serif;display:inline-flex;align-items:center;gap:.5rem;box-shadow:0 4px 20px color-mix(in srgb,var(--primary) 35%,transparent)}
    .btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 32px color-mix(in srgb,var(--primary) 50%,transparent)}
    .btn-ghost{background:var(--glass);color:var(--text);padding:.8rem 2rem;border-radius:100px;font-weight:600;font-size:.95rem;text-decoration:none;border:1px solid var(--glass-border);cursor:pointer;transition:all .25s;font-family:'${headingFont}',sans-serif;backdrop-filter:blur(10px)}
    .btn-ghost:hover{border-color:var(--text);transform:translateY(-2px)}

    /* HERO RIGHT — FLOATING CARDS */
    .hero-right{position:relative;min-height:420px;display:flex;align-items:center;justify-content:center}
    .hero-card-main{width:100%;max-width:360px;background:var(--glass);border:1px solid var(--glass-border);border-radius:24px;padding:1.5rem;backdrop-filter:blur(20px);box-shadow:0 20px 60px rgba(0,0,0,.2);animation:fadeUp 1s cubic-bezier(.16,1,.3,1) .3s both;position:relative;z-index:3}
    .hero-card-main h4{font-size:1rem;margin-bottom:1rem;color:var(--text)}
    .hero-card-row{display:flex;justify-content:space-between;align-items:center;padding:.7rem 0;border-bottom:1px solid var(--glass-border)}
    .hero-card-row:last-child{border-bottom:none}
    .hero-card-label{font-size:.8rem;color:var(--muted)}
    .hero-card-val{font-size:.95rem;font-weight:700;color:var(--text)}
    .hero-card-val.accent{color:var(--primary)}
    .hero-card-chart{height:60px;display:flex;align-items:flex-end;gap:3px;margin:1rem 0}
    .hero-card-bar{flex:1;background:linear-gradient(to top,var(--primary),var(--accent));border-radius:3px;animation:float 3s ease-in-out infinite}

    .hero-float{position:absolute;background:var(--glass);border:1px solid var(--glass-border);border-radius:16px;padding:1rem 1.2rem;backdrop-filter:blur(16px);box-shadow:0 12px 40px rgba(0,0,0,.15);z-index:4}
    .hero-float.f1{top:5%;left:-8%;animation:float 5s ease-in-out infinite}
    .hero-float.f2{bottom:10%;right:-8%;animation:float 5s ease-in-out infinite 1s}
    .hero-float.f3{bottom:0;left:5%;animation:floatRotate 6s ease-in-out infinite}
    .float-icon{font-size:1.4rem;margin-bottom:.3rem}
    .float-label{font-size:.68rem;color:var(--muted);font-weight:500}
    .float-value{font-size:1.2rem;font-weight:800;color:var(--text)}
    .float-trend{font-size:.72rem;font-weight:700;color:var(--primary)}

    /* TRUST BAR */
    .trust-bar{display:flex;gap:2rem;align-items:center;padding:1.5rem 5%;border-top:1px solid var(--glass-border);border-bottom:1px solid var(--glass-border);flex-wrap:wrap;position:relative;z-index:1}
    .trust-label{font-size:.78rem;color:var(--muted);font-weight:600;white-space:nowrap}
    .trust-item{font-size:.9rem;font-weight:700;color:var(--text);opacity:.7;transition:opacity .2s}
    .trust-item:hover{opacity:1}

    /* ASYMMETRIC FEATURE GRID */
    .features{padding:5rem 5%;max-width:1200px;margin:0 auto;position:relative;z-index:1}
    .features-header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:2.5rem;flex-wrap:wrap;gap:1rem}
    .features-header h2{font-size:clamp(1.8rem,4vw,2.8rem);font-weight:800;letter-spacing:-.03em;max-width:500px;line-height:1.1}
    .features-header h2 .accent{color:var(--primary)}
    .features-header p{color:var(--muted);font-size:.95rem;max-width:300px}

    .feat-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:1rem}
    .feat-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:2rem;transition:all .35s cubic-bezier(.16,1,.3,1);position:relative;overflow:hidden}
    .feat-card:hover{transform:translateY(-4px);border-color:var(--primary);box-shadow:0 12px 40px color-mix(in srgb,var(--primary) 15%,transparent)}
    .feat-card.lg{grid-column:span 6;min-height:280px;display:flex;flex-direction:column;justify-content:space-between}
    .feat-card.md{grid-column:span 4}
    .feat-card.sm{grid-column:span 3}
    .feat-card.wide{grid-column:span 8}
    .feat-card.tall{grid-column:span 4;min-height:280px}
    .feat-card.accent{background:var(--primary);color:${isDark ? '#1B1F8A' : '#fff'}}
    .feat-card.accent .feat-num,.feat-card.accent .feat-desc{color:${isDark ? 'rgba(27,31,138,0.7)' : 'rgba(255,255,255,0.7)'}}
    .feat-card.accent .feat-icon{background:${isDark ? 'rgba(27,31,138,0.2)' : 'rgba(255,255,255,0.2)'}}
    .feat-num{font-size:.75rem;font-weight:700;color:var(--muted);letter-spacing:.1em;margin-bottom:.8rem}
    .feat-icon{width:44px;height:44px;border-radius:12px;background:var(--glass);display:flex;align-items:center;justify-content:center;font-size:1.3rem;margin-bottom:1rem}
    .feat-title{font-size:1.2rem;font-weight:700;margin-bottom:.5rem;letter-spacing:-.02em}
    .feat-card.lg .feat-title{font-size:1.6rem}
    .feat-desc{font-size:.9rem;color:var(--muted);line-height:1.6}
    .feat-card.lg .feat-desc{font-size:1rem}
    .feat-card.accent .feat-icon{background:${isDark ? 'rgba(27,31,138,0.2)' : 'rgba(255,255,255,0.2)'}}

    /* IMAGE BANNER */
    .banner{position:relative;z-index:1;margin:0 5%;border-radius:24px;overflow:hidden;min-height:320px;background:var(--surface)}
    .banner img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0}
    .banner-overlay{position:absolute;inset:0;background:linear-gradient(to right,${bg}cc,${bg}33);display:flex;align-items:center;padding:3rem}
    .banner-content{max-width:500px}
    .banner-content h2{font-size:clamp(1.6rem,3vw,2.4rem);font-weight:800;letter-spacing:-.03em;margin-bottom:.5rem}
    .banner-content p{color:var(--muted);font-size:.95rem}

    /* SERVICES TABLE */
    .services{padding:5rem 5%;max-width:1200px;margin:0 auto;position:relative;z-index:1}
    .services h2{font-size:clamp(1.8rem,4vw,2.8rem);font-weight:800;letter-spacing:-.03em;margin-bottom:.5rem}
    .services h2 .accent{color:var(--primary)}
    .services .sub{color:var(--muted);margin-bottom:2rem}
    .svc-table{border:1px solid var(--border);border-radius:20px;overflow:hidden}
    .svc-row{display:grid;grid-template-columns:auto 1fr auto auto;gap:1.5rem;align-items:center;padding:1.5rem 2rem;border-bottom:1px solid var(--border);transition:background .2s;cursor:pointer}
    .svc-row:last-child{border-bottom:none}
    .svc-row:hover{background:var(--surface)}
    .svc-num{font-size:.75rem;font-weight:700;color:var(--muted);width:28px}
    .svc-name{font-weight:700;font-size:1rem}
    .svc-desc{font-size:.85rem;color:var(--muted);margin-top:.2rem}
    .svc-price{font-size:1.1rem;font-weight:800;color:var(--primary);font-family:'${headingFont}',sans-serif;white-space:nowrap}
    .svc-arrow{color:var(--muted);font-size:1.3rem;transition:all .2s}
    .svc-row:hover .svc-arrow{color:var(--primary);transform:translateX(4px)}

    /* TESTIMONIALS */
    .testi{padding:4rem 5%;max-width:1200px;margin:0 auto;position:relative;z-index:1}
    .testi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;margin-top:2rem}
    .testi-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:2rem;transition:all .3s}
    .testi-card:hover{border-color:var(--primary);transform:translateY(-3px)}
    .testi-stars{color:var(--primary);font-size:1.1rem;margin-bottom:1rem}
    .testi-text{font-size:.95rem;line-height:1.7;margin-bottom:1.2rem;color:var(--text)}
    .testi-author{display:flex;align-items:center;gap:.8rem}
    .testi-avatar{width:42px;height:42px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:800;color:${isDark ? '#1B1F8A' : '#fff'};font-size:1rem}
    .testi-name{font-weight:700;font-size:.92rem}
    .testi-loc{font-size:.8rem;color:var(--muted)}

    /* FAQ */
    .faq{padding:4rem 5%;max-width:1200px;margin:0 auto;position:relative;z-index:1}
    .faq h2{font-size:clamp(1.8rem,4vw,2.8rem);font-weight:800;letter-spacing:-.03em;margin-bottom:.5rem}
    .faq h2 .accent{color:var(--primary)}
    .faq-list{display:flex;flex-direction:column;gap:.75rem;margin-top:2rem}
    .faq-item{background:var(--surface);border:1px solid var(--border);border-radius:14px;overflow:hidden;transition:border-color .2s}
    .faq-item:hover{border-color:var(--primary)}
    .faq-q{display:flex;justify-content:space-between;align-items:center;padding:1.3rem 1.5rem;cursor:pointer;font-weight:600;font-size:.95rem;gap:1rem;transition:color .2s}
    .faq-q:hover{color:var(--primary)}
    .faq-icon{font-size:1.2rem;color:var(--muted);transition:transform .3s;flex-shrink:0}
    .faq-item.open .faq-icon{transform:rotate(45deg);color:var(--primary)}
    .faq-a{padding:0 1.5rem;max-height:0;overflow:hidden;transition:max-height .4s ease,padding .4s ease;color:var(--muted);font-size:.9rem;line-height:1.7}
    .faq-item.open .faq-a{max-height:300px;padding-bottom:1.3rem}

    /* CTA BANNER */
    .cta-banner{margin:0 5% 4rem;padding:3.5rem;border-radius:24px;background:var(--primary);display:flex;justify-content:space-between;align-items:center;gap:2rem;flex-wrap:wrap;position:relative;z-index:1;overflow:hidden}
    .cta-banner::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,transparent,color-mix(in srgb,var(--accent) 30%,transparent));opacity:.5}
    .cta-banner > *{position:relative;z-index:1}
    .cta-banner h2{font-size:clamp(1.6rem,3vw,2.4rem);font-weight:800;letter-spacing:-.03em;color:${isDark ? '#1B1F8A' : '#fff'};max-width:450px;line-height:1.1}
    .cta-banner p{color:${isDark ? 'rgba(27,31,138,0.7)' : 'rgba(255,255,255,0.8)'};font-size:.95rem;margin-top:.5rem}
    .cta-actions{display:flex;gap:1rem;align-items:center;flex-wrap:wrap}
    .btn-dark{background:${isDark ? '#1B1F8A' : '#111'};color:#fff;padding:.9rem 2rem;border-radius:100px;font-weight:700;font-size:.95rem;text-decoration:none;transition:opacity .2s;border:none;cursor:pointer;font-family:'${headingFont}',sans-serif'}
    .btn-dark:hover{opacity:.85}
    .contact-mini{display:flex;flex-direction:column;gap:.4rem}
    .contact-mini a{color:${isDark ? 'rgba(27,31,138,0.7)' : 'rgba(255,255,255,0.8)'};font-size:.85rem;font-weight:500;text-decoration:none}
    .contact-mini a:hover{color:${isDark ? '#1B1F8A' : '#fff'}}

    /* FOOTER */
    .footer{padding:2rem 5%;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;position:relative;z-index:1}
    .footer-left{font-weight:800;font-size:.95rem;font-family:'${headingFont}',sans-serif}
    .footer-right{font-size:.8rem;color:var(--muted)}
    .footer-right a{color:var(--primary);text-decoration:none;font-weight:600}

    /* GALLERY */
    .gallery{padding:4rem 5%;max-width:1200px;margin:0 auto;position:relative;z-index:1}
    .gallery-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;margin-top:2rem}
    .gallery-item{border-radius:16px;overflow:hidden;aspect-ratio:1;position:relative}
    .gallery-item img{width:100%;height:100%;object-fit:cover;transition:transform .5s cubic-bezier(.16,1,.3,1)}
    .gallery-item:hover img{transform:scale(1.08)}

    @media(max-width:768px){
      .hero-grid{grid-template-columns:1fr;gap:2rem}
      .hero-right{min-height:300px}
      .feat-card.lg,.feat-card.md,.feat-card.sm,.feat-card.wide,.feat-card.tall{grid-column:span 12}
      .nav-links{display:none}
      .svc-row{grid-template-columns:auto 1fr auto;gap:.8rem;padding:1.2rem 1rem}
      .svc-desc{display:none}
      .cta-banner{padding:2rem;flex-direction:column;text-align:center}
      .footer{flex-direction:column;text-align:center}
      .trust-bar{gap:1rem}
    }
  </style>
</head>
<body>

  <!-- AMBIENT BG -->
  <div class="ambient">
    <div class="blob b1"></div>
    <div class="blob b2"></div>
  </div>

  <!-- NAV -->
  <nav class="nav">
    <a href="#" class="nav-logo">
      <div class="nav-logo-mark">${businessName.charAt(0)}</div>
      ${businessName}
    </a>
    <div class="nav-links">
      <a href="#features">Features</a>
      <a href="#services">Services</a>
      <a href="#gallery">Gallery</a>
      <a href="#faq">FAQ</a>
    </div>
    <a href="#contact" class="nav-cta">Get Started</a>
  </nav>

  <!-- HERO ASYMMETRIC -->
  <section class="hero">
    <div class="hero-grid">
      <div class="hero-left">
        <div class="hero-badge reveal active">
          <span class="dot"></span>
          ${plan.tagline || 'Trusted by 500+ businesses in ' + (plan.city || 'Nigeria')}
        </div>
        <h1 class="hero-title reveal active">
          ${heroWord1}<br><span class="accent">${heroWord2 || 'Simplified'}</span>
        </h1>
        <p class="hero-desc reveal">${hero.subheadline || plan.description || 'The all-in-one platform built for modern African businesses.'}</p>
        <div class="hero-cta-row reveal">
          <a href="#contact" class="btn-primary">Get Started →</a>
          <a href="#features" class="btn-ghost">Explore Features</a>
        </div>
      </div>
      <div class="hero-right">
        <div class="hero-card-main">
          <h4>Live Dashboard</h4>
          <div class="hero-card-row">
            <span class="hero-card-label">Total Revenue</span>
            <span class="hero-card-val accent">₦8.2M</span>
          </div>
          <div class="hero-card-row">
            <span class="hero-card-label">Active Clients</span>
            <span class="hero-card-val">1,247</span>
          </div>
          <div class="hero-card-row">
            <span class="hero-card-label">Growth</span>
            <span class="hero-card-val accent">+24%</span>
          </div>
          <div class="hero-card-chart">
            ${[40,60,45,70,55,80,65,90,75,95].map((h,i) => `<div class="hero-card-bar" style="height:${h}%;animation-delay:${i*0.15}s"></div>`).join('')}
          </div>
        </div>
        ${floatStats.slice(0,2).map((s,i) => `
        <div class="hero-float f${i+1}">
          <div class="float-icon">${s.icon}</div>
          <div class="float-label">${s.label}</div>
          <div class="float-value">${s.value}</div>
          <div class="float-trend">${s.trend}</div>
        </div>`).join('')}
        <div class="hero-float f3">
          <div class="float-icon">⚡</div>
          <div class="float-label">Response Time</div>
          <div class="float-value">0.3s</div>
        </div>
      </div>
    </div>
  </section>

  <!-- TRUST BAR -->
  <div class="trust-bar reveal">
    <span class="trust-label">TRUSTED BY:</span>
    <span class="trust-item">Paystack</span>
    <span class="trust-item">Flutterwave</span>
    <span class="trust-item">GTBank</span>
    <span class="trust-item">Access Bank</span>
    <span class="trust-item">Kuda</span>
  </div>

  <!-- ASYMMETRIC FEATURE GRID -->
  <section class="features" id="features">
    <div class="features-header reveal">
      <h2>Everything you need <br>to <span class="accent">scale fast</span></h2>
      <p>Built for African businesses. Designed to grow with you from your first client to your thousandth.</p>
    </div>
    <div class="feat-grid">
      ${features.slice(0,2).map((f,i) => `
        <div class="feat-card ${i===0?'lg':'tall'} reveal-scale">
          <div>
            <div class="feat-num">${f.num}</div>
            <div class="feat-icon">${f.icon}</div>
            <div class="feat-title">${f.title}</div>
            <div class="feat-desc">${f.desc}</div>
          </div>
          ${i===0 ? `<div style="display:flex;gap:.5rem;margin-top:1rem"><span style="background:var(--glass);padding:.3rem .8rem;border-radius:100px;font-size:.75rem;font-weight:600">✓ Included</span><span style="background:var(--glass);padding:.3rem .8rem;border-radius:100px;font-size:.75rem;font-weight:600">⚡ Real-time</span></div>` : ''}
        </div>`).join('')}
      ${features.slice(2,4).map((f,i) => `
        <div class="feat-card ${i===0?'accent':''} ${i===0?'md':'sm'} reveal-scale">
          <div class="feat-num">${f.num}</div>
          <div class="feat-icon">${f.icon}</div>
          <div class="feat-title">${f.title}</div>
          <div class="feat-desc">${f.desc}</div>
        </div>`).join('')}
      ${features.slice(4,6).map(f => `
        <div class="feat-card sm reveal-scale">
          <div class="feat-num">${f.num}</div>
          <div class="feat-icon">${f.icon}</div>
          <div class="feat-title">${f.title}</div>
          <div class="feat-desc">${f.desc}</div>
        </div>`).join('')}
    </div>
  </section>

  <!-- IMAGE BANNER -->
  ${heroImg ? `
  <div class="banner reveal">
    <img src="${heroImg}" alt="${businessName}">
    <div class="banner-overlay">
      <div class="banner-content">
        <h2>Built different. Built better.</h2>
        <p>${typeof about === 'string' ? about.slice(0,150) : plan.description || ''}</p>
      </div>
    </div>
  </div>` : ''}

  <!-- SERVICES TABLE -->
  <section class="services" id="services">
    <h2 class="reveal">Our <span class="accent">Services</span></h2>
    <p class="sub reveal">Transparent pricing. No hidden fees.</p>
    <div class="svc-table">
      ${(plan.services || []).map((s,i) => `
        <div class="svc-row reveal">
          <span class="svc-num">0${i+1}</span>
          <div>
            <div class="svc-name">${s.name}</div>
            <div class="svc-desc">${s.description || ''}</div>
          </div>
          <span class="svc-price">₦${(s.price || 0).toLocaleString()}</span>
          <span class="svc-arrow">→</span>
        </div>`).join('')}
    </div>
  </section>

  <!-- GALLERY -->
  ${galleryImgs.length > 0 ? `
  <section class="gallery" id="gallery">
    <h2 class="reveal" style="font-size:clamp(1.8rem,4vw,2.8rem);font-weight:800;letter-spacing:-.03em">Our <span style="color:var(--primary)">Work</span></h2>
    <div class="gallery-grid">
      ${galleryImgs.slice(0,8).map(url => `
        <div class="gallery-item reveal-scale">
          <img src="${url}" alt="Portfolio">
        </div>`).join('')}
    </div>
  </section>` : ''}

  <!-- TESTIMONIALS -->
  ${testimonials.length > 0 ? `
  <section class="testi" id="testimonials">
    <h2 class="reveal" style="font-size:clamp(1.8rem,4vw,2.8rem);font-weight:800;letter-spacing:-.03em">What clients <span style="color:var(--primary)">say</span></h2>
    <div class="testi-grid">
      ${testimonials.map(t => `
        <div class="testi-card reveal">
          <div class="testi-stars">★★★★★</div>
          <div class="testi-text">"${t.text}"</div>
          <div class="testi-author">
            <div class="testi-avatar">${(t.name||'C').charAt(0)}</div>
            <div>
              <div class="testi-name">${t.name}</div>
              <div class="testi-loc">${t.location || plan.city || 'Lagos'}</div>
            </div>
          </div>
        </div>`).join('')}
    </div>
  </section>` : ''}

  <!-- FAQ -->
  ${faq.length > 0 ? `
  <section class="faq" id="faq">
    <h2 class="reveal">Common <span class="accent">Questions</span></h2>
    <div class="faq-list">
      ${faq.map(f => `
        <div class="faq-item reveal" onclick="this.classList.toggle('open')">
          <div class="faq-q">${f.q}<span class="faq-icon">+</span></div>
          <div class="faq-a">${f.a}</div>
        </div>`).join('')}
    </div>
  </section>` : ''}

  <!-- CTA BANNER -->
  <div class="cta-banner reveal" id="contact">
    <div>
      <h2>Ready to transform your business?</h2>
      <p>Join 500+ businesses already growing with ${businessName}.</p>
    </div>
    <div class="cta-actions">
      <a href="tel:${contact.phone || ''}" class="btn-dark">📞 Call Now</a>
      ${contact.whatsapp ? `<a href="https://wa.me/${(contact.whatsapp||'').replace(/[^0-9]/g,'')}" style="color:${isDark?'#1B1F8A':'#fff'};font-weight:600;font-size:.88rem;text-decoration:none">💬 WhatsApp →</a>` : ''}
    </div>
  </div>

  <!-- FOOTER -->
  <footer class="footer">
    <div class="footer-left">${businessName}</div>
    <div class="footer-right">© ${new Date().getFullYear()} ${businessName}. Built with <a href="https://ergio.vercel.app">ERGIO</a></div>
  </footer>

  <script>
    // Scroll reveal
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('active'); });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal,.reveal-scale').forEach(el => observer.observe(el));
  </script>
</body>
</html>`;
}

// ============ EDITORIAL / TYPOGRAPHIC WEBSITE GENERATOR ============
// Inspired by: Flowbank, Linear, Vercel, Resend, Arc — bold oversized type, pill tags, split hero
function generateEditorialHTML(plan, brand, content, colors, logoUrl, images = {}) {
  const hero = content.hero || {};
  const about = content.about || '';
  const whyChooseUs = content.whyChooseUs || [];
  const testimonials = content.testimonials || [];
  const faq = content.faq || [];
  const contact = content.contactInfo || {};

  const ds = DESIGN_STYLES[plan.designStyle] || DESIGN_STYLES.editorial;
  const dp = ds.palette;
  const df = ds.fonts;

  const bg = dp.bg;
  const surface = dp.surface;
  const borderClr = dp.border;
  const textClr = dp.text;
  const mutedClr = dp.muted;
  const primaryClr = dp.primary;
  const accentClr = dp.accent;
  const ctaClr = dp.cta;
  const headingFont = df.heading || 'Space Grotesk';
  const bodyFont = df.body || 'DM Sans';

  const isLight = bg.startsWith('#f') || bg.startsWith('#FA') || bg.startsWith('#fe') || bg.startsWith('#FF');
  const heroImg = images.hero?.[0]?.url || '';
  const aboutImg = images.about?.[0]?.url || '';
  const galleryImgs = (images.gallery || []).map(i => i.url);

  // Build dynamic pill tags from services + keywords
  const pillTags = [
    ...(plan.services || []).slice(0, 3).map(s => s.name),
    ...(plan.seoKeywords || []).slice(0, 4),
    plan.city || 'Lagos',
    '24/7',
  ].filter(Boolean).slice(0, 10);

  // Build feature stats from services
  const stats = [
    { val: (plan.services || []).length + '+', label: 'Services' },
    { val: '500+', label: 'Happy Clients' },
    { val: '5★', label: 'Rating' },
    { val: '24/7', label: 'Support' },
  ];

  const businessName = plan.businessName || 'Your Business';
  // Split business name for oversized display — first word big, rest smaller
  const words = businessName.split(' ');
  const heroWord1 = words.slice(0, Math.ceil(words.length / 2)).join(' ').toUpperCase();
  const heroWord2 = words.slice(Math.ceil(words.length / 2)).join(' ').toUpperCase();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.seoTitle || businessName + ' — ' + (plan.tagline || '')}</title>
  <meta name="description" content="${content.seoDescription || plan.description || ''}">
  <meta property="og:title" content="${businessName}">
  <meta property="og:description" content="${plan.tagline || ''}">
  <meta property="og:image" content="${heroImg}">
  <meta name="robots" content="index, follow">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    :root{
      --bg:${bg};
      --surface:${surface};
      --border:${borderClr};
      --text:${textClr};
      --muted:${mutedClr};
      --primary:${primaryClr};
      --accent:${accentClr};
      --cta:${ctaClr};
    }
    html{scroll-behavior:smooth}
    body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden;line-height:1.6}
    h1,h2,h3,h4,h5,h6{font-family:'Space Grotesk',sans-serif}

    /* SCROLLBAR */
    ::-webkit-scrollbar{width:6px}
    ::-webkit-scrollbar-track{background:var(--bg)}
    ::-webkit-scrollbar-thumb{background:var(--primary);border-radius:3px}

    /* REVEAL ANIMATIONS */
    .reveal{opacity:0;transform:translateY(32px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
    .reveal.active{opacity:1;transform:translateY(0)}
    .reveal-left{opacity:0;transform:translateX(-40px);transition:all .7s cubic-bezier(.16,1,.3,1)}
    .reveal-left.active{opacity:1;transform:translateX(0)}
    @keyframes slideIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
    @keyframes pill-scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}

    /* ── NAV ── */
    .nav{display:flex;justify-content:space-between;align-items:center;padding:1.2rem 5%;position:sticky;top:0;z-index:100;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);background:${isLight ? 'rgba(250,250,248,0.88)' : 'rgba(26,35,24,0.88)'};border-bottom:1px solid var(--border)}
    .nav-logo{display:flex;align-items:center;gap:.5rem;font-weight:700;font-size:1.1rem;color:var(--text);text-decoration:none;font-family:'Space Grotesk',sans-serif}
    .nav-logo-icon{width:28px;height:28px;background:var(--primary);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:900;color:${isLight ? '#111' : '#1a2318'}}
    .nav-links{display:flex;gap:2rem}
    .nav-links a{color:var(--muted);text-decoration:none;font-size:.9rem;font-weight:500;transition:color .2s}
    .nav-links a:hover{color:var(--text)}
    .nav-cta{background:transparent;color:var(--text);padding:.5rem 1.2rem;border-radius:100px;border:1px solid var(--text);font-size:.88rem;font-weight:600;cursor:pointer;text-decoration:none;transition:all .25s;font-family:'Space Grotesk',sans-serif}
    .nav-cta:hover{background:var(--text);color:var(--bg)}

    /* ── HERO EDITORIAL ── */
    .hero{position:relative;padding:3rem 5% 0;overflow:hidden;min-height:88vh;display:flex;flex-direction:column}
    .hero-inner{display:grid;grid-template-columns:1fr 1fr;gap:0;flex:1;align-items:end}
    .hero-left{padding-bottom:3rem;display:flex;flex-direction:column;justify-content:flex-end;gap:1.5rem}
    .hero-eyebrow{display:inline-flex;align-items:center;gap:.5rem;background:${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'};border:1px solid var(--border);color:var(--muted);padding:.35rem .9rem;border-radius:100px;font-size:.82rem;font-weight:500;width:fit-content}
    .hero-eyebrow span{width:6px;height:6px;background:var(--primary);border-radius:50%;animation:float 2s ease-in-out infinite}
    .hero-headline{font-size:clamp(3.5rem,9vw,8rem);font-weight:700;line-height:.95;letter-spacing:-.04em;color:var(--text)}
    .hero-headline em{color:var(--primary);font-style:normal}
    .hero-sub{color:var(--muted);font-size:1rem;max-width:380px;line-height:1.65;font-weight:400}
    .hero-actions{display:flex;gap:1rem;align-items:center;flex-wrap:wrap}
    .btn-solid{background:var(--primary);color:${isLight ? '#111' : '#1a2318'};padding:.75rem 1.8rem;border-radius:100px;font-weight:700;font-size:.92rem;text-decoration:none;border:none;cursor:pointer;transition:all .25s;font-family:'Space Grotesk',sans-serif;display:inline-flex;align-items:center;gap:.5rem}
    .btn-solid:hover{transform:scale(1.04);box-shadow:0 8px 30px color-mix(in srgb, ${primaryClr} 40%, transparent)}
    .btn-ghost{background:transparent;color:var(--text);padding:.75rem 1.8rem;border-radius:100px;font-weight:600;font-size:.92rem;text-decoration:none;border:1px solid var(--border);cursor:pointer;transition:all .25s;font-family:'Space Grotesk',sans-serif}
    .btn-ghost:hover{border-color:var(--text);background:${isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)'}}
    
    /* ── HERO RIGHT — MOCKUP ── */
    .hero-right{display:flex;align-items:flex-end;justify-content:center;position:relative;padding-bottom:0}
    .hero-mockup{width:100%;max-width:420px;border-radius:20px 20px 0 0;overflow:hidden;position:relative;animation:fadeUp 1s cubic-bezier(.16,1,.3,1) .3s both}
    .hero-mockup img{width:100%;height:520px;object-fit:cover;object-position:top;display:block}
    .hero-mockup-overlay{position:absolute;bottom:0;left:0;right:0;height:120px;background:linear-gradient(transparent,var(--bg))}
    .hero-float-card{position:absolute;background:${isLight ? '#fff' : surface};border:1px solid var(--border);border-radius:14px;padding:.8rem 1.1rem;backdrop-filter:blur(12px);box-shadow:0 8px 32px rgba(0,0,0,.15)}
    .hero-float-card.top-left{top:10%;left:-5%;animation:float 5s ease-in-out infinite}
    .hero-float-card.bottom-right{bottom:15%;right:-5%;animation:float 5s ease-in-out infinite .8s}
    .float-label{font-size:.7rem;color:var(--muted);font-weight:500;margin-bottom:.2rem}
    .float-value{font-size:1.1rem;font-weight:700;color:var(--text)}
    .float-value span{color:var(--primary)}

    /* ── PILL TICKER ── */
    .pill-ticker{padding:.8rem 0;overflow:hidden;border-top:1px solid var(--border);border-bottom:1px solid var(--border);margin-top:auto;position:relative}
    .pill-ticker::before,.pill-ticker::after{content:'';position:absolute;top:0;width:80px;height:100%;z-index:2}
    .pill-ticker::before{left:0;background:linear-gradient(to right,var(--bg),transparent)}
    .pill-ticker::after{right:0;background:linear-gradient(to left,var(--bg),transparent)}
    .pill-track{display:flex;gap:.75rem;width:max-content;animation:pill-scroll 20s linear infinite}
    .pill-track:hover{animation-play-state:paused}
    .pill-tag{display:inline-flex;align-items:center;gap:.4rem;background:${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'};border:1px solid var(--border);color:var(--text);padding:.4rem 1rem;border-radius:100px;font-size:.82rem;font-weight:500;white-space:nowrap;cursor:default;transition:all .2s}
    .pill-tag:hover{background:var(--primary);color:${isLight ? '#111' : '#1a2318'};border-color:var(--primary)}
    .pill-tag.accent{background:var(--primary);color:${isLight ? '#111' : '#1a2318'};border-color:var(--primary);font-weight:700}
    .pill-dot{width:5px;height:5px;border-radius:50%;background:currentColor;opacity:.6}

    /* ── STATS BAR ── */
    .stats-bar{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--border);border-bottom:1px solid var(--border);margin:4rem 5%}
    .stat-item{padding:2rem 1rem;text-align:center;border-right:1px solid var(--border)}
    .stat-item:last-child{border-right:none}
    .stat-num{font-size:2.2rem;font-weight:800;color:var(--primary);font-family:'Space Grotesk',sans-serif;letter-spacing:-.03em}
    .stat-label{font-size:.82rem;color:var(--muted);font-weight:500;margin-top:.2rem}

    /* ── SECTION STYLES ── */
    .section{padding:5rem 5%;max-width:1200px;margin:0 auto}
    .section-label{font-size:.78rem;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:.12em;margin-bottom:.8rem}
    .section-title{font-size:clamp(2rem,4vw,3.2rem);font-weight:700;line-height:1.1;letter-spacing:-.03em;margin-bottom:1rem}
    .section-title em{color:var(--primary);font-style:normal}

    /* ── BENTO GRID ── */
    .bento{padding:4rem 5%;max-width:1200px;margin:0 auto}
    .bento-grid{display:grid;grid-template-columns:repeat(12,1fr);grid-template-rows:auto;gap:1rem}
    .bento-cell{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:2rem;overflow:hidden;position:relative;transition:border-color .3s,transform .3s}
    .bento-cell:hover{border-color:var(--primary);transform:translateY(-3px)}
    .bento-cell.span-8{grid-column:span 8}
    .bento-cell.span-4{grid-column:span 4}
    .bento-cell.span-6{grid-column:span 6}
    .bento-cell.span-5{grid-column:span 5}
    .bento-cell.span-7{grid-column:span 7}
    .bento-cell.span-12{grid-column:span 12}
    .bento-cell.accent-bg{background:var(--primary);color:${isLight ? '#111' : '#1a2318'}}
    .bento-cell.accent-bg .bento-muted,.bento-cell.accent-bg .bento-sub{color:${isLight ? 'rgba(0,0,0,0.6)' : 'rgba(26,35,24,0.7)'}}
    .bento-tag{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--primary);margin-bottom:.5rem}
    .bento-cell.accent-bg .bento-tag{color:${isLight ? 'rgba(0,0,0,0.7)' : 'rgba(26,35,24,0.8)'}}
    .bento-title{font-size:1.4rem;font-weight:700;margin-bottom:.5rem;font-family:'Space Grotesk',sans-serif;letter-spacing:-.02em}
    .bento-sub{font-size:.9rem;color:var(--muted)}
    .bento-big{font-size:3rem;font-weight:800;font-family:'Space Grotesk',sans-serif;letter-spacing:-.04em;color:var(--primary)}
    .bento-img{width:100%;height:180px;object-fit:cover;border-radius:12px;margin-top:1rem}
    .bento-pill{display:inline-flex;align-items:center;gap:.4rem;background:${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)'};padding:.3rem .7rem;border-radius:100px;font-size:.75rem;font-weight:600;margin:.2rem;color:var(--text)}
    .bento-cell.accent-bg .bento-pill{background:rgba(0,0,0,0.15);color:${isLight ? '#111' : '#1a2318'}}

    /* ── SERVICES LIST ── */
    .services-list{display:flex;flex-direction:column;gap:0;border:1px solid var(--border);border-radius:20px;overflow:hidden;margin-top:2rem}
    .service-row{display:flex;justify-content:space-between;align-items:center;padding:1.5rem 2rem;border-bottom:1px solid var(--border);transition:background .2s;cursor:pointer}
    .service-row:last-child{border-bottom:none}
    .service-row:hover{background:${isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'}}
    .service-row-left{display:flex;align-items:center;gap:1rem}
    .service-num{font-size:.75rem;font-weight:700;color:var(--muted);width:24px}
    .service-row-name{font-weight:600;font-size:1rem}
    .service-row-desc{font-size:.85rem;color:var(--muted);margin-top:.2rem}
    .service-row-price{font-size:1.1rem;font-weight:800;color:var(--primary);font-family:'Space Grotesk',sans-serif;white-space:nowrap}
    .service-arrow{font-size:1.2rem;color:var(--muted);transition:transform .2s,color .2s;margin-left:1rem}
    .service-row:hover .service-arrow{transform:translateX(4px);color:var(--primary)}

    /* ── TESTIMONIALS ── */
    .testimonials-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem;margin-top:2.5rem}
    .testi-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:2rem;transition:border-color .3s}
    .testi-card:hover{border-color:var(--primary)}
    .testi-stars{color:${accentClr};font-size:1rem;margin-bottom:1rem}
    .testi-text{color:var(--text);font-size:.95rem;line-height:1.7;margin-bottom:1.5rem;font-style:italic}
    .testi-author{display:flex;align-items:center;gap:.8rem}
    .testi-avatar{width:40px;height:40px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;color:${isLight ? '#111' : '#1a2318'}}
    .testi-name{font-weight:700;font-size:.92rem}
    .testi-loc{font-size:.8rem;color:var(--muted)}

    /* ── FAQ ── */
    .faq-list{display:flex;flex-direction:column;gap:.75rem;margin-top:2rem}
    .faq-row{background:var(--surface);border:1px solid var(--border);border-radius:14px;overflow:hidden}
    .faq-q{display:flex;justify-content:space-between;align-items:center;padding:1.3rem 1.5rem;cursor:pointer;font-weight:600;font-size:.95rem;gap:1rem;transition:color .2s}
    .faq-q:hover{color:var(--primary)}
    .faq-icon{font-size:1.2rem;color:var(--muted);transition:transform .3s;flex-shrink:0}
    .faq-row.open .faq-icon{transform:rotate(45deg);color:var(--primary)}
    .faq-a{padding:0 1.5rem;max-height:0;overflow:hidden;transition:max-height .4s ease,padding .4s ease;color:var(--muted);font-size:.9rem;line-height:1.7}
    .faq-row.open .faq-a{max-height:300px;padding-bottom:1.3rem}

    /* ── CONTACT CTA ── */
    .contact-cta{margin:0 5% 5rem;background:var(--primary);border-radius:24px;padding:4rem;display:flex;justify-content:space-between;align-items:center;gap:2rem;flex-wrap:wrap}
    .contact-cta h2{font-size:clamp(1.8rem,4vw,2.8rem);font-weight:800;letter-spacing:-.03em;color:${isLight ? '#111' : '#1a2318'};max-width:500px;line-height:1.1}
    .contact-cta p{color:${isLight ? 'rgba(0,0,0,0.6)' : 'rgba(26,35,24,0.7)'};margin-top:.5rem;font-size:1rem}
    .contact-cta-right{display:flex;flex-direction:column;gap:1rem;min-width:220px}
    .btn-dark{background:${isLight ? '#111' : '#1a2318'};color:${isLight ? '#fff' : textClr};padding:.9rem 2rem;border-radius:100px;font-weight:700;font-size:.95rem;text-decoration:none;text-align:center;transition:opacity .2s;font-family:'Space Grotesk',sans-serif;border:none;cursor:pointer}
    .btn-dark:hover{opacity:.85}
    .contact-info-row{display:flex;flex-direction:column;gap:.5rem}
    .contact-link{display:flex;align-items:center;gap:.6rem;color:${isLight ? 'rgba(0,0,0,0.7)' : 'rgba(26,35,24,0.8)'};font-size:.88rem;font-weight:500;text-decoration:none}
    .contact-link:hover{color:${isLight ? '#111' : '#1a2318'}}

    /* ── FOOTER ── */
    .footer{padding:2rem 5%;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem}
    .footer-left{font-weight:700;font-size:.95rem;font-family:'Space Grotesk',sans-serif}
    .footer-right{font-size:.8rem;color:var(--muted)}
    .footer-right a{color:var(--primary);text-decoration:none;font-weight:600}

    /* ── MOBILE ── */
    @media(max-width:768px){
      .hero-inner{grid-template-columns:1fr}
      .hero-right{display:none}
      .hero-headline{font-size:clamp(3rem,14vw,6rem)}
      .stats-bar{grid-template-columns:repeat(2,1fr)}
      .bento-cell.span-8,.bento-cell.span-4,.bento-cell.span-6,.bento-cell.span-5,.bento-cell.span-7{grid-column:span 12}
      .contact-cta{padding:2.5rem;flex-direction:column}
      .nav-links{display:none}
      .footer{flex-direction:column;text-align:center}
    }
  </style>
</head>
<body>

  <!-- NAV -->
  <nav class="nav">
    <a href="#" class="nav-logo">
      <div class="nav-logo-icon">${businessName.charAt(0)}</div>
      ${businessName}
    </a>
    <div class="nav-links">
      <a href="#about">About</a>
      <a href="#services">Services</a>
      <a href="#gallery">Gallery</a>
      <a href="#contact">Contact</a>
    </div>
    <a href="#contact" class="nav-cta">Get Started</a>
  </nav>

  <!-- HERO EDITORIAL -->
  <section class="hero">
    <div class="hero-inner">
      <div class="hero-left">
        <div class="hero-eyebrow reveal active">
          <span></span>
          ${plan.tagline || 'Trusted by 500+ clients in ' + (plan.city || 'Lagos')}
        </div>
        <h1 class="hero-headline reveal active">
          ${heroWord1 ? heroWord1 + '<br>' : ''}${heroWord2 ? '<em>' + heroWord2 + '</em>' : ''}
        </h1>
        <p class="hero-sub reveal">${hero.subheadline || plan.description || 'Trusted protection and expert guidance for your business.'}</p>
        <div class="hero-actions reveal">
          <a href="#contact" class="btn-solid">Get Started →</a>
          <a href="#services" class="btn-ghost">View Services</a>
        </div>
      </div>
      <div class="hero-right">
        ${heroImg ? `
        <div class="hero-mockup">
          <img src="${heroImg}" alt="${businessName}">
          <div class="hero-mockup-overlay"></div>
        </div>` : ''}
        <div class="hero-float-card top-left">
          <div class="float-label">Total Clients</div>
          <div class="float-value"><span>500+</span> happy</div>
        </div>
        <div class="hero-float-card bottom-right">
          <div class="float-label">Rating</div>
          <div class="float-value"><span>★ 4.9</span> /5</div>
        </div>
      </div>
    </div>

    <!-- PILL TICKER -->
    <div class="pill-ticker">
      <div class="pill-track">
        ${[...pillTags, ...pillTags].map((tag, i) => `
          <span class="pill-tag${i % 4 === 1 ? ' accent' : ''}">
            <span class="pill-dot"></span>${tag}
          </span>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- STATS BAR -->
  <div class="stats-bar reveal">
    ${stats.map(s => `
      <div class="stat-item">
        <div class="stat-num">${s.val}</div>
        <div class="stat-label">${s.label}</div>
      </div>
    `).join('')}
  </div>

  <!-- BENTO GRID (About + Features) -->
  <div class="bento" id="about">
    <div class="bento-grid">
      <div class="bento-cell span-8 reveal">
        <div class="bento-tag">About Us</div>
        <div class="bento-title">${businessName}</div>
        <p class="bento-sub">${typeof about === 'string' ? about.slice(0, 280) : plan.description || ''}</p>
        ${aboutImg ? `<img src="${aboutImg}" alt="${businessName}" class="bento-img">` : ''}
      </div>
      <div class="bento-cell span-4 accent-bg reveal">
        <div class="bento-tag">Our Edge</div>
        <div class="bento-big">${stats[0].val}</div>
        <div class="bento-title">${stats[0].label}</div>
        <div class="bento-sub" style="margin-top:1rem">${whyChooseUs.slice(0,2).join(' · ')}</div>
      </div>
      ${(whyChooseUs || []).slice(0, 4).map((w, i) => `
        <div class="bento-cell span-${i % 2 === 0 ? '6' : '6'} reveal">
          <div class="bento-tag">${['01','02','03','04'][i]}</div>
          <div class="bento-title">${w}</div>
          <div class="bento-sub">Professional quality you can trust</div>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- SERVICES as editorial list -->
  <section class="section" id="services">
    <div class="section-label reveal">What We Do</div>
    <h2 class="section-title reveal">Our <em>Services</em></h2>
    <div class="services-list">
      ${(plan.services || []).map((s, i) => `
        <div class="service-row reveal">
          <div class="service-row-left">
            <span class="service-num">0${i+1}</span>
            <div>
              <div class="service-row-name">${s.name}</div>
              <div class="service-row-desc">${s.description || ''}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:1rem">
            <span class="service-row-price">₦${(s.price || 0).toLocaleString()}</span>
            <span class="service-arrow">→</span>
          </div>
        </div>
      `).join('')}
    </div>
  </section>

  <!-- GALLERY (if images available) -->
  ${(images.gallery || []).length > 0 ? `
  <section class="section" id="gallery" style="padding-top:2rem">
    <div class="section-label reveal">Portfolio</div>
    <h2 class="section-title reveal">Our <em>Work</em></h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem;margin-top:2rem">
      ${(images.gallery || []).slice(0,6).map(img => `
        <div style="border-radius:16px;overflow:hidden;aspect-ratio:1;position:relative" class="reveal">
          <img src="${img.url}" alt="Work" style="width:100%;height:100%;object-fit:cover;transition:transform .5s cubic-bezier(.16,1,.3,1)" onmouseover="this.style.transform='scale(1.07)'" onmouseout="this.style.transform='scale(1)'">
        </div>
      `).join('')}
    </div>
  </section>` : ''}

  <!-- TESTIMONIALS -->
  ${testimonials.length > 0 ? `
  <section class="section" id="testimonials">
    <div class="section-label reveal">Reviews</div>
    <h2 class="section-title reveal">What <em>Clients</em> Say</h2>
    <div class="testimonials-grid">
      ${testimonials.map(t => `
        <div class="testi-card reveal">
          <div class="testi-stars">★★★★★</div>
          <div class="testi-text">"${t.text}"</div>
          <div class="testi-author">
            <div class="testi-avatar">${(t.name || 'C').charAt(0)}</div>
            <div>
              <div class="testi-name">${t.name}</div>
              <div class="testi-loc">${t.location || plan.city || 'Lagos'}</div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </section>` : ''}

  <!-- FAQ -->
  ${faq.length > 0 ? `
  <section class="section">
    <div class="section-label reveal">FAQ</div>
    <h2 class="section-title reveal">Common <em>Questions</em></h2>
    <div class="faq-list">
      ${faq.map((f, i) => `
        <div class="faq-row reveal" onclick="this.classList.toggle('open')">
          <div class="faq-q">${f.q}<span class="faq-icon">+</span></div>
          <div class="faq-a">${f.a}</div>
        </div>
      `).join('')}
    </div>
  </section>` : ''}

  <!-- CONTACT CTA — BIG EDITORIAL BLOCK -->
  <div class="contact-cta reveal" id="contact">
    <div>
      <h2>Ready to get <br>started with us?</h2>
      <p>${contact.address || (plan.city || 'Lagos') + ', Nigeria'}</p>
    </div>
    <div class="contact-cta-right">
      <a href="tel:${contact.phone || ''}" class="btn-dark">📞 Call Us Now</a>
      <div class="contact-info-row">
        ${contact.whatsapp ? `<a href="https://wa.me/${(contact.whatsapp||'').replace(/[^0-9]/g,'')}" class="contact-link">💬 WhatsApp Us</a>` : ''}
        ${contact.email ? `<a href="mailto:${contact.email}" class="contact-link">✉️ ${contact.email}</a>` : ''}
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <footer class="footer">
    <div class="footer-left">${businessName}</div>
    <div class="footer-right">© ${new Date().getFullYear()} ${businessName}. Powered by <a href="https://ergio.vercel.app">ERGIO</a></div>
  </footer>

  <script>
    // Scroll reveal
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('active'); });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal,.reveal-left').forEach(el => observer.observe(el));

    // Nav scroll effect
    const nav = document.querySelector('.nav');
    window.addEventListener('scroll', () => {
      nav.style.borderBottomColor = window.scrollY > 20 ? 'var(--border)' : 'transparent';
    });
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
