/* ========================================
   ERGIO — Interactive Build Engine
   ======================================== */

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
  constructor() {
    this.reset();
    this.y = Math.random() * canvas.height;
  }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = canvas.height + 10;
    this.size = Math.random() * 2 + 0.5;
    this.speedY = Math.random() * 0.3 + 0.1;
    this.opacity = Math.random() * 0.4 + 0.1;
    const colors = ['0, 217, 255', '0, 255, 157', '37, 99, 255'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }
  update() {
    this.y -= this.speedY;
    if (this.y < -10) this.reset();
  }
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

function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('mobile-open');
}

function scrollToPrompt() {
  document.getElementById('hero').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => document.getElementById('promptInput').focus(), 600);
}

// ============ REVEAL ON SCROLL ============
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
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
  } else {
    phTimeout = setTimeout(erasePlaceholder, 2000);
  }
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

promptInput.addEventListener('focus', () => {
  clearTimeout(phTimeout);
  promptInput.setAttribute('placeholder', 'What do you want to build?');
});
promptInput.addEventListener('blur', () => {
  if (!promptInput.value) typePlaceholder(placeholders[phIndex]);
});

promptInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && promptInput.value.trim()) startBuild();
});

function fillPrompt(text) {
  promptInput.value = text;
  promptInput.focus();
}

// ============ COUNTERS ============
function animateCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
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
      if (target >= 1000000) {
        display = (current / 1000000).toFixed(1) + 'M';
      }
      el.textContent = prefix + display + suffix;
      if (progress < 1) requestAnimationFrame(update);
      else el.dataset.animated = 'true';
    }
    requestAnimationFrame(update);
  });
}

setTimeout(animateCounters, 800);

// ============ FAQ ============
function toggleFaq(el) {
  const item = el.parentElement;
  item.classList.toggle('open');
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
const previewBody = document.getElementById('previewBody');
const previewUrl = document.getElementById('previewUrl');
const taskList = document.getElementById('taskList');

let currentQuestion = 0;
let buildAnswers = {};
let userPrompt = '';

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
  'default': { emoji: '🚀', color: '#00D9FF', services: ['Consultation', 'Custom Service', 'Project Delivery', 'Maintenance', 'Support', 'Training'] },
};

function detectBusinessType(prompt) {
  const p = prompt.toLowerCase();
  for (const key of Object.keys(businessTypes)) {
    if (key !== 'default' && p.includes(key)) return key;
  }
  // Check for agency keywords
  if (p.includes('agency') || p.includes('design')) return 'logo';
  if (p.includes('food') || p.includes('eat') || p.includes('cook')) return 'restaurant';
  if (p.includes('photo') || p.includes('camera')) return 'photo';
  return 'default';
}

function generateQuestions(prompt) {
  const typeKey = detectBusinessType(prompt);
  const biz = businessTypes[typeKey];
  return [
    {
      id: 'name',
      label: 'BRAND NAME',
      text: 'What should we call your business?',
      hint: 'This will appear on your website and all your marketing.',
      type: 'text',
      placeholder: 'e.g. Lekki Clean Pros'
    },
    {
      id: 'services',
      label: 'SERVICES',
      text: 'What services do you offer?',
      hint: 'Select all that apply. ERGIO will create pages for each.',
      type: 'checkbox',
      options: biz.services
    },
    {
      id: 'location',
      label: 'LOCATION',
      text: 'Where are you based?',
      hint: 'ERGIO will find clients in your area.',
      type: 'text',
      placeholder: 'e.g. Lekki, Lagos'
    },
    {
      id: 'clients',
      label: 'IDEAL CLIENTS',
      text: 'Who are your ideal clients?',
      hint: 'Helps ERGIO target the right audience.',
      type: 'checkbox',
      options: ['Individuals / Personal', 'Small Businesses', 'Corporate Clients', 'Startups', 'Government / NGOs', 'Schools / Churches', 'Event Planners', 'Real Estate Agents']
    },
    {
      id: 'vibe',
      label: 'BRAND VIBE',
      text: 'Choose your brand style',
      hint: 'This determines your website design, colors, and tone.',
      type: 'radio',
      options: [
        { value: 'modern', label: 'Modern & Bold', color: '#00D9FF' },
        { value: 'elegant', label: 'Elegant & Premium', color: '#9B59B6' },
        { value: 'vibrant', label: 'Vibrant & Fun', color: '#FF6B9D' },
        { value: 'clean', label: 'Clean & Minimal', color: '#00FF9D' },
        { value: 'corporate', label: 'Corporate & Professional', color: '#2563FF' },
        { value: 'warm', label: 'Warm & Welcoming', color: '#FF6B6B' }
      ]
    }
  ];
}

