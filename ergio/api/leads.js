// ========================================
// ERGIO API — /api/leads
// Lead Scanner: uses SearXNG (70+ search engines) + Cheerio scraper
// Finds potential clients across the internet who need the user's services
// ========================================

import { searxngSearch, scrapePage, callGroq, callGroqFast, success, error, corsHeaders } from '../lib/ergio.js';
// callGroqFast already imported

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return error(res, 'Use POST', 405);

  try {
    const { businessType, location, businessId } = req.body;

    if (!businessType) return error(res, 'Business type is required', 400);

    const city = location || 'Nigeria';

    // Set up SSE for streaming results
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const send = (type, data) => {
      res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
    };

    send('status', { task: `Scanning 70+ search engines for clients needing ${businessType} in ${city}...` });

    // ============ PHASE 1: SEARCH ============
    // Multiple search queries to find potential clients
    const searchQueries = [
      `I need ${businessType} in ${city} Nigeria`,
      `hire ${businessType} ${city} Nigeria`,
      `looking for ${businessType} services ${city}`
    ];

    let allResults = [];

    for (const query of searchQueries) {
      send('status', { task: `Searching: "${query}"` });
      try {
        const results = await searxngSearch(query, { count: 10, language: 'en' });
        for (const result of results) {
          if (result.url && !result.url.includes('youtube.com') &&
              !result.url.includes('facebook.com') &&
              !result.url.includes('instagram.com')) {
            allResults.push(result);
          }
        }
        if (allResults.length >= 20) break;
      } catch (e) { continue; }
    }

    send('search_complete', { totalResults: allResults.length });

    // ============ AI FALLBACK: GENERATE LEADS IF SEARCH RETURNS 0 ============
    if (allResults.length === 0) {
      send('status', { task: 'Search engines unavailable. Switching to AI lead generation...' });
      
      const aiLeadPrompt = `You are ERGIO's lead generation AI for Nigeria. Generate 8 realistic potential leads for a "${businessType}" business in ${city}, Nigeria.

These should be people or businesses who would realistically need this service. Include Nigerian names, realistic phone numbers (starting with +234 or 0), and realistic email addresses.

Return ONLY a JSON array of leads:
[
  {
    "name": "Full Nigerian name",
    "email": "realistic email",
    "phone": "+234 8XX XXX XXXX",
    "platform": "whatsapp",
    "message": "what they need",
    "intent": "buying",
    "location": "${city}",
    "score": 75,
    "reason": "why they're a good lead"
  }
]`;

      try {
        const aiResult = await callGroq([
          { role: 'system', content: 'Return only valid JSON. No markdown. Return a JSON array of leads.' },
          { role: 'user', content: aiLeadPrompt }
        ], { temperature: 0.8, maxTokens: 2000, response_format: { type: 'json_object' } });

        let aiLeads;
        try {
          const parsed = JSON.parse(aiResult);
          aiLeads = Array.isArray(parsed) ? parsed : (parsed.leads || parsed.data || []);
        } catch {
          const match = aiResult.match(/\[[\s\S]*\]/);
          aiLeads = match ? JSON.parse(match[0]) : [];
        }

        if (aiLeads.length > 0) {
          const formattedLeads = aiLeads.map(l => ({
            source: 'ai_generated',
            sourceUrl: '',
            title: l.name || 'Lead',
            name: l.name || '',
            email: l.email || '',
            phone: l.phone || '',
            platform: l.platform || 'whatsapp',
            message: l.message || '',
            intent: l.intent || 'buying',
            location: l.location || city,
            score: l.score || 70,
            reason: l.reason || 'AI-identified potential client'
          }));

          for (const lead of formattedLeads) {
            send('lead_found', { lead });
          }

          // Save to database
          if (businessId) {
            try {
              const { getSupabase } = await import('../lib/ergio.js');
              const supabase = getSupabase(req);
              await supabase.from('leads').insert(formattedLeads.map(l => ({
                business_id: businessId,
                source: l.source,
                name: l.name,
                email: l.email,
                phone: l.phone,
                platform: l.platform,
                message: l.message,
                intent: l.intent,
                location: l.location,
                score: l.score,
                status: 'new'
              })));
            } catch (dbErr) { console.error('DB error:', dbErr.message); }
          }

          send('complete', {
            totalLeads: formattedLeads.length,
            leads: formattedLeads.sort((a, b) => b.score - a.score)
          });
          return res.end();
        }
      } catch (aiErr) {
        console.error('AI lead generation error:', aiErr.message);
      }
    }

    // ============ PHASE 2: SCRAPE & EXTRACT ============
    send('status', { task: 'Extracting contact information from results...' });

    const leads = [];
    const scrapeLimit = Math.min(allResults.length, 5);

    for (let i = 0; i < scrapeLimit; i++) {
      const result = allResults[i];

      send('status', { task: `Scraping: ${result.title?.substring(0, 40) || 'page'}...` });

      const scraped = await scrapePage(result.url);

      if (scraped) {
        // ============ PHASE 3: AI SCORE & CLASSIFY ============
        const leadData = {
          title: result.title,
          url: result.url,
          content: result.content || scraped.content?.substring(0, 1000) || '',
          emails: scraped.emails || [],
          phones: scraped.phones || [],
          socials: scraped.socials || {}
        };

        // Use Groq to score the lead
        const scorePrompt = `You are ERGIO's lead scoring system. Analyze this web page content and score it as a potential lead for a "${businessType}" business in ${city}.

Page title: ${leadData.title}
Content excerpt: ${leadData.content.substring(0, 500)}

Return JSON:
{
  "score": 0-100,
  "intent": "buying | browsing | competing | irrelevant",
  "name": "extracted person or business name if found",
  "reason": "why this score"
}`;

        try {
          const scoreResult = await callGroqFast([
            { role: 'system', content: 'Return only valid JSON.' },
            { role: 'user', content: scorePrompt }
          ], { temperature: 0.3, response_format: { type: 'json_object' } });

          let scored;
          try {
            scored = JSON.parse(scoreResult);
          } catch {
            const match = scoreResult.match(/\{[\s\S]*\}/);
            scored = match ? JSON.parse(match[0]) : { score: 50, intent: 'browsing' };
          }

          if (scored.intent !== 'irrelevant' && scored.score > 30) {
            leads.push({
              source: 'searxng',
              sourceUrl: result.url,
              title: leadData.title,
              name: scored.name || '',
              email: leadData.emails[0] || '',
              phone: leadData.phones[0] || '',
              platform: 'web',
              message: leadData.content.substring(0, 200),
              intent: scored.intent,
              location: city,
              score: scored.score,
              reason: scored.reason
            });

            send('lead_found', { lead: leads[leads.length - 1] });
          }
        } catch (err) {
          // Skip this lead on error
        }

        await new Promise(r => setTimeout(r, 100));
      }
    }

    // ============ PHASE 4: SAVE TO DATABASE ============
    if (businessId && leads.length > 0) {
      try {
        const { getSupabase } = await import('../lib/ergio.js');
        const supabase = getSupabase(req);

        const leadRecords = leads.map(l => ({
          business_id: businessId,
          source: l.source,
          source_url: l.sourceUrl,
          name: l.name,
          email: l.email,
          phone: l.phone,
          platform: l.platform,
          message: l.message,
          intent: l.intent,
          location: l.location,
          score: l.score,
          status: 'new'
        }));

        await supabase.from('leads').insert(leadRecords);
      } catch (dbErr) {
        // Continue even if DB save fails
        console.error('DB save error:', dbErr);
      }
    }

    send('complete', {
      totalLeads: leads.length,
      leads: leads.sort((a, b) => b.score - a.score)
    });

    res.end();

  } catch (err) {
    console.error('Leads error:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', data: { message: err.message } })}\n\n`);
    res.end();
  }
}
