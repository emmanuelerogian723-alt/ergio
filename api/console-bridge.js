// ERGIO Console Bridge — connects external websites to ERGIO Console
// This script runs on generated websites and sends site data to ERGIO Console

(function() {
  const config = window.ERGIO_CONSOLE_CONFIG;
  if (!config) return;

  const CONSOLE_URL = 'https://ergio.vercel.app';
  const SITE_ID = config.siteId || 'unknown-site';
  const BUSINESS_NAME = config.businessName || 'Unknown Business';

  // Collect site metadata
  function collectSiteData() {
    const pages = [];
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript') && !href.startsWith('mailto')) {
        pages.push({
          url: href,
          text: link.textContent.trim().substring(0, 100)
        });
      }
    });

    return {
      siteId: SITE_ID,
      businessName: BUSINESS_NAME,
      url: window.location.href,
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content || '',
      pages: pages.slice(0, 20),
      metaTags: {
        verification: document.querySelector('meta[name="ergio-site-verification"]')?.content || '',
        ogImage: document.querySelector('meta[property="og:image"]')?.content || '',
        ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
      },
      stats: {
        totalLinks: links.length,
        totalImages: document.querySelectorAll('img').length,
        totalHeadings: document.querySelectorAll('h1,h2,h3').length,
        wordCount: document.body.innerText.split(/\s+/).length
      },
      timestamp: new Date().toISOString()
    };
  }

  // Send data to ERGIO Console backend
  function syncToConsole() {
    const data = collectSiteData();
    fetch(`${CONSOLE_URL}/api/console-bridge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(() => {
      // Silent fail — site should work without console
    });
  }

  // Send heartbeat every 5 minutes
  function startHeartbeat() {
    syncToConsole();
    setInterval(syncToConsole, 300000);
  }

  // Add floating Console badge
  function addConsoleBadge() {
    const badge = document.createElement('div');
    badge.id = 'ergio-console-badge';
    badge.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#00d1ff;color:#000;padding:8px 16px;border-radius:24px;font-size:12px;font-weight:700;cursor:pointer;z-index:9999;box-shadow:0 4px 12px rgba(0,209,255,.3);transition:transform .2s;font-family:sans-serif';
    badge.textContent = '⚡ ERGIO';
    badge.title = 'Connected to ERGIO Console';
    badge.onmouseenter = () => badge.style.transform = 'scale(1.1)';
    badge.onmouseleave = () => badge.style.transform = 'scale(1)';
    badge.onclick = () => window.open(`${CONSOLE_URL}/ergio/console/`, '_blank');
    document.body.appendChild(badge);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      addConsoleBadge();
      if (config.autoConnect) startHeartbeat();
    });
  } else {
    addConsoleBadge();
    if (config.autoConnect) startHeartbeat();
  }
})();
