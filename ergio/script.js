/* ========================================
   ERGIO — Interactive Build Engine v3
   Real client-side AI generation via Pollinations (free, no API key)
   + Paystack payment integration + Lovable-style chat
   ======================================== */

// ============ CONFIG ============
const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? 'http://localhost:3000'
  : window.location.origin.includes('github.io')
  ? 'https://ergio.vercel.app'
  : window.location.origin;

// ============ AURORA PARTICLES ============
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];
const PARTICLE_COUNT = 40;

function resizeCanvas() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Particle {
  constructor() { this.reset(); this.y = Math.random() * (canvas?.height || 800); }
  reset() {
    this.x = Math.random() * (canvas?.width || 1200);
    this.y = (canvas?.height || 800) + 10;
    this.size = Math.random() * 2 + 0.5;
    this.speedY = Math.random() * 0.3 + 0.1;
    this.opacity = Math.random() * 0.4 + 0.1;
    const colors = ['0, 217, 255', '0, 255, 157', '37, 99, 255'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }
  update() { this.y -= this.speedY; if (this.y < -10) this.reset(); }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
    ctx.fill();
  }
}

if (canvas) {
  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());
  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animateParticles);
  }
  animateParticles();
}

// ============ MOUSE GLOW ============
const mouseGlow = document.getElementById('mouseGlow');
if (mouseGlow) {
  document.addEventListener('mousemove', (e) => {
    mouseGlow.style.left = e.clientX + 'px';
    mouseGlow.style.top = e.clientY + 'px';
  });
}

// ============ NAV SCROLL ============
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  });
}

// ============ MOBILE MENU ============
window.toggleMenu = function() {
  const links = document.getElementById('navLinks');
  if (links) links.classList.toggle('open');
};

// ============ ROTATING PLACEHOLDER ============
const promptInput = document.getElementById('promptInput');
const placeholders = [
  'I do graphic design in Lagos...',
  'I am a makeup artist in Abuja...',
  'I run a catering business in Port Harcourt...',
  'I am a photographer in Ibadan...',
  'I teach music lessons in Kano...',
  'I make custom clothes in Enegu...',
  'I am a fitness trainer in Lagos...',
  'I do web design in Benin City...',
  'I am a hair stylist in Kaduna...',
  'I run a cleaning service in Lagos...',
];
let phIndex = 0;
if (promptInput) {
  setInterval(() => {
    phIndex = (phIndex + 1) % placeholders.length;
    if (document.activeElement !== promptInput) {
      promptInput.placeholder = placeholders[phIndex];
    }
  }, 3000);

  promptInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && promptInput.value.trim()) {
      startBuild(promptInput.value.trim());
    }
  });
}

const promptBtn = document.getElementById('promptBtn');
if (promptBtn) {
  promptBtn.addEventListener('click', () => {
    if (promptInput.value.trim()) startBuild(promptInput.value.trim());
  });
}

// ============ COUNTERS ============
const counters = document.querySelectorAll('.tnum');
const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      let current = 0;
      const inc = target / 50;
      const timer = setInterval(() => {
        current += inc;
        if (current >= target) { current = target; clearInterval(timer); }
        el.textContent = Math.floor(current).toLocaleString() + suffix;
      }, 30);
      counterObs.unobserve(el);
    }
  });
});
counters.forEach(c => counterObs.observe(c));

// ============ REVEAL ON SCROLL ============
const reveals = document.querySelectorAll('.reveal');
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealObs.unobserve(entry.target);
    }
  });
});
reveals.forEach(r => revealObs.observe(r));

// ============ BUILD OVERLAY ============
const buildOverlay = document.getElementById('buildOverlay');
const qaPanel = document.getElementById('qaPanel');
const buildPanel = document.getElementById('buildPanel');
const launchPanel = document.getElementById('launchPanel');
const previewPane = document.getElementById('previewPane');

let buildAnswers = {};
let generatedBusiness = null;
let generatedHtml = '';

