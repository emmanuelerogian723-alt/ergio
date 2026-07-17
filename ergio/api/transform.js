// ========================================
// ERGIO API — /api/transform
// Website Transformer: takes an old/ugly website URL,
// scrapes it, and regenerates it as a modern Ergio website
// ========================================

import { searxngSearch, scrapePage, callGroq, callGroqFast, success, error, corsHeaders, generateSlug, generateLogoUrl } from '../lib/ergio.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return error(res, 'Use POST', 405);

  try {
    const { url, style, improvements } = req.body;
    if (!url) return error(res, 'Website URL is required', 400);

    // Set up SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const send = (type, data) => {
      res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
    };

    // ============ STEP 1: SCRAPE OLD WEBSITE ============
    send('status', { task: `Scraping ${url}...`, step: 1, total: 5 });

    const scraped = await scrapePage(url, { timeout: 12000 });

    if (!scraped) {
      send('error', { message: 'Could not access that website. Check the URL and try again.' });
      return res.end();
    }

    send('scraped', {
      title: scraped.title,
      description: scraped.metaDescription,
      contentPreview: scraped.content.substring(0, 500),
      emails: scraped.emails,
      phones: scraped.phones,
      socials: scraped.socials
    });

    // ============ STEP 2: AI ANALYZE & PLAN ============
    send('status', { task: 'AI analyzing your current website...', step: 2, total: 5 });

    const analysisPrompt = `You are ERGIO's website transformation AI. Analyze this scraped website content and create a plan to transform it into a modern, beautiful website.

Current website content:
Title: ${scraped.title}
Description: ${scraped.metaDescription}
Content: ${scraped.content.substring(0, 3000)}

Contact info found:
- Emails: ${(scraped.emails || []).join(', ')}
- Phones: ${(scraped.phones || []).join(', ')}
- Socials: ${JSON.stringify(scraped.socials)}

User's desired improvements: ${improvements || 'Make it modern, professional, and mobile-friendly'}

Return ONLY valid JSON:
{
  "businessName": "extracted or inferred business name",
  "tagline": "a catchy new tagline",
  "type": "business type",
  "description": "improved business description",
  "brandColors": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "bg": "#09090B" },
  "city": "extracted city or 'Nigeria'",
  "services": [{ "name": "service name", "description": "description", "price": 0 }],
  "websiteType": "standard or 3d",
  "improvements": ["list of what was improved"],
  "seoKeywords": ["keywords"]
}`;

    let plan;
    try {
      const planResult = await callGroq([
        { role: 'system', content: 'Return only valid JSON. No markdown.' },
        { role: 'user', content: analysisPrompt }
      ], { temperature: 0.7, response_format: { type: 'json_object' } });

      plan = JSON.parse(planResult);
    } catch (err) {
      const match = (err.message || '').match(/\{[\s\S]*\}/);
      plan = match ? JSON.parse(match[0]) : { businessName: scraped.title, type: 'Business', description: scraped.metaDescription };
    }

    // Use scraped contact info if available
    plan.contact = {
      email: (scraped.emails || [])[0] || '',
      phone: (scraped.phones || [])[0] || '',
      whatsapp: (scraped.phones || [])[0] || '',
      ...plan.contact
    };

    send('plan', { plan });

    // ============ STEP 3: GENERATE BRAND ============
    send('status', { task: 'Generating fresh brand identity...', step: 3, total: 5 });

    const logoUrl = generateLogoUrl(plan.businessName, style || 'modern');

    send('brand', {
      logoUrl,
      improvements: plan.improvements || ['Modern design', 'Mobile responsive', 'Better SEO', 'Professional branding']
    });

    // ============ STEP 4: GENERATE CONTENT ============
    send('status', { task: 'Writing improved website copy...', step: 4, total: 5 });

    const contentPrompt = `Write website copy for the transformed version of "${plan.businessName}", a ${plan.type}.

Original content to preserve and improve: ${scraped.content.substring(0, 2000)}

Return ONLY valid JSON:
{
  "hero": { "headline": "catchy headline", "subheadline": "subheading", "cta": "Book Now" },
  "about": "2-3 paragraphs about the business",
  "servicesHtml": "HTML for services section",
  "whyChooseUs": ["reason1", "reason2", "reason3", "reason4"],
  "testimonials": [{ "text": "review", "name": "name", "location": "city" }],
  "faq": [{ "q": "question", "a": "answer" }],
  "seoTitle": "SEO optimized title",
  "seoDescription": "SEO meta description"
}`;

    let content;
    try {
      const contentResult = await callGroq([
        { role: 'system', content: 'Return only valid JSON.' },
        { role: 'user', content: contentPrompt }
      ], { temperature: 0.7, response_format: { type: 'json_object' }, maxTokens: 2048 });

      content = JSON.parse(contentResult);
    } catch (err) {
      content = { hero: { headline: plan.tagline, subheadline: plan.description, cta: 'Book Now' }, about: plan.description };
    }

    // ============ STEP 5: BUILD NEW WEBSITE ============
    send('status', { task: 'Building your transformed website...', step: 5, total: 5 });

    // Import the website HTML generator from generate.js logic
    const is3D = plan.websiteType === '3d';
    const colors = plan.brandColors || { primary: '#00D9FF', secondary: '#09090B', accent: '#10F981', bg: '#09090B' };

    const websiteHtml = generateTransformedHTML(plan, content, colors, logoUrl, is3D);

    send('website', { html: websiteHtml, logoUrl, improvements: plan.improvements });

    // Save to Supabase
    try {
      const { getSupabase } = await import('../lib/ergio.js');
      const supabase = getSupabase(req);
      await supabase.from('generated_websites').insert({
        business_name: plan.businessName,
        business_type: plan.type,
        html_content: websiteHtml,
        brand_colors: colors,
        website_type: is3D ? '3d' : 'standard',
        created_date: new Date().toISOString()
      });
    } catch (dbErr) {
      console.error('Save error:', dbErr.message);
    }

    send('complete', {
      message: 'Website transformed successfully!',
      businessName: plan.businessName,
      improvements: plan.improvements || [],
      originalUrl: url
    });

    res.end();

  } catch (err) {
    console.error('Transform error:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', data: { message: err.message } })}\n\n`);
    res.end();
  }
}

function generateTransformedHTML(plan, content, colors, logoUrl, is3D) {
  const hero = content.hero || {};
  const about = content.about || '';
  const whyChooseUs = content.whyChooseUs || [];
  const testimonials = content.testimonials || [];
  const contact = plan.contact || {};
  const c = colors || {};

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
  ${is3D ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>' : ''}
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    :root{--primary:${c.primary || '#00D9FF'};--secondary:${c.secondary || '#09090B'};--accent:${c.accent || '#10F981'};--bg:${c.bg || '#09090B'}}
    body{font-family:'Inter',-apple-system,sans-serif;background:var(--bg);color:#F8FAFC;line-height:1.6;overflow-x:hidden}
    ${is3D ? '#three-canvas{position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;opacity:0.3}' : ''}
    .nav{display:flex;justify-content:space-between;align-items:center;padding:1.5rem 5%;position:sticky;top:0;background:rgba(9,9,11,0.85);backdrop-filter:blur(20px);z-index:100}
    .nav-logo{display:flex;align-items:center;gap:.6rem;font-weight:800;font-size:1.3rem;color:#fff;text-decoration:none}
    .nav-logo img{width:36px;height:36px;border-radius:8px}
    .nav-links a{color:#94A3B8;text-decoration:none;margin-left:2rem;font-size:.95rem;transition:color .3s}
    .nav-links a:hover{color:var(--primary)}
    .nav-cta{background:linear-gradient(135deg,var(--primary),var(--accent));color:#09090B;padding:.6rem 1.5rem;border-radius:100px;font-weight:700;text-decoration:none;font-size:.9rem}
    .hero{text-align:center;padding:${is3D ? '8' : '6'}rem 5% 4rem;max-width:900px;margin:0 auto}
    .hero h1{font-size:clamp(2rem,5vw,${is3D ? '4' : '3.5'}rem);font-weight:800;margin-bottom:1rem;line-height:1.1}
    .hero h1 span{background:linear-gradient(135deg,var(--primary),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .hero p{font-size:1.2rem;color:#94A3B8;max-width:600px;margin:0 auto 2rem}
    .hero-cta{display:inline-flex;gap:1rem;flex-wrap:wrap;justify-content:center}
    .btn-primary{background:linear-gradient(135deg,var(--primary),var(--accent));color:#09090B;padding:1rem 2rem;border-radius:100px;font-weight:700;text-decoration:none;border:none;cursor:pointer;font-size:1rem;transition:all .3s;box-shadow:0 10px 40px rgba(0,217,255,0.3)}
    .btn-primary:hover{transform:scale(1.05)}
    .btn-outline{background:rgba(255,255,255,0.05);color:#fff;padding:1rem 2rem;border-radius:100px;border:1px solid rgba(255,255,255,0.2);text-decoration:none;font-weight:600;font-size:1rem;backdrop-filter:blur(10px)}
    .transform-badge{display:inline-block;padding:.4rem 1rem;background:linear-gradient(135deg,var(--accent),var(--primary));border-radius:20px;font-size:.8rem;font-weight:700;color:#09090B;margin-bottom:1.5rem}
    section{padding:4rem 5%;max-width:1200px;margin:0 auto}
    .section-title{font-size:2rem;font-weight:800;margin-bottom:.5rem;text-align:center}
    .section-title span{background:linear-gradient(135deg,var(--primary),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .section-sub{color:#94A3B8;text-align:center;margin-bottom:3rem}
    .services-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem}
    .service-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:2rem;transition:all .3s}
    .service-card:hover{border-color:var(--primary);transform:translateY(-4px)}
    .service-card h3{font-size:1.3rem;margin-bottom:.5rem}
    .service-card p{color:#94A3B8;margin-bottom:1rem}
    .service-price{font-size:1.5rem;font-weight:800;color:var(--accent)}
    .why-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1.5rem}
    .why-item{text-align:center;padding:1.5rem}
    .why-item .icon{font-size:2rem;margin-bottom:.5rem}
    .testimonials{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem}
    .testimonial{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:2rem}
    .testimonial p{color:#CBD5E1;font-style:italic;margin-bottom:1rem}
    .contact{background:linear-gradient(135deg,rgba(0,217,255,0.1),rgba(0,255,157,0.05));border-radius:24px;padding:3rem;text-align:center;margin:2rem 5%}
    .contact-info{display:flex;justify-content:center;gap:2rem;flex-wrap:wrap;margin-top:1.5rem}
    .contact-info a{color:var(--primary);text-decoration:none}
    .footer{text-align:center;padding:2rem;color:#64748B;font-size:.9rem;border-top:1px solid rgba(255,255,255,0.08)}
    .footer a{color:var(--primary);text-decoration:none}
    @keyframes fadeInUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
    @media(max-width:768px){.nav-links{display:none}}
  </style>
</head>
<body>
  ${is3D ? '<canvas id="three-canvas"></canvas>' : ''}
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
    <div class="transform-badge">✨ Transformed by ERGIO AI</div>
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
      ${(plan.services || []).map(s => `
        <div class="service-card">
          <h3>${s.name || ''}</h3>
          <p>${s.description || ''}</p>
          ${s.price ? `<div class="service-price">₦${(s.price || 0).toLocaleString()}</div>` : ''}
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
          <p>"${t.text || ''}"</p>
          <div style="font-weight:700">${t.name || ''}</div>
          <div style="color:#94A3B8;font-size:.9rem">${t.location || ''}</div>
        </div>
      `).join('')}
    </div>
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
    <a href="#" class="btn-primary" onclick="alert('Booking powered by ERGIO');return false;">Book Appointment</a>
  </section>

  <div class="footer">
    <p>© ${new Date().getFullYear()} ${plan.businessName}. Transformed by <a href="https://ergio.vercel.app">ERGIO</a></p>
  </div>

  ${is3D ? `
  <script>
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({canvas:document.getElementById('three-canvas'),alpha:true,antialias:true});
    renderer.setSize(innerWidth, innerHeight);
    camera.position.z = 50;
    for(let i=0;i<60;i++){
      const g=new THREE.SphereGeometry(Math.random()*0.5+0.1,8,8);
      const m=new THREE.MeshBasicMaterial({color:new THREE.Color('${c.primary || '#00D9FF'}'),transparent:true,opacity:0.6});
      const p=new THREE.Mesh(g,m);
      p.position.set((Math.random()-0.5)*100,(Math.random()-0.5)*100,(Math.random()-0.5)*100);
      p.speed=Math.random()*0.02+0.01;
      scene.add(p);
    }
    let mx=0,my=0;
    addEventListener('mousemove',e=>{mx=(e.clientX/innerWidth-0.5)*2;my=(e.clientY/innerHeight-0.5)*2});
    function animate(){
      requestAnimationFrame(animate);
      scene.children.forEach(p=>{p.position.y+=p.speed;p.rotation.x+=p.speed;if(p.position.y>50)p.position.y=-50});
      camera.position.x+=(mx*10-camera.position.x)*0.05;
      camera.position.y+=(-my*10-camera.position.y)*0.05;
      camera.lookAt(scene.position);
      renderer.render(scene,camera);
    }
    animate();
    addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
  <\/script>` : ''}
</body>
</html>`;
}