let questions = [];

function startBuild() {
  const val = promptInput.value.trim();
  if (!val) {
    promptInput.focus();
    return;
  }
  userPrompt = val;
  questions = generateQuestions(val);
  currentQuestion = 0;
  buildAnswers = {};

  buildOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  showQuestion(0);
}

function showQuestion(idx) {
  const q = questions[idx];
  if (!q) return;

  qaProgressFill.style.width = `${(idx / questions.length) * 100}%`;

  qaBack.style.display = idx > 0 ? 'flex' : 'none';
  qaNext.style.display = 'flex';
  qaNext.disabled = !buildAnswers[q.id];

  // Build HTML
  let html = `<div class="qa-question" id="qaQ${idx}">`;
  html += `<div class="qa-q-label">${q.label}</div>`;
  html += `<div class="qa-q-text">${q.text}</div>`;
  html += `<div class="qa-q-hint">${q.hint}</div>`;

  if (q.type === 'text') {
    const val = buildAnswers[q.id] || '';
    html += `<input type="text" class="qa-text-input" id="qaInput${idx}" placeholder="${q.placeholder || ''}" value="${val}" />`;
  } else if (q.type === 'checkbox') {
    html += `<div class="qa-options">`;
    q.options.forEach((opt, i) => {
      const checked = buildAnswers[q.id] && buildAnswers[q.id].includes(opt) ? 'selected' : '';
      html += `
        <div class="qa-option ${checked}" data-qid="${q.id}" data-val="${opt}" onclick="toggleCheckbox(this, ${idx})">
          <div class="qa-checkbox">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#09090B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <span class="qa-option-label">${opt}</span>
        </div>`;
    });
    html += `</div>`;
  } else if (q.type === 'radio') {
    html += `<div class="qa-options">`;
    q.options.forEach((opt) => {
      const checked = buildAnswers[q.id] === opt.value ? 'selected' : '';
      html += `
        <div class="qa-option ${checked}" data-qid="${q.id}" data-val="${opt.value}" onclick="selectRadio(this, ${idx})">
          <div class="qa-checkbox">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#09090B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <span class="qa-option-label" style="color: ${opt.color}">●</span>
          <span class="qa-option-label">${opt.label}</span>
        </div>`;
    });
    html += `</div>`;
  }

  html += `</div>`;

  qaBody.innerHTML = html;
  setTimeout(() => {
    const el = document.getElementById(`qaQ${idx}`);
    if (el) el.classList.add('visible');
  }, 50);

  if (q.type === 'text') {
    const input = document.getElementById(`qaInput${idx}`);
    if (input) {
      setTimeout(() => input.focus(), 300);
      input.addEventListener('input', () => {
        buildAnswers[q.id] = input.value;
        qaNext.disabled = !input.value.trim();
      });
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') nextQuestion();
      });
    }
  }

  // Update preview with partial info
  updatePreview();
}

