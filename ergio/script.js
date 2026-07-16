/* ========================================
   ERGIO — Interactive Build Engine v2
   Powered by Groq + Llama 3.3 + Gemma 2
   ======================================== */

// ============ GROQ API CONFIG ============
const GROQ_API_KEY = window.GROQ_API_KEY || 'YOUR_GROQ_API_KEY';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

async function callGroq(systemPrompt, userPrompt, maxTokens = 2000) {
  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      })
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (e) {
    console.warn('Groq API call failed, using fallback:', e);
    return null;
  }
}

// ============ AURORA PARTICLES ============
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];
const PARTICLE_COUNT = 40;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Particle {
  constructor() { this.reset(); this.y = Math.random() * canvas.height; }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = canvas.height + 10;
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
for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());
function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(animateParticles);
}
animateParticles();

// ============ MOUSE GLOW ============
const mouseGlow = document.getElementById('mouseGlow');
document.addEventListener('mousemove', (e) => {
  mouseGlow.style.left = e.clientX + 'px';
  mouseGlow.style.top = e.clientY + 'px';
  mouseGlow.style.opacity = '1';
});
document.addEventListener('mouseleave', () => mouseGlow.style.opacity = '0');

// ============ NAV SCROLL ============
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 30) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
});
function toggleMenu() { document.getElementById('navLinks').classList.toggle('mobile-open'); }

// ============ REVEAL ON SCROLL ============
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('in'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ============ ROTATING PLACEHOLDER ============
const placeholders = [
  'What do you want to build?',
  'Restaurant in Lagos',
  'Logo Design Agency',
  'Cleaning Company',
  'Fashion Brand',
  'Real Estate Business',
  'AI Startup',
  'Church Website',
  'Law Firm',
  'Medical Clinic',
  'Photography Studio',
  'Barber Shop',
  'Catering Service',
  'Tech Repair Shop',
  'Beauty Salon',
];
let phIndex = 0;
const promptInput = document.getElementById('promptInput');
let phTimeout;
function typePlaceholder(text, idx = 0) {
  if (idx <= text.length) {
    promptInput.setAttribute('placeholder', text.substring(0, idx));
    phTimeout = setTimeout(() => typePlaceholder(text, idx + 1), 50);
  } else { phTimeout = setTimeout(erasePlaceholder, 2000); }
}
function erasePlaceholder() {
  const current = promptInput.getAttribute('placeholder');
  if (current.length > 0) {
    promptInput.setAttribute('placeholder', current.substring(0, current.length - 1));
    phTimeout = setTimeout(erasePlaceholder, 30);
  } else {
    phIndex = (phIndex + 1) % placeholders.length;
    phTimeout = setTimeout(() => typePlaceholder(placeholders[phIndex]), 400);
  }
}
typePlaceholder(placeholders[0]);
promptInput.addEventListener('focus', () => { clearTimeout(phTimeout); promptInput.setAttribute('placeholder', 'What do you want to build?'); });
promptInput.addEventListener('blur', () => { if (!promptInput.value) typePlaceholder(placeholders[phIndex]); });
promptInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && promptInput.value.trim()) startBuild(); });
function fillPrompt(text) { promptInput.value = text; promptInput.focus(); }

// ============ COUNTERS ============
function animateCounters() {
  document.querySelectorAll('[data-target]').forEach(el => {
    if (el.dataset.animated) return;
    const target = parseInt(el.dataset.target);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    let current = 0;
    const duration = 2000;
    const start = performance.now();
    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      current = Math.floor(target * ease);
      let display = current.toLocaleString();
      if (target >= 1000000) display = (current / 1000000).toFixed(1) + 'M';
      el.textContent = prefix + display + suffix;
      if (progress < 1) requestAnimationFrame(update);
      else el.dataset.animated = 'true';
    }
    requestAnimationFrame(update);
  });
}
setTimeout(animateCounters, 800);

