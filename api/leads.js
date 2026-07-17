// ===== ERGIO ENGINE 1 + 2: Lead Generation =====
// Local Discovery SEO + Demand Matching
import { callGroqFast, success, error, corsHeaders, getSupabase } from '../lib/ergio.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { businessName, businessType, city, services, action } = req.body || {};
  
  try {
    if (action === 'find_leads') {
      // Use Groq to simulate lead discovery
      const leadsPrompt = `Generate 8 realistic potential client leads for a ${businessType} business called "${businessName}" in ${city || 'Lagos'}, Nigeria.

Services offered: ${(services || []).map(s => s.name).join(', ')}

Return JSON array with format:
[{
  "name": "Full Nigerian name",
  "source": "Instagram DM" | "Google Search" | "WhatsApp Group" | "Referral" | "Directory",
  "intent": "high" | "medium" | "low",
  "budget": "₦5,000-15,000",
  "notes": "What they are looking for",
  "phone": "+234 8XX XXX XXXX",
  "location": "Area in ${city || 'Lagos'}",
  "status": "new"
}]`;

      const result = await callGroqFast([
        { role: 'system', content: 'You are ERGIO lead gen AI. Return only valid JSON array.' },
        { role: 'user', content: leadsPrompt }
      ], { response_format: { type: 'json_object' } });

      let leads;
      try {
        const parsed = JSON.parse(result);
        leads = Array.isArray(parsed) ? parsed : (parsed.leads || parsed.data || []);
      } catch {
        leads = [];
      }

      // Save leads to Supabase
      try {
        const supabase = getSupabase(req);
        for (const lead of leads) {
          await supabase.from('leads').upsert({
            business_name: businessName,
            lead_name: lead.name,
            source: lead.source,
            intent: lead.intent,
            budget: lead.budget,
            notes: lead.notes,
            phone: lead.phone,
            location: lead.location,
            status: lead.status || 'new',
            created_date: new Date().toISOString()
          });
        }
      } catch (dbErr) { console.error('DB error:', dbErr.message); }

      return success(res, { leads, count: leads.length, message: `Found ${leads.length} potential clients` });
    }

    if (action === 'demand_match') {
      // Match available time slots with demand
      const matchPrompt = `Analyze demand for a ${businessType} in ${city || 'Lagos'} Nigeria and generate 5 demand matching opportunities.
Return JSON: { "matches": [{ "service": "service name", "demand_level": "high|medium", "peak_times": "e.g. Weekends 10am-4pm", "price_suggestion": "₦X,XXX", "client_count": 12 }] }`;

      const result = await callGroqFast([
        { role: 'system', content: 'Return only valid JSON.' },
        { role: 'user', content: matchPrompt }
      ], { response_format: { type: 'json_object' } });

      const data = JSON.parse(result);
      return success(res, data);
    }

    if (action === 'seo_keywords') {
      const seoPrompt = `Generate 15 SEO keywords for a ${businessType} business in ${city || 'Lagos'}, Nigeria.
Return JSON: { "keywords": [{ "keyword": "text", "monthly_searches": "estimated", "competition": "low|medium|high", "intent": "commercial" }] }`;

      const result = await callGroqFast([
        { role: 'system', content: 'Return only valid JSON.' },
        { role: 'user', content: seoPrompt }
      ], { response_format: { type: 'json_object' } });

      const data = JSON.parse(result);
      return success(res, data);
    }

    return error(res, 'Unknown action. Use: find_leads, demand_match, seo_keywords');
  } catch (err) {
    console.error('Leads error:', err);
    return error(res, err.message);
  }
}