function toggleCheckbox(el, idx) {
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

function selectRadio(el, idx) {
  const qid = el.dataset.qid;
  const val = el.dataset.val;

  document.querySelectorAll(`.qa-option[data-qid="${qid}"]`).forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  buildAnswers[qid] = val;

  qaNext.disabled = false;
}

function nextQuestion() {
  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    showQuestion(currentQuestion);
  } else {
    startBuildPhase();
  }
}

function prevQuestion() {
  if (currentQuestion > 0) {
    currentQuestion--;
    showQuestion(currentQuestion);
  }
}

// ============ LIVE PREVIEW GENERATION ============
function updatePreview() {
  const name = buildAnswers.name || userPrompt;
  const typeKey = detectBusinessType(userPrompt);
  const biz = businessTypes[typeKey];
  const vibe = buildAnswers.vibe || 'modern';
  const location = buildAnswers.location || '';

  const vibeColors = {
    modern: '#00D9FF',
    elegant: '#9B59B6',
    vibrant: '#FF6B9D',
    clean: '#00FF9D',
    corporate: '#2563FF',
    warm: '#FF6B6B'
  };
  const color = vibeColors[vibe] || biz.color;

  const services = buildAnswers.services || biz.services.slice(0, 3);
  const serviceIcons = ['✨', '🎯', '🚀', '💡', '⚡', '🔧'];

  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'your-business';
  previewUrl.textContent = `ergio.app/${slug}`;

  let html = `<div class="gen-site" id="genSite">`;
  html += `<div class="gen-loading" id="genLoading"><div class="gen-loading-dot"></div><div class="gen-loading-dot"></div><div class="gen-loading-dot"></div></div>`;
  html += `<div class="gen-nav" id="genNav" style="display:none">`;
  html += `<div class="gen-nav-brand" style="color: ${color}">${name}</div>`;
  html += `<div class="gen-nav-links"><span>Home</span><span>Services</span><span>About</span><span>Contact</span></div>`;
  html += `<button class="gen-nav-cta" style="background: ${color}">Book Now</button>`;
  html += `</div>`;

  const tagline = `${name} — ${userPrompt} in ${location || 'Nigeria'}`.substring(0, 60);

  html += `<div class="gen-hero" id="genHero" style="display:none">`;
  html += `<h1>${userPrompt}</h1>`;
  html += `<p>Professional ${userPrompt.toLowerCase()} serving ${location || 'clients across Nigeria'}. Quality service. Trusted by the community. Book your appointment today.</p>`;
  html += `<div class="gen-hero-btns">`;
  html += `<button class="gen-hero-btn gen-hero-btn-primary" style="background: ${color}">Book Now</button>`;
  html += `<button class="gen-hero-btn gen-hero-btn-secondary">Learn More</button>`;
  html += `</div>`;
  html += `</div>`;

  html += `<div class="gen-services" id="genServices" style="display:none">`;
  html += `<div class="gen-section-title">Our Services</div>`;
  html += `<div class="gen-services-grid">`;
  services.slice(0, 3).forEach((s, i) => {
    html += `<div class="gen-service-card">`;
    html += `<div class="gen-service-icon">${serviceIcons[i % serviceIcons.length]}</div>`;
    html += `<h4>${s}</h4>`;
    html += `<p>Professional ${s.toLowerCase()} with attention to detail and customer satisfaction.</p>`;
    html += `</div>`;
  });
  html += `</div></div>`;

  html += `<div class="gen-contact" id="genContact" style="display:none">`;
  html += `<div class="gen-contact-box">`;
  html += `<h3>Get In Touch</h3>`;
  html += `<p>Ready to get started? Contact us today${location ? ` in ${location}` : ''}.</p>`;
  html += `<div class="gen-contact-btns">`;
  html += `<button class="gen-contact-btn" style="background: #25D366">WhatsApp Us</button>`;
  html += `<button class="gen-contact-btn" style="background: ${color}">Book Appointment</button>`;
  html += `<button class="gen-contact-btn" style="background: #1a1a2e">Call Now</button>`;
  html += `</div></div></div>`;

  html += `<div class="gen-footer" id="genFooter" style="display:none">`;
  html += `© 2026 ${name}. Built with ERGIO.`;
  html += `</div>`;

  html += `</div>`;

  previewBody.innerHTML = html;
}