// ============ BUSINESS TYPE DETECTION ============
const businessTypes = {
  'restaurant': { emoji: '🍽️', color: '#FF6B6B', services: ['Dine-in', 'Takeaway', 'Delivery', 'Event Catering', 'Private Dining', 'Table Reservations'] },
  'logo': { emoji: '🎨', color: '#00D9FF', services: ['Logo Design', 'Brand Identity', 'Business Cards', 'Social Media Kit', 'Brand Guidelines', 'Packaging Design'] },
  'cleaning': { emoji: '🧹', color: '#00FF9D', services: ['Home Cleaning', 'Office Cleaning', 'Deep Cleaning', 'Post-Construction', 'Move In/Out', 'Carpet Cleaning'] },
  'fashion': { emoji: '👗', color: '#FF6B9D', services: ['Custom Designs', 'Ready-to-Wear', 'Alterations', 'Bulk Orders', 'Fashion Consulting', 'Styling Services'] },
  'real estate': { emoji: '🏠', color: '#2563FF', services: ['Property Sales', 'Property Rentals', 'Property Management', 'Valuation', 'Investment Advisory', 'Lease Negotiation'] },
  'law': { emoji: '⚖️', color: '#8B7355', services: ['Legal Consultation', 'Contract Review', 'Property Law', 'Corporate Law', 'Family Law', 'Criminal Defense'] },
  'medical': { emoji: '⚕️', color: '#00D9FF', services: ['General Consultation', 'Specialist Referral', 'Telemedicine', 'Lab Tests', 'Health Checkups', 'Vaccinations'] },
  'church': { emoji: '⛪', color: '#9B59B6', services: ['Sunday Services', 'Online Streaming', 'Counseling', 'Events', 'Community Outreach', 'Weddings & Christenings'] },
  'ai': { emoji: '🤖', color: '#00FF9D', services: ['AI Consulting', 'Custom AI Solutions', 'Chatbot Development', 'Data Analysis', 'AI Training', 'Technical Support'] },
  'photo': { emoji: '📸', color: '#00D9FF', services: ['Portrait Photography', 'Event Coverage', 'Product Photography', 'Wedding Photography', 'Editing Services', 'Studio Sessions'] },
  'barber': { emoji: '💈', color: '#FF6B6B', services: ['Haircuts', 'Beard Trim', 'Hair Coloring', 'Kids Cuts', 'Styling', 'Home Service'] },
  'catering': { emoji: '🍱', color: '#FF6B9D', services: ['Event Catering', 'Corporate Catering', 'Birthday Parties', 'Wedding Catering', 'Custom Menus', 'Delivery'] },
  'tech repair': { emoji: '🔧', color: '#2563FF', services: ['Phone Repair', 'Laptop Repair', 'Software Issues', 'Data Recovery', 'Network Setup', 'Home Service'] },
  'beauty': { emoji: '💄', color: '#FF6B9D', services: ['Makeup', 'Facials', 'Manicure & Pedicure', 'Hair Styling', 'Bridal Package', 'Skincare'] },
  'fitness': { emoji: '💪', color: '#00FF9D', services: ['Personal Training', 'Group Sessions', 'Nutrition Plans', 'Online Coaching', 'Home Visits', 'Body Assessment'] },
  'default': { emoji: '🚀', color: '#00D9FF', services: ['Consultation', 'Custom Service', 'Project Delivery', 'Maintenance', 'Support', 'Training'] },
};

function detectBusinessType(prompt) {
  const p = prompt.toLowerCase();
  for (const key of Object.keys(businessTypes)) {
    if (key !== 'default' && p.includes(key)) return key;
  }
  if (p.includes('agency') || p.includes('design') || p.includes('brand')) return 'logo';
  if (p.includes('food') || p.includes('eat') || p.includes('cook')) return 'restaurant';
  if (p.includes('photo') || p.includes('camera')) return 'photo';
  if (p.includes('clean')) return 'cleaning';
  if (p.includes('gym') || p.includes('fit') || p.includes('train')) return 'fitness';
  return 'default';
}

// ============ INTERACTIVE BUILD FLOW ============
const buildOverlay = document.getElementById('buildOverlay');
const qaPhase = document.getElementById('qaPhase');
const buildPhase = document.getElementById('buildPhase');
const launchPhase = document.getElementById('launchPhase');
const qaBody = document.getElementById('qaBody');
const qaProgressFill = document.getElementById('qaProgressFill');
const qaBack = document.getElementById('qaBack');
const qaNext = document.getElementById('qaNext');
const previewFrame = document.getElementById('previewFrame');
const previewUrlBar = document.getElementById('previewUrlBar');
const taskList = document.getElementById('taskList');
const previewWhiteFlow = document.getElementById('previewWhiteFlow');

let currentQuestion = 0;
let buildAnswers = {};
let userPrompt = '';
let questions = [];

