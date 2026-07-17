// ========================================
// ERGIO API — /api/agents (AGENTIC MODE)
// Autonomous AI Agents that collaborate to build & run businesses
// CEO Agent → Business Planner → Website Engineer → Backend Engineer → Frontend Engineer
// Each agent has specialized AI prompts and streams progress
// ========================================

import { callGroq, callGroqFast, success, error, corsHeaders, generateSlug, generateLogoUrl, getSupabase } from '../lib/ergio.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action || '';
  const body = req.body || {};

  // GET: List all available agents
  if (req.method === 'GET' && !action) {
    return res.status(200).json({
      name: 'ERGIO Agentic Mode',
      description: 'Autonomous AI agents that build and run your entire business',
      agents: [
        { id: 'ceo', name: 'CEO Agent', icon: '👑', role: 'Strategic decision maker', color: '#FFD700',
          capabilities: ['Business strategy', 'Market analysis', 'Resource allocation', 'Goal setting', 'Agent coordination'] },
        { id: 'planner', name: 'Business Planner', icon: '📋', role: 'Creates business plans & financial projections', color: '#00D9FF',
          capabilities: ['Business plan', 'Financial projections', 'SWOT analysis', 'Growth roadmap', 'Competitor analysis'] },
        { id: 'web-engineer', name: 'Website Engineer', icon: '🏗️', role: 'Builds production-ready websites', color: '#00FF9D',
          capabilities: ['Website generation', '3D websites', 'Template selection', 'Responsive design', 'SEO optimization'] },
        { id: 'backend', name: 'Backend Engineer', icon: '⚙️', role: 'Builds APIs, databases, payments', color: '#8B5CF6',
          capabilities: ['API design', 'Database schema', 'Payment gateway', 'CRM setup', 'Booking system'] },
        { id: 'frontend', name: 'Frontend Engineer', icon: '🎨', role: 'Creates beautiful UIs & branding', color: '#FF6B6B',
          capabilities: ['UI design', 'Dashboard creation', 'Animations', 'Branding', 'User flow optimization'] },
        { id: 'marketing', name: 'Marketing Agent', icon: '📣', role: 'Finds customers & creates campaigns', color: '#FF9500',
          capabilities: ['Lead generation', 'Cold email writing', 'Social media content', 'Ad copy', 'Customer acquisition'] },
        { id: 'ops', name: 'Operations Agent', icon: '🔄', role: 'Automates tasks & monitors analytics', color: '#2563FF',
          capabilities: ['Task automation', 'Analytics monitoring', 'Booking management', 'Invoice generation', 'Follow-ups'] }
      ],
      workflows: [
        { id: 'full-launch', name: 'Full Business Launch', agents: ['ceo','planner','web-engineer','backend','frontend','marketing','ops'], estimatedTime: '3-5 min' },
        { id: 'website-only', name: 'Website Build', agents: ['ceo','web-engineer','frontend'], estimatedTime: '1-2 min' },
        { id: 'marketing-sprint', name: 'Marketing Sprint', agents: ['ceo','marketing','ops'], estimatedTime: '30 sec' },
        { id: 'ops-setup', name: 'Operations Setup', agents: ['ceo','backend','ops'], estimatedTime: '1 min' }
      ]
    });
  }

  if (req.method !== 'POST') return error(res, 'Use GET or POST', 405);

  const { prompt, workflow, userId } = body;
  if (!prompt) return error(res, 'Business prompt is required', 400);

  const workflowId = workflow || 'full-launch';
  const agents = WORKFLOWS[workflowId] || WORKFLOWS['full-launch'];

  // SSE streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = (type, data) => res.write(`data: ${JSON.stringify({ type, data })}\n\n`);

  // Run agents in sequence
  if (agents.includes('ceo')) {
    send('agent_start', { agentId: 'ceo', agentName: 'CEO Agent', icon: '👑', task: 'Analyzing business vision...' });
    const ceoResult = await runCEOAgent(prompt, send);
    send('agent_done', { agentId: 'ceo', result: ceoResult });
  }

  if (agents.includes('planner')) {
    send('agent_start', { agentId: 'planner', agentName: 'Business Planner', icon: '📋', task: 'Creating business plan...' });
    const plan = await runPlannerAgent(prompt, send);
    send('agent_done', { agentId: 'planner', result: plan });
  }

  if (agents.includes('web-engineer')) {
    send('agent_start', { agentId: 'web-engineer', agentName: 'Website Engineer', icon: '🏗️', task: 'Designing website...' });
    const spec = await runWebEngineerAgent(prompt, send);
    send('agent_done', { agentId: 'web-engineer', result: spec });
  }

  if (agents.includes('backend')) {
    send('agent_start', { agentId: 'backend', agentName: 'Backend Engineer', icon: '⚙️', task: 'Building backend...' });
    const spec = await runBackendAgent(prompt, send);
    send('agent_done', { agentId: 'backend', result: spec });
  }

  if (agents.includes('frontend')) {
    send('agent_start', { agentId: 'frontend', agentName: 'Frontend Engineer', icon: '🎨', task: 'Creating brand & UI...' });
    const spec = await runFrontendAgent(prompt, send);
    send('agent_done', { agentId: 'frontend', result: spec });
  }

  if (agents.includes('marketing')) {
    send('agent_start', { agentId: 'marketing', agentName: 'Marketing Agent', icon: '📣', task: 'Finding customers...' });
    const plan = await runMarketingAgent(prompt, send);
    send('agent_done', { agentId: 'marketing', result: plan });
  }

  if (agents.includes('ops')) {
    send('agent_start', { agentId: 'ops', agentName: 'Operations Agent', icon: '🔄', task: 'Setting up automation...' });
    const plan = await runOpsAgent(prompt, send);
    send('agent_done', { agentId: 'ops', result: plan });
  }

  send('complete', { message: 'All agents completed!', workflow: workflowId, timestamp: new Date().toISOString() });
  res.end();
}

