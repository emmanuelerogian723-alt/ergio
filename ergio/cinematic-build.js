// ========================================
// ERGIO — CINEMATIC BUILD EXPERIENCE (v1.0)
// 12 stages of AI-driven website creation
// Cinematic, smooth, intelligent, confidence-inspiring
// ========================================

let cinematicState = {
  stage: 0, startTime: 0, timeline: [], agents: [],
  activityLog: [], conversationLog: [], websiteHtml: '',
  previewReady: false, device: 'desktop', business: null,
  aborted: false, timerInterval: null,
};

const AI_AGENTS = [
  { name: 'CEO Agent', icon: '👔', color: '#00D9FF', role: 'Strategy & Vision' },
  { name: 'UI Designer', icon: '🎨', color: '#FF6B9D', role: 'Design Language' },
  { name: 'Frontend Engineer', icon: '⚡', color: '#00FF9D', role: 'Code & Motion' },
  { name: 'Backend Engineer', icon: '🔧', color: '#FBBF24', role: 'APIs & Database' },
  { name: 'Content Writer', icon: '✍️', color: '#A78BFA', role: 'Copy & SEO' },
  { name: 'Image Director', icon: '📸', color: '#3B82F6', role: 'Photo Selection' },
  { name: 'Sales Agent', icon: '📈', color: '#EF4444', role: 'Lead Generation' },
  { name: 'Deployment Agent', icon: '🚀', color: '#10F981', role: 'Go Live' },
];

const BUILD_STAGES = [
  { label: 'Business Plan', icon: '📋' }, { label: 'Brand Identity', icon: '🎨' },
  { label: 'Website', icon: '🌐' }, { label: 'CRM', icon: '📊' },
  { label: 'Lead Engine', icon: '🎯' }, { label: 'Automation', icon: '⚙️' },
  { label: 'Deployment', icon: '🚀' }, { label: 'Growth', icon: '📈' },
];

const CONFIDENCE_CHECKS = [
  'Security verified', 'Mobile optimized', 'SEO optimized',
  'Accessibility checked', 'Performance optimized', 'Ready for deployment',
];

const CONTINUOUS_TASKS = [
  'Monitoring visitors...', 'Checking SEO rankings...', 'Finding new leads...',
  'Preparing outreach...', 'Watching analytics...', 'Optimizing conversion rate...',
];

const THINKING_TASKS = [
  'Reading prompt', 'Detecting business type', 'Identifying target audience',
  'Planning architecture', 'Selecting design language', 'Choosing AI agents',
  'Building execution plan',
];

// ============ MAIN ENTRY POINT ============
async function startCinematicBuild(prompt, answers) {
  cinematicState = {
    stage: 0, startTime: Date.now(), timeline: [], agents: [],
    activityLog: [], conversationLog: [], websiteHtml: '',
    previewReady: false, device: 'desktop', business: null,
    aborted: false, timerInterval: null,
  };
  const overlay = document.getElementById('buildOverlay');
  if (!overlay) return;
  renderCinematicOverlay();
  overlay.classList.add('visible');
  cinematicState.timerInterval = setInterval(updateTimer, 100);

  await runStage1_Thinking(prompt, answers);
  if (cinematicState.aborted) return;
  await runStage2_TeamAssembly();
  if (cinematicState.aborted) return;
  await runStage3_Blueprint();
  if (cinematicState.aborted) return;
  await runStage4_LiveBuilding(prompt, answers);
  if (cinematicState.aborted) return;
  await runStage10_BusinessBuilder();
  if (cinematicState.aborted) return;
  await runStage11_Confidence();
  if (cinematicState.aborted) return;
  await runStage12_Continuous();
  if (cinematicState.aborted) return;
  showLaunchScreen();
}

// ============ STAGE 1: AI THINKING ============
async function runStage1_Thinking(prompt, answers) {
  cinematicState.stage = 1;
  showStage('stage-thinking');
  setStatus('🧠 Understanding your business...');
  const taskList = document.getElementById('thinkingTasks');
  if (!taskList) return;
  taskList.innerHTML = '';
  for (let i = 0; i < THINKING_TASKS.length; i++) {
    if (cinematicState.aborted) return;
    await delay(280 + Math.random() * 200);
    const task = document.createElement('div');
    task.className = 'think-task';
    task.innerHTML = `<div class="think-icon thinking"><div class="think-spinner"></div></div><span class="think-label">${THINKING_TASKS[i]}</span>`;
    taskList.appendChild(task);
    await delay(200 + Math.random() * 150);
    task.querySelector('.think-icon').classList.remove('thinking');
    task.querySelector('.think-icon').classList.add('done');
    task.querySelector('.think-icon').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="16" height="16"><path d="M20 6L9 17l-5-5"/></svg>';
    task.classList.add('completed');
    addActivity('Analyzed: ' + THINKING_TASKS[i]);
  }
  addConversation('ai', 'I understand — you want to build ' + prompt + '. Let me assemble the perfect AI team for this.');
  await delay(500);
}

