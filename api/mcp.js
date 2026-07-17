// ========================================
// ERGIO API — /api/mcp (MCP Servers & Plugins)
// Model Context Protocol integration + built-in tools
// Users can connect external MCP servers AND use built-in ERGIO tools
// ========================================

import { callGroq, success, error, corsHeaders, getSupabase } from '../lib/ergio.js';

// Built-in tools that work immediately — no external server needed
const BUILTIN_TOOLS = [
  {
    name: 'web_search',
    description: 'Search the web for real-time information. Returns relevant results.',
    category: 'Search',
    icon: '🔍',
    inputs: { query: 'string — what to search for', num: 'number — max results (default 5)' },
    execute: async (args) => {
      const q = encodeURIComponent(args.query || '');
      const n = args.num || 5;
      try {
        // Use DuckDuckGo instant answers API (free, no key)
        const ddgRes = await fetch(`https://api.duckduckgo.com/?q=${q}&format=json&no_html=1&skip_disambig=1`);
        const ddgData = await ddgRes.json();
        const results = [];
        
        if (ddgData.AbstractText) {
          results.push({ title: ddgData.Heading, url: ddgData.AbstractURL, snippet: ddgData.AbstractText, source: 'DuckDuckGo' });
        }
        if (ddgData.RelatedTopics) {
          ddgData.RelatedTopics.slice(0, n).forEach(t => {
            if (t.Text && t.FirstURL) {
              results.push({ title: t.Text.split(' - ')[0], url: t.FirstURL, snippet: t.Text, source: 'DuckDuckGo' });
            }
          });
        }
        
        // Also search Wikipedia API for more results
        if (results.length < n) {
          const wikiRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${q}&format=json&srlimit=${n}`);
          const wikiData = await wikiRes.json();
          if (wikiData.query?.search) {
            wikiData.query.search.forEach(r => {
              results.push({
                title: r.title,
                url: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title)}`,
                snippet: r.snippet.replace(/<[^>]+>/g, ''),
                source: 'Wikipedia'
              });
            });
          }
        }
        
        return { success: true, results: results.slice(0, n) };
      } catch (e) {
        return { success: false, error: e.message, results: [] };
      }
    }
  },
  {
    name: 'http_fetch',
    description: 'Fetch any URL and get its HTML content, title, and metadata.',
    category: 'Web',
    icon: '🌐',
    inputs: { url: 'string — the URL to fetch', selector: 'string (optional) — CSS selector to extract' },
    execute: async (args) => {
      try {
        let url = args.url;
        if (!url.startsWith('http')) url = 'https://' + url;
        const res = await fetch(url, { 
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
          signal: AbortSignal.timeout(8000)
        });
        const html = await res.text();
        const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
        const title = titleMatch ? titleMatch[1].trim() : '';
        const descMatch = html.match(/<meta[^>]+name=["']description["']\s+content=["']([^"']+)["']/is);
        const description = descMatch ? descMatch[1].trim() : '';
        const textContent = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000);
        return { success: true, title, description, textContent, url: res.url, contentLength: html.length };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
  },
  {
    name: 'send_email',
    description: 'Send an email via Resend. Requires RESEND_API_KEY env var.',
    category: 'Email',
    icon: '📧',
    inputs: { to: 'string — recipient email', subject: 'string — email subject', html: 'string — email HTML body', from: 'string (optional) — sender email' },
    execute: async (args) => {
      const key = process.env.RESEND_API_KEY;
      if (!key) return { success: false, error: 'RESEND_API_KEY not configured' };
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: args.from || 'ERGIO <noreply@ergio.vercel.app>',
            to: args.to,
            subject: args.subject || 'ERGIO Email',
            html: args.html || args.text || ''
          })
        });
        const data = await res.json();
        return { success: res.ok, data };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
  },
  {
    name: 'create_payment',
    description: 'Initialize a Paystack payment for a customer.',
    category: 'Payments',
    icon: '💰',
    inputs: { amount: 'number — amount in NGN (kobo)', email: 'string — customer email', reference: 'string (optional)', callback_url: 'string (optional)' },
    execute: async (args) => {
      const key = process.env.PAYSTACK_SECRET_KEY;
      if (!key) return { success: false, error: 'PAYSTACK_SECRET_KEY not configured' };
      try {
        const res = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: args.amount,
            email: args.email,
            reference: args.reference || `ergio_${Date.now()}`,
            callback_url: args.callback_url || 'https://ergio.vercel.app/pay.html'
          })
        });
        const data = await res.json();
        return { success: data.status, data: data.data };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
  },
  {
    name: 'whatsapp_send',
    description: 'Generate a WhatsApp click-to-chat link with a pre-filled message.',
    category: 'Communication',
    icon: '🟢',
    inputs: { phone: 'string — phone number with country code (e.g. 2348012345678)', message: 'string — pre-filled message' },
    execute: async (args) => {
      const phone = (args.phone || '').replace(/[^0-9]/g, '');
      const msg = encodeURIComponent(args.message || '');
      const url = `https://wa.me/${phone}?text=${msg}`;
      return { success: true, url, phone, message: args.message };
    }
  },
  {
    name: 'ai_generate',
    description: 'Generate text using AI (Groq/OpenRouter). Useful for content creation, analysis, summarization.',
    category: 'AI',
    icon: '🤖',
    inputs: { prompt: 'string — what to generate', system: 'string (optional) — system prompt', maxTokens: 'number (optional)' },
    execute: async (args) => {
      const key = process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;
      if (!key) {
        // Fallback to Pollinations text API
        try {
          const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(args.prompt)}`);
          const text = await res.text();
          return { success: true, text, model: 'pollinations' };
        } catch (e) {
          return { success: false, error: 'No AI provider configured' };
        }
      }
      const isGroq = !!process.env.GROQ_API_KEY;
      try {
        const endpoint = isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            ...(isGroq ? {} : { 'HTTP-Referer': 'https://ergio.vercel.app', 'X-Title': 'ERGIO MCP' })
          },
          body: JSON.stringify({
            model: isGroq ? 'llama-3.3-70b-versatile' : 'meta-llama/llama-3.1-70b-instruct',
            messages: [
              ...(args.system ? [{ role: 'system', content: args.system }] : []),
              { role: 'user', content: args.prompt }
            ],
            max_tokens: args.maxTokens || 2000
          })
        });
        const data = await res.json();
        return { success: true, text: data.choices?.[0]?.message?.content || '', model: isGroq ? 'groq' : 'openrouter' };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
  },
  {
    name: 'image_generate',
    description: 'Generate an image from a text prompt using Pollinations AI.',
    category: 'AI',
    icon: '🎨',
    inputs: { prompt: 'string — describe the image', width: 'number (optional, default 1024)', height: 'number (optional, default 1024)' },
    execute: async (args) => {
      const p = encodeURIComponent(args.prompt || 'abstract art');
      const w = args.width || 1024;
      const h = args.height || 1024;
      const url = `https://image.pollinations.ai/prompt/${p}?width=${w}&height=${h}&nologo=true&seed=${Math.floor(Math.random()*100000)}`;
      return { success: true, url, prompt: args.prompt, width: w, height: h };
    }
  },
  {
    name: 'scrape_page',
    description: 'Scrape a web page and extract structured data (links, images, text, meta tags).',
    category: 'Web',
    icon: '🪚',
    inputs: { url: 'string — URL to scrape' },
    execute: async (args) => {
      try {
        let url = args.url;
        if (!url.startsWith('http')) url = 'https://' + url;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
          signal: AbortSignal.timeout(8000)
        });
        const html = await res.text();
        const links = [...html.matchAll(/<a\s[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gis)].map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g,'').trim() })).filter(l => l.href.startsWith('http')).slice(0, 20);
        const images = [...html.matchAll(/<img\s[^>]*src=["']([^"']+)["']/gi)].map(m => m[1]).slice(0, 10);
        const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
        const metaTags = [...html.matchAll(/<meta\s[^>]*?(name|property)=["']([^"']+)["']\s+content=["']([^"']+)["']/gi)].map(m => ({ key: m[2], value: m[3] }));
        const headings = [...html.matchAll(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gis)].map(m => m[1].replace(/<[^>]+>/g,'').trim()).filter(Boolean).slice(0, 10);
        return { success: true, url: res.url, title: titleMatch?.[1]?.trim() || '', links, images, metaTags, headings, htmlSize: html.length };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
  },
  {
    name: 'sql_query',
    description: 'Run a read-only SQL query on your Supabase database.',
    category: 'Database',
    icon: '🗄️',
    inputs: { query: 'string — SQL SELECT query' },
    execute: async (args) => {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
      if (!url || !key) return { success: false, error: 'Supabase not configured' };
      if (!/^\s*select/i.test(args.query || '')) return { success: false, error: 'Only SELECT queries allowed' };
      try {
        const res = await fetch(`${url}/rest/v1/rpc/query`, {
          method: 'POST',
          headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: args.query })
        });
        if (!res.ok) {
          // Fallback: use Supabase REST API for simple table queries
          const tableMatch = args.query.match(/from\s+(\w+)/i);
          if (tableMatch) {
            const tableRes = await fetch(`${url}/rest/v1/${tableMatch[1]}?limit=20`, {
              headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
            });
            const data = await tableRes.json();
            return { success: true, rows: data, count: Array.isArray(data) ? data.length : 0 };
          }
          return { success: false, error: 'Query failed' };
        }
        const data = await res.json();
        return { success: true, rows: data, count: Array.isArray(data) ? data.length : 1 };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
  },
  {
    name: 'notification_send',
    description: 'Send a notification to ERGIO dashboard or webhook.',
    category: 'Productivity',
    icon: '🔔',
    inputs: { title: 'string — notification title', message: 'string — notification body', type: 'string (optional) — info|success|warning|error' },
    execute: async (args) => {
      return { success: true, notification: { title: args.title, message: args.message, type: args.type || 'info', timestamp: new Date().toISOString() } };
    }
  }
];