// ════════════════════════════════════════════
// AGENT IMPLEMENTATIONS
// ════════════════════════════════════════════

async function runCEOAgent(prompt, send) {
  send('agent_progress', { agentId: 'ceo', message: '🔍 Analyzing market opportunity...' });
  const result = await callGroq([
    { role: 'system', content: 'You are the ERGIO CEO Agent. Return ONLY valid JSON.' },
    { role: 'user', content: `Analyze this business idea for the African market: "${prompt}"
Return JSON: {"businessName":"name","tagline":"tagline","type":"type","industry":"industry","marketSize":"₦X","opportunity":"why good","competitiveAdvantage":"what wins","targetRevenue":"₦X/month","keyRisks":["r1"],"priority":"high","launchStrategy":"1-2 sentences"}` }
  ], { temperature: 0.8, response_format: { type: 'json_object' } });
  try { return JSON.parse(result); } catch(e) { return { businessName: 'New Venture' }; }
}

async function runPlannerAgent(prompt, send) {
  send('agent_progress', { agentId: 'planner', message: '📊 Building financial projections...' });
  const result = await callGroq([
    { role: 'system', content: 'You are the ERGIO Business Planner. Return ONLY valid JSON.' },
    { role: 'user', content: `Create a business plan for: "${prompt}"
Return JSON: {"executiveSummary":"2-3 sentences","services":[{"name":"S1","description":"desc","price":5000,"duration":30}],"revenueProjection":{"month1":0,"month3":0,"month6":0},"breakEvenPoint":"Month X","swot":{"strengths":["s"],"weaknesses":["w"],"opportunities":["o"],"threats":["t"]},"milestones":[{"month":1,"goal":"Launch"}],"brandColors":{"primary":"#00D9FF","secondary":"#00FF9D"},"city":"Lagos"}` }
  ], { temperature: 0.8, response_format: { type: 'json_object' } });
  try { return JSON.parse(result); } catch(e) { return {}; }
}

async function runWebEngineerAgent(prompt, send) {
  send('agent_progress', { agentId: 'web-engineer', message: '📐 Designing website structure...' });
  const result = await callGroq([
    { role: 'system', content: 'You are the ERGIO Website Engineer. Return ONLY valid JSON.' },
    { role: 'user', content: `Design website architecture for: "${prompt}"
Return JSON: {"websiteType":"standard","pages":[{"name":"Home","sections":["hero","services"],"purpose":"Convert"}],"features":["responsive","seo-optimized"],"integrations":["booking","payment","whatsapp"],"estimatedBuildTime":"2 min"}` }
  ], { temperature: 0.7, response_format: { type: 'json_object' } });
  try { return JSON.parse(result); } catch(e) { return { websiteType: 'standard' }; }
}

