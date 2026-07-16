/**
 * ERGIO Business Generator — Client-side, no backend needed
 * Uses Pollinations.ai (free, no API key) for text + image generation
 * Generates a real, shareable business page from a single prompt
 */

const ERGIO_GEN = {
  // Free APIs — no keys needed
  textAPI: 'https://text.pollinations.ai',
  imageAPI: 'https://image.pollinations.ai/prompt',

  // Business data extracted from prompt
  businessData: null,

  async generate(promptText, opts = {}) {
    const business = this.parsePrompt(promptText);
    
    // Generate all content in parallel
    const [tagline, about, services, pricing, faqs] = await Promise.all([
      this.genText(`You are a business branding expert in Nigeria. A person describes their skill: "${promptText}". Write a catchy 6-word business tagline. Just the tagline, nothing else.`),
      this.genText(`You are a business writer in Nigeria. A person does: "${promptText}". Write a professional "About" paragraph (3 sentences) for their business. Professional but warm tone. Just the paragraph.`),
      this.genText(`A person does: "${promptText}" in Nigeria. List exactly 4 services they should offer, one per line. Format: "Service name - short description". Just the 4 lines.`),
      this.genText(`A person does: "${promptText}" in Nigeria. Suggest 3 pricing packages (Basic, Standard, Premium) in Naira. Format each as: "Package: ₦X,000 - what's included". Just the 3 lines.`),
      this.genText(`A person does: "${promptText}" in Nigeria. Write 3 FAQ questions and answers a potential client might ask. Format: "Q: question? A: answer". Just the 3 Q&A pairs.`),
    ]);

    this.businessData = {
      skill: promptText,
      name: business.name,
      category: business.category,
      city: opts.city || 'Nigeria',
      tagline: tagline.trim(),
      about: about.trim(),
      services: this.parseList(services),
      pricing: this.parseList(pricing),
      faqs: this.parseFAQs(faqs),
      logoUrl: `${this.imageAPI}/${encodeURIComponent('minimalist logo for ' + business.name + ', clean modern, flat design, white background')}&width=200&height=200&nologo=true`,
      heroImageUrl: `${this.imageAPI}/${encodeURIComponent('professional ' + business.category + ' business hero image, modern, clean, high quality')}&width=800&height=400&nologo=true`,
      generatedAt: new Date().toISOString(),
    };

    return this.businessData;
  },

  parsePrompt(text) {
    const lower = text.toLowerCase().trim();
    const categories = {
      'design': ['logo', 'design', 'graphic', 'branding', 'creative', 'artist'],
      'cleaning': ['clean', 'cleaning', 'janitor'],
      'fitness': ['fitness', 'gym', 'trainer', 'workout', 'personal trainer'],
      'food': ['food', 'cook', 'chef', 'catering', 'bakery', 'cake', 'restaurant'],
      'photography': ['photo', 'photography', 'camera', 'wedding shoot'],
      'development': ['developer', 'coding', 'programming', 'web design', 'software', 'app'],
      'beauty': ['makeup', 'beauty', 'salon', 'hair', 'nails', 'spa', 'barber'],
      'events': ['event', 'planning', 'wedding planner', 'party'],
      'repair': ['repair', 'fix', 'phone repair', 'laptop', 'technician'],
      'realestate': ['real estate', 'property', 'agent', 'housing'],
      'tutoring': ['tutor', 'teach', 'lesson', 'education', 'training'],
    };

    let category = 'professional';
    for (const [cat, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => lower.includes(kw))) {
        category = cat;
        break;
      }
    }

    // Generate business name from prompt
    const cleanText = text.replace(/^(i\s+(am|do|run|provide|offer)\s+)/i, '').trim();
    const words = cleanText.split(/\s+/).slice(0, 2);
    const suffixes = ['Studio', 'Pro', 'Hub', 'Services', 'NG', 'Expert', 'Works', 'Solutions'];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const name = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' ' + suffix;

    return { name: name.trim(), category };
  },

  async genText(prompt) {
    try {
      const url = `${this.textAPI}/${encodeURIComponent(prompt)}?model=openai`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (resp.ok) return await resp.text();
      return '';
    } catch (e) {
      return '';
    }
  },

  parseList(text) {
    if (!text) return [];
    return text.split('\n').map(l => l.trim()).filter(l => l && !l.match(/^\d+\./));
  },

  parseFAQs(text) {
    if (!text) return [];
    const lines = text.split('\n').filter(l => l.trim());
    const faqs = [];
    for (let i = 0; i < lines.length; i += 2) {
      const q = lines[i]?.replace(/^Q:\s*/i, '').trim();
      const a = lines[i + 1]?.replace(/^A:\s*/i, '').trim();
      if (q && a) faqs.push({ q, a });
    }
    return faqs;
  },

  // Generate full HTML business page
  generateHTML(data) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${data.name} — ${data.tagline}</title>