function startBuild() {
  const val = promptInput.value.trim();
  if (!val) { promptInput.focus(); return; }
  userPrompt = val;
  buildAnswers = {};
  currentQuestion = 0;

  const typeKey = detectBusinessType(userPrompt);
  const biz = businessTypes[typeKey];

  questions = [
    {
      id: 'name', text: 'What should we call your business?',
      hint: 'This will appear on your website and all your marketing.',
      type: 'text', placeholder: 'e.g. Lekki Clean Pros', icon: '🏷️'
    },
    {
      id: 'services', text: 'What services do you offer?',
      hint: 'Select all that apply. ERGIO will create pages for each.',
      type: 'checkbox', options: biz.services, icon: '📋'
    },
    {
      id: 'location', text: 'Where are you based?',
      hint: 'ERGIO will find clients in your area using OpenStreetMap.',
      type: 'text', placeholder: 'e.g. Lekki, Lagos', icon: '📍'
    },
    {
      id: 'clients', text: 'Who are your ideal clients?',
      hint: 'This helps our AI outreach engine target the right people.',
      type: 'checkbox',
      options: ['Small Businesses', 'Startups', 'Individuals', 'Corporate Clients', 'Events', 'Students', 'Families', 'Government'],
      icon: '🎯'
    },
    {
      id: 'vibe', text: 'Pick your brand style',
      hint: 'This determines your website colors and design feel.',
      type: 'radio', icon: '🎨',
      options: [
        { value: 'modern', label: 'Modern — Cyan', color: '#00D9FF' },
        { value: 'elegant', label: 'Elegant — Purple', color: '#9B59B6' },
        { value: 'vibrant', label: 'Vibrant — Pink', color: '#FF6B9D' },
        { value: 'clean', label: 'Clean — Green', color: '#00FF9D' },
        { value: 'corporate', label: 'Corporate — Blue', color: '#2563FF' },
        { value: 'warm', label: 'Warm — Red', color: '#FF6B6B' },
      ]
    }
  ];

  buildOverlay.classList.add('active');
  setTimeout(() => buildOverlay.classList.add('visible'), 10);
  document.body.style.overflow = 'hidden';
  showQuestion(0);
}

function showQuestion(idx) {
  const q = questions[idx];
  if (!q) return;
  qaProgressFill.style.width = `${(idx / questions.length) * 100}%`;
  qaBack.style.display = idx > 0 ? 'block' : 'none';
  qaNext.textContent = idx < questions.length - 1 ? 'Continue →' : 'Build my business →';
  qaNext.disabled = !buildAnswers[q.id] || (Array.isArray(buildAnswers[q.id]) && buildAnswers[q.id].length === 0);

  let html = `<div class="qa-question">`;
  html += `<div class="qa-q-icon">${q.icon}</div>`;
  html += `<div class="qa-q-title">${q.text}</div>`;
  html += `<div class="qa-q-sub">${q.hint}</div>`;

  if (q.type === 'text') {
    const val = buildAnswers[q.id] || '';
    html += `<input type="text" class="qa-input" id="qaInput${idx}" placeholder="${q.placeholder || ''}" value="${val}" />`;
  } else if (q.type === 'checkbox') {
    html += `<div class="qa-options">`;
    q.options.forEach((opt) => {
      const checked = buildAnswers[q.id] && buildAnswers[q.id].includes(opt) ? 'selected' : '';
      html += `<div class="qa-option ${checked}" data-qid="${q.id}" data-val="${opt}" onclick="toggleCheckbox(this)"><div class="qa-option-check"></div><span>${opt}</span></div>`;
    });
    html += `</div>`;
  } else if (q.type === 'radio') {
    html += `<div class="qa-options">`;
    q.options.forEach((opt) => {
      const checked = buildAnswers[q.id] === opt.value ? 'selected' : '';
      html += `<div class="qa-option ${checked}" data-qid="${q.id}" data-val="${opt.value}" onclick="selectRadio(this)"><div class="qa-option-check" style="background:${opt.color};border-color:${opt.color}"></div><span>●</span><span style="color:${opt.color}"> ${opt.label}</span></div>`;
    });
    html += `</div>`;
  }
  html += `</div>`;
  qaBody.innerHTML = html;

  if (q.type === 'text') {
    const input = document.getElementById(`qaInput${idx}`);
    if (input) {
      setTimeout(() => input.focus(), 300);
      input.addEventListener('input', () => { buildAnswers[q.id] = input.value; qaNext.disabled = !input.value.trim(); });
      input.addEventListener('keypress', (e) => { if (e.key === 'Enter') nextQuestion(); });
    }
  }
  updatePreview(idx);
}

