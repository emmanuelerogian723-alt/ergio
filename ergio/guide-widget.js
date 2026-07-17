// ========================================
// ERGIO Guide Widget — Interactive onboarding
// Shows step-by-step tutorials for new users
// ========================================
(function() {
  const ERGIO_GUIDE = {
    steps: [
      { id: 'welcome', icon: '👋', title: 'Welcome to ERGIO!', text: 'Your AI Business Operating System. Let me show you around — takes 60 seconds.', action: 'Start Tour', highlight: null },
      { id: 'prompt', icon: '💡', title: 'Describe Your Business', text: 'Type what your business does in the prompt box. Example: "A modern restaurant in Lagos serving Nigerian cuisine". ERGIO AI builds a complete website from just that.', action: 'Next', highlight: '#prompt-input, .hero-input, input[type="text"], textarea' },
      { id: 'build', icon: '⚡', title: 'AI Builds Your Website', text: 'ERGIO creates your brand, content, images, and code automatically. Watch the build animation — it takes about 30 seconds.', action: 'Next', highlight: '#build-btn, .build-button, button[type="submit"]' },
      { id: 'preview', icon: '👀', title: 'Preview & Deploy', text: 'See your live website instantly. You get a shareable Vercel URL you can send to anyone.', action: 'Next', highlight: '#preview, .preview-frame, .website-preview' },
      { id: 'dashboard', icon: '📊', title: 'Your Dashboard', text: 'After signup, access your dashboard with bookings, leads, payments, analytics, and 21+ business engines.', action: 'Next', highlight: null },
      { id: 'leads', icon: '🎯', title: 'Find Paying Clients', text: 'ERGIO scans 70+ search engines to find people who need your service. AI generates leads with names, phone numbers, and intent scores.', action: 'Next', highlight: null },
      { id: 'payments', icon: '💳', title: 'Accept Payments', text: 'Connect Paystack to accept payments online. Your customers can pay with cards, bank transfers, and more.', action: 'Next', highlight: null },
      { id: 'engines', icon: '⚙️', title: '21+ Business Engines', text: 'SEO optimizer, smart pricing, social media kit, expense tracker, invoice generator, WhatsApp bot, and more — all included.', action: 'Finish', highlight: null }
    ],
    currentStep: 0,
    overlay: null,
    tooltip: null,
    
    init() {
      // Only show if not dismissed
      if (localStorage.getItem('ergio_guide_done') === 'true') return;
      // Only show on main pages
      const path = window.location.pathname;
      if (path.includes('/api/')) return;
      
      // Add button after delay
      setTimeout(() => this.addButton(), 1500);
    },
    
    addButton() {
      if (document.getElementById('ergio-guide-btn')) return;
      const btn = document.createElement('div');
      btn.id = 'ergio-guide-btn';
      btn.innerHTML = '🎓 Take the Tour';
      btn.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; z-index: 99999;
        background: linear-gradient(135deg, #00D9FF, #00FF9D);
        color: #000; padding: 12px 24px; border-radius: 50px;
        font-family: Inter, sans-serif; font-weight: 700; font-size: 14px;
        cursor: pointer; box-shadow: 0 4px 20px rgba(0,217,255,.4);
        transition: all .3s; animation: ergio-guide-pulse 2s infinite;
      `;
      btn.onclick = () => this.start();
      document.body.appendChild(btn);
      
      // Add pulse animation
      if (!document.getElementById('ergio-guide-style')) {
        const style = document.createElement('style');
        style.id = 'ergio-guide-style';
        style.textContent = `
          @keyframes ergio-guide-pulse {
            0%,100% { box-shadow: 0 4px 20px rgba(0,217,255,.4); }
            50% { box-shadow: 0 4px 30px rgba(0,217,255,.7); }
          }
          @keyframes ergio-guide-fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes ergio-guide-highlight {
            0%,100% { box-shadow: 0 0 0 4px rgba(0,217,255,.5); }
            50% { box-shadow: 0 0 0 8px rgba(0,217,255,.3); }
          }
          .ergio-guide-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,.75);
            z-index: 999999; transition: opacity .3s;
          }
          .ergio-guide-tooltip {
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
            background: #0a0a0f; border: 1px solid rgba(0,217,255,.3);
            border-radius: 20px; padding: 28px; max-width: 420px; width: 90%;
            z-index: 999999; color: #fff; font-family: Inter, sans-serif;
            animation: ergio-guide-fade-in .4s ease;
            box-shadow: 0 10px 60px rgba(0,217,255,.2);
          }
          .ergio-guide-tooltip .icon { font-size: 2.5rem; margin-bottom: 12px; }
          .ergio-guide-tooltip h3 { font-size: 1.3rem; margin: 0 0 8px; color: #00D9FF; }
          .ergio-guide-tooltip p { color: #94a3b8; line-height: 1.6; margin: 0 0 20px; font-size: .95rem; }
          .ergio-guide-tooltip .actions { display: flex; gap: 12px; align-items: center; }
          .ergio-guide-tooltip .btn-next {
            background: linear-gradient(135deg, #00D9FF, #00FF9D);
            color: #000; border: none; padding: 10px 24px; border-radius: 10px;
            font-weight: 700; cursor: pointer; font-size: .9rem;
          }
          .ergio-guide-tooltip .btn-skip {
            background: transparent; color: #64748b; border: none;
            cursor: pointer; font-size: .85rem; margin-left: auto;
          }
          .ergio-guide-tooltip .progress { display: flex; gap: 6px; margin-bottom: 16px; }
          .ergio-guide-tooltip .dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,.15); }
          .ergio-guide-tooltip .dot.active { background: #00D9FF; }
          .ergio-guide-tooltip .dot.done { background: #00FF9D; }
          .ergio-guide-highlight {
            animation: ergio-guide-highlight 1.5s infinite !important;
            border-radius: 12px !important;
            position: relative !important; z-index: 1000000 !important;
          }
        `;
        document.head.appendChild(style);
      }
    },
    
    start() {
      this.currentStep = 0;
      document.getElementById('ergio-guide-btn')?.remove();
      this.showStep();
    },
    
    showStep() {
      const step = this.steps[this.currentStep];
      if (!step) return this.finish();
      
      // Remove old overlay
      this.overlay?.remove();
      this.tooltip?.remove();
      document.querySelectorAll('.ergio-guide-highlight').forEach(el => {
        el.classList.remove('ergio-guide-highlight');
      });
      
      // Create overlay
      this.overlay = document.createElement('div');
      this.overlay.className = 'ergio-guide-overlay';
      this.overlay.onclick = () => this.next();
      document.body.appendChild(this.overlay);
      
      // Highlight target element
      if (step.highlight) {
        const selectors = step.highlight.split(',').map(s => s.trim());
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) {
            el.classList.add('ergio-guide-highlight');
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            break;
          }
        }
      }
      
      // Create tooltip
      this.tooltip = document.createElement('div');
      this.tooltip.className = 'ergio-guide-tooltip';
      const progressDots = this.steps.map((_, i) => 
        `<div class="dot ${i === this.currentStep ? 'active' : i < this.currentStep ? 'done' : ''}"></div>`
      ).join('');
      
      this.tooltip.innerHTML = `
        <div class="progress">${progressDots}</div>
        <div class="icon">${step.icon}</div>
        <h3>${step.title}</h3>
        <p>${step.text}</p>
        <div class="actions">
          <button class="btn-next">${step.action}</button>
          <button class="btn-skip">Skip tour</button>
        </div>
      `;
      document.body.appendChild(this.tooltip);
      
      this.tooltip.querySelector('.btn-next').onclick = () => this.next();
      this.tooltip.querySelector('.btn-skip').onclick = () => this.finish();
    },
    
    next() {
      this.currentStep++;
      if (this.currentStep >= this.steps.length) {
        this.finish();
      } else {
        this.showStep();
      }
    },
    
    finish() {
      this.overlay?.remove();
      this.tooltip?.remove();
      document.querySelectorAll('.ergio-guide-highlight').forEach(el => {
        el.classList.remove('ergio-guide-highlight');
      });
      localStorage.setItem('ergio_guide_done', 'true');
      
      // Show completion toast
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
        background: linear-gradient(135deg, #00D9FF, #00FF9D); color: #000;
        padding: 16px 32px; border-radius: 50px; font-family: Inter, sans-serif;
        font-weight: 700; z-index: 999999; font-size: .9rem;
        animation: ergio-guide-fade-in .4s ease;
      `;
      toast.textContent = '🎉 You're ready to build with ERGIO!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    },
    
    reset() {
      localStorage.removeItem('ergio_guide_done');
      window.location.reload();
    }
  };
  
  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ERGIO_GUIDE.init());
  } else {
    ERGIO_GUIDE.init();
  }
  
  // Expose for manual control
  window.ERGIO_GUIDE = ERGIO_GUIDE;
})();
