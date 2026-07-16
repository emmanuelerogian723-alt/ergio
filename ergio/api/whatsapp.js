// ========================================
// ERGIO API — /api/whatsapp
// WhatsApp Bot: AI auto-reply for client inquiries
// Uses Groq to generate contextual responses
// ========================================

import { callGroq, callGroqFast, getSupabase, success, error, corsHeaders } from '../lib/ergio.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'POST') {
      // ============ WEBHOOK: Incoming WhatsApp message ============
      const { businessId, from, message, contactName } = req.body;

      if (!businessId || !message) return error(res, 'businessId and message required', 400);

      const supabase = getSupabase(req);

      // Get business info
      const { data: business } = await supabase.from('businesses')
        .select('*, services(*)').eq('id', businessId).single();

      if (!business) return error(res, 'Business not found', 404);

      // Check if conversation exists
      let { data: conversation } = await supabase.from('whatsapp_conversations')
        .select('*').eq('business_id', businessId).eq('client_phone', from).maybeSingle();

      // Generate AI response
      const systemPrompt = `You are the AI assistant for "${business.name}", a ${business.type} in ${business.city || 'Nigeria'}.

Business info:
- Description: ${business.description || ''}
- Phone: ${business.phone || 'N/A'}
- WhatsApp: ${business.whatsapp || 'N/A'}
- Email: ${business.email || 'N/A'}

Services:
${(business.services || []).map(s => `- ${s.name}: ₦${(s.price || 0).toLocaleString()} (${s.duration_minutes || 60} mins)`).join('\n')}

Rules:
1. Be friendly, professional, and helpful
2. Keep responses SHORT (WhatsApp style, under 100 words)
3. Answer questions about services, pricing, booking
4. If they want to book, ask for their preferred date and time
5. If you can't answer, say the business owner will get back to them
6. Use Nigerian English (can use "you" casually, keep it warm)
7. Never make up prices — use only what's listed above`;

      const userMessages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ];

      // Add conversation history if available
      if (conversation?.messages?.length > 0) {
        const history = conversation.messages.slice(-10).map(m => ({
          role: m.role === 'client' ? 'user' : 'assistant',
          content: m.text
        }));
        userMessages.splice(1, 0, ...history);
      }

      const aiResponse = await callGroqFast(userMessages, { temperature: 0.7, maxTokens: 200 });

      // Update conversation
      const newMessages = [
        ...(conversation?.messages || []),
        { role: 'client', text: message, time: new Date().toISOString() },
        { role: 'bot', text: aiResponse, time: new Date().toISOString() }
      ];

      if (conversation) {
        await supabase.from('whatsapp_conversations')
          .update({
            messages: newMessages,
            last_message_at: new Date().toISOString(),
            client_name: contactName || conversation.client_name
          })
          .eq('id', conversation.id);
      } else {
        await supabase.from('whatsapp_conversations').insert({
          business_id: businessId,
          client_phone: from,
          client_name: contactName || null,
          messages: newMessages,
          ai_enabled: true,
          last_message_at: new Date().toISOString()
        });
      }

      // Log analytics
      await supabase.from('analytics_events').insert({
        business_id: businessId,
        event_type: 'whatsapp_message',
        event_data: { from, message_preview: message.substring(0, 50) }
      });

      return success(res, {
        reply: aiResponse,
        shouldSend: true
      });
    }

    if (req.method === 'GET') {
      // Get conversations for a business
      const { businessId } = req.query;
      if (!businessId) return error(res, 'businessId required', 400);

      const supabase = getSupabase(req);
      const { data, error: dbErr } = await supabase.from('whatsapp_conversations')
        .select('*').eq('business_id', businessId).order('last_message_at', { ascending: false });

      if (dbErr) return error(res, dbErr.message, 500);

      return success(res, { conversations: data || [] });
    }

    return error(res, 'Method not allowed', 405);

  } catch (err) {
    return error(res, err.message, 500);
  }
}
