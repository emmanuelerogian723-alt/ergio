/**
 * ERGIO Engines API Client
 * Connects the Vercel frontend to the Render Python backend.
 */
window.ErgioEngines = (function () {
  const BASE = window.ERGIO_CONFIG?.enginesApiBase || 'https://ergio-engines.onrender.com';

  async function request(endpoint, options = {}) {
    const url = BASE + endpoint;
    const opts = {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    };
    if (opts.body && typeof opts.body === 'object') opts.body = JSON.stringify(opts.body);
    try {
      const resp = await fetch(url, opts);
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ detail: resp.statusText }));
        throw new Error(err.detail || `HTTP ${resp.status}`);
      }
      return await resp.json();
    } catch (e) {
      console.error('[ErgioEngines] Request failed:', endpoint, e.message);
      throw e;
    }
  }

  return {
    BASE,
    health: () => request('/health'),
    status: () => request('/status'),
    conductor: (req, bid, uid) => request('/conductor', { method: 'POST', body: { request: req, business_id: bid, user_id: uid } }),
    discovery: (p) => request('/engines/discovery', { method: 'POST', body: p }),
    matching: (p) => request('/engines/matching', { method: 'POST', body: p }),
    outreach: (p) => request('/engines/outreach', { method: 'POST', body: p }),
    repeat: (p) => request('/engines/repeat', { method: 'POST', body: p }),
    runAll: (p) => request('/engines/run-all', { method: 'POST', body: p }),
    scrape: (url, useBrowser) => request('/scrape', { method: 'POST', body: { url, use_browser: useBrowser } }),
    crawl: (urls) => request('/crawl', { method: 'POST', body: { urls } }),
    search: (q, count, cat) => request('/search', { method: 'POST', body: { query: q, count, category: cat } }),
    ai: (prompt, system, jsonMode) => request('/ai', { method: 'POST', body: { prompt, system, json_mode: jsonMode !== false } }),
    socialContent: (p) => request('/social-content', { method: 'POST', body: p }),
    listMcps: () => request('/mcp/list'),
    listPlugins: () => request('/plugins/list'),
    getApprovals: (bid) => request('/approvals' + (bid ? `?business_id=${bid}` : '')),
    approve: (id, uid) => request('/approve', { method: 'POST', body: { approval_id: id, user_id: uid } }),
    reject: (id, reason, uid) => request('/reject', { method: 'POST', body: { approval_id: id, reason, user_id: uid } }),
    aiProviders: () => request('/ai/providers'),
    aiComplete: (p, s, t) => request('/ai/complete', { method: 'POST', body: { prompt: p, system: s, task_type: t || 'smart' } }),
    memoryRemember: (fact, cat, bid) => request('/memory/remember', { method: 'POST', body: { fact, category: cat, business_id: bid } }),
    memoryRecall: (q, bid) => request(`/memory/recall?query=${encodeURIComponent(q)}${bid ? `&business_id=${bid}` : ''}`),
    pingStatus: () => request('/ping/status'),
    listBusinesses: () => request('/businesses'),
  };
})();
