/**
 * ERGIO AI Chatbot Widget
 * Embeddable widget for generated business websites
 * Powered by Groq (free tier) + fallback to Pollinations
 * 
 * Usage: <script src="https://ergio.app/widget/chatbot.js" data-business="BUSINESS_ID"></script>
 */

(function() {
  const script = document.currentScript;
  const businessId = script?.dataset?.business || 'demo';
  const apiBase = script?.dataset?.api || 'https://ergio.app';
  
  // Create widget container
  const widget = document.createElement('div');
  widget.id = 'ergio-chatbot';
  widget.innerHTML = `
    <style>
      #ergio-chatbot{position:fixed;bottom:20px;right:20px;z-index:99999;font-family:'Inter',system-ui,sans-serif}
      #ergio-chat-toggle{width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#00D9FF,#00FF9D);border:none;cursor:pointer;box-shadow:0 8px 24px rgba(0,217,255,.4);display:flex;align-items:center;justify-content:center;transition:transform .3s}
      #ergio-chat-toggle:hover{transform:scale(1.05)}
      #ergio-chat-toggle svg{width:28px;height:28px;color:#09090B}
      #ergio-chat-window{position:absolute;bottom:80px;right:0;width:360px;max-width:calc(100vw - 40px);height:500px;max-height:calc(100vh - 120px);background:#0a0a0f;border:1px solid rgba(255,255,255,.08);border-radius:20px;overflow:hidden;display:none;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.5)}
      #ergio-chat-window.open{display:flex;animation:ergioSlideUp .3s ease}
      @keyframes ergioSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      .ergio-chat-header{padding:1rem;background:linear-gradient(135deg,rgba(0,217,255,.1),rgba(0,255,157,.05));border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;gap:.6rem}
      .ergio-chat-avatar{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#00D9FF,#00FF9D);display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:700;color:#09090B}
      .ergio-chat-title{flex:1}
      .ergio-chat-title h4{color:#F8FAFC;font-size:.95rem;font-weight:700;margin:0}
      .ergio-chat-status{color:#00FF9D;font-size:.75rem;display:flex;align-items:center;gap:.3rem}
      .ergio-chat-status::before{content:'';width:6px;height:6px;border-radius:50%;background:#00FF9D;animation:ergioPulse 2s infinite}
      @keyframes ergioPulse{0%,100%{opacity:1}50%{opacity:.3}}
      .ergio-chat-close{background:none;border:none;color:#94A3B8;cursor:pointer;font-size:1.2rem;padding:.2rem .4rem;border-radius:8px}
      .ergio-chat-close:hover{background:rgba(255,255,255,.05);color:#F8FAFC}
      .ergio-chat-messages{flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:.6rem}
      .ergio-msg{max-width:80%;padding:.7rem 1rem;border-radius:14px;font-size:.88rem;line-height:1.4}
      .ergio-msg.bot{background:rgba(255,255,255,.04);color:#F8FAFC;border:1px solid rgba(255,255,255,.06);align-self:flex-start;border-bottom-left-radius:4px}
      .ergio-msg.user{background:linear-gradient(135deg,#00D9FF,#00FF9D);color:#09090B;align-self:flex-end;border-bottom-right-radius:4px;font-weight:500}
      .ergio-typing{display:flex;gap:.3rem;padding:.7rem 1rem;align-self:flex-start}
      .ergio-typing span{width:8px;height:8px;border-radius:50%;background:#94A3B8;animation:ergioType 1.4s infinite}
      .ergio-typing span:nth-child(2){animation-delay:.2s}
      .ergio-typing span:nth-child(3){animation-delay:.4s}
      @keyframes ergioType{0%,60%,100%{opacity:.3;transform:scale(.8)}30%{opacity:1;transform:scale(1)}}
      .ergio-chat-input{padding:1rem;border-top:1px solid rgba(255,255,255,.08);display:flex;gap:.5rem}
      .ergio-input{flex:1;padding:.7rem .9rem;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;color:#F8FAFC;font-size:.88rem;outline:none;font-family:inherit}
      .ergio-input:focus{border-color:#00D9FF}
      .ergio-input::placeholder{color:#475569}
      .ergio-send{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#00D9FF,#00FF9D);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
      .ergio-send:hover{opacity:.9}
      .ergio-send svg{width:18px;height:18px;color:#09090B}
      .ergio-quick{display:flex;gap:.4rem;padding:0 1rem .5rem;flex-wrap:wrap}
      .ergio-quick-btn{padding:.4rem .8rem;background:rgba(0,217,255,.05);border:1px solid rgba(0,217,255,.15);border-radius:20px;color:#00D9FF;font-size:.78rem;cursor:pointer;transition:all .2s}
      .ergio-quick-btn:hover{background:rgba(0,217,255,.1)}
    </style>
    <button id="ergio-chat-toggle" onclick="document.getElementById('ergio-chat-window').classList.toggle('open')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    </button>
    <div id="ergio-chat-window">
      <div class="ergio-chat-header">
        <div class="ergio-chat-avatar">E</div>
        <div class="ergio-chat-title">
          <h4>ERGIO Assistant</h4>
          <div class="ergio-chat-status">Online • AI-powered</div>
        </div>
        <button class="ergio-chat-close" onclick="document.getElementById('ergio-chat-window').classList.remove('open')">×</button>
      </div>
      <div class="ergio-chat-messages" id="ergio-messages">
        <div class="ergio-msg bot">Hi! I'm the AI assistant for this business. How can I help you today?</div>
      </div>
      <div class="ergio-quick">
        <button class="ergio-quick-btn" onclick="ergioSendMsg('What services do you offer?')">Services</button>
        <button class="ergio-quick-btn" onclick="ergioSendMsg('What are your prices?')">Pricing</button>
        <button class="ergio-quick-btn" onclick="ergioSendMsg('How do I book?')">Book now</button>
      </div>
      <div class="ergio-chat-input">
        <input type="text" class="ergio-input" id="ergio-input" placeholder="Type a message..." onkeypress="if(event.key==='Enter')ergioSend()">
        <button class="ergio-send" onclick="ergioSend()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(widget);

  // Chat logic
  async function ergioSendMsg(msg) {
    const input = document.getElementById('ergio-input');
    if (!msg) msg = input.value.trim();
    if (!msg) return;
    input.value = '';

    // Add user message
    const msgs = document.getElementById('ergio-messages');
    const userDiv = document.createElement('div');
    userDiv.className = 'ergio-msg user';
    userDiv.textContent = msg;
    msgs.appendChild(userDiv);
    msgs.scrollTop = msgs.scrollHeight;

    // Show typing
    const typing = document.createElement('div');
    typing.className = 'ergio-typing';
    typing.id = 'ergio-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;

    try {
      // Try API first, fallback to Pollinations
      let response;
      try {
        const apiResp = await fetch(`${apiBase}/api/engines?action=jan-ai`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: msg,
            systemPrompt: 'You are a helpful AI assistant for a local business. Be friendly, concise, and helpful. Answer questions about services, pricing, and booking. Keep responses under 100 words.',
          }),
          signal: AbortSignal.timeout(10000),
        });
        if (apiResp.ok) {
          const data = await apiResp.json();
          response = data.content || data.message;
        }
      } catch (e) {}

      // Fallback to Pollinations free text API
      if (!response) {
        const pollResp = await fetch(`https://text.pollinations.ai/${encodeURIComponent('You are a helpful AI assistant for a local business. Be friendly and concise (under 100 words). Customer asks: ' + msg)}`);
        if (pollResp.ok) response = await pollResp.text();
      }

      // Remove typing
      document.getElementById('ergio-typing')?.remove();

      // Add bot response
      const botDiv = document.createElement('div');
      botDiv.className = 'ergio-msg bot';
      botDiv.textContent = response || 'Sorry, I could not process that. Please try again or contact us directly.';
      msgs.appendChild(botDiv);
      msgs.scrollTop = msgs.scrollHeight;
    } catch (err) {
      document.getElementById('ergio-typing')?.remove();
      const botDiv = document.createElement('div');
      botDiv.className = 'ergio-msg bot';
      botDiv.textContent = 'I am having trouble connecting. Please contact us directly via WhatsApp.';
      msgs.appendChild(botDiv);
      msgs.scrollTop = msgs.scrollHeight;
    }
  }

  window.ergioSend = ergioSendMsg;
  window.ergioSendMsg = ergioSendMsg;
})();
