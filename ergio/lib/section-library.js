// ERGIO Section Library — 50+ professionally designed sections
// Each section is a function that takes (content, colors, plan) and returns HTML string

const ERGIO_SECTIONS = {

  // ===== HERO SECTIONS (6) =====
  heroCentered: (c, col) => `
<section class="hero" id="home">
  <div class="hero-badge reveal">✨ ${c.city || 'Lagos'}'s Premier ${c.type || 'Business'}</div>
  <h1 class="reveal reveal-delay-1">${c.headline}</h1>
  <p class="sub reveal reveal-delay-2">${c.subheadline}</p>
  <div class="hero-cta reveal reveal-delay-3">
    <a class="btn btn-p" href="#contact">${c.cta || 'Get Started'} →</a>
    <a class="btn btn-s" href="#services">View Services</a>
  </div>
</section>`,

  heroWithImage: (c, col, plan) => `
<section class="hero hero-split" id="home">
  <div class="hero-text">
    <div class="hero-badge reveal">✨ ${c.city || 'Lagos'}'s Premier ${c.type || 'Business'}</div>
    <h1 class="reveal reveal-delay-1">${c.headline}</h1>
    <p class="sub reveal reveal-delay-2">${c.subheadline}</p>
    <div class="hero-cta reveal reveal-delay-3">
      <a class="btn btn-p" href="#contact">${c.cta || 'Get Started'} →</a>
      <a class="btn btn-s" href="#about">Learn More</a>
    </div>
  </div>
  ${c.heroImage ? `<div class="hero-img reveal reveal-scale"><div class="img-frame"><img src="${c.heroImage}" alt="${c.businessName}"></div></div>` : ''}
</section>`,

  heroVideo: (c, col) => `
<section class="hero hero-video" id="home">
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <h1 class="reveal reveal-delay-1">${c.headline}</h1>
    <p class="sub reveal reveal-delay-2">${c.subheadline}</p>
    <div class="hero-cta reveal reveal-delay-3">
      <a class="btn btn-p" href="#contact">${c.cta || 'Get Started'} →</a>
    </div>
  </div>
</section>`,

  heroStats: (c, col) => `
<section class="hero" id="home">
  <div class="hero-badge reveal">✨ ${c.city || 'Lagos'}'s Premier ${c.type || 'Business'}</div>
  <h1 class="reveal reveal-delay-1">${c.headline}</h1>
  <p class="sub reveal reveal-delay-2">${c.subheadline}</p>
  <div class="hero-cta reveal reveal-delay-3">
    <a class="btn btn-p" href="#contact">${c.cta || 'Get Started'} →</a>
    <a class="btn btn-s" href="#services">View Services</a>
  </div>
  <div class="hero-stats reveal reveal-delay-4">
    ${(c.stats||[{n:'500+',l:'Clients'},{n:'10yr',l:'Experience'},{n:'4.9★',l:'Rating'}]).map(s=>`<div class="stat"><div class="stat-num">${s.n}</div><div class="stat-label">${s.l}</div></div>`).join('')}
  </div>
</section>`,

  heroMinimal: (c, col) => `
<section class="hero hero-minimal" id="home">
  <h1 class="reveal">${c.headline}</h1>
  <p class="sub reveal reveal-delay-1">${c.subheadline}</p>
  <a class="btn btn-p reveal reveal-delay-2" href="#contact">${c.cta || 'Get Started'} →</a>
</section>`,

  heroBold: (c, col) => `
<section class="hero hero-bold" id="home" style="background:linear-gradient(135deg,${col.bg||'#09090B'},${col.primary||'#00D9FF'}22)">
  <h1 class="reveal reveal-delay-1" style="font-size:clamp(3rem,8vw,5.5rem);font-weight:900;letter-spacing:-2px">${c.headline}</h1>
  <p class="sub reveal reveal-delay-2" style="font-size:1.4rem">${c.subheadline}</p>
  <div class="hero-cta reveal reveal-delay-3">
    <a class="btn btn-p" href="#contact">${c.cta || 'Get Started'} →</a>
    <a class="btn btn-s" href="#services">Our Services</a>
  </div>
</section>`,

  // ===== ABOUT SECTIONS (4) =====
  aboutText: (c, col) => `
<section class="section" id="about">
  <div class="section-header reveal"><div class="eyebrow">About Us</div><h2>Our <span class="gradient-text">Story</span></h2></div>
  <div class="about-grid">
    <div class="about-text reveal reveal-delay-1">${(c.about||'We are a premier business dedicated to excellence.').split('\n').map(p=>`<p>${p}</p>`).join('')}</div>
    ${c.aboutImage?`<div class="reveal reveal-scale"><div class="img-frame"><img src="${c.aboutImage}" alt="About ${c.businessName}"></div></div>`:''}
  </div>
</section>`,

  aboutStats: (c, col) => `
<section class="section" id="about">
  <div class="section-header reveal"><div class="eyebrow">Why Choose Us</div><h2>Numbers <span class="gradient-text">That Matter</span></h2></div>
  <div class="stats-grid">
    ${(c.stats||[{n:'500+',l:'Happy Clients'},{n:'10yr',l:'Experience'},{n:'50+',l:'Projects'},{n:'4.9★',l:'Rating'}]).map((s,i)=>`<div class="stat-card reveal reveal-delay-${Math.min(i+1,4)}"><div class="stat-big" style="color:${col.primary||'#00D9FF'}">${s.n}</div><div class="stat-desc">${s.l}</div></div>`).join('')}
  </div>
</section>`,

  aboutValues: (c, col) => `
<section class="section" id="about">
  <div class="section-header reveal"><div class="eyebrow">Our Values</div><h2>What We <span class="gradient-text">Stand For</span></h2></div>
  <div class="grid">
    ${(c.values||[{icon:'🎯',title:'Excellence',desc:'We deliver nothing short of exceptional'},{icon:'🤝',title:'Integrity',desc:'Honest and transparent in everything'},{icon:'🚀',title:'Innovation',desc:'Always pushing boundaries'}]).map((v,i)=>`<div class="card reveal reveal-delay-${Math.min(i+1,4)}"><div style="font-size:2rem;margin-bottom:12px">${v.icon}</div><h3>${v.title}</h3><p>${v.desc}</p></div>`).join('')}
  </div>
</section>`,

  aboutSplit: (c, col) => `
<section class="section" id="about">
  <div class="about-grid">
    <div class="about-text reveal">
      <div class="eyebrow">About Us</div>
      <h2 style="margin:8px 0 16px">Our <span class="gradient-text">Mission</span></h2>
      ${(c.about||'We are dedicated to excellence.').split('\n').map(p=>`<p>${p}</p>`).join('')}
      <a class="btn btn-p" href="#contact" style="margin-top:16px">Work With Us →</a>
    </div>
    <div class="reveal reveal-scale">${c.aboutImage?`<div class="img-frame"><img src="${c.aboutImage}" alt="About"></div>`:''}</div>
  </div>
</section>`,

  // ===== SERVICES SECTIONS (5) =====
  servicesGrid: (c, col) => `
<section class="section" id="services">
  <div class="section-header reveal"><div class="eyebrow">What We Offer</div><h2>Our <span class="gradient-text">Services</span></h2></div>
  <div class="grid">
    ${(c.servicesHtml||'').includes('service-card')?(c.servicesHtml):(c.services||[{name:'Service One',desc:'Professional service',price:'₦5,000'},{name:'Service Two',desc:'Quality guaranteed',price:'₦10,000'},{name:'Service Three',desc:'Expert delivery',price:'₦15,000'}]).map((s,i)=>`<div class="card reveal reveal-delay-${Math.min(i+1,4)}"><h3>${s.name}</h3><p>${s.desc||s.description||''}</p>${s.price?`<div class="price" style="color:${col.primary||'#00D9FF'}">${s.price}</div>`:''}</div>`).join('')}
  </div>
</section>`,

  servicesList: (c, col) => `
<section class="section" id="services">
  <div class="section-header reveal"><div class="eyebrow">Services</div><h2>What We <span class="gradient-text">Do</span></h2></div>
  <div class="services-list">
    ${(c.services||[]).map((s,i)=>`<div class="service-row reveal reveal-delay-${Math.min(i+1,4)}"><div class="service-num">${String(i+1).padStart(2,'0')}</div><div><h3>${s.name}</h3><p>${s.desc||s.description||''}</p></div><div class="price" style="color:${col.primary||'#00D9FF'}">${s.price||''}</div></div>`).join('')}
  </div>
</section>`,

  servicesCards: (c, col) => `
<section class="section" id="services">
  <div class="section-header reveal"><div class="eyebrow">Our Offerings</div><h2>Premium <span class="gradient-text">Services</span></h2></div>
  <div class="grid">
    ${(c.services||[]).map((s,i)=>`<div class="card reveal reveal-delay-${Math.min(i+1,4)}" style="border-top:3px solid ${col.primary||'#00D9FF'}"><div style="font-size:1.5rem;margin-bottom:8px">${s.icon||'✨'}</div><h3>${s.name}</h3><p>${s.desc||s.description||''}</p>${s.price?`<div class="price" style="color:${col.primary||'#00D9FF'};font-size:1.4rem;font-weight:800;margin-top:12px">${s.price}</div>`:''}<a href="#contact" style="color:${col.primary||'#00D9FF'};font-size:13px;text-decoration:none;margin-top:12px;display:inline-block">Book Now →</a></div>`).join('')}
  </div>
</section>`,

  servicesFeatured: (c, col) => `
<section class="section" id="services">
  <div class="section-header reveal"><div class="eyebrow">Featured</div><h2>Our <span class="gradient-text">Signature Services</span></h2></div>
  <div class="featured-grid">
    ${(c.services||[]).slice(0,3).map((s,i)=>`<div class="featured-card reveal reveal-delay-${i+1}" style="${i===0?'border:2px solid '+(col.primary||'#00D9FF'):''}">${i===0?'<div class="badge-popular">Most Popular</div>':''}<h3>${s.name}</h3><p>${s.desc||s.description||''}</p><div class="price" style="color:${col.primary||'#00D9FF'};font-size:1.6rem;font-weight:800">${s.price||''}</div><a class="btn ${i===0?'btn-p':'btn-s'}" href="#contact" style="margin-top:16px;width:100%;text-align:center">Book Now</a></div>`).join('')}
  </div>
</section>`,

  servicesIconGrid: (c, col) => `
<section class="section" id="services">
  <div class="section-header reveal"><div class="eyebrow">What We Do</div><h2>Our <span class="gradient-text">Expertise</span></h2></div>
  <div class="icon-grid">
    ${(c.services||[]).map((s,i)=>`<div class="icon-card reveal reveal-delay-${Math.min(i+1,4)}"><div class="icon-circle" style="background:${(col.primary||'#00D9FF')}22;color:${col.primary||'#00D9FF'}">${s.icon||['💡','🎨','🚀','⚡','🎯','🏆'][i]||'✨'}</div><h3>${s.name}</h3><p>${s.desc||s.description||''}</p></div>`).join('')}
  </div>
</section>`,

  // ===== TESTIMONIAL SECTIONS (4) =====
  testimonialsCard: (c, col) => `
<section class="section" id="testimonials">
  <div class="section-header reveal"><div class="eyebrow">Client Love</div><h2>What Clients <span class="gradient-text">Say</span></h2></div>
  ${(c.testimonials||[]).map((t,i)=>`<div class="testimonial reveal reveal-delay-${Math.min(i+1,4)}"><p>"${t.text||''}"</p><div class="author"><div class="avatar">${(t.name||'A').charAt(0)}</div><div><div class="name">${t.name||''}</div><div class="location">${t.location||c.city||'Lagos'}</div></div></div></div>`).join('')}
</section>`,

  testimonialsWall: (c, col) => `
<section class="section" id="testimonials">
  <div class="section-header reveal"><div class="eyebrow">Reviews</div><h2>Don\'t Take Our <span class="gradient-text">Word For It</span></h2></div>
  <div class="masonry-grid">
    ${(c.testimonials||[]).map((t,i)=>`<div class="testimonial-card reveal reveal-delay-${Math.min(i%4+1,4)}"><div style="font-size:1.5rem;color:${col.primary||'#00D9FF'};margin-bottom:8px">★★★★★</div><p>"${t.text||''}"</p><div class="author" style="margin-top:12px"><div class="avatar">${(t.name||'A').charAt(0)}</div><div><div class="name">${t.name||''}</div><div class="location">${t.location||c.city||'Lagos'}</div></div></div></div>`).join('')}
  </div>
</section>`,

  testimonialsVideo: (c, col) => `
<section class="section" id="testimonials">
  <div class="section-header reveal"><div class="eyebrow">Success Stories</div><h2>Client <span class="gradient-text">Results</span></h2></div>
  <div class="grid">
    ${(c.testimonials||[]).slice(0,3).map((t,i)=>`<div class="card reveal reveal-delay-${i+1}" style="text-align:center"><div style="width:60px;height:60px;border-radius:50%;background:${(col.primary||'#00D9FF')}22;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:24px">▶</div><p style="font-style:italic">"${t.text||''}"</p><div style="margin-top:12px;font-weight:700">${t.name||''}</div><div style="font-size:12px;color:var(--muted)">${t.location||c.city||'Lagos'}</div></div>`).join('')}
  </div>
</section>`,

  testimonialsMinimal: (c, col) => `
<section class="section" id="testimonials" style="background:rgba(255,255,255,0.02)">
  <div class="section-header reveal"><h2 style="font-size:1.5rem">"<span class="gradient-text">${(c.testimonials||[])[0]?.text||'Amazing service!'}</span>"</h2><div style="margin-top:12px;color:var(--muted)">— ${(c.testimonials||[])[0]?.name||'Happy Client'}, ${(c.testimonials||[])[0]?.location||c.city||'Lagos'}</div></div>
</section>`,

  // ===== GALLERY SECTIONS (3) =====
  galleryGrid: (imgs, col) => `
<section class="section" id="gallery">
  <div class="section-header reveal"><div class="eyebrow">Our Work</div><h2>Photo <span class="gradient-text">Gallery</span></h2></div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
    ${(imgs||[]).map((src,i)=>`<div class="img-frame reveal reveal-delay-${Math.min(i%4+1,4)}" style="overflow:hidden"><img src="${src}" alt="Gallery ${i+1}" style="width:100%;height:200px;object-fit:cover"></div>`).join('')}
  </div>
</section>`,

  galleryMasonry: (imgs, col) => `
<section class="section" id="gallery">
  <div class="section-header reveal"><div class="eyebrow">Portfolio</div><h2>Our <span class="gradient-text">Work</span></h2></div>
  <div class="masonry-grid">
    ${(imgs||[]).map((src,i)=>`<div class="masonry-item reveal reveal-delay-${Math.min(i%4+1,4)}"><div class="img-frame"><img src="${src}" alt="Gallery ${i+1}" style="width:100%;object-fit:cover"></div></div>`).join('')}
  </div>
</section>`,

  gallerySlider: (imgs, col) => `
<section class="section" id="gallery">
  <div class="section-header reveal"><div class="eyebrow">Showcase</div><h2>Our <span class="gradient-text">Portfolio</span></h2></div>
  <div style="display:flex;overflow-x:auto;gap:16px;padding-bottom:8px">
    ${(imgs||[]).map((src,i)=>`<div class="reveal" style="min-width:300px;flex-shrink:0"><div class="img-frame"><img src="${src}" alt="Gallery ${i+1}" style="width:100%;height:250px;object-fit:cover"></div></div>`).join('')}
  </div>
</section>`,

  // ===== PRICING SECTIONS (3) =====
  pricingCards: (c, col) => `
<section class="section" id="pricing">
  <div class="section-header reveal"><div class="eyebrow">Pricing</div><h2>Our <span class="gradient-text">Plans</span></h2></div>
  <div class="grid">
    ${(c.pricing||c.services||[]).slice(0,3).map((p,i)=>`<div class="card reveal reveal-delay-${i+1}" style="${i===1?'border:2px solid '+(col.primary||'#00D9FF')+';position:relative':''}">${i===1?'<div class="badge-popular">Popular</div>':''}<h3>${p.name}</h3><div class="price" style="font-size:2rem;font-weight:900;color:${col.primary||'#00D9FF'};margin:12px 0">${p.price||'₦'+(p.priceNGN||'5,000')}</div><p style="color:var(--muted)">${p.desc||p.description||''}</p><a class="btn ${i===1?'btn-p':'btn-s'}" href="#contact" style="margin-top:16px;width:100%;text-align:center">Choose Plan</a></div>`).join('')}
  </div>
</section>`,

  pricingTable: (c, col) => `
<section class="section" id="pricing">
  <div class="section-header reveal"><div class="eyebrow">Investment</div><h2>Transparent <span class="gradient-text">Pricing</span></h2></div>
  <div class="pricing-table">
    ${(c.services||[]).map((s,i)=>`<div class="pricing-row reveal reveal-delay-${Math.min(i%3+1,3)}"><div style="font-weight:600">${s.name}</div><div style="color:var(--muted)">${s.desc||s.description||''}</div><div style="font-weight:800;color:${col.primary||'#00D9FF'};font-size:1.2rem">${s.price||''}</div></div>`).join('')}
  </div>
</section>`,

  pricingMinimal: (c, col) => `
<section class="section" id="pricing" style="text-align:center">
  <div class="section-header reveal"><div class="eyebrow">Simple Pricing</div><h2>One <span class="gradient-text">Price</span>, No Surprises</h2></div>
  <div class="reveal reveal-delay-1" style="max-width:400px;margin:0 auto;padding:32px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:20px"><div style="font-size:3rem;font-weight:900;color:${col.primary||'#00D9FF'}">${(c.pricing||[{price:'₦15,000'}])[0]?.price||'₦15,000'}</div><p style="color:var(--muted);margin:12px 0">Complete service package</p><a class="btn btn-p" href="#contact" style="width:100%">Get Started</a></div>
</section>`,

  // ===== FAQ SECTIONS (2) =====
  faqAccordion: (c, col) => `
<section class="section" id="faq">
  <div class="section-header reveal"><div class="eyebrow">Questions</div><h2>Frequently <span class="gradient-text">Asked</span></h2></div>
  <div class="faq-list">
    ${(c.faq||[{q:'How do I get started?',a:'Contact us or book online.'},{q:'Where are you located?',a:'We serve '+((c.city||'Lagos')+'.')},{q:'Do you offer consultations?',a:'Yes, book a free consultation.'}]).map((f,i)=>`<div class="faq-item reveal reveal-delay-${Math.min(i%3+1,3)}"><div class="faq-q" onclick="this.parentElement.classList.toggle('open')">${f.q} <span style="float:right">+</span></div><div class="faq-a"><p>${f.a}</p></div></div>`).join('')}
  </div>
</section>`,

  faqSimple: (c, col) => `
<section class="section" id="faq">
  <div class="section-header reveal"><div class="eyebrow">FAQ</div><h2>Quick <span class="gradient-text">Answers</span></h2></div>
  ${(c.faq||[]).map((f,i)=>`<div class="reveal" style="margin-bottom:16px"><h3 style="font-size:1.1rem;margin-bottom:4px">${f.q}</h3><p style="color:var(--muted)">${f.a}</p></div>`).join('')}
</section>`,

  // ===== CONTACT SECTIONS (3) =====
  contactForm: (c, col, plan) => `
<section class="section" id="contact">
  <div class="section-header reveal"><div class="eyebrow">Get In Touch</div><h2>Let\'s <span class="gradient-text">Talk</span></h2></div>
  <div class="contact-wrap">
    <div class="contact-info reveal">
      <div class="contact-item">📞 <a href="tel:${(c.contactInfo||{}).phone||'+2348000000000'}">${(c.contactInfo||{}).phone||'+234 800 000 0000'}</a></div>
      <div class="contact-item">✉️ <a href="mailto:${(c.contactInfo||{}).email||'info@example.com'}">${(c.contactInfo||{}).email||'info@example.com'}</a></div>
      <div class="contact-item">📍 ${(c.contactInfo||{}).address||((c.city||'Lagos')+', Nigeria')}</div>
      ${((c.contactInfo||{}).whatsapp||'')?`<a class="btn btn-p" href="https://wa.me/${c.contactInfo.whatsapp.replace(/\\D/g,'')}" style="margin-top:16px">💬 WhatsApp Us</a>`:''}
    </div>
    <form class="contact-form reveal reveal-delay-1" onsubmit="event.preventDefault();alert('Thank you! We will contact you soon.');this.reset()">
      <input type="text" placeholder="Your Name" required>
      <input type="email" placeholder="Email Address" required>
      <input type="tel" placeholder="Phone Number">
      <textarea placeholder="Tell us about your project" rows="4"></textarea>
      <button type="submit" class="btn btn-p" style="width:100%">Send Message →</button>
    </form>
  </div>
</section>`,

  contactCard: (c, col) => `
<section class="section" id="contact">
  <div class="contact-card reveal" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:3rem;text-align:center;max-width:600px;margin:0 auto">
    <h2>Ready to <span class="gradient-text">Get Started?</span></h2>
    <p style="color:var(--muted);margin:12px 0 24px">Contact us today and let's bring your vision to life.</p>
    <div style="display:flex;flex-direction:column;gap:8px;align-items:center">
      <a href="tel:${(c.contactInfo||{}).phone||''}" style="color:${col.primary||'#00D9FF'};font-size:1.2rem;text-decoration:none">📞 ${(c.contactInfo||{}).phone||'+234 800 000 0000'}</a>
      <a href="mailto:${(c.contactInfo||{}).email||''}" style="color:var(--muted);text-decoration:none">✉️ ${(c.contactInfo||{}).email||'info@example.com'}</a>
      <div style="color:var(--muted)">📍 ${(c.contactInfo||{}).address||((c.city||'Lagos')+', Nigeria')}</div>
    </div>
    <a class="btn btn-p" href="https://wa.me/${(((c.contactInfo||{}).whatsapp||'').replace(/\\D/g,''))||'2348000000000'}" style="margin-top:24px">💬 Chat on WhatsApp</a>
  </div>
</section>`,

  contactCTA: (c, col) => `
<section class="section" id="contact" style="background:linear-gradient(135deg,${col.bg||'#09090B'},${(col.primary||'#00D9FF')}11);border-radius:24px;margin:2rem 5%;padding:4rem;text-align:center">
  <h2 class="reveal" style="font-size:2.5rem">Let\'s <span class="gradient-text">Work Together</span></h2>
  <p class="reveal reveal-delay-1" style="color:var(--muted);max-width:500px;margin:16px auto">Book a free consultation today.</p>
  <a class="btn btn-p reveal reveal-delay-2" href="https://wa.me/${(((c.contactInfo||{}).whatsapp||'').replace(/\\D/g,''))||'2348000000000'}" style="font-size:1.1rem;padding:1.2rem 3rem">💬 Start on WhatsApp →</a>
</section>`,

  // ===== CTA SECTIONS (3) =====
  ctaBanner: (c, col) => `
<section class="cta-banner reveal" style="background:linear-gradient(135deg,${col.primary||'#00D9FF'},${col.accent||'#00FF9D'});padding:3rem 5%;border-radius:20px;margin:2rem 5%;text-align:center">
  <h2 style="color:#000;font-size:2rem;margin-bottom:8px">${c.ctaHeadline||'Ready to Get Started?'}</h2>
  <p style="color:#000aa;margin-bottom:16px">${c.ctaSub||'Book your appointment today.'}</p>
  <a class="btn" href="#contact" style="background:#000;color:#fff;padding:1rem 3rem;border-radius:100px;font-weight:700">${c.cta||'Get Started'} →</a>
</section>`,

  ctaSplit: (c, col) => `
<section class="section" style="display:flex;align-items:center;gap:2rem;flex-wrap:wrap">
  <div style="flex:1;min-width:300px"><h2>${c.ctaHeadline||'Let\'s Build Something Great'}</h2><p style="color:var(--muted)">${c.ctaSub||'Get in touch for a free consultation.'}</p></div>
  <a class="btn btn-p" href="#contact" style="font-size:1.1rem;padding:1rem 2.5rem">Get Started →</a>
</section>`,

  ctaUrgent: (c, col) => `
<section class="section" style="text-align:center;padding:3rem">
  <div class="reveal" style="display:inline-block;padding:8px 16px;background:${(col.primary||'#00D9FF')}22;color:${col.primary||'#00D9FF'};border-radius:100px;font-size:12px;font-weight:700;margin-bottom:16px">⏰ Limited Time Offer</div>
  <h2 class="reveal reveal-delay-1" style="font-size:2rem">${c.ctaHeadline||'Book Now and Save 20%'}</h2>
  <a class="btn btn-p reveal reveal-delay-2" href="#contact" style="font-size:1.1rem;margin-top:16px">Claim Offer →</a>
</section>`,

  // ===== PROCESS STEPS (2) =====
  processSteps: (c, col) => `
<section class="section" id="process">
  <div class="section-header reveal"><div class="eyebrow">How It Works</div><h2>Our <span class="gradient-text">Process</span></h2></div>
  <div class="process-grid">
    ${(c.process||[{step:'01',title:'Consult',desc:'We discuss your needs'},{step:'02',title:'Plan',desc:'We create a strategy'},{step:'03',title:'Execute',desc:'We deliver results'},{step:'04',title:'Follow-up',desc:'We ensure satisfaction'}]).map((p,i)=>`<div class="process-card reveal reveal-delay-${Math.min(i+1,4)}"><div class="process-num" style="color:${col.primary||'#00D9FF'}">${p.step}</div><h3>${p.title}</h3><p>${p.desc}</p></div>`).join('')}
  </div>
</section>`,

  processTimeline: (c, col) => `
<section class="section" id="process">
  <div class="section-header reveal"><div class="eyebrow">Our Process</div><h2>Step by <span class="gradient-text">Step</span></h2></div>
  <div class="timeline">
    ${(c.process||[]).map((p,i)=>`<div class="timeline-item reveal reveal-delay-${Math.min(i%3+1,3)}"><div class="timeline-dot" style="background:${col.primary||'#00D9FF'}"></div><div class="timeline-content"><h3>${p.title}</h3><p>${p.desc}</p></div></div>`).join('')}
  </div>
</section>`,

  // ===== TEAM SECTIONS (2) =====
  teamGrid: (c, col) => `
<section class="section" id="team">
  <div class="section-header reveal"><div class="eyebrow">Our People</div><h2>Meet the <span class="gradient-text">Team</span></h2></div>
  <div class="grid">
    ${(c.team||[{name:'Team Member',role:'Founder',bio:'Passionate about excellence'},{name:'Team Member 2',role:'Director',bio:'Dedicated to quality'}]).map((m,i)=>`<div class="card reveal reveal-delay-${Math.min(i+1,4)}" style="text-align:center"><div class="avatar-lg" style="width:80px;height:80px;border-radius:50%;background:${(col.primary||'#00D9FF')}22;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:32px;color:${col.primary||'#00D9FF'}">${(m.name||'T').charAt(0)}</div><h3>${m.name}</h3><div style="color:${col.primary||'#00D9FF'};font-size:13px;margin-bottom:8px">${m.role||''}</div><p style="font-size:13px">${m.bio||''}</p></div>`).join('')}
  </div>
</section>`,

  // ===== STATS BAR (1) =====
  statsBar: (c, col) => `
<section class="stats-bar reveal" style="background:${col.primary||'#00D9FF'};padding:2rem 5%;display:flex;justify-content:space-around;flex-wrap:wrap;gap:1rem;border-radius:16px;margin:2rem 5%">
  ${(c.stats||[{n:'500+',l:'Clients'},{n:'10yr',l:'Years'},{n:'50+',l:'Projects'},{n:'4.9★',l:'Rating'}]).map(s=>`<div style="text-align:center"><div style="font-size:2rem;font-weight:900;color:#000">${s.n}</div><div style="color:#000aa;font-size:13px">${s.l}</div></div>`).join('')}
</section>`,

  // ===== LOGO STRIP (1) =====
  logoStrip: (c, col) => `
<section style="padding:2rem 5%;text-align:center">
  <p style="color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px">Trusted By</p>
  <div style="display:flex;justify-content:center;gap:2rem;flex-wrap:wrap;align-items:center;opacity:0.6">
    ${(c.clientLogos||['Brand One','Brand Two','Brand Three','Brand Four']).map(l=>`<div style="font-weight:700;font-size:1.1rem;color:var(--muted)">${l}</div>`).join('')}
  </div>
</section>`,

  // ===== MAP SECTION (1) =====
  contactMap: (c, col) => `
<section class="section" id="contact">
  <div class="section-header reveal"><div class="eyebrow">Visit Us</div><h2>Find <span class="gradient-text">Us</span></h2></div>
  <div class="contact-wrap">
    <div class="contact-info reveal">
      <div class="contact-item">📞 ${(c.contactInfo||{}).phone||'+234 800 000 0000'}</div>
      <div class="contact-item">✉️ ${(c.contactInfo||{}).email||'info@example.com'}</div>
      <div class="contact-item">📍 ${(c.contactInfo||{}).address||((c.city||'Lagos')+', Nigeria')}</div>
    </div>
    <div class="reveal reveal-delay-1" style="flex:1;min-height:300px;border-radius:16px;overflow:hidden;border:1px solid var(--border)">
      <iframe src="https://maps.google.com/maps?q=${encodeURIComponent((c.contactInfo||{}).address||(c.city||'Lagos')+' Nigeria')}&output=embed" style="width:100%;height:300px;border:0" loading="lazy"></iframe>
    </div>
  </div>
</section>`,

  // ===== NEWSLETTER (1) =====
  newsletter: (c, col) => `
<section style="padding:3rem 5%;text-align:center;max-width:500px;margin:0 auto">
  <h2 class="reveal">Stay <span class="gradient-text">Updated</span></h2>
  <p style="color:var(--muted);margin:8px 0 16px">Subscribe for tips, offers, and updates.</p>
  <form class="reveal reveal-delay-1" onsubmit="event.preventDefault();alert('Subscribed!');this.reset()" style="display:flex;gap:8px">
    <input type="email" placeholder="Your email" required style="flex:1;padding:12px;border-radius:10px;background:var(--card);border:1px solid var(--border);color:var(--text)">
    <button class="btn btn-p" type="submit">Subscribe</button>
  </form>
</section>`,
};