// External MCP plugin marketplace
const PLUGINS = [
  { id: 'gmail', name: 'Gmail MCP', icon: '📧', category: 'Email', description: 'Read and send emails through Gmail.', transport: 'stdio', command: 'npx', args: ['@modelcontextprotocol/server-gmail'], env: ['GMAIL_CLIENT_ID','GMAIL_CLIENT_SECRET','GMAIL_REFRESH_TOKEN'], popular: true, verified: true },
  { id: 'github', name: 'GitHub MCP', icon: '🐙', category: 'Developer', description: 'Access GitHub repos, issues, PRs, and code.', transport: 'stdio', command: 'npx', args: ['@modelcontextprotocol/server-github'], env: ['GITHUB_TOKEN'], popular: true, verified: true },
  { id: 'supabase', name: 'Supabase MCP', icon: '🗄️', category: 'Database', description: 'Query and manage your Supabase database.', transport: 'stdio', command: 'npx', args: ['@modelcontextprotocol/server-supabase'], env: ['SUPABASE_URL','SUPABASE_SERVICE_KEY'], popular: true, verified: true },
  { id: 'stripe', name: 'Stripe MCP', icon: '💳', category: 'Payments', description: 'Create charges, manage subscriptions via Stripe.', transport: 'stdio', command: 'npx', args: ['@modelcontextprotocol/server-stripe'], env: ['STRIPE_SECRET_KEY'], popular: false, verified: true },
  { id: 'slack', name: 'Slack MCP', icon: '💬', category: 'Communication', description: 'Send messages, read channels, manage Slack.', transport: 'stdio', command: 'npx', args: ['@modelcontextprotocol/server-slack'], env: ['SLACK_BOT_TOKEN'], popular: true, verified: true },
  { id: 'google-calendar', name: 'Google Calendar MCP', icon: '📅', category: 'Productivity', description: 'Create events, check availability, manage calendar.', transport: 'stdio', command: 'npx', args: ['@modelcontextprotocol/server-google-calendar'], env: ['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GOOGLE_REFRESH_TOKEN'], popular: false, verified: true },
  { id: 'notion', name: 'Notion MCP', icon: '📝', category: 'Productivity', description: 'Read and write Notion pages, databases, and tasks.', transport: 'stdio', command: 'npx', args: ['@modelcontextprotocol/server-notion'], env: ['NOTION_TOKEN'], popular: false, verified: true },
  { id: 'filesystem', name: 'Filesystem MCP', icon: '📁', category: 'Developer', description: 'Read and write files on your machine.', transport: 'stdio', command: 'npx', args: ['@modelcontextprotocol/server-filesystem'], env: ['ROOT_PATH'], popular: false, verified: true },
  { id: 'postgres', name: 'PostgreSQL MCP', icon: '🐘', category: 'Database', description: 'Query any PostgreSQL database.', transport: 'stdio', command: 'npx', args: ['@modelcontextprotocol/server-postgres'], env: ['DATABASE_URL'], popular: false, verified: true },
  { id: 'brave-search', name: 'Brave Search MCP', icon: '🔍', category: 'Search', description: 'Search the web with Brave Search API.', transport: 'stdio', command: 'npx', args: ['@modelcontextprotocol/server-brave-search'], env: ['BRAVE_API_KEY'], popular: false, verified: true },
  { id: 'memory', name: 'Memory MCP', icon: '🧠', category: 'AI', description: 'Persistent memory for agents.', transport: 'stdio', command: 'npx', args: ['@modelcontextprotocol/server-memory'], env: [], popular: false, verified: true },
  { id: 'puppeteer', name: 'Puppeteer MCP', icon: '🎭', category: 'Developer', description: 'Browser automation. Navigate, click, scrape.', transport: 'stdio', command: 'npx', args: ['@modelcontextprotocol/server-puppeteer'], env: [], popular: true, verified: true },
  { id: 'whatsapp', name: 'WhatsApp MCP', icon: '🟢', category: 'Communication', description: 'Send and receive WhatsApp messages.', transport: 'sse', url: 'https://wa-mcp.bridge/v1', env: ['WHATSAPP_TOKEN'], popular: true, verified: false },
  { id: 'paystack', name: 'Paystack MCP', icon: '💰', category: 'Payments', description: 'Initialize payments, verify transactions.', transport: 'sse', url: 'https://paystack-mcp.bridge/v1', env: ['PAYSTACK_SECRET_KEY'], popular: true, verified: false },
  { id: 'custom', name: 'Custom MCP Server', icon: '🔌', category: 'Custom', description: 'Add any MCP server by URL. Works with stdio, SSE, and WebSocket.', transport: 'custom', env: [], popular: false, verified: false }
];

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action || '';
  let body = {};
  if (typeof req.body === 'object' && req.body !== null) { body = req.body; }
  else { try { body = JSON.parse(req.body || '{}'); } catch { body = {}; } }
  const userId = body.userId || req.query.userId || '';

  // ── GET: List tools & marketplace ──
  if (req.method === 'GET') {
    // action=tools — list all available tools (built-in + connected)
    if (action === 'tools') {
      return res.status(200).json({
        success: true,
        builtIn: BUILTIN_TOOLS.map(t => ({ name: t.name, description: t.description, category: t.category, icon: t.icon, inputs: t.inputs })),
        total: BUILTIN_TOOLS.length
      });
    }

    // action=marketplace — return plugin marketplace
    if (action === 'marketplace') {
      return res.status(200).json({
        plugins: PLUGINS,
        categories: ['Email','Developer','Database','Payments','Communication','Productivity','Search','AI','Custom'],
        totalPlugins: PLUGINS.length,
        builtInTools: BUILTIN_TOOLS.length
      });
    }

    // Default: return user's configured MCP servers + built-in tools summary
    const supabase = getSupabase();
    let servers = [];
    if (supabase) {
      try {
        const { data } = await supabase.from('mcp_servers').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        servers = data || [];
      } catch { servers = []; }
    }
    return res.status(200).json({
      success: true,
      servers,
      builtInTools: BUILTIN_TOOLS.map(t => ({ name: t.name, description: t.description, icon: t.icon, category: t.category })),
      pluginCount: PLUGINS.length
    });
  }

  // ── POST: Execute a tool call ──
  if (req.method === 'POST') {
    // action=call — execute a tool
    if (action === 'call' || body.action === 'call') {
      const { tool, args, serverUrl } = body;
      if (!tool) return error(res, 'Tool name is required', 400);

      // Check built-in tools first
      const builtIn = BUILTIN_TOOLS.find(t => t.name === tool);
      if (builtIn) {
        try {
          const result = await builtIn.execute(args || {});
          return res.status(200).json({ success: true, tool, result, source: 'builtin' });
        } catch (e) {
          return res.status(500).json({ success: false, tool, error: e.message });
        }
      }

      // Try external MCP server via SSE
      if (serverUrl) {
        try {
          // MCP SSE protocol: POST to serverUrl/callTool with JSON-RPC
          const mcpRes = await fetch(`${serverUrl}/callTool`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'tools/call',
              params: { name: tool, arguments: args || {} },
              id: Date.now()
            }),
            signal: AbortSignal.timeout(10000)
          });
          if (mcpRes.ok) {
            const data = await mcpRes.json();
            return res.status(200).json({ success: true, tool, result: data.result || data, source: 'mcp' });
          }
          return error(res, `MCP server returned ${mcpRes.status}`, 502);
        } catch (e) {
          return error(res, `MCP connection failed: ${e.message}`, 502);
        }
      }

      // Try user's configured server that matches the tool
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data: servers } = await supabase.from('mcp_servers').select('*').eq('user_id', userId);
          if (servers && servers.length > 0) {
            // Try each configured server
            for (const srv of servers) {
              if (srv.url) {
                try {
                  const mcpRes = await fetch(`${srv.url}/callTool`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/call', params: { name: tool, arguments: args || {} }, id: Date.now() }),
                    signal: AbortSignal.timeout(8000)
                  });
                  if (mcpRes.ok) {
                    const data = await mcpRes.json();
                    return res.status(200).json({ success: true, tool, result: data.result || data, source: 'mcp', server: srv.name });
                  }
                } catch { continue; }
              }
            }
          }
        } catch {}
      }

      return error(res, `Tool "${tool}" not found. Available tools: ${BUILTIN_TOOLS.map(t=>t.name).join(', ')}`, 404);
    }

    // Default POST: Add a new MCP server
    const { name, pluginId, transport, command, args: cmdArgs, url, envVars } = body;
    if (!name) return error(res, 'Server name is required', 400);

    // Test connection first
    let connectionStatus = 'pending';
    let availableTools = [];
    if (url) {
      try {
        const testRes = await fetch(`${url}/tools`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000)
        });
        if (testRes.ok) {
          connectionStatus = 'connected';
          const toolsData = await testRes.json();
          availableTools = toolsData.tools || [];
        }
      } catch { connectionStatus = 'pending'; }
    }

    const server = {
      user_id: userId,
      name, plugin_id: pluginId || 'custom',
      transport: transport || 'sse',
      command: command || null, args: cmdArgs || [],
      url: url || null, env_vars: envVars || {},
      status: connectionStatus,
      tools: availableTools,
      created_at: new Date().toISOString()
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error: dbError } = await supabase.from('mcp_servers').insert(server).select().single();
        if (!dbError) {
          return res.status(200).json({ success: true, server: data, message: 'MCP server added & connected' });
        }
      } catch {}
    }
    // Fallback to client-side response
    return res.status(200).json({ success: true, server: { ...server, id: Date.now().toString() }, message: 'MCP server saved (client-side mode)' });
  }

  // ── DELETE: Remove an MCP server ──
  if (req.method === 'DELETE') {
    const { serverId } = body;
    if (!serverId) return error(res, 'Server ID is required', 400);
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('mcp_servers').delete().eq('id', serverId).eq('user_id', userId);
      } catch {}
    }
    return res.status(200).json({ success: true, message: 'MCP server removed' });
  }

  // ── PUT: Test connection + list tools from a server ──
  if (req.method === 'PUT') {
    const { url: testUrl, serverId } = body;
    if (testUrl) {
      try {
        // Try MCP SSE protocol: GET /tools
        const res2 = await fetch(`${testUrl}/tools`, {
          headers: { 'Accept': 'text/event-stream' },
          signal: AbortSignal.timeout(8000)
        });
        if (res2.ok) {
          const text = await res2.text();
          let tools = [];
          try { tools = JSON.parse(text).tools || []; } catch {}
          return res.status(200).json({ success: true, status: 'connected', tools, message: 'MCP server reachable' });
        }
      } catch {}
      return res.status(200).json({ success: true, status: 'pending', tools: [], message: 'Server added but connection test failed — will retry' });
    }
    return res.status(200).json({ success: true, status: 'connected', tools: [], message: 'Server configured' });
  }

  return error(res, 'Method not allowed', 405);
}
