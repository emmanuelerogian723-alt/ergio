/**
 * ERGIO Engines API Client (v5.2)
 * Connects the Vercel frontend to the Render Python backend.
 * Supports streaming conductor (live progress like Claude Code) + MCP/plugin management.
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

  /**
   * Stream conductor — sends live progress updates via SSE.
   * onEvent(type, data) is called for each SSE event.
   */
  async function streamConductor(request_text, bid, uid, onEvent) {
    const url = BASE + '/conductor/run';
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request: request_text, business_id: bid, user_id: uid }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') return;
          try {
            const event = JSON.parse(data);
            onEvent(event.type, event.data);
          } catch (e) { /* skip malformed */ }
        }
      }
    } catch (e) {
      console.error('[ErgioEngines] Stream failed:', e.message);
      throw e;
    }
  }

  /**
   * Fast chat using /ai endpoint (reliable, ~0.3s)
   * Uses json_mode=true and returns parsed text.
   */
  async function aiChat(prompt, system) {
    const url = BASE + '/ai';
    const sys = system || 'You are ERGIO Conductor, an AI business assistant for African businesses. Be helpful, concise, and actionable. Respond in plain text (not JSON).';
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt + '\n\nRespond in plain text, not JSON.',
          system: sys + '\nYou must include the word json in your response.',
          json_mode: true
        }),
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      // The response is a JSON object — extract the text field
      let text = '';
      if (typeof data === 'string') text = data;
      else if (data.response) text = data.response;
      else if (data.text) text = data.text;
      else if (data.message) text = data.message;
      else if (data.answer) text = data.answer;
      else if (data.content) text = data.content;
      else {
        // Try to find any string value in the JSON
        let found = false;
        for (const key of Object.keys(data)) {
          if (typeof data[key] === 'string' && data[key].length > 10) {
            text = data[key];
            found = true;
            break;
          }
        }
        if (!found) {
          // If no string field found, format the JSON as readable text
          const parts = [];
          for (const [key, val] of Object.entries(data)) {
            if (typeof val === 'string') parts.push(key + ': ' + val);
            else if (Array.isArray(val)) {
              if (val.length > 0 && val.every(v => typeof v === 'string')) {
                parts.push(key + ': ' + val.join(', '));
              } else if (val.length > 0) {
                parts.push(key + ': ' + JSON.stringify(val).slice(0, 200));
              }
            } else if (typeof val === 'object' && val !== null) {
              parts.push(key + ': ' + JSON.stringify(val).slice(0, 200));
            } else {
              parts.push(key + ': ' + String(val));
            }
          }
          text = parts.join('\n') || JSON.stringify(data, null, 2);
        }
      }
      return text;
    } catch (e) {
      console.error('[ErgioEngines] aiChat failed:', e.message);
      throw e;
    }
  }

  return {
    BASE,
    health: () => request('/health'),
    status: () => request('/status'),
    conductor: (req, bid, uid) => request('/conductor', { method: 'POST', body: { request: req, business_id: bid, user_id: uid } }),
    streamConductor,
    discovery: (p) => request('/engines/discovery', { method: 'POST', body: p }),
    matching: (p) => request('/engines/matching', { method: 'POST', body: p }),
    outreach: (p) => request('/engines/outreach', { method: 'POST', body: p }),
    repeat: (p) => request('/engines/repeat', { method: 'POST', body: p }),
    runAll: (p) => request('/engines/run-all', { method: 'POST', body: p }),
    scrape: (url, useBrowser) => request('/scrape', { method: 'POST', body: { url, use_browser: useBrowser } }),
    crawl: (urls) => request('/crawl', { method: 'POST', body: { urls } }),
    search: (q, count, cat) => request('/search', { method: 'POST', body: { query: q, count, category: cat } }),
    ai: (prompt, system, jsonMode) => request('/ai', { method: 'POST', body: { prompt, system, json_mode: jsonMode === true } }),
    aiChat,
    socialContent: (p) => request('/social-content', { method: 'POST', body: p }),
    // MCP management
    listMcps: () => request('/mcp/list'),
    connectMcp: (config) => request('/mcp/connect', { method: 'POST', body: config }),
    disconnectMcp: (id) => request('/mcp/' + id, { method: 'DELETE' }),
    listMcpTools: (id) => request('/mcp/' + id + '/tools'),
    // Plugin management
    listPlugins: () => request('/plugins/list'),
    connectPlugin: (config) => request('/plugins/connect', { method: 'POST', body: config }),
    disconnectPlugin: (id) => request('/plugins/' + id, { method: 'DELETE' }),
    listConnectedPlugins: () => request('/plugins/connected'),
    // Approvals
    getApprovals: (bid) => request('/approvals' + (bid ? `?business_id=${bid}` : '')),
    approve: (id, uid) => request('/approve', { method: 'POST', body: { approval_id: id, user_id: uid } }),
    reject: (id, reason, uid) => request('/reject', { method: 'POST', body: { approval_id: id, reason: reason, user_id: uid } }),
    // AI
    aiProviders: () => request('/ai/providers'),
    aiComplete: (p, s, t) => request('/ai/complete', { method: 'POST', body: { prompt: p, system: s, task_type: t || 'smart' } }),
    // Memory
    memoryRemember: (fact, cat, bid) => request('/memory/remember', { method: 'POST', body: { fact, category: cat, business_id: bid } }),
    memoryRecall: (q, bid) => request(`/memory/recall?query=${encodeURIComponent(q)}${bid ? `&business_id=${bid}` : ''}`),
    // Ping
    pingStatus: () => request('/ping/status'),
    listBusinesses: () => request('/businesses'),
  };
})();