function showGenLoading() {
  const loading = document.getElementById('genLoading');
  const site = document.getElementById('genSite');
  if (loading) loading.style.display = 'flex';
  if (site) site.classList.add('visible');
}

function showGenSection(id, delay) {
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = 'block';
      setTimeout(() => el.classList.add('visible'), 50);
    }
  }, delay);
}

// ============ BUILD PHASE ============
const buildTasks = [
  { text: 'Understanding your request...', duration: 800 },
  { text: 'Researching competitors...', duration: 1000 },
  { text: 'Finding market opportunities...', duration: 1000 },
  { text: 'Creating business strategy...', duration: 900 },
  { text: 'Generating brand identity...', duration: 800 },
  { text: 'Designing logo...', duration: 1000 },
  { text: 'Selecting colors...', duration: 700 },
  { text: 'Creating typography...', duration: 700 },
  { text: 'Writing copy...', duration: 1000 },
  { text: 'Building website...', duration: 1200 },
  { text: 'Optimizing SEO...', duration: 800 },
  { text: 'Connecting AI systems...', duration: 900 },
  { text: 'Setting up CRM...', duration: 800 },
  { text: 'Creating social pages...', duration: 700 },
  { text: 'Creating business emails...', duration: 700 },
  { text: 'Finding nearby customers...', duration: 1000 },
  { text: 'Searching Google Maps...', duration: 1000 },
  { text: 'Finding businesses needing your service...', duration: 1200 },
  { text: 'Generating outreach messages...', duration: 900 },
  { text: 'Sending outreach...', duration: 1000 },
  { text: 'Booking meetings...', duration: 800 },
  { text: 'Tracking responses...', duration: 700 },
  { text: 'Building marketing funnel...', duration: 900 },
  { text: 'Preparing launch...', duration: 600 },
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

  // Reset footer stats
  document.getElementById('bfWebsite').textContent = 'Pending';
  document.getElementById('bfBrand').textContent = 'Pending';
  document.getElementById('bfLeads').textContent = '0';
  document.getElementById('bfOutreach').textContent = 'Waiting';

  // Generate preview fresh
  updatePreview();
  showGenLoading();

  let taskIdx = 0;
  let totalProgress = 0;
  const totalDuration = buildTasks.reduce((a, b) => a + b.duration, 0);

  function runTask() {
    if (taskIdx >= buildTasks.length) {
      finishBuild();
      return;
    }

    const task = buildTasks[taskIdx];
    const taskEl = document.createElement('div');
    taskEl.className = 'task-item active';
    taskEl.innerHTML = `
      <div class="task-icon">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
          <path d="M5 12l5 5L20 7" stroke="#00FF9D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="task-text">${task.text}</span>
    `;
    taskList.appendChild(taskEl);
    taskEl.scrollIntoView({ behavior: 'smooth', block: 'end' });

    // Show preview sections at specific task points
    if (taskIdx === 4) showGenSection('genNav', 0);
    if (taskIdx === 7) showGenSection('genHero', 0);
    if (taskIdx === 8) {
      const loading = document.getElementById('genLoading');
      if (loading) loading.style.display = 'none';
    }
    if (taskIdx === 9) showGenSection('genServices', 0);
    if (taskIdx === 14) showGenSection('genContact', 0);
    if (taskIdx === 22) showGenSection('genFooter', 0);

    // Update footer stats at milestones
    if (taskIdx === 9) {
      document.getElementById('bfWebsite').textContent = 'Live';
      document.getElementById('bfWebsite').style.color = '#00FF9D';
    }
    if (taskIdx === 5) {
      document.getElementById('bfBrand').textContent = 'Ready';
      document.getElementById('bfBrand').style.color = '#00FF9D';
    }
    if (taskIdx === 16) {
      let leadCount = 0;
      const leadInterval = setInterval(() => {
        leadCount += Math.floor(Math.random() * 40) + 10;
        if (leadCount > 413) leadCount = 413;
        document.getElementById('bfLeads').textContent = leadCount;
        if (leadCount >= 413) clearInterval(leadInterval);
      }, 100);
    }
    if (taskIdx === 19) {
      document.getElementById('bfOutreach').textContent = 'Sending...';
    }
    if (taskIdx === 21) {
      document.getElementById('bfOutreach').textContent = '287 sent';
      document.getElementById('bfOutreach').style.color = '#00FF9D';
    }

    setTimeout(() => {
      taskEl.classList.remove('active');
      taskEl.classList.add('done');

      totalProgress += task.duration;
      const pct = Math.round((totalProgress / totalDuration) * 100);
      document.getElementById('buildProgressFill').style.width = pct + '%';
      document.getElementById('buildProgressPct').textContent = pct + '%';

      taskIdx++;
      runTask();
    }, task.duration);
  }

  // Hide loading after a moment
  setTimeout(() => {
    const loading = document.getElementById('genLoading');
    if (loading) loading.style.display = 'none';
    showGenSection('genNav', 0);
    showGenSection('genHero', 400);
  }, 500);

  runTask();
}