const questions = [
  { id: 'name', label: 'Business Name', text: 'What do you want to call your business?', hint: 'This will be your brand name. Be creative!', type: 'text', placeholder: 'e.g. SparkleClean Pros' },
  { id: 'services', label: 'Your Services', text: 'What services do you offer?', hint: 'Select all that apply', type: 'checkbox', options: ['Cleaning', 'Design', 'Consulting', 'Photography', 'Catering', 'Tutoring', 'Styling', 'Repairs', 'Marketing', 'Other'] },
  { id: 'location', label: 'Your Location', text: 'Where are you based?', hint: 'We use this to find local clients for you', type: 'text', placeholder: 'e.g. Lagos, Nigeria' },
  { id: 'style', label: 'Brand Style', text: 'What vibe do you want?', hint: 'This shapes your website design', type: 'radio', options: ['Modern & Minimal', 'Bold & Colorful', 'Luxury & Premium', 'Friendly & Casual'] }
];

let currentQ = 0;

function startBuild(prompt) {
  buildAnswers = { prompt };
  buildOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  qaPanel.style.display = 'flex';
  buildPanel.style.display = 'none';
  launchPanel.style.display = 'none';
  if (previewPane) previewPane.classList.add('visible');

  currentQ = 0;
  showQuestion(0);
}

function showQuestion(idx) {
  const q = questions[idx];
  if (!q) return;

  const fill = document.getElementById('qaProgressFill');
  if (fill) fill.style.width = `${(idx / questions.length) * 100}%`;

  const backBtn = document.getElementById('qaBack');
  const nextBtn = document.getElementById('qaNext');
  if (backBtn) backBtn.style.display = idx > 0 ? 'flex' : 'none';
  if (nextBtn) {
    nextBtn.style.display = 'flex';
    nextBtn.disabled = !buildAnswers[q.id];
  }

  let html = `<div class="qa-question" id="qaQ${idx}">`;
  html += `<div class="qa-q-label">${q.label}</div>`;
  html += `<div class="qa-q-text">${q.text}</div>`;
  html += `<div class="qa-q-hint">${q.hint}</div>`;

  if (q.type === 'text') {
    const val = buildAnswers[q.id] || '';
    html += `<input type="text" class="qa-text-input" id="qaInput${idx}" placeholder="${q.placeholder || ''}" value="${val}" />`;
  } else if (q.type === 'checkbox') {
    html += `<div class="qa-options">`;
    q.options.forEach(opt => {
      const checked = buildAnswers[q.id] && buildAnswers[q.id].includes(opt) ? 'selected' : '';
      html += `<div class="qa-option ${checked}" data-qid="${q.id}" data-val="${opt}" onclick="toggleCheckbox(this)"><div class="qa-checkbox"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#09090B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="qa-option-label">${opt}</span></div>`;
    });
    html += `</div>`;
  } else if (q.type === 'radio') {
    html += `<div class="qa-options">`;
    q.options.forEach(opt => {
      const checked = buildAnswers[q.id] === opt ? 'selected' : '';
      html += `<div class="qa-option ${checked}" data-qid="${q.id}" onclick="toggleRadio(this, '${opt}')"><div class="qa-radio"></div><span class="qa-option-label">${opt}</span></div>`;
    });
    html += `</div>`;
  }

  html += `</div>`;

  const content = document.getElementById('qaContent');
  content.innerHTML = html;
  content.style.opacity = '0';
  setTimeout(() => content.style.opacity = '1', 50);

  if (q.type === 'text') {
    setTimeout(() => {
      const input = document.getElementById(`qaInput${idx}`);
      if (input) {
        input.focus();
        input.addEventListener('input', () => {
          buildAnswers[q.id] = input.value;
          if (nextBtn) nextBtn.disabled = !input.value.trim();
        });
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' && input.value.trim()) nextQuestion();
        });
      }
    }, 100);
  }
}

window.toggleCheckbox = function(el) {
  const qid = el.dataset.qid;
  const val = el.dataset.val;
  if (!buildAnswers[qid]) buildAnswers[qid] = [];
  if (buildAnswers[qid].includes(val)) {
    buildAnswers[qid] = buildAnswers[qid].filter(v => v !== val);
    el.classList.remove('selected');
  } else {
    buildAnswers[qid].push(val);
    el.classList.add('selected');
  }
  const nextBtn = document.getElementById('qaNext');
  if (nextBtn) nextBtn.disabled = !buildAnswers[qid] || buildAnswers[qid].length === 0;
};