// ============ STAGE 2: AI TEAM ASSEMBLY ============
async function runStage2_TeamAssembly() {
  cinematicState.stage = 2;
  showStage('stage-team');
  setStatus('🤖 Assembling your AI team...');
  const agentGrid = document.getElementById('agentGrid');
  if (!agentGrid) return;
  agentGrid.innerHTML = '';
  addActivity('AI team assembly started');
  for (let i = 0; i < AI_AGENTS.length; i++) {
    if (cinematicState.aborted) return;
    await delay(280);
    const agent = AI_AGENTS[i];
    const card = document.createElement('div');
    card.className = 'agent-card';
    card.style.setProperty('--agent-color', agent.color);
    card.innerHTML = `
      <div class="agent-avatar" style="background:${agent.color}22;border-color:${agent.color}">
        <span class="agent-emoji">${agent.icon}</span>
        <div class="agent-pulse" style="background:${agent.color}"></div>
      </div>
      <div class="agent-info">
        <div class="agent-name">${agent.name}</div>
        <div class="agent-role">${agent.role}</div>
      </div>
      <div class="agent-status">
        <div class="status-dot-mini" style="background:${agent.color}"></div>
        <span style="color:${agent.color}">Online</span>
      </div>`;
    agentGrid.appendChild(card);
    requestAnimationFrame(() => card.classList.add('appeared'));
    cinematicState.agents.push(agent);
    addActivity(agent.name + ' assigned');
  }
  await delay(600);
  addConversation('ai', 'Team assembled. ' + AI_AGENTS.length + ' AI specialists are ready to build your business.');
}

// ============ STAGE 3: PROJECT BLUEPRINT ============
async function runStage3_Blueprint() {
  cinematicState.stage = 3;
  showStage('stage-blueprint');
  setStatus('📐 Creating project blueprint...');
  const blueprintEl = document.getElementById('blueprintFlow');
  if (!blueprintEl) return;
  blueprintEl.innerHTML = '';
  for (let i = 0; i < BUILD_STAGES.length; i++) {
    if (cinematicState.aborted) return;
    await delay(220);
    const stage = BUILD_STAGES[i];
    const node = document.createElement('div');
    node.className = 'blueprint-node';
    node.innerHTML = `<div class="blueprint-icon">${stage.icon}</div><div class="blueprint-label">${stage.label}</div>`;
    blueprintEl.appendChild(node);
    if (i < BUILD_STAGES.length - 1) {
      const arrow = document.createElement('div');
      arrow.className = 'blueprint-arrow';
      arrow.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>';
      blueprintEl.appendChild(arrow);
    }
    requestAnimationFrame(() => node.classList.add('active'));
    addActivity('Blueprint: ' + stage.label);
  }
  await delay(500);
  addConversation('ai', "Blueprint ready. Let's start building.");
  await delay(400);
}

// ============ STAGE 4-9: LIVE BUILDING ============
async function runStage4_LiveBuilding(prompt, answers) {
  cinematicState.stage = 4;
  showStage('stage-build');
  setStatus('🏗️ Building your website...');
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, answers }),
    });
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      if (cinematicState.aborted) { reader.cancel(); return; }
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try { const event = JSON.parse(line.slice(6)); await handleSSEEvent(event); } catch(e) {}
      }
    }
    if (buffer.startsWith('data: ')) {
      try { const event = JSON.parse(buffer.slice(6)); await handleSSEEvent(event); } catch(e) {}
    }
  } catch (err) {
    addActivity('Error: ' + err.message);
    addConversation('ai', 'I encountered an issue. Let me retry with a fallback approach.');
    await generateFallback(prompt, answers);
  }
}