function finishBuild() {
  document.getElementById('buildProgressFill').style.width = '100%';
  document.getElementById('buildProgressPct').textContent = '100%';
  document.getElementById('statusText').textContent = 'Done';
  document.getElementById('statusDot').classList.add('done');

  const name = buildAnswers.name || userPrompt;
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'your-business';

  setTimeout(() => {
    buildPhase.style.display = 'none';
    launchPhase.style.display = 'flex';

    document.getElementById('launchBusinessName').textContent = `${name} is live. Clients are being found.`;
    document.getElementById('lpUrl').textContent = `ergio.app/${slug}`;

    // Animate launch stats
    const leads = Math.floor(Math.random() * 300) + 200;
    const emails = Math.floor(leads * 0.7);
    const meetings = Math.floor(emails * 0.05) + 5;

    animateNumber('launchLeads', 0, leads, 1500);
    animateNumber('launchEmails', 0, emails, 1500);
    animateNumber('launchMeetings', 0, meetings, 1500);
  }, 800);
}

function animateNumber(id, start, end, duration) {
  const el = document.getElementById(id);
  if (!el) return;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const val = Math.floor(start + (end - start) * ease);
    el.textContent = val;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function closeBuild() {
  buildOverlay.classList.remove('active');
  document.body.style.overflow = '';
  setTimeout(() => {
    qaPhase.style.display = 'flex';
    buildPhase.style.display = 'none';
    launchPhase.style.display = 'none';
    previewBody.innerHTML = `<div class="preview-placeholder">
      <div class="pp-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <path d="M4 4h16v16H4z M4 4l8 8 8-8" stroke="url(#ppGrad)" stroke-width="1.5" stroke-linejoin="round" fill="none"/>
          <defs>
            <linearGradient id="ppGrad" x1="0" y1="0" x2="24" y2="24">
              <stop stop-color="#00D9FF"/><stop offset="0.5" stop-color="#00FF9D"/><stop offset="1" stop-color="#2563FF"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <p>Answer a few questions and watch your<br>business come to life here.</p>
    </div>`;
  }, 400);
}

function copyLink() {
  const url = document.getElementById('lpUrl').textContent;
  navigator.clipboard.writeText(`https://${url}`).then(() => {
    const btn = document.querySelector('.lp-copy');
    const orig = btn.innerHTML;
    btn.innerHTML = '✓ Copied';
    setTimeout(() => btn.innerHTML = orig, 2000);
  });
}