<meta name="description" content="${data.about.substring(0, 155)}">
<meta property="og:title" content="${data.name}">
<meta property="og:description" content="${data.tagline}">
<meta property="og:image" content="${data.heroImageUrl}">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#09090B;--surface:rgba(255,255,255,.03);--border:rgba(255,255,255,.06);--cyan:#00D9FF;--green:#00FF9D;--text:#F8FAFC;--muted:#94A3B8}
body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);line-height:1.6}
.hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2rem;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse at top,rgba(0,217,255,.08),transparent 70%)}
.hero-logo{width:100px;height:100px;border-radius:24px;margin-bottom:1.5rem;object-fit:cover;box-shadow:0 8px 32px rgba(0,217,255,.2)}
.hero h1{font-size:2.5rem;font-weight:800;margin-bottom:.5rem}
.hero .tagline{font-size:1.2rem;color:var(--cyan);margin-bottom:1rem}
.hero .location{color:var(--muted);font-size:.9rem}
.hero-cta{margin-top:2rem;display:flex;gap:1rem;flex-wrap:wrap;justify-content:center}
.btn{padding:1rem 2rem;border-radius:14px;font-weight:700;text-decoration:none;font-size:.95rem;transition:all .3s;border:none;cursor:pointer;font-family:inherit}
.btn-primary{background:linear-gradient(135deg,var(--cyan),var(--green));color:#09090B}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(0,217,255,.3)}
.btn-outline{background:transparent;border:1px solid var(--border);color:var(--text)}
.btn-outline:hover{border-color:var(--cyan)}
.section{max-width:800px;margin:0 auto;padding:4rem 2rem}
.section h2{font-size:1.8rem;font-weight:700;margin-bottom:1.5rem;text-align:center}
.about-text{font-size:1.05rem;color:var(--muted);text-align:center;max-width:600px;margin:0 auto}
.services-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:1rem}
.service-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:1.5rem;transition:all .3s}
.service-card:hover{border-color:rgba(0,217,255,.2);transform:translateY(-3px)}
.service-card h3{font-size:1rem;margin-bottom:.5rem;color:var(--cyan)}
.service-card p{font-size:.9rem;color:var(--muted)}
.pricing-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:1rem}
.price-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:1.5rem;text-align:center}
.price-card.feat{border-color:var(--cyan);box-shadow:0 0 20px rgba(0,217,255,.1)}
.price-card h3{color:var(--cyan);margin-bottom:.5rem}
.price{font-size:1.8rem;font-weight:800;margin-bottom:.5rem}
.price-card p{font-size:.85rem;color:var(--muted)}
.faq-item{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.5rem;margin-bottom:.8rem}
.faq-item h4{font-size:.95rem;margin-bottom:.5rem;color:var(--cyan)}
.faq-item p{font-size:.9rem;color:var(--muted)}
.footer{text-align:center;padding:3rem 2rem;border-top:1px solid var(--border);color:var(--muted)}
.footer a{color:var(--cyan)}
.badge{display:inline-block;padding:.3rem .8rem;background:rgba(0,217,255,.1);border:1px solid rgba(0,217,255,.2);border-radius:20px;font-size:.8rem;color:var(--cyan);margin-bottom:1rem}
@media(max-width:600px){.hero h1{font-size:1.8rem}.services-grid,.pricing-grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="hero">
  <span class="badge">Powered by ERGIO</span>
  <img src="${data.logoUrl}" alt="${data.name}" class="hero-logo" onerror="this.style.display='none'">
  <h1>${data.name}</h1>
  <div class="tagline">${data.tagline}</div>
  <div class="location">📍 ${data.city}, Nigeria</div>
  <div class="hero-cta">
    <a href="#book" class="btn btn-primary">Book Now</a>
    <a href="https://wa.me/2348000000000" class="btn btn-outline">WhatsApp Us</a>
  </div>
</div>

<div class="section" id="about">
  <h2>About Us</h2>
  <p class="about-text">${data.about}</p>
</div>

${data.services.length ? `<div class="section">
  <h2>Our Services</h2>
  <div class="services-grid">
    ${data.services.map(s => {
      const parts = s.split(' - ');
      return `<div class="service-card"><h3>${parts[0]||s}</h3><p>${parts[1]||''}</p></div>`;
    }).join('')}
  </div>
</div>` : ''}

${data.pricing.length ? `<div class="section">
  <h2>Pricing</h2>
  <div class="pricing-grid">
    ${data.pricing.map((p, i) => {
      const parts = p.split(/:|₦/);
      const pkgName = parts[0]?.trim() || `Package ${i+1}`;
      const price = p.match(/₦[\d,]+/)?.[0] || '';
      const desc = p.replace(/^[^:]*:\s*/, '').replace(/^₦[\d,]+\s*-\s*/, '');
      return `<div class="price-card ${i===1?'feat':''}"><h3>${pkgName}</h3><div class="price">${price || 'Custom'}</div><p>${desc}</p></div>`;
    }).join('')}
  </div>
</div>` : ''}

${data.faqs.length ? `<div class="section">
  <h2>FAQ</h2>
  ${data.faqs.map(f => `<div class="faq-item"><h4>${f.q}</h4><p>${f.a}</p></div>`).join('')}
</div>` : ''}

<div class="section" id="book">
  <h2>Ready to get started?</h2>
  <p class="about-text" style="margin-bottom:2rem">Book your appointment or send us a message. We respond within minutes.</p>
  <div style="text-align:center">
    <a href="https://wa.me/2348000000000" class="btn btn-primary">Book on WhatsApp</a>
  </div>
</div>

<div class="footer">
  <p>© ${new Date().getFullYear()} ${data.name}. Built with <a href="https://ergio.app">ERGIO</a>.</p>
</div>

<script src="https://ergio.app/widget/chatbot.js"></script>
</body>
</html>`;
  }
};
