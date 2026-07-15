// Example chips
function setExample(text) {
  const input = document.getElementById('skill-input');
  input.value = text;
  input.focus();
}

// Build button
document.getElementById('build-btn').addEventListener('click', function () {
  const input = document.getElementById('skill-input').value.trim();
  if (!input) {
    document.getElementById('skill-input').focus();
    return;
  }
  triggerBuild(input);
});

document.getElementById('skill-input').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    const input = this.value.trim();
    if (input) triggerBuild(input);
  }
});

function triggerBuild(skill) {
  const overlay = document.getElementById('modal-overlay');
  const loading = document.getElementById('modal-loading');
  const result = document.getElementById('modal-result');
  const bar = document.getElementById('modal-bar');
  const status = document.getElementById('modal-status');

  overlay.classList.add('active');
  loading.style.display = 'block';
  result.style.display = 'none';
  bar.style.width = '0%';

  const steps = [
    { text: 'Analyzing your skill...', pct: 15 },
    { text: 'Generating your website...', pct: 30 },
    { text: 'Setting up payment link (Paystack)...', pct: 48 },
    { text: 'Building your booking system...', pct: 62 },
    { text: 'Activating WhatsApp bot...', pct: 75 },
    { text: 'Adding you to the ERGIO directory...', pct: 88 },
    { text: 'Turning on client engines...', pct: 96 },
    { text: 'Done! 🎉', pct: 100 },
  ];

  let i = 0;
  function runStep() {
    if (i >= steps.length) {
      setTimeout(() => {
        loading.style.display = 'none';
        result.style.display = 'block';
      }, 400);
      return;
    }
    status.textContent = steps[i].text;
    bar.style.width = steps[i].pct + '%';
    i++;
    setTimeout(runStep, 520);
  }

  runStep();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
}

document.getElementById('modal-overlay').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});

// Animated counters
function animateCounters() {
  const nums = document.querySelectorAll('.proof-num');
  nums.forEach(el => {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const duration = 1800;
    const start = performance.now();
    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = target.toLocaleString() + (el.getAttribute('data-target') === '430' ? '' : '+');
    }
    requestAnimationFrame(update);
  });
}

// Trigger counters when proof bar enters view
const proofBar = document.querySelector('.proof-bar');
const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    animateCounters();
    observer.disconnect();
  }
}, { threshold: 0.3 });
if (proofBar) observer.observe(proofBar);
