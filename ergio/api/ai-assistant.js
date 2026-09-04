// ============================================================
// ERGIO AI Business Assistant — 24/7 business advisor
// Answers questions, drafts content, gives strategy advice
// Powered by Groq Llama 3.3 70B
// ============================================================

import { callGroq, callGroqFast, success, error, corsHeaders } from '../lib/ergio.js';

const ERGIO_SYSTEM = `You are ERGIO AI, a world-class business advisor specializing in Nigerian and African markets.
You help entrepreneurs build, grow, and scale their businesses. You know about:
- Nigerian business law, taxes (FIRS, VAT, income tax), and regulations
- Lagos, Abuja, Port Harcourt, Kano, and all major Nigerian cities
- African consumer behavior, payment methods (Paystack, Flutterwave, USSD)
- Social media marketing for Nigerian audiences (Instagram, Twitter/X, WhatsApp Business, TikTok)
- Local suppliers, wholesalers, and business networks in Nigeria
- Business registration (CAC), trademarks, and compliance
- Pricing strategies for the Nigerian market

Always:
- Be warm, practical, and actionable
- Give specific Nigerian naira figures when discussing money
- Reference real Nigerian platforms, tools, and resources
- Suggest WhatsApp Business strategies (huge in Nigeria)
- Be encouraging but honest about challenges

Never give legal or medical advice, but help with general business questions.`;

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return error(res, 'Use POST', 405);
  
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { message, history = [], businessContext = {}, stream = false } = body;
  
  if (!message) return error(res, 'Message required', 400);
  
  try {
    const isWebsiteChatbot = businessContext && businessContext.type === 'website_chatbot';
    const biz = businessContext.name || 'this business';
    const WEBSITE_ASSISTANT = `You are the friendly AI assistant FOR ${biz} — a real business. You live on their website and chat with visitors.
You answer as a member of the business team (say "we", never mention being an AI model or ERGIO).
You help visitors with: services offered, pricing (give general guidance if unsure, never invent exact figures — instead invite them to leave their email/phone for a quote), booking (point them to the booking form on the page), location & hours (check the page content if mentioned, else ask them to use the contact form), and general questions.
Keep replies short, warm and human — 1-3 sentences, use plain text, at most one emoji.
If a visitor shares their email or phone, thank them and confirm the business will follow up.
If you truly don't know something specific about ${biz}, say so honestly and invite them to use the contact/booking form so the team can respond.`;

    const messages = [
      { role: 'system', content: (isWebsiteChatbot ? WEBSITE_ASSISTANT : ERGIO_SYSTEM) + (businessContext.name && !isWebsiteChatbot ? `\n\nBusiness context: ${JSON.stringify(businessContext)}` : '') },
      ...history.slice(-10), // Last 10 messages for context
      { role: 'user', content: message }
    ];
    
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Stream response
      const bodyStream = await callGroq(messages, { temperature: 0.7, maxTokens: 1000, stream: true });
      
      if (bodyStream) {
        const reader = bodyStream.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') { res.write('data: [DONE]\n\n'); continue; }
              try {
                const parsed = JSON.parse(data);
                const token = parsed.choices?.[0]?.delta?.content || '';
                if (token) res.write(`data: ${JSON.stringify({ token })}\n\n`);
              } catch {}
            }
          }
        }
        res.end();
        return;
      }
    }
    
    // Non-streaming response
    const response = await callGroq(messages, { temperature: 0.7, maxTokens: 1000 });
    return success(res, { response, model: 'llama-3.3-70b' });
    
  } catch(e) {
    return error(res, e.message, 500);
  }
}
