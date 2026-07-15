/* ===== PARTICLES ===== */
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];
let pw, ph;

function resizeCanvas() {
  pw = canvas.width = window.innerWidth;
  ph = canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const colors = ['#00D9FF', '#00FF9D', '#2563FF'];
const particleCount = window.innerWidth < 768 ? 30 : 60;

function initParticles() {
  particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * pw,
      y: Math.random() * ph,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      c: colors[Math.floor(Math.random() * colors.length)],
      a: Math.random() * 0.5 + 0.1
    });
  }
}
initParticles();

function drawParticles() {
  ctx.clearRect(0, 0, pw, ph);
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = pw;
    if (p.x > pw) p.x = 0;
    if (p.y < 0) p.y = ph;
    if (p.y > ph) p.y = 0;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.c;
    ctx.globalAlpha = p.a;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  requestAnimationFrame(drawParticles);
}
drawParticles();

/* ===== MOUSE GLOW ===== */
const mouseGlow = document.getElementById('mouseGlow');
let mx = window.innerWidth / 2, my = window.innerHeight / 2;
let gx = mx, gy = my;

document.addEventListener('mousemove', (e) => {
  mx = e.clientX;
  my = e.clientY;
});

function animateGlow() {
  gx += (mx - gx) * 0.08;
  gy += (my - gy) * 0.08;
  mouseGlow.style.transform = `translate(${gx}px, ${gy}px) translate(-50%, -50%)`;
  requestAnimationFrame(animateGlow);
}
animateGlow();

/* ===== NAV SCROLL ===== */
const nav = document.getElementById('nav');
const mobileMenu = document.getElementById('mobileMenu');
const menuToggle = document.getElementById('menuToggle');

window.addEventListener('scroll', () => {
  if (window.scrollY > 20) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
});

menuToggle.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});

document.querySelectorAll('.mobile-menu a').forEach(a => {
  a.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

/* ===== ROTATING PLACEHOLDER ===== */
const promptInput = document.getElementById('promptInput');
const examples = [
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
  'Catering Service',
  'Tech Repair Shop'
];
let exIdx = 0;
let charIdx = 0;
let typing = true;

function typePlaceholder() {
  const current = examples[exIdx];
  if (typing) {
    charIdx++;
    promptInput.setAttribute('placeholder', current.slice(0, charIdx));
    if (charIdx >= current.length) {
      typing = false;
      setTimeout(typePlaceholder, 2000);
      return;
    }
  } else {
    charIdx--;
    promptInput.setAttribute('placeholder', current.slice(0, charIdx));
    if (charIdx <= 0) {
      typing = true;
      exIdx = (exIdx + 1) % examples.length;
    }
  }
  setTimeout(typePlaceholder, typing ? 60 : 30);
}
typePlaceholder();

/* ===== COUNTER ANIMATION ===== */
function animateCounter(el) {
  const target = parseInt(el.dataset.count);
  const duration = 2000;
  const start = performance.now();
  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const val = Math.floor(eased * target);
    el.textContent = val >= 1000 ? (val / 1000).toFixed(val >= 10000 ? 0 : 1) + 'k' : val;
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target >= 1000 ? (target / 1000).toFixed(target >= 10000 ? 0 : 1) + 'k' : target;
  }
  requestAnimationFrame(update);
}

/* ===== SCROLL REVEAL ===== */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      if (entry.target.classList.contains('trust-num')) {
        animateCounter(entry.target);
      }
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.section, .trust-num, .step-card, .engine-card, .price-card, .feature-pill').forEach(el => {
  el.classList.add('fade-in');
  observer.observe(el);
});

/* ===== EXAMPLE CHIPS ===== */
document.querySelectorAll('.ex-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    promptInput.value = chip.dataset.example;
    promptInput.focus();
  });
});

/* ===== BUILD CONSOLE ===== */
const promptBtn = document.getElementById('promptBtn');
const promptBox = document.getElementById('promptBox');
const consoleOverlay = document.getElementById('consoleOverlay');
const consoleBody = document.getElementById('consoleBody');
const consoleClose = document.getElementById('consoleClose');
const consoleStatus = document.getElementById('consoleStatus');
const consoleQuery = document.getElementById('consoleQuery');
const progressFill = document.getElementById('progressFill');
const statWebsite = document.getElementById('statWebsite');
const statBrand = document.getElementById('statBrand');
const statLeads = document.getElementById('statLeads');
const statOutreach = document.getElementById('statOutreach');

