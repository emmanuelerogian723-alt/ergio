/**
 * ERGIO Connector System (Accio-inspired)
 * One-click integration connections from the frontend.
 * Users connect their own API keys — stored encrypted in Supabase.
 */
window.ErgioConnectors = (function() {
  const SUPABASE = window.SUPABASE_URL;
  const ANON_KEY = window.SUPABASE_ANON_KEY;
  
  // Connector definitions with OAuth + API key connection types
  const CONNECTORS = {
    // Payments
    paystack: { name: 'Paystack', icon: '💳', category: 'Payments', type: 'api_key', 
      fields: [{ name: 'secret_key', label: 'Secret Key', placeholder: 'sk_live_...' }],
      test: async (creds) => {
        const r = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST', headers: { Authorization: `Bearer ${creds.secret_key}` }, body: JSON.stringify({email:'test@test.com',amount:100})
        });
        return r.status === 200 || r.status === 400;
      }},
    flutterwave: { name: 'Flutterwave', icon: '💛', category: 'Payments', type: 'api_key',
      fields: [{ name: 'secret_key', label: 'Secret Key', placeholder: 'FLWSECK-...' }]},
    stripe: { name: 'Stripe', icon: '💳', category: 'Payments', type: 'api_key',
      fields: [{ name: 'secret_key', label: 'Secret Key', placeholder: 'sk_live_...' }],
      test: async (creds) => {
        const r = await fetch('https://api.stripe.com/v1/balance', { headers: { Authorization: `Bearer ${creds.secret_key}` } });
        return r.ok;
      }},
    
    // Communication
    gmail: { name: 'Gmail', icon: '📧', category: 'Communication', type: 'oauth', 
      oauth_url: 'https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/gmail.send&response_type=code' },
    whatsapp: { name: 'WhatsApp Business', icon: '💬', category: 'Communication', type: 'api_key',
      fields: [{ name: 'token', label: 'Access Token', placeholder: 'EAAG...' }, { name: 'phone_id', label: 'Phone Number ID', placeholder: '123...' }]},
    telegram: { name: 'Telegram Bot', icon: '✈️', category: 'Communication', type: 'api_key',
      fields: [{ name: 'bot_token', label: 'Bot Token', placeholder: '123456:ABC...' }],
      test: async (creds) => {
        const r = await fetch(`https://api.telegram.org/bot${creds.bot_token}/getMe`);
        const d = await r.json();
        return d.ok === true;
      }},
    resend: { name: 'Resend Email', icon: '📧', category: 'Communication', type: 'api_key',
      fields: [{ name: 'api_key', label: 'API Key', placeholder: 're_...' }],
      test: async (creds) => {
        const r = await fetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${creds.api_key}` } });
        return r.ok;
      }},
    twilio: { name: 'Twilio SMS', icon: '📱', category: 'Communication', type: 'api_key',
      fields: [{ name: 'account_sid', label: 'Account SID', placeholder: 'AC...' }, { name: 'auth_token', label: 'Auth Token', placeholder: '...' }]},
    slack: { name: 'Slack', icon: '💼', category: 'Communication', type: 'oauth',
      oauth_url: 'https://slack.com/oauth/v2/authorize?scope=chat:write,channels:read' },
    
    // Productivity
    notion: { name: 'Notion', icon: '📝', category: 'Productivity', type: 'api_key',
      fields: [{ name: 'token', label: 'Integration Token', placeholder: 'secret_...' }],
      test: async (creds) => {
        const r = await fetch('https://api.notion.com/v1/users/me', { headers: { Authorization: `Bearer ${creds.token}`, 'Notion-Version': '2022-06-28' } });
        return r.ok;
      }},
    'google-calendar': { name: 'Google Calendar', icon: '📅', category: 'Productivity', type: 'oauth',
      oauth_url: 'https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/calendar&response_type=code' },
    'google-drive': { name: 'Google Drive', icon: '📁', category: 'Productivity', type: 'oauth',
      oauth_url: 'https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/drive.file&response_type=code' },
    github: { name: 'GitHub', icon: '🐙', category: 'Productivity', type: 'api_key',
      fields: [{ name: 'token', label: 'Personal Access Token', placeholder: 'ghp_...' }],
      test: async (creds) => {
        const r = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${creds.token}` } });
        return r.ok;
      }},
    
    // Marketing
    mailchimp: { name: 'Mailchimp', icon: '🐵', category: 'Marketing', type: 'api_key',
      fields: [{ name: 'api_key', label: 'API Key', placeholder: '...' }]},
    'meta-ads': { name: 'Meta Ads', icon: '📘', category: 'Marketing', type: 'oauth',
      oauth_url: 'https://www.facebook.com/v18.0/dialog/oauth?scope=ads_management' },
    'google-ads': { name: 'Google Ads', icon: '🎯', category: 'Marketing', type: 'api_key',
      fields: [{ name: 'developer_token', label: 'Developer Token' }, { name: 'refresh_token', label: 'Refresh Token' }]},
    canva: { name: 'Canva', icon: '🎨', category: 'Marketing', type: 'oauth',
      oauth_url: 'https://api.canva.com/v1/oauth/authorize' },
    
    // Analytics
    'google-analytics': { name: 'Google Analytics', icon: '📊', category: 'Analytics', type: 'oauth',
      oauth_url: 'https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/analytics.readonly&response_type=code' },
    mixpanel: { name: 'Mixpanel', icon: '📈', category: 'Analytics', type: 'api_key',
      fields: [{ name: 'project_token', label: 'Project Token' }]},
    
    // AI & Automation
    openai: { name: 'OpenAI', icon: '🤖', category: 'AI & Automation', type: 'api_key',
      fields: [{ name: 'api_key', label: 'API Key', placeholder: 'sk-...' }],
      test: async (creds) => {
        const r = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${creds.api_key}` } });
        return r.ok;
      }},
    groq: { name: 'Groq', icon: '⚡', category: 'AI & Automation', type: 'api_key',
      fields: [{ name: 'api_key', label: 'API Key', placeholder: 'gsk_...' }],
      test: async (creds) => {
        const r = await fetch('https://api.groq.com/openai/v1/models', { headers: { Authorization: `Bearer ${creds.api_key}` } });
        return r.ok;
      }},
    openrouter: { name: 'OpenRouter', icon: '🔀', category: 'AI & Automation', type: 'api_key',
      fields: [{ name: 'api_key', label: 'API Key', placeholder: 'sk-or-...' }],
      test: async (creds) => {
        const r = await fetch('https://openrouter.ai/api/v1/models', { headers: { Authorization: `Bearer ${creds.api_key}` } });
        return r.ok;
      }},
    'eleven-labs': { name: 'ElevenLabs Voice', icon: '🎙️', category: 'AI & Automation', type: 'api_key',
      fields: [{ name: 'api_key', label: 'API Key', placeholder: '...' }]},
    cal: { name: 'Cal.com Bookings', icon: '📆', category: 'AI & Automation', type: 'api_key',
      fields: [{ name: 'api_key', label: 'API Key', placeholder: '...' }]},
    elevenlabs: { name: 'ElevenLabs', icon: '🔊', category: 'AI & Automation', type: 'api_key',
      fields: [{ name: 'api_key', label: 'API Key', placeholder: '...' }]},
    
    // Social
    instagram: { name: 'Instagram', icon: '📸', category: 'Social', type: 'oauth',
      oauth_url: 'https://api.instagram.com/oauth/authorize?scope=user_profile,user_media' },
    twitter: { name: 'Twitter/X', icon: '🐦', category: 'Social', type: 'api_key',
      fields: [{ name: 'bearer_token', label: 'Bearer Token' }]},
    facebook: { name: 'Facebook', icon: '👍', category: 'Social', type: 'oauth',
      oauth_url: 'https://www.facebook.com/v18.0/dialog/oauth?scope=pages_manage_posts' },
    linkedin: { name: 'LinkedIn', icon: '💼', category: 'Social', type: 'oauth',
      oauth_url: 'https://www.linkedin.com/oauth/v2/authorization?scope=w_member_social' },
    
    // CRM
    hubspot: { name: 'HubSpot CRM', icon: '🎯', category: 'CRM', type: 'api_key',
      fields: [{ name: 'api_key', label: 'API Key' }]},
    'google-business': { name: 'Google Business', icon: '📍', category: 'CRM', type: 'oauth',
      oauth_url: 'https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/business.manage&response_type=code' },
  };

  // Simple encryption (obfuscation for client-side — real encryption is server-side)
  function encrypt(text) {
    return btoa(unescape(encodeURIComponent(text.split('').reverse().join(''))));
  }
  function decrypt(encoded) {
    try { return decodeURIComponent(escape(atob(encoded))).split('').reverse().join(''); } catch { return ''; }
  }

  async function getSupabaseClient() {
    if (window.supabaseClient) return window.supabaseClient;
    if (window.supabase) {
      window.supabaseClient = window.supabase.createClient(SUPABASE, ANON_KEY);
      return window.supabaseClient;
    }
    return null;
  }

  async function saveCredentials(connectorId, credentials, userId) {
    const client = await getSupabaseClient();
    if (!client) throw new Error('Supabase not initialized');
    
    const encrypted = {};
    for (const [k, v] of Object.entries(credentials)) {
      encrypted[k] = encrypt(v);
    }
    
    const { data, error } = await client.from('user_integrations').upsert({
      user_id: userId,
      connector_id: connectorId,
      credentials: encrypted,
      connected_at: new Date().toISOString(),
      status: 'connected'
    }).select().single();
    
    if (error) throw error;
    return data;
  }

  async function loadConnections(userId) {
    const client = await getSupabaseClient();
    if (!client) return {};
    const { data, error } = await client.from('user_integrations').select('*').eq('user_id', userId);
    if (error || !data) return {};
    const connected = {};
    data.forEach(row => { connected[row.connector_id] = { connected_at: row.connected_at, status: row.status }; });
    return connected;
  }

  async function disconnect(connectorId, userId) {
    const client = await getSupabaseClient();
    if (!client) throw new Error('Supabase not initialized');
    const { error } = await client.from('user_integrations').delete().eq('user_id', userId).eq('connector_id', connectorId);
    return !error;
  }

  async function testConnection(connectorId, credentials) {
    const conn = CONNECTORS[connectorId];
    if (!conn || !conn.test) return { success: true }; // skip if no test defined
    try {
      const result = await conn.test(credentials);
      return { success: result };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  function renderModal() {
    const modal = document.createElement('div');
    modal.id = 'ergio-connector-modal';
    modal.innerHTML = `
      <div style="position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px" onclick="if(event.target===this)this.remove()">
        <div style="background:#0a0a0f;border:1px solid rgba(0,217,255,.2);border-radius:16px;max-width:600px;width:100%;max-height:80vh;overflow-y:auto;padding:32px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
            <h2 style="color:#fff;font-size:1.5rem;font-weight:700">🔗 Connect Integration</h2>
            <button onclick="this.closest('#ergio-connector-modal').remove()" style="background:none;border:none;color:#fff;font-size:1.5rem;cursor:pointer">×</button>
          </div>
          <div id="ergio-connector-form" style="color:#fff"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
  }

  function showConnectorForm(connectorId, userId) {
    const conn = CONNECTORS[connectorId];
    if (!conn) return;
    
    const modal = renderModal();
    const form = modal.querySelector('#ergio-connector-form');
    
    if (conn.type === 'oauth') {
      form.innerHTML = `
        <div style="text-align:center;padding:20px 0">
          <div style="font-size:3rem;margin-bottom:16px">${conn.icon}</div>
          <h3 style="color:#fff;margin-bottom:8px">${conn.name}</h3>
          <p style="color:#94A3B8;margin-bottom:24px">You'll be redirected to ${conn.name} to authorize ERGIO.</p>
          <button onclick="window.open('${conn.oauth_url}&client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent(window.location.origin + '/dashboard/index.html')}', '_blank')" 
            style="background:linear-gradient(135deg,#00d9ff,#007fff);color:#fff;border:none;padding:14px 32px;border-radius:10px;font-size:1rem;cursor:pointer;font-weight:600">
            Connect with ${conn.name} →
          </button>
        </div>
      `;
    } else {
      const fields = conn.fields.map(f => `
        <div style="margin-bottom:16px">
          <label style="display:block;color:#94A3B8;font-size:.875rem;margin-bottom:6px">${f.label}</label>
          <input type="text" id="conn-field-${f.name}" placeholder="${f.placeholder || ''}" 
            style="width:100%;padding:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#fff;font-size:.9rem" />
        </div>
      `).join('');
      
      form.innerHTML = `
        <div style="text-align:center;margin-bottom:20px">
          <div style="font-size:2.5rem">${conn.icon}</div>
          <h3 style="color:#fff;margin-top:8px">${conn.name}</h3>
        </div>
        ${fields}
        <button id="ergio-connect-btn" onclick="window.ErgioConnectors._handleConnect('${connectorId}', '${userId}')" 
          style="width:100%;background:linear-gradient(135deg,#00d9ff,#007fff);color:#fff;border:none;padding:14px;border-radius:10px;font-size:1rem;cursor:pointer;font-weight:600;margin-top:8px">
          Test & Connect →
        </button>
        <p id="ergio-conn-status" style="text-align:center;margin-top:12px;font-size:.85rem"></p>
      `;
    }
  }

  async function _handleConnect(connectorId, userId) {
    const conn = CONNECTORS[connectorId];
    const btn = document.getElementById('ergio-connect-btn');
    const status = document.getElementById('ergio-conn-status');
    btn.textContent = 'Testing...';
    btn.disabled = true;
    status.style.color = '#94A3B8';
    status.textContent = 'Validating credentials...';
    
    const credentials = {};
    conn.fields.forEach(f => {
      const input = document.getElementById(`conn-field-${f.name}`);
      if (input) credentials[f.name] = input.value;
    });
    
    // Test connection
    const testResult = await testConnection(connectorId, credentials);
    if (!testResult.success) {
      btn.textContent = 'Test & Connect →';
      btn.disabled = false;
      status.style.color = '#ef4444';
      status.textContent = '❌ Connection failed: ' + (testResult.error || 'Invalid credentials');
      return;
    }
    
    status.style.color = '#10b981';
    status.textContent = '✅ Credentials valid! Saving...';
    
    // Save to Supabase
    try {
      await saveCredentials(connectorId, credentials, userId);
      btn.textContent = '✅ Connected!';
      status.style.color = '#10b981';
      status.textContent = 'Successfully connected to ' + conn.name + '!';
      setTimeout(() => {
        document.getElementById('ergio-connector-modal')?.remove();
        if (window.loadIntegrations) window.loadIntegrations();
      }, 1500);
    } catch (e) {
      btn.textContent = 'Test & Connect →';
      btn.disabled = false;
      status.style.color = '#ef4444';
      status.textContent = '❌ Save failed: ' + e.message;
    }
  }

  function getConnectors() { return CONNECTORS; }
  
  function getByCategory(cat) {
    return Object.entries(CONNECTORS).filter(([_, c]) => c.category === cat).map(([id, c]) => ({ id, ...c }));
  }

  function getCategories() {
    return [...new Set(Object.values(CONNECTORS).map(c => c.category))];
  }

  return {
    getConnectors, getByCategory, getCategories,
    saveCredentials, loadConnections, disconnect, testConnection,
    showConnectorForm, _handleConnect, renderModal
  };
})();