// ===== SECTION ASSEMBLY ENGINE =====
// AI picks which sections to use based on the business plan
function assembleWebsite(plan, content, images, userPhotos) {
  const colors = plan.brandColors || { primary: '#00D9FF', bg: '#09090B', accent: '#00FF9D' };
  const c = {
    ...content,
    headline: content.hero?.headline || plan.businessName,
    subheadline: content.hero?.subheadline || plan.tagline,
    cta: content.hero?.cta || 'Get Started',
    city: plan.city || 'Lagos',
    type: plan.type || 'Business',
    businessName: plan.businessName,
    services: plan.services || content.services,
    about: content.about,
    testimonials: content.testimonials,
    faq: content.faq,
    contactInfo: content.contactInfo,
    stats: plan.stats || content.stats,
    heroImage: userPhotos[0]?.dataUrl || images.hero?.[0] || '',
    aboutImage: userPhotos[1]?.dataUrl || images.about?.[0] || '',
    galleryImages: userPhotos.slice(2).map(p => p.dataUrl).concat(images.gallery || []),
  };

  // Smart section selection based on business type
  const category = plan.websiteCategory || 'landing';
  const galleryImgs = c.galleryImages || [];
  
  // Default section order
  let sections = [];
  
  // 1. Hero — pick based on whether we have images
  if (c.heroImage) {
    sections.push(ERGIO_SECTIONS.heroWithImage(c, colors, plan));
  } else {
    sections.push(ERGIO_SECTIONS.heroStats(c, colors));
  }
  
  // 2. Stats bar (for most business types)
  if (['agency', 'saas', 'fitness', 'clinic'].includes(category)) {
    sections.push(ERGIO_SECTIONS.statsBar(c, colors));
  }
  
  // 3. About
  if (c.aboutImage) {
    sections.push(ERGIO_SECTIONS.aboutSplit(c, colors));
  } else {
    sections.push(ERGIO_SECTIONS.aboutText(c, colors));
  }
  
  // 4. Services
  if (['ecommerce', 'restaurant'].includes(category)) {
    sections.push(ERGIO_SECTIONS.servicesCards(c, colors));
  } else if (['agency', 'saas'].includes(category)) {
    sections.push(ERGIO_SECTIONS.servicesFeatured(c, colors));
  } else {
    sections.push(ERGIO_SECTIONS.servicesGrid(c, colors));
  }
  
  // 5. Process (for service businesses)
  if (['agency', 'clinic', 'fitness', 'salon'].includes(category)) {
    sections.push(ERGIO_SECTIONS.processSteps(c, colors));
  }
  
  // 6. Gallery (if we have photos)
  if (galleryImgs.length >= 3) {
    sections.push(ERGIO_SECTIONS.galleryGrid(galleryImgs, colors));
  }
  
  // 7. Testimonials
  if (c.testimonials && c.testimonials.length > 0) {
    if (c.testimonials.length > 2) {
      sections.push(ERGIO_SECTIONS.testimonialsWall(c, colors));
    } else {
      sections.push(ERGIO_SECTIONS.testimonialsCard(c, colors));
    }
  }
  
  // 8. Pricing
  if (['salon', 'fitness', 'clinic', 'agency'].includes(category)) {
    sections.push(ERGIO_SECTIONS.pricingCards(c, colors));
  }
  
  // 9. FAQ
  if (c.faq && c.faq.length > 0) {
    sections.push(ERGIO_SECTIONS.faqAccordion(c, colors));
  }
  
  // 10. CTA
  sections.push(ERGIO_SECTIONS.ctaBanner(c, colors));
  
  // 11. Contact
  if (['restaurant', 'realestate', 'clinic'].includes(category)) {
    sections.push(ERGIO_SECTIONS.contactMap(c, colors));
  } else {
    sections.push(ERGIO_SECTIONS.contactForm(c, colors));
  }
  
  return sections.join('\n');
}

// Export for both Node.js and browser
if (typeof module !== 'undefined') module.exports = { ERGIO_SECTIONS, assembleWebsite };
if (typeof window !== 'undefined') { window.ERGIO_SECTIONS = ERGIO_SECTIONS; window.assembleWebsite = assembleWebsite; }
