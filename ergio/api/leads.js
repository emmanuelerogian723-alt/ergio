// ========================================
// ERGIO API — /api/leads
// Lead Scanner: uses SearXNG (70+ search engines) + Cheerio scraper
// Finds potential clients across the internet who need the user's services
// ========================================

import { searxngSearch, scrapePage, callGroq, callGroqFast, success, error, corsHeaders } from '../lib/ergio.js';

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
      `I need ${businessType} in ${city}`,
      `looking for ${businessType} ${city} Nigeria`,
      `hire ${businessType} ${city}`,
      `${businessType} needed urgently ${city}`,
      `seeking ${businessType} services ${city} Nigeria`,
      `where can I find ${businessType} in ${city}`,
      `best ${businessType} ${city} Nigeria`,
      `${businessType} ${city} site:twitter.com OR site:nairaland.com OR site:jiji.com.ng`,
      `need ${businessType} ${city} site:facebook.com`,
      `${businessType} recommendation ${city} Nigeria`
    ];

    let allResults = [];

    for (const query of searchQueries) {
      send('status', { task: `Searching: "${query}"` });
      const results = await searxngSearch(query, { count: 15, language: 'en' });

      for (const result of results) {
        // Filter out irrelevant results
        if (result.url && !result.url.includes('youtube.com') &&
            !result.url.includes('facebook.com') &&
            !result.url.includes('instagram.com')) {
          allResults.push(result);
        }
      }

      if (allResults.length >= 30) break;
      await new Promise(r => setTimeout(r, 300));
    }

    send('search_complete', { totalResults: allResults.length });

    // ============ PHASE 2: SCRAPE & EXTRACT ============
    send('status', { task: 'Extracting contact information from results...' });

    const leads = [];
    const scrapeLimit = Math.min(allResults.length, 10);

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

        await new Promise(r => setTimeout(r, 200));
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
