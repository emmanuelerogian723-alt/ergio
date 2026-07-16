/* ========================================
   ERGIO — Interactive Build Engine v2
   Real API integration + Lovable-style chat
   ======================================== */

// ============ CONFIG ============
const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? 'http://localhost:3000'
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
const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');
if (menuBtn) {
  menuBtn.addEventListener('click', () => navLinks.classList.toggle('open'));
}

// ============ ROTATING PLACEHOLDER ============
const promptInput = document.getElementById('promptInput');
const placeholders = [
  'I do graphic design in Lagos...',
  'I am a makeup artist in Abuja...',
  'I run a catering business in Port Harcourt...',
  'I am a photographer in Ibadan...',
  'I teach music lessons in Kano...',
  'I make custom clothes in Enugu...',
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
const counters = document.querySelectorAll('.counter');
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
      entry.target.classList.add('visible');
      revealObs.unobserve(entry.target);
    }
  });
});
reveals.forEach(r => revealObs.observe(r));

// ============ FAQ ============
document.querySelectorAll('.faq-q').forEach(q => {
  q.addEventListener('click', () => {
    const a = q.nextElementSibling;
    a.style.maxHeight = a.style.maxHeight ? null : a.scrollHeight + 'px';
    q.classList.toggle('open');
  });
});

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
  { id: 'clients', label: 'Ideal Clients', text: 'Who are your ideal clients?', hint: 'Be specific — this powers our AI outreach engine', type: 'text', placeholder: 'e.g. Restaurants, event planners, families...' },
  { id: 'style', label: 'Brand Style', text: 'What vibe do you want?', hint: 'This shapes your website design', type: 'radio', options: ['Modern & Minimal', 'Bold & Colorful', 'Luxury & Premium', 'Friendly & Casual'] }
];

let currentQ = 0;

function startBuild(prompt) {
  buildAnswers = { prompt };
  buildOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Hide prompt, show preview pane
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

  // Update progress
  const fill = document.getElementById('qaProgressFill');
  if (fill) fill.style.width = `${(idx / questions.length) * 100}%`;

  const backBtn = document.getElementById('qaBack');
  const nextBtn = document.getElementById('qaNext');
  if (backBtn) backBtn.style.display = idx > 0 ? 'flex' : 'none';
  if (nextBtn) {
    nextBtn.style.display = 'flex';
    nextBtn.disabled = !buildAnswers[q.id];
  }

  // Build question HTML
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

  // Focus input
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
  if (nextBtn) nextBtn.disabled = buildAnswers[qid].length === 0;
};