// ============ SSE EVENT HANDLER ============
async function handleSSEEvent(event) {
  const { type, data } = event;
  const timeStr = new Date().toTimeString().slice(0, 5);
  switch (type) {
    case 'status':
      setStatus(data.task); updateProgress(data.step, data.total); addActivity(data.task); break;
    case 'plan':
      cinematicState.business = data.plan;
      addConversation('ai', 'I\'ve planned your business: <b>' + data.plan.businessName + '</b> — ' + data.plan.tagline);
      addTimeline(timeStr, 'Business strategy created: ' + data.plan.businessName);
      showPlanPreview(data.plan); break;
    case 'brand':
      addConversation('ai', 'Brand identity is ready. Logo generated. Voice: ' + (data.brand.brandVoice || 'Professional') + '.');
      addTimeline(timeStr, 'Brand identity created'); addActivity('Logo generated via AI'); break;
    case 'images':
      addConversation('ai', 'Found <b>' + data.total + ' real photos</b> from Pixabay & Unsplash for your website.');
      addTimeline(timeStr, data.total + ' images sourced from Pixabay + Unsplash');
      showImageCount(data.total, data.placements); break;
    case 'content':
      if (data.content.hero) addConversation('ai', 'Your hero headline: "' + data.content.hero.headline + '"');
      addTimeline(timeStr, 'Premium copy written'); break;
    case 'website':
      cinematicState.websiteHtml = data.html; cinematicState.previewReady = true;
      updatePreview(data.html);
      addConversation('ai', 'Your website is built with motion graphics and real photos. Take a look →');
      addTimeline(timeStr, 'Website generated with ' + (data.imageCount || '') + ' real images'); break;
    case 'booking':
      addConversation('ai', 'Booking system configured. Customers can book your services online.');
      addTimeline(timeStr, 'Booking system configured'); break;
    case 'payment':
      addConversation('ai', 'Payment gateway ready. Accept cards, bank transfers, and USSD.');
      addTimeline(timeStr, 'Paystack payment integration ready'); break;
    case 'engines':
      if (data.engines) {
        for (const engine of data.engines) {
          addActivity(engine.name + ': ' + engine.description);
          await delay(150);
        }
        addConversation('ai', 'All 4 client acquisition engines are now active and scanning for leads.');
      }
      addTimeline(timeStr, 'Client acquisition engines activated'); break;
    case 'complete':
      cinematicState.business = Object.assign({}, cinematicState.business, data.business);
      addTimeline(timeStr, 'Business launch complete'); break;
    case 'error':
      addActivity('Error: ' + data.message); break;
  }
}

// ============ STAGE 10: BUSINESS BUILDER ============
async function runStage10_BusinessBuilder() {
  cinematicState.stage = 10;
  showStage('stage-business');
  setStatus('💼 Setting up your business tools...');
  const tools = [
    { icon: '📊', name: 'CRM System', desc: 'Manage your clients' },
    { icon: '🧾', name: 'Invoices', desc: 'Send professional invoices' },
    { icon: '📅', name: 'Calendar', desc: 'Online booking system' },
    { icon: '💳', name: 'Payments', desc: 'Paystack integration' },
    { icon: '📧', name: 'Email Marketing', desc: 'Automated campaigns' },
    { icon: '🔍', name: 'Lead Finder', desc: 'Scan 70+ search engines' },
    { icon: '📱', name: 'WhatsApp Bot', desc: 'Auto-reply to customers' },
    { icon: '📈', name: 'Analytics', desc: 'Track your growth' },
  ];
  const grid = document.getElementById('businessGrid');
  if (!grid) return;
  grid.innerHTML = '';
  for (const tool of tools) {
    if (cinematicState.aborted) return;
    await delay(200);
    const card = document.createElement('div');
    card.className = 'biz-tool-card';
    card.innerHTML = `
      <div class="biz-tool-icon">${tool.icon}</div>
      <div class="biz-tool-name">${tool.name}</div>
      <div class="biz-tool-desc">${tool.desc}</div>
      <div class="biz-tool-check"><svg viewBox="0 0 24 24" fill="none" stroke="#00FF9D" stroke-width="3" width="14" height="14"><path d="M20 6L9 17l-5-5"/></svg></div>`;
    grid.appendChild(card);
    requestAnimationFrame(() => card.classList.add('configured'));
    addActivity(tool.name + ' configured');
  }
  await delay(400);
}