async function runBackendAgent(prompt, send) {
  send('agent_progress', { agentId: 'backend', message: '🔧 Designing API & database...' });
  const result = await callGroq([
    { role: 'system', content: 'You are the ERGIO Backend Engineer. Return ONLY valid JSON.' },
    { role: 'user', content: `Design backend for: "${prompt}"
Return JSON: {"database":{"tables":["businesses","bookings","leads"],"schema":"Supabase"},"apis":[{"endpoint":"/api/bookings","method":"POST","purpose":"Create booking"}],"integrations":[{"name":"Paystack","type":"payment","status":"ready"}],"automations":[{"trigger":"New booking","action":"Send confirmation"}],"security":"RLS + Firebase auth"}` }
  ], { temperature: 0.7, response_format: { type: 'json_object' } });
  try { return JSON.parse(result); } catch(e) { return {}; }
}

async function runFrontendAgent(prompt, send) {
  send('agent_progress', { agentId: 'frontend', message: '🎨 Creating brand identity...' });
  const result = await callGroq([
    { role: 'system', content: 'You are the ERGIO Frontend Engineer. Return ONLY valid JSON.' },
    { role: 'user', content: `Create brand identity for: "${prompt}"
Return JSON: {"brandName":"name","logoStyle":"modern minimal","colorPalette":{"primary":"#hex","secondary":"#hex","accent":"#hex","background":"#hex","text":"#hex"},"typography":{"heading":"Inter 800","body":"Inter 400"},"uiComponents":["hero","cards","pricing","booking"],"animations":["fade-in","hover-lift"],"mobileDesign":"Mobile-first responsive","accessibility":"WCAG AA"}` }
  ], { temperature: 0.7, response_format: { type: 'json_object' } });
  try { return JSON.parse(result); } catch(e) { return {}; }
}

async function runMarketingAgent(prompt, send) {
  send('agent_progress', { agentId: 'marketing', message: '🎯 Scanning for customers...' });
  const result = await callGroq([
    { role: 'system', content: 'You are the ERGIO Marketing Agent. Return ONLY valid JSON.' },
    { role: 'user', content: `Create marketing plan for: "${prompt}"
Return JSON: {"channels":["WhatsApp","Instagram","Google"],"socialContent":[{"platform":"Instagram","post":"caption","hashtags":["#tag"]}],"leadSources":[{"source":"Google","query":"search query"}],"outreachTemplates":{"coldEmail":"Subject...","whatsapp":"Hi..."},"adStrategy":"₦5k ads after 10 clients","referralProgram":"10% discount for referrals"}` }
  ], { temperature: 0.8, response_format: { type: 'json_object' } });
  try { return JSON.parse(result); } catch(e) { return {}; }
}

async function runOpsAgent(prompt, send) {
  send('agent_progress', { agentId: 'ops', message: '🔄 Setting up automation...' });
  const result = await callGroq([
    { role: 'system', content: 'You are the ERGIO Operations Agent. Return ONLY valid JSON.' },
    { role: 'user', content: `Set up operations for: "${prompt}"
Return JSON: {"automations":[{"id":1,"name":"Auto-respond to leads","trigger":"New lead","action":"AI response","active":true}],"integrations":{"whatsapp":"24/7 bot","email":"Resend","payments":"Paystack auto-invoice"},"monitoring":{"uptime":"99.9%","responseTime":"< 2s"},"tasks":[{"task":"Setup WhatsApp bot","priority":"high","status":"ready"}]}` }
  ], { temperature: 0.7, response_format: { type: 'json_object' } });
  try { return JSON.parse(result); } catch(e) { return {}; }
}

const WORKFLOWS = {
  'full-launch': ['ceo', 'planner', 'web-engineer', 'backend', 'frontend', 'marketing', 'ops'],
  'website-only': ['ceo', 'web-engineer', 'frontend'],
  'marketing-sprint': ['ceo', 'marketing', 'ops'],
  'ops-setup': ['ceo', 'backend', 'ops']
};
