// ============================================================
// ERGIO MCP Server — Model Context Protocol Integration
// Connects to external tools: Figma, GitHub, Supabase, Slack
// ============================================================

import { callGroqFast, success, error, corsHeaders } from '../lib/ergio.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { tool, action, params } = { ...req.query, ...body };
  
  try {
    // ── FIGMA MCP ──────────────────────────────────────────
    if (tool === 'figma') {
      const { fileUrl, token } = params || {};
      if (!fileUrl) return error(res, 'Figma file URL required', 400);
      
      // Extract file ID from URL
      const match = fileUrl.match(/figma\.com\/(file|design)\/([a-zA-Z0-9]+)/);
      if (!match) return error(res, 'Invalid Figma URL', 400);
      const fileId = match[2];
      
      if (action === 'get_design') {
        // Fetch Figma file structure
        const figmaRes = await fetch(`https://api.figma.com/v1/files/${fileId}`, {
          headers: { 'X-Figma-Token': token || process.env.FIGMA_TOKEN || '' },
          signal: AbortSignal.timeout(10000)
        });
        if (!figmaRes.ok) return error(res, 'Figma API error: ' + figmaRes.status, 400);
        const data = await figmaRes.json();
        
        // AI-analyze the design
        const analysis = await callGroqFast([
          {role:'system',content:'Analyze this Figma design structure and extract: brand colors, fonts, layout type, and component list. Return JSON: {colors, fonts, layout, components, designStyle}'},
          {role:'user',content:JSON.stringify(data.document?.children?.[0] || {})}
        ],{temperature:0.3,response_format:{type:'json_object'}});
        
        return success(res, {
          figmaFile: { name: data.name, id: fileId },
          analysis: JSON.parse(analysis),
          message: 'Figma design analyzed — ERGIO will use this as your design reference'
        });
      }
    }
    
    // ── GITHUB MCP ────────────────────────────────────────────
    if (tool === 'github') {
      const { repo, token, content: fileContent, path: filePath, message: commitMsg } = params || {};
      
      if (action === 'deploy') {
        if (!repo || !token) return error(res, 'GitHub repo and token required', 400);
        const [owner, repoName] = repo.split('/');
        
        // Create or update file
        const uploadRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${filePath || 'index.html'}`, {
          method: 'PUT',
          headers: { 
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: commitMsg || 'Deploy from ERGIO',
            content: Buffer.from(fileContent || '').toString('base64'),
          }),
          signal: AbortSignal.timeout(15000)
        });
        
        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          return error(res, errData.message || 'GitHub deploy failed', 400);
        }
        
        const result = await uploadRes.json();
        return success(res, {
          deployed: true,
          url: result.content?.html_url,
          pagesUrl: `https://${owner}.github.io/${repoName}`,
          message: '✅ Deployed to GitHub! Enable GitHub Pages in your repo settings.'
        });
      }
      
      if (action === 'create_repo') {
        const { name, description, isPrivate = false } = params || {};
        const createRes = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description, private: isPrivate, auto_init: true }),
          signal: AbortSignal.timeout(10000)
        });
        if (!createRes.ok) return error(res, 'Failed to create repo', 400);
        const repo = await createRes.json();
        return success(res, { repoUrl: repo.html_url, cloneUrl: repo.clone_url });
      }
    }
    
    // ── WEB SEARCH MCP ────────────────────────────────────────
    if (tool === 'web_search') {
      const { query } = params || {};
      if (!query) return error(res, 'Query required', 400);
      
      // Try multiple search sources
      let results = [];
      try {
        const ddgRes = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`, {
          signal: AbortSignal.timeout(5000)
        });
        if (ddgRes.ok) {
          const data = await ddgRes.json();
          results = (data.RelatedTopics || []).slice(0, 10).map(t => ({
            title: t.Text?.substring(0, 80) || '',
            url: t.FirstURL || '',
            snippet: t.Text || ''
          })).filter(r => r.url);
        }
      } catch {}
      
      return success(res, { results, query, total: results.length });
    }
    
    // ── HTTP FETCH MCP ────────────────────────────────────────
    if (tool === 'http_fetch') {
      const { url, method = 'GET', headers: reqHeaders = {}, body: reqBody } = params || {};
      if (!url) return error(res, 'URL required', 400);
      
      const fetchRes = await fetch(url, {
        method,
        headers: { 'User-Agent': 'ERGIO-AI/1.0', ...reqHeaders },
        body: reqBody ? JSON.stringify(reqBody) : undefined,
        signal: AbortSignal.timeout(8000)
      });
      
      const contentType = fetchRes.headers.get('content-type') || '';
      let responseData;
      if (contentType.includes('json')) {
        responseData = await fetchRes.json();
      } else {
        responseData = await fetchRes.text();
      }
      
      return success(res, { status: fetchRes.status, data: responseData, url });
    }
    
    // ── STATUS ────────────────────────────────────────────────
    if (!tool || tool === 'status') {
      return success(res, {
        status: 'online',
        version: '2.0',
        tools: [
          { id: 'figma', name: 'Figma MCP', status: 'active', actions: ['get_design'] },
          { id: 'github', name: 'GitHub MCP', status: 'active', actions: ['deploy', 'create_repo'] },
          { id: 'web_search', name: 'Web Search', status: 'active', actions: ['search'] },
          { id: 'http_fetch', name: 'HTTP Fetch', status: 'active', actions: ['fetch'] },
        ],
        message: 'ERGIO MCP Server v2.0 — All tools operational'
      });
    }
    
    return error(res, 'Unknown tool. Use: figma, github, web_search, http_fetch, status', 400);
  } catch(e) {
    return error(res, e.message, 500);
  }
}