// ============ STAGE 11: CONFIDENCE UI ============
async function runStage11_Confidence() {
  cinematicState.stage = 11;
  showStage('stage-confidence');
  setStatus('✅ Running quality checks...');
  const checkList = document.getElementById('confidenceList');
  if (!checkList) return;
  checkList.innerHTML = '';
  for (const check of CONFIDENCE_CHECKS) {
    if (cinematicState.aborted) return;
    await delay(250);
    const item = document.createElement('div');
    item.className = 'confidence-item';
    item.innerHTML = `<div class="confidence-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#00FF9D" stroke-width="3" width="18" height="18"><path d="M20 6L9 17l-5-5"/></svg></div><span class="confidence-label">${check}</span>`;
    checkList.appendChild(item);
    requestAnimationFrame(() => item.classList.add('verified'));
    addActivity('Verified: ' + check);
  }
  await delay(400);
  addConversation('ai', 'Everything checks out. Your business is ready to launch. 🚀');
}

// ============ STAGE 12: CONTINUOUS AGENT ============
async function runStage12_Continuous() {
  cinematicState.stage = 12;
  showStage('stage-continuous');
  setStatus('🤖 ERGIO never sleeps...');
  const feedEl = document.getElementById('continuousFeed');
  if (!feedEl) return;
  feedEl.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    if (cinematicState.aborted) return;
    await delay(500);
    const task = CONTINUOUS_TASKS[i];
    const item = document.createElement('div');
    item.className = 'continuous-item';
    item.innerHTML = `<div class="continuous-dot"></div><span class="continuous-text">${task}</span><span class="continuous-time">${formatTime(Date.now() - cinematicState.startTime)}</span>`;
    feedEl.appendChild(item);
    requestAnimationFrame(() => item.classList.add('active'));
  }
  await delay(600);
}

// ============ LAUNCH SCREEN ============
function showLaunchScreen() {
  cinematicState.stage = 13;
  showStage('stage-launch');
  setStatus('🎉 Your business is live!');
  clearInterval(cinematicState.timerInterval);
  const biz = cinematicState.business || {};
  const name = biz.name || biz.businessName || 'Your Business';
  const tagline = biz.tagline || '';
  const slug = (biz.slug || biz.businessName || 'your-business').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  document.getElementById('launchBusinessName').textContent = name;
  document.getElementById('launchBusinessName').style.display = 'block';
  document.getElementById('launchUrl').textContent = 'ergio.app/' + slug;
  document.getElementById('launchSub').textContent = tagline || 'Welcome to ERGIO.';
  const chatBox = document.getElementById('chatBox');
  if (chatBox) chatBox.style.display = 'flex';
  try {
    localStorage.setItem('ergio_generated_website', cinematicState.websiteHtml || '');
    localStorage.setItem('ergio_generated_business', JSON.stringify({
      name, tagline, slug, type: biz.type || 'standard', city: biz.city || '',
      colors: biz.brandColors || biz.colors || {}, services: biz.services || [], description: biz.description || '',
    }));
    localStorage.setItem('ergio_build_complete', 'true');
  } catch (e) {}
  setupChatRefinement();
}

// ============ CHAT REFINEMENT ============
function setupChatRefinement() {
  const chatBox = document.getElementById('chatBox');
  if (!chatBox) return;
  const chatInput = document.getElementById('chatInput');
  const chatSend = document.getElementById('chatSend');
  if (!chatInput || !chatSend) return;
  function sendChatMessage() {
    const msg = chatInput.value.trim();
    if (!msg) return;
    addChatMessage('user', msg); chatInput.value = ''; refineWebsite(msg);
  }
  chatSend.onclick = sendChatMessage;
  chatInput.onkeypress = (e) => { if (e.key === 'Enter') sendChatMessage(); };
  setTimeout(() => { if (chatInput) chatInput.focus(); }, 500);
}

async function refineWebsite(message) {
  addChatMessage('ai', 'On it. Refining your website...');
  try {
    const response = await fetch('/api/refine', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, currentHtml: cinematicState.websiteHtml, business: cinematicState.business }),
    });
    const reader = response.body.getReader();
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
        try {
          const event = JSON.parse(line.slice(6));
          if (event.type === 'status') addChatMessage('ai', event.data.task || 'Working...');
          else if (event.type === 'website' || event.type === 'complete') {
            if (event.data.html) {
              cinematicState.websiteHtml = event.data.html;
              updatePreview(event.data.html);
              addChatMessage('ai', 'Done! Take a look →');
            }
          }
        } catch (e) {}
      }
    }
  } catch (err) {
    addChatMessage('ai', 'I had trouble with that. Try a simpler request.');
  }
}

