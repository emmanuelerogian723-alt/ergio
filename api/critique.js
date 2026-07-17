// ========================================
// ERGIO API — /api/critique (AI Website Critique Engine)
// Paste any URL — AI analyzes it and gives actionable improvements
// ========================================

async function fetchWithTimeout(url, ms = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' } });
  } finally {
    clearTimeout(timer);
  }
}

async function getAICompletion(prompt, systemPrompt) {
  const key = process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;
  const isGroq = !!process.env.GROQ_API_KEY;
  
  if (!key) return null;
  
  try {
    const endpoint = isGroq
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://openrouter.ai/api/v1/chat/completions';
    
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        ...(isGroq ? {} : { 'HTTP-Referer': 'https://ergio.vercel.app', 'X-Title': 'ERGIO' })
      },
      body: JSON.stringify({
        model: isGroq ? 'llama-3.3-70b-versatile' : 'meta-llama/llama-3.1-70b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1200
      })
    });
    
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const params = url.searchParams;

  let targetUrl, businessName;
  if (req.method === 'GET') {
    targetUrl = params.get('url');
    businessName = params.get('name') || '';
  } else if (req.method === 'POST') {
    let body = {};
    try { body = JSON.parse(req.body || '{}'); } catch {}
    targetUrl = body.url;
    businessName = body.name || '';
  }

  if (!targetUrl) {
    return res.status(400).json({ success: false, error: 'URL is required (e.g. ?url=https://example.com)' });
  }

  // Normalize URL
  if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;

  try {
    // Step 1: Fetch the page
    const response = await fetchWithTimeout(targetUrl, 8000);
    if (!response.ok) {
      return res.status(400).json({ success: false, error: `Could not fetch website (status ${response.status})` });
    }
    
    const html = await response.text();
    const contentType = response.headers.get('content-type') || '';
    const pageUrl = response.url;

    // Step 2: Extract page metadata
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
    const title = titleMatch ? titleMatch[1].trim() : '';

    const descMatch = html.match(/<meta[^>]+name=["']description["']\s+content=["']([^"']+)["']/is);
    const metaDesc = descMatch ? descMatch[1].trim() : '';

    const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gis) || [];
    const h1s = h1Matches.map(h => h.replace(/<[^>]+>/g, '').trim()).filter(Boolean);

    const h2Matches = html.match(/<h2[^>]*>(.*?)<\/h2>/gis) || [];
    const h2s = h2Matches.map(h => h.replace(/<[^>]+>/g, '').trim()).filter(Boolean).slice(0, 5);

    const imgCount = (html.match(/<img/gi) || []).length;
    const linkCount = (html.match(/<a\s/gi) || []).length;
    const scriptCount = (html.match(/<script/gi) || []).length;
    const hasViewport = /viewport/i.test(html);
    const hasOpenGraph = /og:image|og:title|og:description/i.test(html);
    const hasFavicon = /favicon|rel=["']icon/i.test(html);
    const hasAnalytics = /google-analytics|gtag|ga\(|fbq\(|hotjar/i.test(html);
    const hasWhatsApp = /whatsapp/i.test(html);
    const hasContactForm = /<form/i.test(html) && /contact|message|submit/i.test(html);
    const hasSocialLinks = /facebook\.com|instagram\.com|twitter\.com|linkedin\.com|tiktok\.com/i.test(html);
    const hasSSL = targetUrl.startsWith('https');
    const htmlSize = html.length;
    const loadTime = Math.round(htmlSize / 1024); // rough KB estimate

    // Extract colors used
    const colorMatches = html.match(/#[0-9a-fA-F]{6}/g) || [];
    const uniqueColors = [...new Set(colorMatches)].slice(0, 8);

    // Extract first paragraph text
    const pMatches = html.match(/<p[^>]*>(.*?)<\/p>/gis) || [];
    const firstText = pMatches.map(p => p.replace(/<[^>]+>/g, '').trim()).filter(Boolean).slice(0, 3).join(' ');

    // Step 3: Score the website
    const scores = {
      seo: 0,
      design: 0,
      performance: 0,
      mobile: 0,
      content: 0,
      marketing: 0
    };

    // SEO scoring
    if (title && title.length > 10 && title.length < 60) scores.seo += 25;
    else if (title) scores.seo += 10;
    if (metaDesc && metaDesc.length > 50) scores.seo += 25;
    if (hasOpenGraph) scores.seo += 20;
    if (h1s.length === 1) scores.seo += 15;
    if (h2s.length >= 2) scores.seo += 15;
    scores.seo = Math.min(scores.seo, 100);

    // Design scoring
    if (uniqueColors.length >= 2 && uniqueColors.length <= 5) scores.design += 30;
    else if (uniqueColors.length >= 1) scores.design += 15;
    if (imgCount >= 3) scores.design += 25;
    if (hasFavicon) scores.design += 15;
    if (html.includes('font-family') || html.includes('fonts.googleapis')) scores.design += 15;
    scores.design += 15; // base for having a site
    scores.design = Math.min(scores.design, 100);

    // Performance
    if (htmlSize < 100000) scores.performance += 40;
    else if (htmlSize < 200000) scores.performance += 25;
    else if (htmlSize < 500000) scores.performance += 10;
    if (scriptCount <= 5) scores.performance += 30;
    else if (scriptCount <= 10) scores.performance += 15;
    if (imgCount <= 10) scores.performance += 30;
    scores.performance = Math.min(scores.performance, 100);

    // Mobile
    if (hasViewport) scores.mobile += 50;
    if (html.includes('max-width') || html.includes('@media')) scores.mobile += 30;
    if (/responsive|viewport/i.test(html)) scores.mobile += 20;
    scores.mobile = Math.min(scores.mobile, 100);

    // Content
    if (h1s.length >= 1) scores.content += 20;
    if (firstText.length > 100) scores.content += 25;
    if (h2s.length >= 2) scores.content += 20;
    if (imgCount >= 2) scores.content += 15;
    if (linkCount >= 5) scores.content += 20;
    scores.content = Math.min(scores.content, 100);

    // Marketing
    if (hasAnalytics) scores.marketing += 25;
    if (hasSocialLinks) scores.marketing += 25;
    if (hasContactForm) scores.marketing += 20;
    if (hasWhatsApp) scores.marketing += 15;
    if (hasOpenGraph) scores.marketing += 15;
    scores.marketing = Math.min(scores.marketing, 100);

    const overallScore = Math.round(
      (scores.seo + scores.design + scores.performance + scores.mobile + scores.content + scores.marketing) / 6
    );

    // Step 4: Generate AI critique
    const analysisData = {
      url: pageUrl,
      title, metaDesc, h1s, h2s, imgCount, linkCount, scriptCount,
      hasViewport, hasOpenGraph, hasFavicon, hasAnalytics, hasWhatsApp,
      hasContactForm, hasSocialLinks, hasSSL, htmlSize, uniqueColors,
      firstText, scores, overallScore
    };

    const systemPrompt = `You are ERGIO's AI Website Critic. You analyze websites and give actionable, specific improvement suggestions for African businesses. Be direct, honest, and practical. Focus on what will actually increase conversions and revenue.`;

    const userPrompt = `Analyze this website and give a critique:

URL: ${pageUrl}
Title: ${title}
Meta Description: ${metaDesc || 'MISSING'}
H1s: ${h1s.join(', ') || 'NONE'}
H2s: ${h2s.join(', ') || 'NONE'}
Images: ${imgCount}
Links: ${linkCount}
Scripts: ${scriptCount}
Has SSL: ${hasSSL}
Mobile-friendly (viewport): ${hasViewport}
Open Graph tags: ${hasOpenGraph}
Favicon: ${hasFavicon}
Analytics: ${hasAnalytics}
WhatsApp link: ${hasWhatsApp}
Contact form: ${hasContactForm}
Social links: ${hasSocialLinks}
HTML size: ${loadTime}KB
Colors used: ${uniqueColors.join(', ') || 'none detected'}

Scores: SEO ${scores.seo}/100, Design ${scores.design}/100, Performance ${scores.performance}/100, Mobile ${scores.mobile}/100, Content ${scores.content}/100, Marketing ${scores.marketing}/100
Overall: ${overallScore}/100

Give your response as JSON:
{
  "summary": "1-2 sentence overall assessment",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "topPriority": "single most important thing to fix first",
  "quickWins": ["quick win 1", "quick win 2", "quick win 3"],
  "recommendations": [{"title": "rec title", "detail": "specific actionable advice", "impact": "high|medium|low"}]
}`;

    let critique = null;
    const aiResponse = await getAICompletion(userPrompt, systemPrompt);
    if (aiResponse) {
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) critique = JSON.parse(jsonMatch[0]);
      } catch {}
    }

    // Fallback critique if AI failed
    if (!critique) {
      const weaknesses = [];
      const strengths = [];
      const quickWins = [];
      const recommendations = [];

      if (!hasViewport) { weaknesses.push('No mobile viewport tag — site may not work on phones'); quickWins.push('Add viewport meta tag for mobile'); recommendations.push({title:'Add Mobile Viewport',detail:'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> to your <head>',impact:'high'}); }
      if (!metaDesc) { weaknesses.push('Missing meta description — bad for SEO'); quickWins.push('Add a meta description'); recommendations.push({title:'Add Meta Description',detail:'Write a 150-char description of your business for Google search results',impact:'high'}); }
      if (!hasOpenGraph) { weaknesses.push('No Open Graph tags — links look bad on social media'); quickWins.push('Add Open Graph tags'); recommendations.push({title:'Add Social Preview Tags',detail:'Add og:title, og:description, og:image meta tags so links show previews on WhatsApp/Facebook',impact:'medium'}); }
      if (!hasAnalytics) { weaknesses.push('No analytics installed — flying blind'); quickWins.push('Install Google Analytics'); recommendations.push({title:'Install Analytics',detail:'Add Google Analytics or Plausible to track visitors and conversions',impact:'high'}); }
      if (!hasSocialLinks) { weaknesses.push('No social media links'); quickWins.push('Add social media links'); recommendations.push({title:'Add Social Links',detail:'Link your Instagram, Facebook, and WhatsApp so visitors can follow you',impact:'medium'}); }
      if (!hasContactForm) { weaknesses.push('No contact form — visitors have no way to reach you'); quickWins.push('Add a contact form'); recommendations.push({title:'Add Contact Form',detail:'Add a simple contact form so visitors can send you messages directly',impact:'high'}); }
      if (!hasWhatsApp) { weaknesses.push('No WhatsApp link — most African customers prefer WhatsApp'); quickWins.push('Add WhatsApp click-to-chat'); recommendations.push({title:'Add WhatsApp Button',detail:'Add a WhatsApp link (wa.me/number) — it is the #1 way African customers contact businesses',impact:'high'}); }
      if (scriptCount > 10) { weaknesses.push('Too many scripts — slow loading'); quickWins.push('Reduce third-party scripts'); }
      if (imgCount < 2) { weaknesses.push('Very few images — looks unprofessional'); quickWins.push('Add more business photos'); }

      if (hasSSL) strengths.push('SSL certificate active — secure');
      if (title) strengths.push('Has a page title');
      if (h1s.length > 0) strengths.push('Has H1 heading');
      if (hasFavicon) strengths.push('Has favicon — looks professional');
      if (hasViewport) strengths.push('Mobile viewport configured');
      if (imgCount >= 3) strengths.push('Good number of images');

      critique = {
        summary: overallScore >= 70 ? 'Solid website with room for optimization.' : overallScore >= 40 ? 'Decent start but needs several improvements to compete effectively.' : 'This website needs significant work to attract and convert customers.',
        strengths: strengths.length ? strengths : ['Website is live and accessible'],
        weaknesses: weaknesses.length ? weaknesses : ['Limited analysis without AI — check manually'],
        topPriority: recommendations[0]?.title || 'Add a meta description and WhatsApp link',
        quickWins: quickWins.length ? quickWins : ['Add Google Analytics', 'Add social media links'],
        recommendations: recommendations.length ? recommendations : [{title:'Get Professional Audit',detail:'Use ERGIO AI to rebuild this site with all best practices built in',impact:'high'}]
      };
    }

    return res.status(200).json({
      success: true,
      url: pageUrl,
      title,
      overallScore,
      scores,
      ...critique,
      metadata: {
        imgCount, linkCount, scriptCount, htmlSize: loadTime + 'KB',
        hasSSL, hasViewport, hasAnalytics, hasWhatsApp, hasContactForm,
        hasSocialLinks, hasOpenGraph, hasFavicon,
        colors: uniqueColors,
        h1s, h2s
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to analyze website: ' + error.message });
  }
}
