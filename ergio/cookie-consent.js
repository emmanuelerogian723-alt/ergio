// ========================================
// ERGIO — Cookie Consent Banner
// GDPR + Google compliance — prevents Google from flagging the site
// ========================================
(function() {
  const CONSENT_KEY = 'ergio_cookie_consent';
  const existing = localStorage.getItem(CONSENT_KEY);
  
  if (existing) return; // Already accepted

  const banner = document.createElement('div');
  banner.id = 'ergio-cookie-banner';
  banner.style.cssText = `
    position:fixed;bottom:0;left:0;right:0;z-index:99999;
    background:rgba(9,9,11,0.95);backdrop-filter:blur(20px);
    border-top:1px solid rgba(0,217,255,0.2);
    padding:1rem 2rem;display:flex;align-items:center;gap:1rem;
    flex-wrap:wrap;justify-content:center;
    font-family:'Inter',sans-serif;
    animation:slideUp 0.5s ease;
  `;
  
  banner.innerHTML = `
    <div style="flex:1;min-width:250px;color:#CBD5E1;font-size:.85rem;line-height:1.5">
      🍪 We use cookies to improve your experience, analyze traffic, and show relevant leads.
      By using Ergio, you agree to our <a href="privacy.html" style="color:#00D9FF;text-decoration:none">Privacy Policy</a> and <a href="terms.html" style="color:#00D9FF;text-decoration:none">Terms</a>.
    </div>
    <div style="display:flex;gap:.5rem">
      <button id="ergio-cookie-accept" style="padding:.6rem 1.5rem;border:none;border-radius:10px;background:linear-gradient(135deg,#00D9FF,#10F981);color:#09090B;font-weight:700;cursor:pointer;font-size:.85rem">Accept All</button>
      <button id="ergio-cookie-essential" style="padding:.6rem 1.2rem;border:1px solid #1E293B;border-radius:10px;background:transparent;color:#64748B;cursor:pointer;font-size:.85rem">Essential Only</button>
    </div>
  `;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = '@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}';
  document.head.appendChild(style);
  
  document.body.appendChild(banner);

  document.getElementById('ergio-cookie-accept').onclick = function() {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ all: true, date: new Date().toISOString() }));
    banner.remove();
  };

  document.getElementById('ergio-cookie-essential').onclick = function() {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ all: false, date: new Date().toISOString() }));
    banner.remove();
  };
})();
