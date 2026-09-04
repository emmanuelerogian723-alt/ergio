// ════════════════════════════════════════════════════════════
// ERGIO Site Features — universal injection for published sites
// Injected at serve-time by /api/site so EVERY published site gets:
//   1. Real AI chatbot (via /api/ai-assistant — multi-provider fallback)
//   2. Universal booking + contact capture → Supabase (bookings/leads) + owner email alert
// ════════════════════════════════════════════════════════════

const ERGIO_API_BASE = process.env.ERGIO_PUBLIC_URL || 'https://ergio.vercel.app';

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function buildSiteFeaturesScript() {
  return `<script id="ergio-features">
(function(){
  if (window.__ERGIO_FEATURES) return; window.__ERGIO_FEATURES = true;
  var API = '${ERGIO_API_BASE}';
  function meta(n){ var m = document.querySelector('meta[name="ergio-' + n + '"]'); return m ? m.content : ''; }
  var slug = meta('slug') || location.pathname.replace(/^\\/(s|site)\\//, '') || '';
  var ownerEmail = meta('owner-email') || '';
  var bizName = meta('business') || (document.title.split(/[\\u2014\\u2013\\-|]/)[0] || '').trim() || 'this business';
  var session = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  function post(payload){
    try {
      payload.businessSlug = slug; payload.businessName = bizName;
      payload.siteUrl = location.href; payload.ownerEmail = ownerEmail; payload.session = session;
      fetch(API + '/api/lead-capture', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) }).catch(function(){});
    } catch(e){}
  }

  function collectFields(root){
    var d = { name: '', email: '', phone: '', date: '', service: '', message: '' };
    if (!root) return d;
    var els = root.querySelectorAll('input,textarea,select');
    for (var i = 0; i < els.length; i++) {
      var el = els[i], v = (el.value || '').trim(); if (!v) continue;
      var p = ((el.placeholder || '') + ' ' + (el.name || '') + ' ' + (el.id || '')).toLowerCase();
      var t = (el.type || '').toLowerCase();
      if (t === 'email' || p.indexOf('email') > -1) d.email = v;
      else if (t === 'tel' || p.indexOf('phone') > -1 || p.indexOf('whatsapp') > -1) d.phone = v;
      else if (t === 'date' || p.indexOf('date') > -1 || p.indexOf('time') > -1) d.date = v;
      else if (el.tagName === 'TEXTAREA' || p.indexOf('message') > -1 || p.indexOf('notes') > -1 || p.indexOf('about') > -1) d.message = v;
      else if (el.tagName === 'SELECT' || p.indexOf('service') > -1) d.service = v;
      else if (p.indexOf('name') > -1 && !d.name) d.name = v;
      else if (!d.name) d.name = v;
    }
    return d;
  }

  /* capture ALL form submissions (capture phase — fires before inline handlers) */
  document.addEventListener('submit', function(e){
    try {
      var d = collectFields(e.target);
      d.type = 'contact';
      if (d.name || d.email || d.phone || d.message) post(d);
    } catch(err){}
  }, true);

  /* capture "Book / Confirm" button clicks in form-less layouts (legacy fake booking UI) */
  document.addEventListener('click', function(e){
    try {
      var el = e.target; while (el && el.tagName !== 'BUTTON') el = el.parentElement;
      if (!el) return;
      var t = (el.textContent || '').toLowerCase();
      if (!/(book|reserv|appoint|confirm|enquir)/.test(t)) return;
      if (el.__ergioDone) return; el.__ergioDone = true;
      var scope = el.closest('section') || el.parentElement || document.body;
      var d = collectFields(scope);
      d.type = 'booking';
      if (d.name || d.email || d.phone) {
        post(d);
        el.textContent = '\\u2713 Received \\u2014 we will contact you shortly';
        el.style.opacity = '0.75';
      }
    } catch(err){}
  }, true);

  /* REAL AI CHAT WIDGET */
  var old = document.getElementById('ergioChatWidget'); if (old) old.remove();
  var css = document.createElement('style'); css.textContent = '#ergioAiFab{position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#00d1ff,#007bff);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.5rem;cursor:pointer;box-shadow:0 4px 20px rgba(0,209,255,.4);z-index:99999;transition:transform .3s}#ergioAiFab:hover{transform:scale(1.08)}#ergioAiWin{position:fixed;bottom:92px;right:20px;width:360px;max-width:calc(100vw - 40px);height:480px;max-height:calc(100vh - 120px);background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.18);z-index:99999;display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,sans-serif}#ergioAiWin.ergio-open{display:flex}.ergio-ai-head{padding:14px 16px;background:linear-gradient(135deg,#00d1ff,#007bff);color:#fff;display:flex;align-items:center;gap:10px}.ergio-ai-head .av{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:1.2rem}.ergio-ai-head h4{margin:0;font-size:.95rem}.ergio-ai-head p{margin:0;font-size:.7rem;opacity:.9}.ergio-ai-msgs{flex:1;overflow-y:auto;padding:14px;background:#f6f8fa}.ergio-ai-msg{margin-bottom:10px;max-width:82%}.ergio-ai-msg.ai{margin-right:auto}.ergio-ai-msg.user{margin-left:auto;text-align:right}.ergio-ai-msg .b{display:inline-block;padding:10px 14px;border-radius:14px;font-size:.85rem;line-height:1.5;text-align:left;white-space:pre-wrap}.ergio-ai-msg.ai .b{background:#fff;border:1px solid #e2e6ea;border-bottom-left-radius:4px;color:#222}.ergio-ai-msg.user .b{background:#007bff;color:#fff;border-bottom-right-radius:4px}.ergio-ai-in{padding:10px;background:#fff;border-top:1px solid #e2e6ea;display:flex;gap:8px}.ergio-ai-in input{flex:1;padding:10px 14px;border:1px solid #e2e6ea;border-radius:20px;font-size:.85rem;outline:none}.ergio-ai-in button{width:40px;height:40px;border-radius:50%;background:#007bff;color:#fff;border:none;cursor:pointer;font-size:1rem}.ergio-typing{display:inline-block;padding:10px 14px;border-radius:14px;background:#fff;border:1px solid #e2e6ea}.ergio-typing span{display:inline-block;width:6px;height:6px;border-radius:50%;background:#999;margin:0 2px;animation:ergioBlink 1.4s infinite}.ergio-typing span:nth-child(2){animation-delay:.2s}.ergio-typing span:nth-child(3){animation-delay:.4s}@keyframes ergioBlink{0%,60%,100%{opacity:.3}30%{opacity:1}}';
  document.head.appendChild(css);

  var fab = document.createElement('div'); fab.id = 'ergioAiFab'; fab.textContent = '\\uD83D\\uDCAC';
  var win = document.createElement('div'); win.id = 'ergioAiWin';
  win.innerHTML = '<div class="ergio-ai-head"><div class="av">\\uD83E\\uDD16</div><div><h4></h4><p>AI-powered \\u2022 by ERGIO</p></div></div><div class="ergio-ai-msgs" id="ergioAiMsgs"></div><div class="ergio-ai-in"><input id="ergioAiInput" type="text" placeholder="Type your message..."><button id="ergioAiSend">\\u27A4</button></div>';
  win.querySelector('h4').textContent = bizName + ' Assistant';
  var msgs0 = document.getElementById('ergioAiMsgs');
  var greet = document.createElement('div'); greet.className = 'ergio-ai-msg ai';
  greet.innerHTML = '<div class="b">Hi! \\uD83D\\uDC4B I am the AI assistant for ' + '</div>';
  greet.querySelector('.b').textContent = 'Hi! \\uD83D\\uDC4B I am the AI assistant for ' + bizName + '. Ask me anything \\u2014 services, pricing, booking, location.';
  msgs0.appendChild(greet);
  document.body.appendChild(fab); document.body.appendChild(win);
  fab.onclick = function(){ win.classList.toggle('ergio-open'); };
  var input = document.getElementById('ergioAiInput');
  var msgs = document.getElementById('ergioAiMsgs');
  var hist = [];

  function addMsg(role, text){
    var d = document.createElement('div'); d.className = 'ergio-ai-msg ' + role;
    var b = document.createElement('div'); b.className = 'b'; b.textContent = text;
    d.appendChild(b); msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight;
  }
  function typing(on){
    var t = document.getElementById('ergioTyping');
    if (on && !t) { var d = document.createElement('div'); d.id = 'ergioTyping'; d.className = 'ergio-ai-msg ai'; d.innerHTML = '<div class="ergio-typing"><span></span><span></span><span></span></div>'; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; }
    if (!on && t) t.remove();
  }

  function fallbackReply(m){
    var ml = m.toLowerCase();
    var map = {
      price: 'You can find our pricing in the pricing section of this page \\u2014 or leave your email and we\\u2019ll send you a full quote.',
      hours: 'We\\u2019re open Monday to Saturday, 8am to 8pm.',
      location: 'We\\u2019re easy to find \\u2014 check the location section on this page for directions!',
      book: 'I\\u2019d love to help you book! Use the booking form on this page and we\\u2019ll confirm right away.',
      service: 'We offer a range of professional services \\u2014 tell me what you need and I\\u2019ll point you to the right one!',
      contact: 'You can reach us via the contact form on this page, by phone, or email.'
    };
    for (var k in map) if (ml.indexOf(k) > -1) return map[k];
    if (/^(hi|hello|hey)/.test(ml)) return 'Hello! \\uD83D\\uDC4B Welcome to ' + bizName + '! How can I help you today?';
    return 'Thanks for your message! A team member from ' + bizName + ' will get back to you shortly. Meanwhile, feel free to browse our services.';
  }

  function send(){
    var m = (input.value || '').trim(); if (!m) return;
    input.value = '';
    addMsg('user', m); typing(true);
    post({ type: 'chat', message: m });
    fetch(API + '/api/ai-assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: m, history: hist.slice(-10), businessContext: { name: bizName, website: location.href, type: 'website_chatbot' } })
    }).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){
      typing(false);
      var reply = (j && j.data && j.data.response) || (j && j.response) || fallbackReply(m);
      addMsg('ai', reply);
      hist.push({ role: 'user', content: m }, { role: 'assistant', content: reply });
    }).catch(function(){ typing(false); var fr = fallbackReply(m); addMsg('ai', fr); hist.push({ role: 'user', content: m }, { role: 'assistant', content: fr }); });
  }
  document.getElementById('ergioAiSend').onclick = send;
  input.addEventListener('keydown', function(e){ if (e.key === 'Enter') send(); });
})();
</script>`;
}

// Inject features into served HTML (idempotent)
function injectSiteFeatures(html, ctx = {}) {
  if (!html || typeof html !== 'string') return html;
  if (html.includes('ergio-features')) return html;

  let metaTags = '';
  if (ctx.slug) metaTags += '<meta name="ergio-slug" content="' + esc(ctx.slug) + '">';
  if (ctx.ownerEmail) metaTags += '<meta name="ergio-owner-email" content="' + esc(ctx.ownerEmail) + '">';
  if (ctx.businessName) metaTags += '<meta name="ergio-business" content="' + esc(ctx.businessName) + '">';

  const script = buildSiteFeaturesScript();
  if (metaTags) {
    if (/<\/head>/i.test(html)) html = html.replace(/<\/head>/i, metaTags + '</head>');
    else html = metaTags + html;
  }
  if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, script + '</body>');
  else html = html + script;
  return html;
}

export { buildSiteFeaturesScript, injectSiteFeatures };
export default { buildSiteFeaturesScript, injectSiteFeatures };
