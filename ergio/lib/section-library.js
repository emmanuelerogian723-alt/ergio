// ============================================================
// ERGIO SECTION LIBRARY v1.0
// Pre-designed, reusable website sections that the AI assembles
// into complete websites. Each section is a function that returns
// HTML given a business data object.
// ============================================================

export const SECTIONS = {
  // ── HERO SECTIONS ──────────────────────────────────────────
  heroCentered: (d) => `
<section class="hero hero-centered" id="home">
  <div class="hero-bg" style="background: radial-gradient(ellipse at center, ${d.colors.primary}11 0%, transparent 70%);"></div>
  <div class="container hero-content">
    <h1 class="hero-title reveal">${d.name}</h1>
    <p class="hero-subtitle reveal" style="transition-delay:0.1s">${d.tagline || 'Excellence delivered, every time'}</p>
    <div class="hero-cta reveal" style="transition-delay:0.2s">
      <a href="#contact" class="btn btn-primary">${d.ctaText || 'Get Started'}</a>
      <a href="#about" class="btn btn-ghost">Learn More</a>
    </div>
  </div>
  <div class="scroll-indicator">Scroll to explore</div>
</section>`,

  heroSplit: (d) => `
<section class="hero hero-split" id="home">
  <div class="hero-split-left">
    <div class="container">
      <h1 class="hero-title reveal">${d.name}</h1>
      <p class="hero-subtitle reveal" style="transition-delay:0.1s">${d.tagline || 'Excellence delivered, every time'}</p>
      <p class="hero-desc reveal" style="transition-delay:0.15s">${d.description || ''}</p>
      <div class="hero-cta reveal" style="transition-delay:0.2s">
        <a href="#contact" class="btn btn-primary">${d.ctaText || 'Get Started'}</a>
      </div>
    </div>
  </div>
  <div class="hero-split-right" style="background: url('${d.heroImage || ''}') center/cover; background-color: ${d.colors.surface};"></div>
</section>`,

  heroVideo: (d) => `
<section class="hero hero-video" id="home">
  ${d.heroVideo ? `<video class="hero-video-bg" autoplay muted loop playsinline poster="${d.heroImage || ''}"><source src="${d.heroVideo}" type="video/mp4"></video>` : `<div class="hero-bg" style="background: linear-gradient(135deg, ${d.colors.bg}, ${d.colors.surface});"></div>`}
  <div class="hero-overlay"></div>
  <div class="container hero-content">
    <h1 class="hero-title reveal">${d.name}</h1>
    <p class="hero-subtitle reveal" style="transition-delay:0.1s">${d.tagline || 'Excellence delivered, every time'}</p>
    <div class="hero-cta reveal" style="transition-delay:0.2s">
      <a href="#contact" class="btn btn-primary">${d.ctaText || 'Get Started'}</a>
    </div>
  </div>
</section>`,

  // ── ABOUT SECTIONS ──────────────────────────────────────────
  aboutStandard: (d) => `
<section class="about" id="about">
  <div class="container">
    <h2 class="section-title reveal">About Us</h2>
    <div class="about-content">
      <div class="about-text reveal">
        <h3>${d.name}</h3>
        <p>${d.aboutText || `${d.name} is ${d.city || 'Lagos'}'s premier ${d.type || 'business'}, built on a foundation of excellence and deep roots in the Nigerian community. We combine world-class standards with an authentic local touch — ensuring every client receives an experience that truly stands out.`}</p>
        <p>${d.description || ''}</p>
      </div>
      ${d.aboutImage ? `<div class="about-image reveal" style="transition-delay:0.1s"><img src="${d.aboutImage}" alt="About ${d.name}" loading="lazy"></div>` : ''}
    </div>
  </div>
</section>`,

  aboutMinimal: (d) => `
<section class="about about-minimal" id="about">
  <div class="container">
    <h2 class="section-title reveal">About Us</h2>
    <p class="about-lead reveal" style="transition-delay:0.1s">${d.aboutText || `${d.name} delivers exceptional value to clients across Nigeria.`}</p>
  </div>
</section>`,

  // ── SERVICES / FEATURES ─────────────────────────────────────
  servicesGrid: (d) => `
<section class="services" id="services">
  <div class="container">
    <h2 class="section-title reveal">Our Services</h2>
    <p class="section-subtitle reveal" style="transition-delay:0.05s">What we offer</p>
    <div class="services-grid">
      ${(d.services || []).map((s, i) => `
      <div class="service-card reveal" style="transition-delay:${i * 0.1}s">
        <div class="service-icon" style="background:${d.colors.primary}15; color:${d.colors.primary};">${s.icon || '✨'}</div>
        <h3>${s.name}</h3>
        <p>${s.description || ''}</p>
        ${s.price ? `<div class="service-price">₦${s.price.toLocaleString()}</div>` : ''}
      </div>`).join('')}
    </div>
  </div>
</section>`,

  servicesList: (d) => `
<section class="services services-list" id="services">
  <div class="container">
    <h2 class="section-title reveal">Our Services</h2>
    <div class="services-list-container">
      ${(d.services || []).map((s, i) => `
      <div class="service-row reveal" style="transition-delay:${i * 0.05}s">
        <div class="service-row-icon" style="color:${d.colors.primary};">${s.icon || '✨'}</div>
        <div class="service-row-content">
          <h3>${s.name}</h3>
          <p>${s.description || ''}</p>
        </div>
        ${s.price ? `<div class="service-row-price">₦${s.price.toLocaleString()}</div>` : ''}
      </div>`).join('')}
    </div>
  </div>
</section>`,

  featuresIcons: (d) => `
<section class="features" id="features">
  <div class="container">
    <h2 class="section-title reveal">Why Choose Us</h2>
    <div class="features-grid">
      ${(d.features || [
        { icon: '🎯', title: 'Expert Team', desc: 'Delivering excellence every step of the way' },
        { icon: '🤝', title: 'Trusted by 500+', desc: 'A growing community of satisfied clients' },
        { icon: '💎', title: 'Affordable Pricing', desc: 'Premium quality at fair prices' },
      ]).map((f, i) => `
      <div class="feature-card reveal" style="transition-delay:${i * 0.1}s">
        <div class="feature-icon">${f.icon}</div>
        <h3>${f.title}</h3>
        <p>${f.desc}</p>
      </div>`).join('')}
    </div>
  </div>
</section>`,

  // ── STATS SECTION ───────────────────────────────────────────
  statsCounter: (d) => `
<section class="stats" id="stats">
  <div class="container">
    <div class="stats-grid">
      ${(d.stats || [
        { value: '500', label: 'HAPPY CLIENTS' },
        { value: '1200', label: 'PROJECTS' },
        { value: '10', label: 'YEARS' },
        { value: '100%', label: 'SATISFACTION' },
      ]).map((s, i) => `
      <div class="stat-card reveal" style="transition-delay:${i * 0.1}s">
        <div class="stat-number" style="color:${d.colors.primary};">${s.value}</div>
        <div class="stat-label">${s.label}</div>
      </div>`).join('')}
    </div>
  </div>
</section>`,

  // ── TESTIMONIALS ────────────────────────────────────────────
  testimonials: (d) => `
<section class="testimonials" id="testimonials">
  <div class="container">
    <h2 class="section-title reveal">What People Say</h2>
    <div class="testimonials-grid">
      ${(d.testimonials || [
        { text: `${d.name} is absolutely outstanding! The quality and service exceeded all my expectations.`, author: 'Client' },
        { text: `I've been a loyal client for over a year. Professional, reliable, and truly world-class.`, author: 'Client' },
        { text: `Best in ${d.city || 'Lagos'}. I refer everyone I know here.`, author: 'Client' },
      ]).map((t, i) => `
      <div class="testimonial-card reveal" style="transition-delay:${i * 0.1}s">
        <div class="testimonial-stars">★★★★★</div>
        <p class="testimonial-text">"${t.text}"</p>
        <div class="testimonial-author">${t.author}</div>
      </div>`).join('')}
    </div>
  </div>
</section>`,

  // ── FAQ SECTION ─────────────────────────────────────────────
  faq: (d) => `
<section class="faq" id="faq">
  <div class="container">
    <h2 class="section-title reveal">Frequently Asked Questions</h2>
    <div class="faq-list">
      ${(d.faq || [
        { q: `How do I get started with ${d.name}?`, a: 'Simply call us, WhatsApp us, or book online at our website. Our team responds within minutes.' },
        { q: 'What are your operating hours?', a: 'We operate Monday to Saturday, 8am to 8pm. Online bookings are available 24/7.' },
        { q: `Where are you located in ${d.city || 'Lagos'}?`, a: 'We serve clients across the city. Contact us for our exact location or to arrange a visit.' },
        { q: 'Do you offer payment plans?', a: 'Yes, we offer flexible payment options to suit your needs.' },
      ]).map((f, i) => `
      <details class="faq-item reveal" style="transition-delay:${i * 0.05}s">
        <summary>${f.q}</summary>
        <p>${f.a}</p>
      </details>`).join('')}
    </div>
  </div>
</section>`,

  // ── CONTACT SECTION ─────────────────────────────────────────
  contactForm: (d) => `
<section class="contact" id="contact">
  <div class="container">
    <h2 class="section-title reveal">Get In Touch</h2>
    <p class="section-subtitle reveal" style="transition-delay:0.05s">We would love to hear from you</p>
    <div class="contact-grid">
      <div class="contact-info reveal">
        <div class="contact-item"><span class="contact-icon">📞</span> ${d.phone || '+234 800 000 0000'}</div>
        <div class="contact-item"><span class="contact-icon">✉️</span> ${d.email || `info@${(d.name || 'business').toLowerCase().replace(/[^a-z]/g, '')}.com`}</div>
        <div class="contact-item"><span class="contact-icon">📍</span> ${d.city || 'Lagos'}, Nigeria</div>
      </div>
      <form class="contact-form reveal" style="transition-delay:0.1s" onsubmit="event.preventDefault(); alert('Thank you! We will get back to you shortly.');">
        <input type="text" name="name" placeholder="Your Name" required>
        <input type="email" name="email" placeholder="Your Email" required>
        <input type="tel" name="phone" placeholder="Phone Number">
        <textarea name="message" placeholder="Your Message" rows="4" required></textarea>
        <button type="submit" class="btn btn-primary">Send Message</button>
      </form>
    </div>
  </div>
</section>`,

  // ── MAP SECTION ─────────────────────────────────────────────
  mapEmbed: (d) => `
<section class="map-section" id="location">
  <div class="container">
    <h2 class="section-title reveal">Find Us</h2>
  </div>
  <div class="map-container reveal" style="transition-delay:0.1s">
    <div id="map" style="height:400px; border-radius:12px; overflow:hidden;">
      <iframe src="https://www.openstreetmap.org/export/embed.html?bbox=3.3792,6.4541,3.4792,6.5541&marker=6.5012,3.4292" width="100%" height="100%" style="border:0; border-radius:12px;" loading="lazy"></iframe>
    </div>
    <div class="map-label">${d.name}<br>${d.city || 'Lagos'}, Nigeria</div>
  </div>
</section>`,

  // ── CTA SECTION ─────────────────────────────────────────────
  ctaBanner: (d) => `
<section class="cta-banner" id="cta">
  <div class="container">
    <div class="cta-content reveal">
      <h2>Get started today</h2>
      <p>It only takes a minute</p>
      <a href="#contact" class="btn btn-primary btn-large">${d.ctaText || 'Get Started'}</a>
    </div>
  </div>
</section>`,

  // ── PRICING SECTION ─────────────────────────────────────────
  pricingTiers: (d) => `
<section class="pricing" id="pricing">
  <div class="container">
    <h2 class="section-title reveal">Our Pricing</h2>
    <div class="pricing-grid">
      ${(d.pricing || [
        { name: 'Basic', price: '5,000', features: ['Core features', 'Email support', '1 project'] },
        { name: 'Pro', price: '15,000', features: ['Everything in Basic', 'Priority support', '5 projects', 'Analytics'], popular: true },
        { name: 'Business', price: '50,000', features: ['Everything in Pro', '24/7 support', 'Unlimited projects', 'Custom branding'] },
      ]).map((p, i) => `
      <div class="pricing-card ${p.popular ? 'popular' : ''} reveal" style="transition-delay:${i * 0.1}s">
        ${p.popular ? '<div class="popular-badge">Most Popular</div>' : ''}
        <h3>${p.name}</h3>
        <div class="price">₦${p.price}<span>/mo</span></div>
        <ul class="pricing-features">
          ${p.features.map(f => `<li>✓ ${f}</li>`).join('')}
        </ul>
        <a href="#contact" class="btn ${p.popular ? 'btn-primary' : 'btn-outline'}">Choose ${p.name}</a>
      </div>`).join('')}
    </div>
  </div>
</section>`,

  // ── GALLERY SECTION ─────────────────────────────────────────
  galleryGrid: (d) => `
<section class="gallery" id="gallery">
  <div class="container">
    <h2 class="section-title reveal">Gallery</h2>
    <div class="gallery-grid">
      ${(d.galleryImages || d.images || [1,2,3,4,5,6]).map((img, i) => `
      <div class="gallery-item reveal" style="transition-delay:${(i % 3) * 0.1}s">
        <img src="${typeof img === 'string' ? img : ''}" alt="Gallery ${i+1}" loading="lazy" onerror="this.style.background='${d.colors.surface}'; this.style.minHeight='200px';">
      </div>`).join('')}
    </div>
  </div>
</section>`,

  // ── TEAM SECTION ────────────────────────────────────────────
  teamGrid: (d) => `
<section class="team" id="team">
  <div class="container">
    <h2 class="section-title reveal">Our Team</h2>
    <div class="team-grid">
      ${(d.team || [
        { name: 'Team Member 1', role: 'Founder & CEO', emoji: '👨‍💼' },
        { name: 'Team Member 2', role: 'Operations Lead', emoji: '👩‍💼' },
        { name: 'Team Member 3', role: 'Head of Client Relations', emoji: '👨‍💻' },
      ]).map((m, i) => `
      <div class="team-card reveal" style="transition-delay:${i * 0.1}s">
        <div class="team-avatar">${m.emoji || '👤'}</div>
        <h3>${m.name}</h3>
        <p>${m.role}</p>
      </div>`).join('')}
    </div>
  </div>
</section>`,

  // ── FOOTER ──────────────────────────────────────────────────
  footer: (d) => `
<footer class="site-footer">
  <div class="container">
    <div class="footer-content">
      <div class="footer-brand">
        <div class="footer-logo">${d.logoUrl ? `<img src="${d.logoUrl}" alt="${d.name}" style="height:32px;">` : `<span style="color:${d.colors.primary}; font-weight:700;">${d.name}</span>`}</div>
        <p>${d.tagline || ''}</p>
      </div>
      <div class="footer-links">
        <a href="#about">About</a>
        <a href="#services">Services</a>
        <a href="#contact">Contact</a>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; ${new Date().getFullYear()} ${d.name}. All rights reserved.</p>
      <p>Powered by <strong>ERGIO</strong> — AI Business OS for Africa</p>
    </div>
  </div>
</footer>`,
};

// ── SECTION ROUTING ───────────────────────────────────────────
// Maps website categories to recommended section combinations
export const SECTION_PRESETS = {
  landing: ['heroCentered', 'aboutStandard', 'featuresIcons', 'statsCounter', 'testimonials', 'faq', 'ctaBanner', 'contactForm', 'footer'],
  restaurant: ['heroSplit', 'aboutStandard', 'servicesGrid', 'galleryGrid', 'testimonials', 'faq', 'mapEmbed', 'ctaBanner', 'contactForm', 'footer'],
  ecommerce: ['heroCentered', 'featuresIcons', 'galleryGrid', 'pricingTiers', 'testimonials', 'faq', 'ctaBanner', 'contactForm', 'footer'],
  portfolio: ['heroSplit', 'galleryGrid', 'aboutStandard', 'testimonials', 'ctaBanner', 'contactForm', 'footer'],
  saas: ['heroCentered', 'featuresIcons', 'pricingTiers', 'testimonials', 'faq', 'ctaBanner', 'contactForm', 'footer'],
  agency: ['heroSplit', 'aboutStandard', 'servicesGrid', 'teamGrid', 'testimonials', 'ctaBanner', 'contactForm', 'footer'],
  fitness: ['heroVideo', 'servicesGrid', 'pricingTiers', 'testimonials', 'ctaBanner', 'contactForm', 'footer'],
  clinic: ['heroCentered', 'servicesList', 'teamGrid', 'testimonials', 'faq', 'mapEmbed', 'ctaBanner', 'contactForm', 'footer'],
  realestate: ['heroSplit', 'galleryGrid', 'servicesGrid', 'testimonials', 'mapEmbed', 'ctaBanner', 'contactForm', 'footer'],
  education: ['heroCentered', 'featuresIcons', 'servicesList', 'pricingTiers', 'testimonials', 'faq', 'ctaBanner', 'contactForm', 'footer'],
  events: ['heroVideo', 'featuresIcons', 'galleryGrid', 'testimonials', 'ctaBanner', 'contactForm', 'footer'],
  blog: ['heroCentered', 'galleryGrid', 'featuresIcons', 'ctaBanner', 'contactForm', 'footer'],
};

// ── ASSEMBLE WEBSITE FROM SECTIONS ────────────────────────────
export function assembleFromSections(sections, data) {
  let html = '';
  for (const sectionName of sections) {
    const fn = SECTIONS[sectionName];
    if (fn) {
      html += fn(data);
    }
  }
  return html;
}

// ── GET SECTION PRESET FOR CATEGORY ───────────────────────────
export function getSectionPreset(category) {
  return SECTION_PRESETS[category] || SECTION_PRESETS.landing;
}

// ── LIST ALL AVAILABLE SECTIONS ───────────────────────────────
export function listSections() {
  return Object.keys(SECTIONS).map(key => ({
    id: key,
    name: key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()),
    category: categorizeSection(key),
  }));
}

function categorizeSection(key) {
  if (key.startsWith('hero')) return 'hero';
  if (key.startsWith('about')) return 'about';
  if (key.includes('service') || key.includes('feature')) return 'services';
  if (key.includes('pricing')) return 'pricing';
  if (key.includes('gallery')) return 'gallery';
  if (key.includes('team')) return 'team';
  if (key.includes('testimonial')) return 'social proof';
  if (key.includes('faq')) return 'faq';
  if (key.includes('contact')) return 'contact';
  if (key.includes('map')) return 'location';
  if (key.includes('cta')) return 'cta';
  if (key === 'footer') return 'footer';
  return 'other';
}

export default SECTIONS;