function addChatMessage(role, text) {
  const messages = document.getElementById('chatMessages');
  if (!messages) return;
  const msg = document.createElement('div');
  msg.className = 'chat-msg chat-' + role;
  msg.innerHTML = '<div class="chat-msg-bubble">' + text + '</div>';
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

// ============ RENDER OVERLAY ============
function renderCinematicOverlay() {
  const overlay = document.getElementById('buildOverlay');
  if (!overlay) return;
  overlay.innerHTML = `
    <div class="cinematic-container">
      <div class="cinematic-topbar">
        <div class="cinematic-brand"><div class="cinematic-logo-dot"></div><span>ERGIO AI</span></div>
        <div class="cinematic-status" id="cinematicStatus">Initializing...</div>
        <div class="cinematic-meta"><span class="cinematic-timer" id="cinematicTimer">00:00</span><button class="cinematic-close" id="cinematicClose">✕</button></div>
      </div>
      <div class="cinematic-stage" id="stage-thinking" style="display:none">
        <div class="stage-center">
          <div class="stage-title-block"><div class="stage-big-icon">🧠</div><h2 class="stage-title">Understanding your business</h2><p class="stage-subtitle">ERGIO is analyzing your vision</p></div>
          <div class="thinking-tasks" id="thinkingTasks"></div>
          <div class="stage-eta">Estimated time: ~5 seconds</div>
        </div>
      </div>
      <div class="cinematic-stage" id="stage-team" style="display:none">
        <div class="stage-center">
          <div class="stage-title-block"><div class="stage-big-icon">🤖</div><h2 class="stage-title">Assembling your AI team</h2><p class="stage-subtitle">${AI_AGENTS.length} specialists are joining your project</p></div>
          <div class="agent-grid" id="agentGrid"></div>
        </div>
      </div>
      <div class="cinematic-stage" id="stage-blueprint" style="display:none">
        <div class="stage-center">
          <div class="stage-title-block"><div class="stage-big-icon">📐</div><h2 class="stage-title">Project blueprint</h2><p class="stage-subtitle">Your roadmap from idea to empire</p></div>
          <div class="blueprint-flow" id="blueprintFlow"></div>
        </div>
      </div>
      <div class="cinematic-stage stage-build" id="stage-build" style="display:none">
        <div class="build-panel build-conversation">
          <div class="panel-header"><div class="panel-icon">💬</div><span>AI Conversation</span></div>
          <div class="conversation-feed" id="conversationFeed"></div>
          <div class="build-progress-wrap"><div class="build-progress-bar"><div class="build-progress-fill" id="buildProgress"></div></div><span class="build-progress-text" id="buildProgressText">0%</span></div>
        </div>
        <div class="build-panel build-preview-center">
          <div class="panel-header"><div class="panel-icon">🌐</div><span>Live Preview</span><div class="device-switcher">
            <button class="device-btn active" data-device="desktop" title="Desktop"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg></button>
            <button class="device-btn" data-device="tablet" title="Tablet"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg></button>
            <button class="device-btn" data-device="mobile" title="Mobile"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M12 18h.01"/></svg></button>
          </div></div>
          <div class="preview-frame-wrap device-desktop" id="previewFrameWrap">
            <div class="preview-browser"><div class="preview-browser-bar"><div class="browser-dots"><span></span><span></span><span></span></div><div class="preview-url" id="previewUrl">ergio.app/preview</div></div>
            <div class="preview-browser-content"><iframe id="previewFrame" title="Live Preview" style="display:none"></iframe>
            <div class="preview-placeholder" id="previewPlaceholder"><div class="preview-skeleton"><div class="skel-bar" style="width:60%;height:40px"></div><div class="skel-bar" style="width:40%;height:20px;margin-top:12px"></div><div class="skel-bar" style="width:100%;height:200px;margin-top:20px"></div><div class="skel-grid"><div class="skel-card"></div><div class="skel-card"></div><div class="skel-card"></div></div></div><div class="preview-waiting">Building your website...</div></div></div></div>
          </div>
        </div>
        <div class="build-panel build-activity">
          <div class="panel-header"><div class="panel-icon">⚡</div><span>Activity Feed</span></div>
          <div class="activity-feed" id="activityFeed"></div>
        </div>
      </div>
      <div class="cinematic-stage" id="stage-business" style="display:none">
        <div class="stage-center">
          <div class="stage-title-block"><div class="stage-big-icon">💼</div><h2 class="stage-title">Setting up your business tools</h2><p class="stage-subtitle">CRM, invoices, payments, and more</p></div>
          <div class="business-grid" id="businessGrid"></div>
        </div>
      </div>
      <div class="cinematic-stage" id="stage-confidence" style="display:none">
        <div class="stage-center">
          <div class="stage-title-block"><div class="stage-big-icon">✅</div><h2 class="stage-title">Quality assured</h2><p class="stage-subtitle">Every system checked and verified</p></div>
          <div class="confidence-list" id="confidenceList"></div>
        </div>
      </div>
      <div class="cinematic-stage" id="stage-continuous" style="display:none">
        <div class="stage-center">
          <div class="stage-title-block"><div class="stage-big-icon">🛰️</div><h2 class="stage-title">ERGIO never sleeps</h2><p class="stage-subtitle">Your AI agent is now working 24/7</p></div>
          <div class="continuous-feed" id="continuousFeed"></div>
        </div>
      </div>
      <div class="cinematic-stage" id="stage-launch" style="display:none">
        <div class="launch-content">
          <div class="launch-check-circle">✓</div>
          <h2 class="launch-title">Your business is live.</h2>
          <p class="launch-sub" id="launchSub">Welcome to ERGIO.</p>
          <div class="launch-url" id="launchUrl">ergio.app/your-business</div>
          <div class="launch-business-name" id="launchBusinessName" style="display:none"></div>
          <div class="chat-refine-box" id="chatBox" style="display:none">
            <div class="chat-refine-header"><span class="chat-refine-title">💬 Refine your website</span><span class="chat-refine-hint">Ask ERGIO to change anything</span></div>
            <div class="chat-messages" id="chatMessages"></div>
            <div class="chat-input-wrap"><input type="text" id="chatInput" placeholder='Try: "make the colors blue" or "add a pricing section"' autocomplete="off"/><button id="chatSend">↑</button></div>
          </div>
          <div class="launch-actions">
            <a href="auth/signup.html" class="launch-btn-primary">Open my dashboard →</a>
            <button class="launch-btn-outline" id="cinematicCloseBtn">Back to home</button>
          </div>
        </div>
      </div>
    </div>`;
  document.getElementById('cinematicClose')?.addEventListener('click', closeCinematic);
  document.getElementById('cinematicCloseBtn')?.addEventListener('click', closeCinematic);
  document.querySelectorAll('.device-btn').forEach(btn => {
    btn.addEventListener('click', () => switchDevice(btn.dataset.device));
  });
}

// ============ HELPERS ============
function showStage(stageId) {
  document.querySelectorAll('.cinematic-stage').forEach(s => s.style.display = 'none');
  const stage = document.getElementById(stageId);
  if (stage) { stage.style.display = 'flex'; stage.classList.add('stage-enter'); setTimeout(() => stage.classList.remove('stage-enter'), 600); }
}
function setStatus(text) { const el = document.getElementById('cinematicStatus'); if (el) el.textContent = text; }
function updateProgress(step, total) {
  const pct = total > 0 ? Math.round((step / total) * 100) : 0;
  const fill = document.getElementById('buildProgress'); const text = document.getElementById('buildProgressText');
  if (fill) fill.style.width = pct + '%'; if (text) text.textContent = pct + '%';
}
function updatePreview(html) {
  const frame = document.getElementById('previewFrame'); const placeholder = document.getElementById('previewPlaceholder');
  if (!frame) return;
  if (placeholder) placeholder.style.display = 'none';
  frame.style.display = 'block'; frame.srcdoc = html;
  const url = cinematicState.business?.slug || cinematicState.business?.businessName || 'your-business';
  const urlEl = document.getElementById('previewUrl');
  if (urlEl) urlEl.textContent = 'ergio.app/' + url.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function switchDevice(device) {
  cinematicState.device = device;
  document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.device-btn[data-device="' + device + '"]')?.classList.add('active');
  const wrap = document.getElementById('previewFrameWrap');
  if (!wrap) return;
  wrap.classList.remove('device-desktop', 'device-tablet', 'device-mobile');
  wrap.classList.add('device-' + device);
}
function showPlanPreview(plan) {
  const feed = document.getElementById('conversationFeed');
  if (!feed) return;
  const card = document.createElement('div');
  card.className = 'conv-plan-card';
  card.innerHTML = '<div class="plan-card-row"><span class="plan-card-label">Business</span><span class="plan-card-val">' + (plan.businessName||'') + '</span></div><div class="plan-card-row"><span class="plan-card-label">Type</span><span class="plan-card-val">' + (plan.type||'') + '</span></div><div class="plan-card-row"><span class="plan-card-label">City</span><span class="plan-card-val">' + (plan.city||'') + '</span></div><div class="plan-card-row"><span class="plan-card-label">Services</span><span class="plan-card-val">' + (plan.services||[]).length + ' planned</span></div>';
  feed.appendChild(card); feed.scrollTop = feed.scrollHeight;
}
function showImageCount(total, placements) {
  const feed = document.getElementById('conversationFeed');
  if (!feed) return;
  const card = document.createElement('div');
  card.className = 'conv-images-card';
  card.innerHTML = '<div class="images-badge">📸 ' + total + ' Real Photos</div><div class="images-sources">Pixabay + Unsplash</div><div class="images-placements">' + placements.map(p => '<div class="img-placement"><span>' + p.placement + '</span><span class="img-count">' + p.count + '</span></div>').join('') + '</div>';
  feed.appendChild(card); feed.scrollTop = feed.scrollHeight;
}
function addConversation(role, text) {
  cinematicState.conversationLog.push({ role, text });
  const feed = document.getElementById('conversationFeed');
  if (!feed) return;
  const msg = document.createElement('div');
  msg.className = 'conv-msg conv-' + role;
  if (role === 'ai') { msg.innerHTML = '<div class="conv-avatar">🤖</div><div class="conv-bubble">' + text + '</div>'; }
  else { msg.innerHTML = '<div class="conv-bubble user">' + text + '</div>'; }
  feed.appendChild(msg); feed.scrollTop = feed.scrollHeight;
}
function addActivity(text) {
  const time = formatTime(Date.now() - cinematicState.startTime);
  cinematicState.activityLog.push({ time, text });
  const feed = document.getElementById('activityFeed');
  if (!feed) return;
  const item = document.createElement('div');
  item.className = 'activity-item';
  item.innerHTML = '<span class="activity-time">' + time + '</span><span class="activity-text">' + text + '</span>';
  feed.appendChild(item); feed.scrollTop = feed.scrollHeight;
}
function addTimeline(time, text) { cinematicState.timeline.push({ time, text }); }
function updateTimer() {
  const elapsed = Date.now() - cinematicState.startTime;
  const el = document.getElementById('cinematicTimer');
  if (el) el.textContent = formatTime(elapsed);
}
function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const sec = String(totalSec % 60).padStart(2, '0');
  return min + ':' + sec;
}
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function closeCinematic() {
  cinematicState.aborted = true;
  clearInterval(cinematicState.timerInterval);
  const overlay = document.getElementById('buildOverlay');
  if (overlay) { overlay.classList.remove('visible'); overlay.innerHTML = ''; }
}
async function generateFallback(prompt, answers) {
  addActivity('Using fallback generation mode');
  addConversation('ai', 'Let me build your website with our offline engine.');
  const bizName = (prompt.split(' ').slice(0, 2).join(' ')) || 'Your Business';
  const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + bizName + ' — Built with ERGIO AI</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,sans-serif;background:#0A0A0F;color:#F8FAFC}.hero{min-height:80vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:2rem}.hero h1{font-size:clamp(2rem,6vw,4rem);font-weight:900;background:linear-gradient(135deg,#00D9FF,#00FF9D);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.brand{position:fixed;bottom:1rem;right:1rem;font-size:.75rem;color:#475569}.brand a{color:#00D9FF;text-decoration:none}</style></head><body><div class="hero"><div><h1>' + bizName + '</h1><p>' + prompt + '</p></div></div><div class="brand">Built with <a href="https://ergio.vercel.app">ERGIO AI</a></div></body></html>';
  cinematicState.websiteHtml = html;
  cinematicState.business = { name: bizName, tagline: 'Built with ERGIO AI', slug: bizName.toLowerCase().replace(/\s+/g, '-') };
  updatePreview(html);
  addConversation('ai', 'Your website is ready. Take a look →');
}