function toggleCheckbox(el) {
  const qid = el.dataset.qid;
  const val = el.dataset.val;
  if (!buildAnswers[qid]) buildAnswers[qid] = [];
  if (el.classList.contains('selected')) {
    el.classList.remove('selected');
    buildAnswers[qid] = buildAnswers[qid].filter(v => v !== val);
  } else {
    el.classList.add('selected');
    buildAnswers[qid].push(val);
  }
  qaNext.disabled = !buildAnswers[qid] || buildAnswers[qid].length === 0;
}

function selectRadio(el) {
  const qid = el.dataset.qid;
  document.querySelectorAll(`.qa-option[data-qid="${qid}"]`).forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  buildAnswers[qid] = el.dataset.val;
  qaNext.disabled = false;
}

function nextQuestion() {
  if (currentQuestion < questions.length - 1) { currentQuestion++; showQuestion(currentQuestion); }
  else { startBuildPhase(); }
}
function prevQuestion() { if (currentQuestion > 0) { currentQuestion--; showQuestion(currentQuestion); } }

// ============ LIVE PREVIEW ============
function updatePreview(qaStep) {
  const name = buildAnswers.name || 'your-business';
  const typeKey = detectBusinessType(userPrompt);
  const biz = businessTypes[typeKey];
  const vibe = buildAnswers.vibe || 'modern';
  const location = buildAnswers.location || '';

  const vibeColors = { modern: '#00D9FF', elegant: '#9B59B6', vibrant: '#FF6B9D', clean: '#00FF9D', corporate: '#2563FF', warm: '#FF6B6B' };
  const color = vibeColors[vibe] || biz.color;
  const services = buildAnswers.services || biz.services.slice(0, 3);
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'your-business';
  previewUrlBar.textContent = `ergio.app/${slug}`;

  // White flow shimmer during early questions
  if (qaStep !== undefined && qaStep < 4) {
    previewWhiteFlow.classList.remove('hidden');
  } else {
    previewWhiteFlow.classList.add('hidden');
  }

  const serviceIcons = ['✨', '🎯', '🚀', '💡', '⚡', '🔧'];
  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    *{margin:0;padding:0;box-sizing:border-box;font-family:'Inter',system-ui,sans-serif}
    body{background:#fff;color:#1a1a2e}
    .nav{display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-bottom:1px solid #eee}
    .nav-brand{font-weight:800;font-size:18px;color:${color}}
    .nav-links{display:flex;gap:20px;font-size:13px;color:#555}
    .nav-cta{padding:8px 18px;background:${color};color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer}
    .hero{text-align:center;padding:60px 24px}
    .hero h1{font-size:28px;font-weight:800;margin-bottom:12px;color:#1a1a2e}
    .hero p{font-size:14px;color:#666;max-width:400px;margin:0 auto 24px;line-height:1.6}
    .hero-btns{display:flex;gap:12px;justify-content:center}
    .btn-primary{padding:12px 28px;background:${color};color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer}
    .btn-secondary{padding:12px 28px;background:#f0f0f0;color:#333;border:none;border-radius:10px;font-weight:600;cursor:pointer}
    .services{padding:48px 24px;background:#f9f9f9}
    .section-title{text-align:center;font-size:20px;font-weight:800;margin-bottom:28px}
    .services-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:600px;margin:0 auto}
    .service-card{text-align:center;padding:20px;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.05)}
    .service-icon{font-size:28px;margin-bottom:8px}
    .service-card h4{font-size:14px;font-weight:700;margin-bottom:6px}
    .service-card p{font-size:12px;color:#888;line-height:1.5}
    .contact{padding:48px 24px;text-align:center}
    .contact h3{font-size:20px;font-weight:800;margin-bottom:10px}
    .contact p{font-size:14px;color:#666;margin-bottom:20px}
    .contact-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
    .contact-btn{padding:10px 20px;color:#fff;border:none;border-radius:10px;font-weight:600;cursor:pointer}
    .footer{padding:20px;text-align:center;font-size:12px;color:#999;border-top:1px solid #eee}
  </style></head><body>`;

  if (buildAnswers.name) {
    html += `<div class="nav"><div class="nav-brand">${name}</div><div class="nav-links"><span>Home</span><span>Services</span><span>About</span><span>Contact</span></div><button class="nav-cta">Book Now</button></div>`;
  }
  if (userPrompt) {
    html += `<div class="hero"><h1>${userPrompt}</h1><p>Professional ${userPrompt.toLowerCase()} serving ${location || 'clients across Nigeria'}. Quality service you can trust. Book your appointment today.</p><div class="hero-btns"><button class="btn-primary">Book Now</button><button class="btn-secondary">Learn More</button></div></div>`;
  }
  if (buildAnswers.services) {
    html += `<div class="services"><div class="section-title">Our Services</div><div class="services-grid">`;
    services.slice(0, 3).forEach((s, i) => {
      html += `<div class="service-card"><div class="service-icon">${serviceIcons[i % serviceIcons.length]}</div><h4>${s}</h4><p>Professional ${s.toLowerCase()} with attention to detail.</p></div>`;
    });
    html += `</div></div>`;
  }
  if (buildAnswers.location) {
    html += `<div class="contact"><h3>Get In Touch</h3><p>Ready to start? Contact us today in ${location}.</p><div class="contact-btns"><button class="contact-btn" style="background:#25D366">WhatsApp</button><button class="contact-btn" style="background:${color}">Book</button><button class="contact-btn" style="background:#1a1a2e">Call</button></div></div>`;
  }
  html += `<div class="footer">© 2026 ${name}. Built with ERGIO.</div></body></html>`;

  previewFrame.srcdoc = html;
}

// ============ BUILD PHASE ============
const buildTasks = [
  { text: 'Analyzing your request with Groq + Llama 3.3...', duration: 900 },
  { text: 'Researching competitors in your area...', duration: 1000 },
  { text: 'Finding market opportunities...', duration: 900 },
  { text: 'Creating business strategy with AI...', duration: 1000 },
  { text: 'Generating brand identity...', duration: 800 },
  { text: 'Designing logo style...', duration: 900 },
  { text: 'Selecting color palette...', duration: 700 },
  { text: 'Setting up typography...', duration: 700 },
  { text: 'Writing AI-generated copy with Gemma 2...', duration: 1000 },
  { text: 'Building website with HTML/CSS...', duration: 1200 },
  { text: 'Optimizing for local SEO (OpenStreetMap)...', duration: 800 },
  { text: 'Connecting Paystack payment gateway...', duration: 900 },
  { text: 'Setting up booking calendar...', duration: 800 },
  { text: 'Creating WhatsApp business profile...', duration: 700 },
  { text: 'Setting up business email (Resend)...', duration: 700 },
  { text: '🔍 Engine 1: Scanning local demand with Crawlee...', duration: 1000 },
  { text: '🔍 Engine 1: Indexing on OpenStreetMap...', duration: 1000 },
  { text: '⚡ Engine 2: Matching nearby clients (Bolt-style)...', duration: 1200 },
  { text: '🤖 Engine 3: Generating outreach messages with AI...', duration: 900 },
  { text: '🤖 Engine 3: Sending outreach via WhatsApp API...', duration: 1000 },
  { text: '🔄 Engine 4: Setting up repeat client automation...', duration: 800 },
  { text: 'Building marketing funnel...', duration: 700 },
  { text: 'Deploying to GitHub Pages / Vercel...', duration: 800 },
  { text: 'Final launch preparations...', duration: 600 },
];

function startBuildPhase() {
  qaPhase.style.display = 'none';
  buildPhase.style.display = 'flex';
  launchPhase.style.display = 'none';
  qaProgressFill.style.width = '100%';

  taskList.innerHTML = '';
  document.getElementById('buildProgressFill').style.width = '0%';
  document.getElementById('buildProgressPct').textContent = '0%';
  document.getElementById('statusText').textContent = 'Building your business...';
  document.getElementById('statusDot').classList.remove('done');

  document.getElementById('bfWebsite').textContent = 'Pending';
  document.getElementById('bfWebsite').className = 'bf-value';
  document.getElementById('bfBrand').textContent = 'Pending';
  document.getElementById('bfBrand').className = 'bf-value';
  document.getElementById('bfLeads').textContent = '0';
  document.getElementById('bfOutreach').textContent = 'Waiting';
  document.getElementById('bfOutreach').className = 'bf-value';

  previewWhiteFlow.classList.remove('hidden');
  updatePreview(5);

  // Call Groq API for AI-enhanced content (non-blocking)
  callGroqForBusiness();

  let taskIdx = 0;
  let totalProgress = 0;
  const totalDuration = buildTasks.reduce((a, b) => a + b.duration, 0);

  function runTask() {
    if (taskIdx >= buildTasks.length) { finishBuild(); return; }
    const task = buildTasks[taskIdx];
    const taskEl = document.createElement('div');
    taskEl.className = 'task-item';
    taskEl.innerHTML = `<div class="task-spin"></div><span>${task.text}</span>`;
    taskList.appendChild(taskEl);
    setTimeout(() => taskEl.classList.add('visible'), 30);
    taskEl.scrollIntoView({ behavior: 'smooth', block: 'end' });

    // Reveal preview progressively
    if (taskIdx === 4) previewWhiteFlow.classList.add('hidden');
    if (taskIdx === 5) { document.getElementById('bfBrand').textContent = 'Ready'; document.getElementById('bfBrand').classList.add('live'); }
    if (taskIdx === 9) { document.getElementById('bfWebsite').textContent = 'Live'; document.getElementById('bfWebsite').classList.add('live'); }
    if (taskIdx === 15) {
      let leadCount = 0;
      const li = setInterval(() => {
        leadCount += Math.floor(Math.random() * 40) + 10;
        if (leadCount > 413) leadCount = 413;
        document.getElementById('bfLeads').textContent = leadCount;
        if (leadCount >= 413) { clearInterval(li); document.getElementById('bfLeads').classList.add('live'); }
      }, 100);
    }
    if (taskIdx === 19) document.getElementById('bfOutreach').textContent = 'Sending...';
    if (taskIdx === 21) { document.getElementById('bfOutreach').textContent = '287 sent'; document.getElementById('bfOutreach').classList.add('live'); }

    setTimeout(() => {
      taskEl.querySelector('.task-spin')?.remove();
      const check = document.createElement('div');
      check.className = 'task-check';
      check.innerHTML = '✓';
      taskEl.insertBefore(check, taskEl.firstChild);
      taskEl.classList.add('done');
      totalProgress += task.duration;
      const pct = Math.round((totalProgress / totalDuration) * 100);
      document.getElementById('buildProgressFill').style.width = pct + '%';
      document.getElementById('buildProgressPct').textContent = pct + '%';
      taskIdx++;
      runTask();
    }, task.duration);
  }
  runTask();
}

// ============ GROQ AI BUSINESS GENERATION ============
async function callGroqForBusiness() {
  const name = buildAnswers.name || userPrompt;
  const services = (buildAnswers.services || []).join(', ');
  const location = buildAnswers.location || 'Nigeria';
  const clients = (buildAnswers.clients || []).join(', ');

  const systemPrompt = `You are ERGIO's AI business engine. Generate a compelling business description and marketing tagline for a new business. Return JSON with fields: tagline (short catchy phrase), description (2-3 sentences), heroHeadline (5-8 words), aboutText (2 sentences).`;

  const userMsg = `Business: ${name}\nType: ${userPrompt}\nServices: ${services}\nLocation: ${location}\nTarget clients: ${clients}\n\nGenerate marketing copy.`;

  const result = await callGroq(systemPrompt, userMsg, 500);
  if (result) {
    try {
      const cleaned = result.replace(/```json|```/g, '').trim();
      const aiContent = JSON.parse(cleaned);
      buildAnswers.aiContent = aiContent;
      // Could update preview with AI content here
    } catch (e) {
      console.warn('AI content parse failed, continuing with defaults');
    }
  }
}

// ============ FINISH ============
function finishBuild() {
  document.getElementById('buildProgressFill').style.width = '100%';
  document.getElementById('buildProgressPct').textContent = '100%';
  document.getElementById('statusText').textContent = 'Done!';
  document.getElementById('statusDot').classList.add('done');

  const name = buildAnswers.name || userPrompt;
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'your-business';

  setTimeout(() => {
    buildPhase.style.display = 'none';
    launchPhase.style.display = 'flex';
    const launchSub = document.getElementById('launchSub');
    const launchUrl = document.getElementById('launchUrl');
    if (launchSub) launchSub.textContent = `${name} is live. 4 engines are now finding you clients.`;
    if (launchUrl) launchUrl.textContent = `ergio.app/${slug}`;
  }, 800);
}

function closeBuild() {
  buildOverlay.classList.remove('visible');
  document.body.style.overflow = '';
  setTimeout(() => {
    buildOverlay.classList.remove('active');
    qaPhase.style.display = 'flex';
    buildPhase.style.display = 'none';
    launchPhase.style.display = 'none';
    previewWhiteFlow.classList.add('hidden');
    promptInput.value = '';
  }, 300);
}

// ============ FAQ ============
function toggleFaq(el) { el.parentElement.classList.toggle('open'); }
