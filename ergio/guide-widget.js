// ============================================================
// ERGIO Interactive Guide Widget v1.0
// Hands-on onboarding tour for new users
// Floating mascot + step-by-step interactive walkthrough
// ============================================================

(function() {
  'use strict';
  
  const GUIDE_STEPS = [
    {
      title: "Welcome to ERGIO! 🚀",
      desc: "I'm Ergie, your AI business companion. I'll help you build a stunning website, find clients, and grow your business — all in minutes.",
      target: null,
      action: "Let's get started!",
      cta: "Start Tour"
    },
    {
      title: "Step 1: Describe Your Business ✍️",
      desc: "Type what your business does in the prompt box below. Example: 'A luxury hair salon in Lagos called GlowUp Beauty'. The more detail you give, the better your website will be.",
      target: "#prompt, #promptInput, .prompt-box, textarea",
      action: "Try typing your business idea now",
      cta: "Next: Generate →"
    },
    {
      title: "Step 2: AI Builds Your Website 🤖",
      desc: "Watch as ERGIO's AI creates your brand identity, finds real photos, writes professional copy, and builds a stunning website — in under 60 seconds!",
      target: ".build-animation, #buildOverlay, .scan-section, .preview-frame, iframe",
      action: "Watch the magic happen",
      cta: "Next: Preview →"
    },
    {
      title: "Step 3: Live Preview & Edit 👁️",
      desc: "Your website appears on the right side. Click any element to edit it, or chat with ERGIO on the left to make changes. Try saying 'make the hero section blue' or 'add a contact form'.",
      target: ".preview-area, .preview-frame, iframe, .edit-overlay",
      action: "Click on any element in the preview to edit it",
      cta: "Next: Deploy →"
    },
    {
      title: "Step 4: Deploy Anywhere 🚀",
      desc: "Click the Deploy button to publish your website. You can deploy to ERGIO's free hosting, GitHub, Netlify, or download the code. Your site goes live instantly!",
      target: ".deploy-btn, #deployBtn, .header-actions button",
      action: "Click the Deploy button when you're ready",
      cta: "Next: Find Clients →"
    },
    {
      title: "Step 5: Find Paying Clients 🔍",
      desc: "ERGIO scans the internet for people who need your service. Go to the Leads tab in your dashboard to see qualified leads with names, phone numbers, and intent scores.",
      target: ".nav-links a[href*='dashboard'], .leads-tab, #leadsTab",
      action: "Visit your dashboard to see leads",
      cta: "Next: Get Paid →"
    },
    {
      title: "Step 6: Accept Payments 💳",
      desc: "ERGIO integrates Paystack for instant payments. Send invoices, accept bookings with payment, and track revenue — all from your dashboard.",
      target: ".payments-tab, #paymentsTab",
      action: "Set up payments in your dashboard",
      cta: "Finish Tour →"
    },
    {
      title: "You're All Set! 🎉",
      desc: "You now know how to build websites, find clients, and accept payments with ERGIO. Remember — I'm always here to help. Just type a question anytime!",
      target: null,
      action: "Start building your business empire!",
      cta: "🚀 Start Building"
    }
  ];
  
  let currentStep = 0;
  let guideActive = false;
  let mascot = null;
  let tooltip = null;
  let spotlight = null;
  let overlay = null;
  
  function init() {
    // Only show on first visit
    const seen = localStorage.getItem('ergio_guide_seen');
    const onLanding = window.location.pathname === '/' || window.location.pathname.endsWith('index.html') || window.location.pathname === '/ergio/' || window.location.pathname === '/ergio/index.html';
    const onBuild = window.location.pathname.includes('build.html');
    
    if (!seen && (onLanding || onBuild)) {
      setTimeout(showWelcomeBubble, 2000);
    }
    
    // Add guide button to nav (if exists)
    const nav = document.querySelector('.nav, .navbar, header');
    if (nav && !document.getElementById('guideTrigger')) {
      const btn = document.createElement('button');
      btn.id = 'guideTrigger';
      btn.innerHTML = '📖 Guide';
      btn.style.cssText = 'background:rgba(0,217,255,0.1);border:1px solid rgba(0,217,255,0.3);color:#00D9FF;padding:6px 14px;border-radius:100px;cursor:pointer;font-size:0.85rem;font-weight:600;margin-left:12px;transition:all 0.2s';
      btn.onmouseover = () => { btn.style.background = 'rgba(0,217,255,0.2)'; };
      btn.onmouseout = () => { btn.style.background = 'rgba(0,217,255,0.1)'; };
      btn.onclick = () => startTour();
      nav.appendChild(btn);
    }
  }
  
  function showWelcomeBubble() {
    if (document.getElementById('welcomeBubble')) return;
    
    const bubble = document.createElement('div');
    bubble.id = 'welcomeBubble';
    bubble.style.cssText = 'position:fixed;bottom:30px;right:30px;z-index:99998;max-width:320px;background:linear-gradient(135deg,#0f0f1a,#1a1a2e);border:2px solid #00D9FF;border-radius:20px;padding:24px;box-shadow:0 20px 60px rgba(0,217,255,0.3);animation:slideUp 0.5s cubic-bezier(.16,1,.3,1)';
    bubble.innerHTML = `
      <div style="display:flex;align-items:start;gap:12px;margin-bottom:12px">
        <div style="font-size:32px;flex-shrink:0">🤖</div>
        <div>
          <div style="color:#00D9FF;font-weight:800;font-size:1rem;margin-bottom:4px">Hi! I'm Ergie 👋</div>
          <div style="color:#94a3b8;font-size:0.85rem;line-height:1.5">New to ERGIO? I'll walk you through everything — building websites, finding clients, and getting paid. Takes 2 minutes!</div>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button onclick="document.getElementById('welcomeBubble').remove();ERGIO_GUIDE.startTour()" style="flex:1;padding:10px;background:linear-gradient(135deg,#00D9FF,#0088ff);border:none;border-radius:10px;color:#000;font-weight:700;cursor:pointer;font-size:0.9rem">📖 Take the Tour</button>
        <button onclick="document.getElementById('welcomeBubble').remove();localStorage.setItem('ergio_guide_seen','1')" style="padding:10px 16px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#888;cursor:pointer;font-size:0.9rem">Maybe later</button>
      </div>
    `;
    document.body.appendChild(bubble);
    
    // Add slide-up animation
    if (!document.getElementById('guideAnimations')) {
      const style = document.createElement('style');
      style.id = 'guideAnimations';
      style.textContent = `
        @keyframes slideUp{from{transform:translateY(100px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes bounce-in{0%{transform:scale(0.3);opacity:0}50%{transform:scale(1.05)}70%{transform:scale(0.95)}100%{transform:scale(1);opacity:1}}
        @keyframes pulse-ring{0%{box-shadow:0 0 0 0 rgba(0,217,255,0.4)}70%{box-shadow:0 0 0 20px rgba(0,217,255,0)}100%{box-shadow:0 0 0 0 rgba(0,217,255,0)}}
        @keyframes typing{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .ergio-spotlight{position:fixed;z-index:99997;pointer-events:none;box-shadow:0 0 0 9999px rgba(0,0,0,0.7);border-radius:12px;transition:all 0.4s cubic-bezier(.16,1,.3,1)}
        .ergio-highlight{position:fixed;z-index:99998;pointer-events:none;border:3px solid #00D9FF;border-radius:12px;animation:pulse-ring 2s infinite;transition:all 0.4s cubic-bezier(.16,1,.3,1)}
      `;
      document.head.appendChild(style);
    }
  }
  
  function startTour() {
    if (guideActive) return;
    guideActive = true;
    currentStep = 0;
    document.getElementById('welcomeBubble')?.remove();
    showStep();
  }
  
  function showStep() {
    // Remove previous elements
    [tooltip, spotlight, overlay, mascot].forEach(el => el?.remove());
    
    const step = GUIDE_STEPS[currentStep];
    if (!step) { endTour(); return; }
    
    // Find target element
    let targetEl = null;
    if (step.target) {
      const selectors = step.target.split(',').map(s => s.trim());
      for (const sel of selectors) {
        targetEl = document.querySelector(sel);
        if (targetEl) break;
      }
    }
    
    // Create overlay
    overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:99996;transition:opacity 0.3s';
    overlay.onclick = () => {}; // Prevent click-through
    document.body.appendChild(overlay);
    
    // Highlight target if found
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      
      spotlight = document.createElement('div');
      spotlight.className = 'ergio-spotlight';
      spotlight.style.cssText = `position:fixed;top:${rect.top - 8}px;left:${rect.left - 8}px;width:${rect.width + 16}px;height:${rect.height + 16}px;z-index:99997;pointer-events:none;box-shadow:0 0 0 9999px rgba(0,0,0,0.75);border-radius:12px;transition:all 0.4s cubic-bezier(.16,1,.3,1)`;
      document.body.appendChild(spotlight);
      
      // Remove overlay since spotlight handles dimming
      overlay.remove();
      overlay = null;
      
      // Scroll into view
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Create mascot + tooltip
    const isLast = currentStep === GUIDE_STEPS.length - 1;
    
    tooltip = document.createElement('div');
    tooltip.style.cssText = `position:fixed;bottom:40px;left:50%;transform:translateX(-50%);z-index:99999;max-width:480px;width:calc(100% - 48px);background:linear-gradient(135deg,#0f0f1a,#1a1a2e);border:2px solid #00D9FF;border-radius:20px;padding:28px;box-shadow:0 20px 80px rgba(0,217,255,0.4);animation:bounce-in 0.5s cubic-bezier(.16,1,.3,1)`;
    
    const progress = Array(GUIDE_STEPS.length).fill(0).map((_, i) => 
      `<div style="width:${100/GUIDE_STEPS.length}%;height:4px;border-radius:2px;background:${i <= currentStep ? '#00D9FF' : 'rgba(255,255,255,0.1)'};transition:background 0.3s"></div>`
    ).join('');
    
    tooltip.innerHTML = `
      <div style="display:flex;gap:12px;margin-bottom:16px">
        <div style="font-size:36px;flex-shrink:0;animation:typing 2s ease-in-out infinite">🤖</div>
        <div style="flex:1">
          <div style="color:#00D9FF;font-weight:800;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Step ${currentStep + 1} of ${GUIDE_STEPS.length}</div>
          <div style="color:#fff;font-weight:800;font-size:1.25rem;margin-bottom:6px">${step.title}</div>
          <div style="color:#94a3b8;font-size:0.9rem;line-height:1.6">${step.desc}</div>
        </div>
      </div>
      ${step.action ? `<div style="background:rgba(0,217,255,0.08);border:1px solid rgba(0,217,255,0.2);border-radius:10px;padding:10px 14px;margin-bottom:16px;color:#00D9FF;font-size:0.85rem;font-weight:600">💡 ${step.action}</div>` : ''}
      <div style="display:flex;gap:10px;align-items:center">
        ${currentStep > 0 ? '<button onclick="ERGIO_GUIDE.prevStep()" style="padding:10px 18px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#888;cursor:pointer;font-weight:600;font-size:0.9rem">← Back</button>' : ''}
        <div style="flex:1"></div>
        <button onclick="ERGIO_GUIDE.skipTour()" style="padding:10px 16px;background:none;border:none;color:#555;cursor:pointer;font-size:0.85rem">Skip</button>
        <button onclick="ERGIO_GUIDE.nextStep()" style="padding:12px 24px;background:linear-gradient(135deg,#00D9FF,#0088ff);border:none;border-radius:10px;color:#000;font-weight:800;cursor:pointer;font-size:0.95rem;box-shadow:0 4px 20px rgba(0,217,255,0.4);transition:all 0.2s" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">${step.cta}</button>
      </div>
      <div style="display:flex;gap:4px;margin-top:16px">${progress}</div>
    `;
    
    document.body.appendChild(tooltip);
  }
  
  function nextStep() {
    currentStep++;
    if (currentStep >= GUIDE_STEPS.length) {
      endTour();
    } else {
      showStep();
    }
  }
  
  function prevStep() {
    if (currentStep > 0) {
      currentStep--;
      showStep();
    }
  }
  
  function skipTour() {
    endTour();
  }
  
  function endTour() {
    [tooltip, spotlight, overlay, mascot].forEach(el => el?.remove());
    guideActive = false;
    localStorage.setItem('ergio_guide_seen', '1');
    
    // Show completion toast
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:30px;right:30px;z-index:99999;background:linear-gradient(135deg,#0f0f1a,#1a1a2e);border:2px solid #00FF9D;border-radius:16px;padding:20px 24px;box-shadow:0 20px 60px rgba(0,255,157,0.3);animation:slideUp 0.5s';
    toast.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px">
        <div style="font-size:28px">🎉</div>
        <div>
          <div style="color:#00FF9D;font-weight:800;font-size:1rem">Tour Complete!</div>
          <div style="color:#888;font-size:0.85rem">You're ready to build with ERGIO. Need help? Just ask Ergie anytime!</div>
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }
  
  // Expose globally
  window.ERGIO_GUIDE = { startTour, nextStep, prevStep, skipTour, endTour };
  
  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