const buildTasks = [
  'Understanding your request...',
  'Researching competitors...',
  'Finding market opportunities...',
  'Creating business strategy...',
  'Generating brand identity...',
  'Designing logo...',
  'Selecting colors...',
  'Creating typography...',
  'Writing copy...',
  'Building website...',
  'Optimizing SEO...',
  'Connecting AI systems...',
  'Setting up CRM...',
  'Creating social pages...',
  'Creating business emails...',
  'Searching Google Maps for clients...',
  'Scanning business directories...',
  'Finding businesses needing your service...',
  'Generating personalized outreach...',
  'Sending outreach messages...',
  'Tracking responses...',
  'Building marketing funnel...',
  'Preparing launch...',
  'Launch Complete.'
];

let isBuilding = false;

function startBuild(query) {
  if (isBuilding) return;
  isBuilding = true;
  consoleOverlay.classList.add('active');
  consoleBody.innerHTML = '';
  consoleQuery.textContent = '"' + query + '"';
  consoleStatus.textContent = 'Building';
  consoleStatus.classList.remove('done');
  progressFill.style.width = '0%';
  statWebsite.textContent = '—';
  statBrand.textContent = '—';
  statLeads.textContent = '—';
  statOutreach.textContent = '—';
  statWebsite.classList.remove('ready');
  statBrand.classList.remove('ready');
  statLeads.classList.remove('ready');
  statOutreach.classList.remove('ready');

  let taskIdx = 0;
  const total = buildTasks.length;

  function nextTask() {
    if (taskIdx >= total) {
      consoleStatus.textContent = 'Done';
      consoleStatus.classList.add('done');
      progressFill.style.width = '100%';
      isBuilding = false;
      return;
    }

    const task = buildTasks[taskIdx];
    const taskEl = document.createElement('div');
    taskEl.className = 'console-task';
    taskEl.innerHTML = `
      <div class="task-icon loading">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </div>
      <div class="task-text active">${task}</div>
    `;
    consoleBody.appendChild(taskEl);
    consoleBody.scrollTop = consoleBody.scrollHeight;

    // Update progress
    const progress = ((taskIdx + 1) / total) * 100;
    progressFill.style.width = progress + '%';

    // Update stats at certain milestones
    if (taskIdx === 9) { statWebsite.textContent = 'Live'; statWebsite.classList.add('ready'); }
    if (taskIdx === 7) { statBrand.textContent = 'Ready'; statBrand.classList.add('ready'); }
    if (taskIdx === 16) { statLeads.textContent = '413'; statLeads.classList.add('ready'); }
    if (taskIdx === 19) { statOutreach.textContent = 'Sent'; statOutreach.classList.add('ready'); }

    // Time per task — varies for realism
    const delay = 400 + Math.random() * 500;

    setTimeout(() => {
      const icon = taskEl.querySelector('.task-icon');
      const text = taskEl.querySelector('.task-text');
      icon.classList.remove('loading');
      icon.classList.add('done');
      icon.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
      text.classList.remove('active');
      text.classList.add('done');
      taskIdx++;
      nextTask();
    }, delay);
  }

  nextTask();
}

promptBtn.addEventListener('click', () => {
  const query = promptInput.value.trim() || promptInput.getAttribute('placeholder');
  if (query && query !== 'What do you want to build?') {
    startBuild(query);
  } else {
    promptInput.focus();
    promptBox.style.animation = 'none';
    setTimeout(() => {
      promptBox.style.animation = '';
      promptBox.style.borderColor = 'rgba(0,217,255,.4)';
      setTimeout(() => promptBox.style.borderColor = '', 1000);
    }, 10);
  }
});

promptInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    promptBtn.click();
  }
});

consoleClose.addEventListener('click', () => {
  consoleOverlay.classList.remove('active');
  isBuilding = false;
});

consoleOverlay.addEventListener('click', (e) => {
  if (e.target === consoleOverlay) {
    consoleOverlay.classList.remove('active');
    isBuilding = false;
  }
});

/* ===== SMOOTH SCROLL FOR ANCHORS ===== */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});