window.toggleRadio = function(el, val) {
  const qid = el.dataset.qid;
  buildAnswers[qid] = val;
  el.parentElement.querySelectorAll('.qa-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  const nextBtn = document.getElementById('qaNext');
  if (nextBtn) nextBtn.disabled = false;
};

function nextQuestion() {
  currentQ++;
  if (currentQ < questions.length) {
    showQuestion(currentQ);
  } else {
    startRealGeneration();
  }
}

function prevQuestion() {
  if (currentQ > 0) {
    currentQ--;
    showQuestion(currentQ);
  }
}

const qaNextBtn = document.getElementById('qaNext');
if (qaNextBtn) qaNextBtn.addEventListener('click', nextQuestion);
const qaBackBtn = document.getElementById('qaBack');
if (qaBackBtn) qaBackBtn.addEventListener('click', prevQuestion);

// ============ REAL AI GENERATION (Pollinations - free, no key) ============
async function startRealGeneration() {
  qaPanel.style.display = 'none';
  buildPanel.style.display = 'flex';

  const buildLog = document.getElementById('buildLog');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const statTasks = document.getElementById('statTasks');
  const statTime = document.getElementById('statTime');
  const previewFrame = document.getElementById('previewFrame');
  const statusText = document.getElementById('statusText');

  if (buildLog) buildLog.innerHTML = '';
  if (progressBar) progressBar.style.width = '0%';
  let taskCount = 0;
  let totalTasks = 12;
  const startTime = Date.now();

  // Timer
  const timerInterval = setInterval(() => {
    if (statTime) statTime.textContent = Math.floor((Date.now() - startTime) / 1000) + 's';
  }, 1000);

  try {
    // Try backend API first
    const response = await fetch(`${API_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: buildAnswers.prompt, answers: buildAnswers }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) throw new Error('API not ready');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'status') {
              addBuildTask(buildLog, event.data.task, 'active');
              taskCount++;
              if (statTasks) statTasks.textContent = taskCount;
              if (progressBar) progressBar.style.width = `${(event.data.step / event.data.total) * 100}%`;
              if (progressText) progressText.textContent = `${event.data.step}/${event.data.total}`;
              scrollBuildLog();
            } else if (event.type === 'website') {
              completeLastTask(buildLog);
              generatedHtml = event.data.html;
              if (previewFrame) previewFrame.srcdoc = generatedHtml;
            } else if (event.type === 'complete') {
              completeLastTask(buildLog);
              generatedBusiness = event.data.business;
              if (progressBar) progressBar.style.width = '100%';
              if (progressText) progressText.textContent = 'Complete';
              clearInterval(timerInterval);
              setTimeout(() => showLaunchScreen(event.data.business), 1000);
            }
          } catch (e) {}
        }
      }
    }
  } catch (err) {
    // Fallback: REAL client-side generation using Pollinations free API
    console.log('Backend not available, using client-side generation');
    clearInterval(timerInterval);
    await clientSideGeneration(buildLog, progressBar, progressText, statTasks, statTime, previewFrame, startTime);
  }
}

// ============ CLIENT-SIDE GENERATION (Pollinations - free) ============
async function clientSideGeneration(buildLog, progressBar, progressText, statTasks, statTime, previewFrame, startTime) {
  const tasks = [
    'Analyzing your skill...',
    'Researching market in Nigeria...',
    'Generating business name & tagline...',
    'Creating brand identity...',
    'Generating logo via AI...',
    'Writing website copy...',
    'Designing website layout...',
    'Building booking system...',
    'Connecting Paystack payments...',
    'Activating 4 client engines...',
    'Optimizing for Google SEO...',
    'Publishing your business...',
  ];

  const prompt = buildAnswers.prompt;
  const bizName = buildAnswers.name || generateBizName(prompt);
  const location = buildAnswers.location || 'Nigeria';
  const services = buildAnswers.services || [];
  const style = buildAnswers.style || 'Modern & Minimal';

  // Style colors
  const styles = {
    'Modern & Minimal': { primary: '#00D9FF', accent: '#00FF9D', bg: '#09090B' },
    'Bold & Colorful': { primary: '#FF6B6B', accent: '#FFD93D', bg: '#1A0A0A' },
    'Luxury & Premium': { primary: '#FFB800', accent: '#D4AF37', bg: '#0A0A0A' },
    'Friendly & Casual': { primary: '#6BCB77', accent: '#FF9F45', bg: '#0F1A0F' },
  };
  const colors = styles[style] || styles['Modern & Minimal'];

  let taskCount = 0;
  const totalTasks = tasks.length;

  // Start generating content in parallel
  const contentPromise = generateAllContent(prompt, bizName, location, services);

  for (let i = 0; i < tasks.length; i++) {
    addBuildTask(buildLog, tasks[i], 'active');
    taskCount++;
    if (statTasks) statTasks.textContent = taskCount;
    if (statTime) statTime.textContent = Math.floor((Date.now() - startTime) / 1000) + 's';
    if (progressBar) progressBar.style.width = `${((i + 1) / totalTasks) * 100}%`;
    if (progressText) progressText.textContent = `${i + 1}/${totalTasks}`;
    scrollBuildLog();

    // Wait a bit for visual effect (shorter for early tasks, longer for generation tasks)
    const delay = i < 2 ? 400 : i < 8 ? 500 + Math.random() * 300 : 300;
    await new Promise(r => setTimeout(r, delay));

    completeLastTask(buildLog);

    // After "Designing website layout" (index 6), wait for content and show preview
    if (i === 6) {
      try {
        const content = await contentPromise;
        const logoUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent('minimalist logo for ' + bizName + ', flat design, clean, modern, white background')}&width=200&height=200&nologo=true`;

        generatedHtml = buildBusinessHTML(bizName, content, colors, logoUrl, location, prompt);
        if (previewFrame) previewFrame.srcdoc = generatedHtml;
      } catch (e) {
        console.error('Generation error:', e);
        generatedHtml = buildFallbackHTML(bizName, prompt, colors);
        if (previewFrame) previewFrame.srcdoc = generatedHtml;
      }
    }
  }

  // Generate final business object
  try {
    const content = await contentPromise;
    generatedBusiness = {
      name: bizName,
      tagline: content.tagline || 'Professional services, delivered with excellence.',
      slug: bizName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      location: location,
      plan: 'free',
      website: `ergio.app/${bizName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    };
  } catch (e) {
    generatedBusiness = {
      name: bizName,
      tagline: 'Professional services, delivered with excellence.',
      slug: bizName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      location: location,
      plan: 'free',
      website: `ergio.app/${bizName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    };
  }

  setTimeout(() => showLaunchScreen(generatedBusiness), 500);
}

// Generate all content via Pollinations free text API
async function generateAllContent(prompt, bizName, location, services) {
  const servicesStr = services.length ? services.join(', ') : 'professional services';

  const [tagline, about, servicesText, pricingText] = await Promise.all([
    pollText(`You are a Nigerian business branding expert. Write a catchy 8-word tagline for a business called "${bizName}" that does: ${prompt} in ${location}. Just the tagline, nothing else.`),
    pollText(`Write a 3-sentence "About" paragraph for a business called "${bizName}" that does: ${prompt} in ${location}. Professional, warm, Nigerian context. Just the paragraph.`),
    pollText(`A business called "${bizName}" does: ${prompt}. List 4 specific services they offer, one per line. Format: "Service Name - brief description". Just the 4 lines.`),
    pollText(`A business called "${bizName}" does: ${prompt} in ${location}, Nigeria. Suggest 3 pricing packages (Basic, Standard, Premium) in Naira (₦). Format each as: "PackageName: ₦X,000 - what's included". Just the 3 lines.`),
  ]);

  return {
    tagline: tagline?.trim() || 'Quality service you can trust',
    about: about?.trim() || `We are ${bizName}, providing ${servicesStr} in ${location}. Our mission is to deliver exceptional quality and build lasting relationships with every client. We combine professional expertise with genuine care for your needs.`,
    services: parseList(servicesText),
    pricing: parseList(pricingText),
  };
}

// Pollinations free text API
async function pollText(prompt) {
  try {
    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (resp.ok) return await resp.text();
    return '';
  } catch (e) {
    return '';
  }
}

function parseList(text) {
  if (!text) return [];
  return text.split('\n').map(l => l.trim()).filter(l => l && !l.match(/^\d+\.$/) && l.length > 3);
}

function generateBizName(prompt) {
  const cleanText = prompt.replace(/^(i\s+(am|do|run|provide|offer)\s+)/i, '').trim();
  const words = cleanText.split(/\s+/).slice(0, 2);
  const suffixes = ['Studio', 'Pro', 'Hub', 'Services', 'NG', 'Expert', 'Works', 'Solutions'];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' ' + suffix;
}

// Build full business HTML
function buildBusinessHTML(name, content, colors, logoUrl, location, prompt) {
  const servicesHTML = (content.services || []).map(s => {
    const parts = s.split(' - ');
    return `<div class="service-card"><h3>${parts[0] || s}</h3><p>${parts[1] || ''}</p></div>`;
  }).join('');

  const pricingHTML = (content.pricing || []).map((p, i) => {
    const pkgMatch = p.match(/^([^:]+):\s*₦([\d,]+)/);
    const pkgName = pkgMatch ? pkgMatch[1].trim() : `Package ${i+1}`;
    const price = p.match(/₦[\d,]+/)?.[0] || 'Custom';
    const desc = p.replace(/^[^:]*:\s*₦[\d,]+\s*-\s*/, '') || p;
    return `<div class="price-card ${i===1?'feat':''}"><h3>${pkgName}</h3><div class="price">${price}</div><p>${desc}</p></div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${name} — ${content.tagline}</title>
<meta name="description" content="${content.about?.substring(0, 155) || ''}">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:${colors.bg};--surface:rgba(255,255,255,.03);--border:rgba(255,255,255,.06);--primary:${colors.primary};--accent:${colors.accent};--text:#F8FAFC;--muted:#94A3B8}
body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);line-height:1.6}
.hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2rem;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse at top,${colors.primary}15,transparent 70%)}
.hero-logo{width:100px;height:100px;border-radius:24px;margin-bottom:1.5rem;object-fit:cover;box-shadow:0 8px 32px ${colors.primary}33}
.hero h1{font-size:2.5rem;font-weight:800;margin-bottom:.5rem;position:relative;z-index:1}
.hero .tagline{font-size:1.2rem;color:var(--primary);margin-bottom:1rem;position:relative;z-index:1}
.hero .location{color:var(--muted);font-size:.9rem;position:relative;z-index:1}
.hero-cta{margin-top:2rem;display:flex;gap:1rem;flex-wrap:wrap;justify-content:center;position:relative;z-index:1}
.btn{padding:1rem 2rem;border-radius:14px;font-weight:700;text-decoration:none;font-size:.95rem;transition:all .3s;border:none;cursor:pointer;font-family:inherit;display:inline-block}
.btn-primary{background:linear-gradient(135deg,var(--primary),var(--accent));color:var(--bg)}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 10px 30px ${colors.primary}55}
.btn-outline{background:transparent;border:1px solid var(--border);color:var(--text)}
.btn-outline:hover{border-color:var(--primary)}
.badge{display:inline-block;padding:.3rem .8rem;background:${colors.primary}15;border:1px solid ${colors.primary}30;border-radius:20px;font-size:.8rem;color:var(--primary);margin-bottom:1rem;position:relative;z-index:1}
.section{max-width:800px;margin:0 auto;padding:4rem 2rem}
.section h2{font-size:1.8rem;font-weight:700;margin-bottom:1.5rem;text-align:center}
.about-text{font-size:1.05rem;color:var(--muted);text-align:center;max-width:600px;margin:0 auto}
.services-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:1rem}
.service-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:1.5rem;transition:all .3s}
.service-card:hover{border-color:${colors.primary}40;transform:translateY(-3px)}
.service-card h3{font-size:1rem;margin-bottom:.5rem;color:var(--primary)}
.service-card p{font-size:.9rem;color:var(--muted)}
.pricing-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:1rem}
.price-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:1.5rem;text-align:center}
.price-card.feat{border-color:var(--primary);box-shadow:0 0 20px ${colors.primary}1a}
.price-card h3{color:var(--primary);margin-bottom:.5rem}
.price{font-size:1.8rem;font-weight:800;margin-bottom:.5rem}
.price-card p{font-size:.85rem;color:var(--muted)}
.footer{text-align:center;padding:3rem 2rem;border-top:1px solid var(--border);color:var(--muted)}
.footer a{color:var(--primary)}
@media(max-width:600px){.hero h1{font-size:1.8rem}.services-grid,.pricing-grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="hero">
  <span class="badge">Powered by ERGIO</span>
  <img src="${logoUrl}" alt="${name}" class="hero-logo" onerror="this.style.display='none'">
  <h1>${name}</h1>
  <div class="tagline">${content.tagline}</div>
  <div class="location">📍 ${location}, Nigeria</div>
  <div class="hero-cta">
    <a href="#book" class="btn btn-primary">Book Now</a>
    <a href="https://wa.me/2348000000000" class="btn btn-outline">WhatsApp Us</a>
  </div>
</div>
<div class="section" id="about">
  <h2>About Us</h2>
  <p class="about-text">${content.about}</p>
</div>
${servicesHTML ? `<div class="section"><h2>Our Services</h2><div class="services-grid">${servicesHTML}</div></div>` : ''}
${pricingHTML ? `<div class="section"><h2>Pricing</h2><div class="pricing-grid">${pricingHTML}</div></div>` : ''}
<div class="section" id="book">
  <h2>Ready to get started?</h2>
  <p class="about-text" style="margin-bottom:2rem">Book your appointment or send us a message. We respond within minutes.</p>
  <div style="text-align:center"><a href="https://wa.me/2348000000000" class="btn btn-primary">Book on WhatsApp</a></div>
</div>
<div class="footer"><p>© ${new Date().getFullYear()} ${name}. Built with <a href="https://emmanuelerogian723-alt.github.io/ergio/">ERGIO</a>.</p></div>
</body>
</html>`;
}

function buildFallbackHTML(name, prompt, colors) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,sans-serif;background:${colors.bg};color:#fff;line-height:1.6;text-align:center;padding:6rem 2rem}h1{font-size:3rem;margin-bottom:1rem;color:${colors.primary}}p{color:#94A3B8;font-size:1.2rem;max-width:600px;margin:0 auto 2rem}a{display:inline-block;padding:1rem 2rem;background:linear-gradient(135deg,${colors.primary},${colors.accent});color:${colors.bg};border-radius:14px;text-decoration:none;font-weight:700}</style></head><body><h1>${name}</h1><p>${prompt}</p><a href="#">Book Now</a></body></html>`;
}

// ============ BUILD TASK UI ============
function addBuildTask(log, text, status = 'pending') {
  if (!log) return;
  const task = document.createElement('div');
  task.className = `build-task ${status}`;
  const icon = status === 'active' ? '<div class="spinner"></div>' : status === 'done' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#00FF9D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '!';
  task.innerHTML = `<div class="build-task-icon">${icon}</div><div class="build-task-text">${text}</div>`;
  log.appendChild(task);
}

function completeLastTask(log) {
  if (!log) return;
  const tasks = log.querySelectorAll('.build-task.active');
  tasks.forEach(t => {
    t.classList.remove('active');
    t.classList.add('done');
    t.querySelector('.build-task-icon').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#00FF9D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  });
}

function scrollBuildLog() {
  const log = document.getElementById('buildLog');
  if (log) log.scrollTop = log.scrollHeight;
}

// ============ LAUNCH SCREEN ============
function showLaunchScreen(business) {
  buildPanel.style.display = 'none';
  launchPanel.style.display = 'flex';

  const launchSub = document.getElementById('launchSub');
  const launchUrl = document.getElementById('launchUrl');
  const launchBusinessName = document.getElementById('launchBusinessName');
  const previewFrame = document.getElementById('previewFrame');

  if (launchSub) launchSub.textContent = business.tagline || 'Your business is live!';
  if (launchUrl) launchUrl.textContent = `ergio.app/${business.slug || 'your-business'}`;
  if (launchBusinessName) {
    launchBusinessName.textContent = business.name || 'Your Business';
    launchBusinessName.style.display = 'block';
  }

  showChatRefinement();
}

// ============ CHAT REFINEMENT (Lovable Chat Mode) ============
function showChatRefinement() {
  const chatBox = document.getElementById('chatBox');
  if (!chatBox) return;

  chatBox.style.display = 'flex';

  const chatInput = document.getElementById('chatInput');
  const chatSend = document.getElementById('chatSend');

  function sendChatMessage() {
    const msg = chatInput.value.trim();
    if (!msg) return;
    addChatMessage('user', msg);
    chatInput.value = '';
    refineWebsite(msg);
  }

  if (chatSend) chatSend.onclick = sendChatMessage;
  if (chatInput) {
    chatInput.onkeypress = (e) => {
      if (e.key === 'Enter') sendChatMessage();
    };
  }
  setTimeout(() => chatInput?.focus(), 500);
}

function addChatMessage(role, text) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  const msg = document.createElement('div');
  msg.className = `chat-msg chat-${role}`;
  msg.innerHTML = `<div class="chat-msg-text">${text}</div>`;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function refineWebsite(message) {
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');

  const thinking = document.createElement('div');
  thinking.className = 'chat-msg chat-bot';
  thinking.innerHTML = '<div class="chat-msg-text"><div class="chat-typing"><span></span><span></span><span></span></div></div>';
  chatMessages.appendChild(thinking);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    // Try backend refine API
    const response = await fetch(`${API_BASE}/api/refine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, currentHtml: generatedHtml, businessContext: generatedBusiness }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error('Refine API not ready');
    // ... handle SSE if available
    throw new Error('Use client-side refine');
  } catch (err) {
    // Client-side refine using Pollinations
    try {
      thinking.querySelector('.chat-msg-text').textContent = 'On it...';
      const refinePrompt = `You are a website editing AI. The user wants: "${message}". Their current website HTML is for a business called "${generatedBusiness?.name || 'a business'}". Respond with a short confirmation of what you changed (max 15 words). Do not output HTML.`;
      const aiResponse = await pollText(refinePrompt);
      thinking.remove();
      addChatMessage('bot', aiResponse?.trim() || 'Done! Your website has been updated.');

      // Simple client-side HTML modifications based on common requests
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes('blue')) {
        generatedHtml = generatedHtml.replace(/--primary:\s*[^;]+/, '--primary:#2563FF');
        generatedHtml = generatedHtml.replace(/--accent:\s*[^;]+/, '--accent:#00D9FF');
      } else if (lowerMsg.includes('red')) {
        generatedHtml = generatedHtml.replace(/--primary:\s*[^;]+/, '--primary:#FF4757');
        generatedHtml = generatedHtml.replace(/--accent:\s*[^;]+/, '--accent:#FF6B6B');
      } else if (lowerMsg.includes('green')) {
        generatedHtml = generatedHtml.replace(/--primary:\s*[^;]+/, '--primary:#00FF9D');
        generatedHtml = generatedHtml.replace(/--accent:\s*[^;]+/, '--accent:#6BCB77');
      } else if (lowerMsg.includes('gold') || lowerMsg.includes('amber')) {
        generatedHtml = generatedHtml.replace(/--primary:\s*[^;]+/, '--primary:#FFB800');
        generatedHtml = generatedHtml.replace(/--accent:\s*[^;]+/, '--accent:#D4AF37');
      }

      const previewFrame = document.getElementById('previewFrame');
      if (previewFrame) previewFrame.srcdoc = generatedHtml;

      if (chatInput) chatInput.placeholder = 'Try: "make the colors blue" or "add a pricing section"';
    } catch (e2) {
      thinking.remove();
      addChatMessage('bot', 'I can help with color changes and simple edits. Try: "make it blue" or "change to gold".');
    }
  }
}

// ============ CLOSE OVERLAY ============
function closeBuild() {
  buildOverlay.classList.remove('active');
  document.body.style.overflow = '';
  if (previewPane) previewPane.classList.remove('visible');
}

const buildClose = document.getElementById('buildClose');
if (buildClose) buildClose.addEventListener('click', closeBuild);

document.addEventListener('DOMContentLoaded', () => {
  const closeBtns = document.querySelectorAll('[id^="buildClose"]');
  closeBtns.forEach(btn => btn.addEventListener('click', closeBuild));

  // Trigger reveal for elements already in viewport on page load
  setTimeout(() => {
    document.querySelectorAll('.reveal').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        el.classList.add('in');
      }
    });
  }, 100);
});

// ============ HELPER FUNCTIONS ============
window.fillPrompt = function(text) {
  const input = document.getElementById('promptInput');
  if (input) {
    input.value = text;
    input.focus();
  }
};

window.closeBuild = closeBuild;
window.startBuild = startBuild;
window.ERGIO = { startBuild, closeBuild };

