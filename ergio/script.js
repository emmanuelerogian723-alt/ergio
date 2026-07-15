// ===========================
// ERGIO — Landing Page Script
// ===========================

// Animate counters on load
window.addEventListener('DOMContentLoaded', () => {
  animateCounter('earnings-counter', 0, 847000, 2000, formatNaira);
  animateCounter('students-counter', 0, 1247, 1500, formatNumber);
  animateCounter('jobs-counter', 0, 342, 1500, formatNumber);
});

function animateCounter(id, start, end, duration, formatter) {
  const el = document.getElementById(id);
  if (!el) return;
  const startTime = performance.now();
  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (end - start) * eased);
    el.textContent = formatter(current);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function formatNaira(n) {
  if (n >= 1000000) return '\u20A6' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return '\u20A6' + (n / 1000).toFixed(0) + 'k';
  return '\u20A6' + n.toLocaleString();
}

function formatNumber(n) {
  return n.toLocaleString();
}

// Prompt box interaction
function handleBuild() {
  const input = document.getElementById('skill-input');
  const btn = document.getElementById('build-btn');
  const value = input.value.trim();

  if (!value) {
    input.focus();
    input.placeholder = 'Type what you do... e.g. "I design logos in Lagos"';
    return;
  }

  // Simulate building
  btn.innerHTML = 'Building...';
  btn.disabled = true;
  input.disabled = true;

  setTimeout(() => {
    btn.innerHTML = 'Opening your business...';
  }, 800);

  setTimeout(() => {
    btn.innerHTML = 'Done! Your business is live.';
    btn.style.background = '#22c55e';

    // Show a mini preview
    showBuildPreview(value);
  }, 1600);
}

function showBuildPreview(skill) {
  // Create a floating preview card
  const existing = document.getElementById('build-preview-card');
  if (existing) existing.remove();

  const card = document.createElement('div');
  card.id = 'build-preview-card';
  card.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 320px;
    background: #131316;
    border: 1px solid rgba(255,184,0,0.25);
    border-radius: 16px;
    padding: 24px;
    z-index: 200;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    animation: slideUp 0.4s ease;
  `;

  card.innerHTML = `
    <div style="font-size:13px;color:#FFB800;font-weight:600;margin-bottom:12px;">YOUR BUSINESS IS LIVE</div>
    <div style="font-size:20px;font-weight:700;margin-bottom:8px;">${capitalize(skill)}</div>
    <div style="font-size:14px;color:#8a8a90;margin-bottom:16px;">
      \u2713 Professional website<br>
      \u2713 Payment link (Paystack)<br>
      \u2713 Booking page<br>
      \u2713 Listed in local directory<br>
      \u2713 WhatsApp follow-up bot
    </div>
    <div style="font-size:13px;color:#5a5a60;">Share your link: <span style="color:#FFB800;">ergio.ng/${slugify(skill)}</span></div>
    <div style="margin-top:16px;">
      <button onclick="document.getElementById('build-preview-card').remove()" 
        style="width:100%;padding:10px;background:transparent;border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#f5f5f5;cursor:pointer;font-size:14px;">
        Close
      </button>
    </div>
  `;

  document.body.appendChild(card);

  // Add slide animation
  const style = document.createElement('style');
  style.textContent = '@keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }';
  document.head.appendChild(style);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 20);
}

// Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Reveal on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.step, .engine-card, .build-item, .proof-card, .price-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});