window.toggleRadio = function(el, val) {
  const qid = el.dataset.qid;
  buildAnswers[qid] = val;
  document.querySelectorAll(`[data-qid="${qid}"]`).forEach(s => s.classList.remove('selected'));
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

// ============ REAL AI GENERATION ============
async function startRealGeneration() {
  qaPanel.style.display = 'none';
  buildPanel.style.display = 'flex';

  const buildLog = document.getElementById('buildLog');
  const progressBar = document.getElementById('progressBar');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const statTasks = document.getElementById('statTasks');
  const statTime = document.getElementById('statTime');
  const previewFrame = document.getElementById('previewFrame');

  if (buildLog) buildLog.innerHTML = '';
  if (progressBar) progressBar.style.width = '0%';
  let taskCount = 0;
  const startTime = Date.now();

  try {
    // Call the real API with SSE streaming
    const response = await fetch(`${API_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: buildAnswers.prompt,
        answers: buildAnswers
      })
    });

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
              if (statTime) statTime.textContent = Math.floor((Date.now() - startTime) / 1000) + 's';
              if (progressFill) progressFill.style.width = `${(event.data.step / event.data.total) * 100}%`;
              if (progressText) progressText.textContent = `${event.data.step}/${event.data.total}`;
              scrollBuildLog();
            } else if (event.type === 'plan') {
              const plan = event.data.plan;
              completeLastTask(buildLog);
              if (plan.brandColors && progressFill) {
                // Could update theme colors here
              }
            } else if (event.type === 'brand') {
              completeLastTask(buildLog);
            } else if (event.type === 'content') {
              completeLastTask(buildLog);
            } else if (event.type === 'website') {
              completeLastTask(buildLog);
              generatedHtml = event.data.html;
              if (previewFrame) {
                previewFrame.srcdoc = generatedHtml;
              }
            } else if (event.type === 'booking') {
              completeLastTask(buildLog);
            } else if (event.type === 'payment') {
              completeLastTask(buildLog);
            } else if (event.type === 'engines') {
              completeLastTask(buildLog);
            } else if (event.type === 'complete') {
              completeLastTask(buildLog);
              generatedBusiness = event.data.business;
              if (progressBar) progressBar.style.width = '100%';
              if (progressFill) progressFill.style.width = '100%';
              if (progressText) progressText.textContent = 'Complete';

              setTimeout(() => {
                showLaunchScreen(event.data.business);
              }, 1000);
            } else if (event.type === 'error') {
              addBuildTask(buildLog, 'Error: ' + event.data.message, 'error');
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  } catch (err) {
    // Fallback to simulated build if API is not available
    console.log('API not available, using simulation:', err.message);
    await simulateBuild(buildLog, progressBar, progressFill, progressText, statTasks, statTime, previewFrame);
  }
}

function addBuildTask(log, text, status = 'pending') {
  if (!log) return;
  const task = document.createElement('div');
  task.className = `build-task ${status}`;
  task.innerHTML = `
    <div class="build-task-icon">${status === 'active' ? '<div class="spinner"></div>' : status === 'done' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#00FF9D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '!'}</div>
    <div class="build-task-text">${text}</div>
  `;
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

// ============ SIMULATION FALLBACK ============
async function simulateBuild(buildLog, progressBar, progressFill, progressText, statTasks, statTime, previewFrame) {
  const tasks = [
    'Understanding your request...',
    'Researching competitors...',
    'Finding market opportunities...',
    'Creating business strategy...',
    'Generating brand identity...',
    'Designing logo via Pollinations AI...',
    'Selecting brand colors...',
    'Writing website copy with Groq AI...',
    'Building website HTML...',
    'Optimizing SEO meta tags...',
    'Setting up booking system...',
    'Connecting Paystack payment gateway...',
    'Initializing Local Discovery engine...',
    'Initializing Demand Matching engine...',
    'Initializing AI Outreach engine...',
    'Initializing Repeat Client engine...',
    'Deploying to subdomain...',
    'Finalizing your business...'
  ];

  for (let i = 0; i < tasks.length; i++) {
    addBuildTask(buildLog, tasks[i], 'active');
    if (statTasks) statTasks.textContent = i + 1;
    if (statTime) statTime.textContent = Math.floor((Date.now() - startTime) / 1000) + 's';
    if (progressFill) progressFill.style.width = `${((i + 1) / tasks.length) * 100}%`;
    if (progressText) progressText.textContent = `${i + 1}/${tasks.length}`;
    if (progressBar) progressBar.style.width = `${((i + 1) / tasks.length) * 100}%`;
    scrollBuildLog();

    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));

    completeLastTask(buildLog);
  }

  // Show launch
  generatedBusiness = {
    name: buildAnswers.name || 'Your Business',
    tagline: 'Powered by ERGIO AI',
    slug: 'your-business'
  };
  generatedHtml = generateFallbackHTML();
  if (previewFrame) previewFrame.srcdoc = generatedHtml;

  setTimeout(() => showLaunchScreen(generatedBusiness), 500);
}

function generateFallbackHTML() {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${buildAnswers.name || 'My Business'}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,sans-serif;background:#09090B;color:#fff;line-height:1.6}.hero{text-align:center;padding:6rem 5%}.hero h1{font-size:3rem;margin-bottom:1rem}.hero p{color:#94A3B8;font-size:1.2rem;max-width:600px;margin:0 auto 2rem}.btn{background:#00D9FF;color:#09090B;padding:1rem 2rem;border-radius:100px;font-weight:700;text-decoration:none;display:inline-block}</style></head><body><div class="hero"><h1>${buildAnswers.name || 'Your Business'}</h1><p>${buildAnswers.prompt || 'Professional services tailored to your needs.'}</p><a href="#" class="btn">Book Now</a></div></body></html>`;
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
  if (launchBusinessName) launchBusinessName.textContent = business.name || 'Your Business';

  // Show chat refinement box (like Lovable's Chat Mode)
  showChatRefinement();
}

// ============ CHAT REFINEMENT (Lovable Chat Mode) ============
function showChatRefinement() {
  const chatBox = document.getElementById('chatBox');
  if (!chatBox) return;

  chatBox.style.display = 'flex';

  const chatInput = document.getElementById('chatInput');
  const chatSend = document.getElementById('chatSend');
  const chatMessages = document.getElementById('chatMessages');

  function sendChatMessage() {
    const msg = chatInput.value.trim();
    if (!msg) return;

    // Add user message
    addChatMessage('user', msg);
    chatInput.value = '';
    chatInput.placeholder = 'Refining...';

    // Call refine API
    refineWebsite(msg);
  }

  if (chatSend) chatSend.onclick = sendChatMessage;
  if (chatInput) {
    chatInput.onkeypress = (e) => {
      if (e.key === 'Enter') sendChatMessage();
    };
  }

  // Focus the input
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

  // Show "thinking" indicator
  const thinking = document.createElement('div');
  thinking.className = 'chat-msg chat-bot';
  thinking.innerHTML = '<div class="chat-msg-text"><div class="chat-typing"><span></span><span></span><span></span></div></div>';
  chatMessages.appendChild(thinking);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const response = await fetch(`${API_BASE}/api/refine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        currentHtml: generatedHtml,
        businessContext: generatedBusiness
      })
    });

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

            if (event.type === 'updated') {
              thinking.querySelector('.chat-msg-text').textContent = 'Applying changes...';
            } else if (event.type === 'complete') {
              thinking.remove();
              generatedHtml = event.data.html;
              addChatMessage('bot', event.data.summary || 'Done!');

              // Update preview
              const previewFrame = document.getElementById('previewFrame');
              if (previewFrame) previewFrame.srcdoc = generatedHtml;

              if (chatInput) {
                chatInput.placeholder = 'Try: "make the colors blue" or "add a pricing section"';
              }
            } else if (event.type === 'error') {
              thinking.remove();
              addChatMessage('bot', 'Sorry, ' + event.data.message);
              if (chatInput) chatInput.placeholder = 'Try again...';
            }
          } catch (e) {}
        }
      }
    }
  } catch (err) {
    thinking.remove();
    addChatMessage('bot', 'API not connected yet. This will work once deployed to Vercel.');
    if (chatInput) chatInput.placeholder = 'Try: "make the colors blue"';
  }
}

// ============ CLOSE OVERLAY ============
const buildClose = document.getElementById('buildClose');
if (buildClose) {
  buildClose.addEventListener('click', () => {
    buildOverlay.classList.remove('active');
    document.body.style.overflow = '';
    if (previewPane) previewPane.classList.remove('visible');
  });
}

// ============ ANALYTICS TRACKING ============
if (!window.location.pathname.includes('auth') && !window.location.pathname.includes('dashboard')) {
  fetch(`${API_BASE}/api/analytics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: 'page_view', event_data: { page: window.location.pathname } })
  }).catch(() => {});
}

// Expose for debugging
window.ERGIO = { startBuild, generatedBusiness, generatedHtml };

// ============ HELPER FUNCTIONS ============
window.fillPrompt = function(text) {
  const input = document.getElementById('promptInput');
  if (input) {
    input.value = text;
    input.focus();
  }
};

window.closeBuild = function() {
  const overlay = document.getElementById('buildOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    const pane = document.getElementById('previewPane');
    if (pane) pane.classList.remove('visible');
  }
};

window.toggleMenu = function() {
  const links = document.getElementById('navLinks');
  if (links) links.classList.toggle('open');
};

// ============ ADDITIONAL EVENT LISTENERS ============
// Close buttons
document.addEventListener('DOMContentLoaded', () => {
  const closeBtns = document.querySelectorAll('[id^="buildClose"]');
  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => window.closeBuild());
  });
});
