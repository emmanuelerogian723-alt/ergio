// ============================================================
// ERGIO CRM — Client Relationship Management
// Track clients, deals, follow-ups, lifetime value
// ============================================================

import { getSupabase, callGroqFast, success, error, corsHeaders, generateSlug } from '../lib/ergio.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { action } = { ...req.query, ...body };
  const sb = getSupabase(req);
  
  try {
    // ── ADD CLIENT ──────────────────────────────────────────
    if (action === 'add_client' || (req.method === 'POST' && !action)) {
      const { name, email, phone, businessId, tags, notes, source } = body;
      if (!name) return error(res, 'Client name required', 400);
      
      const { data, error: e } = await sb.from('clients').insert({
        business_id: businessId,
        name, email, phone, tags, notes,
        source: source || 'manual',
        status: 'active',
        ltv: 0,
        created_at: new Date().toISOString()
      }).select().single();
      
      if (e) return error(res, e.message, 500);
      
      // AI-powered client insight
      let insight = '';
      try {
        const ai = await callGroqFast([
          {role:'system',content:'Return a brief, personalized client strategy tip as JSON: {tip, upsell, retention}'},
          {role:'user',content:`New client: ${name}, source: ${source}. What's the best first-contact strategy?`}
        ],{temperature:0.7,response_format:{type:'json_object'}});
        insight = JSON.parse(ai);
      } catch {}
      
      return success(res, { client: data, insight });
    }
    
    // ── LIST CLIENTS ─────────────────────────────────────────
    if (action === 'list' || req.method === 'GET') {
      const { businessId, status, search } = { ...req.query, ...body };
      let q = sb.from('clients').select('*').order('created_at', { ascending: false }).limit(100);
      if (businessId) q = q.eq('business_id', businessId);
      if (status) q = q.eq('status', status);
      if (search) q = q.ilike('name', `%${search}%`);
      const { data, error: e } = await q;
      if (e) return error(res, e.message, 500);
      return success(res, { clients: data, total: data.length });
    }
    
    // ── AI FOLLOW-UP MESSAGE ──────────────────────────────────
    if (action === 'followup') {
      const { clientName, lastService, daysSince, businessName, businessType } = body;
      const msg = await callGroqFast([
        {role:'system',content:'Write a friendly Nigerian WhatsApp follow-up message. Return JSON: {whatsapp, sms, email_subject, email_body}'},
        {role:'user',content:`Client: ${clientName}, last used: ${lastService}, ${daysSince} days ago. Business: ${businessName} (${businessType}). Write a warm follow-up to bring them back.`}
      ],{temperature:0.8,response_format:{type:'json_object'}});
      return success(res, JSON.parse(msg));
    }
    
    // ── PIPELINE/DEALS ────────────────────────────────────────
    if (action === 'add_deal') {
      const { clientId, businessId, title, value, stage, expectedClose } = body;
      const { data, error: e } = await sb.from('leads').insert({
        business_id: businessId,
        name: title || 'Deal',
        client_id: clientId,
        estimated_value: value,
        status: stage || 'prospect',
        expected_close: expectedClose,
        created_at: new Date().toISOString()
      }).select().single();
      if (e) return error(res, e.message, 500);
      return success(res, data);
    }
    
    return error(res, 'Unknown action. Use: add_client, list, followup, add_deal', 400);
  } catch(e) {
    return error(res, e.message, 500);
  }
}
