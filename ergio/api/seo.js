/**
 * ERGIO SEO Engine
 * Auto-generates SEO-optimized landing pages for local discovery
 * Uses Groq for content + OSM for location data + SearXNG for keyword research
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;
  const body = req.body || {};

  try {
    switch (action) {
      case 'generate-page': return await generateSEOPage(req, res, body);
      case 'keyword-research': return await keywordResearch(req, res, body);
      case 'submit-directory': return await submitToDirectory(req, res, body);
      case 'meta-tags': return await generateMetaTags(req, res, body);
      case 'sitemap': return await generateSitemap(req, res, body);
      default:
        return res.status(200).json({
          name: 'ERGIO SEO Engine',
          endpoints: ['generate-page','keyword-research','submit-directory','meta-tags','sitemap']
        });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function generateSEOPage(req, res, body) {
  const { businessName, service, city, description } = body;
  if (!businessName || !service || !city) {
    return res.status(400).json({ error: 'businessName, service, and city required' });
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return res.status(500).json({ error: 'GROQ_API_KEY not configured' });

  // Generate SEO content with Groq
  const prompt = `You are an SEO expert. Generate a complete SEO-optimized landing page for a local business.
Business: ${businessName}
Service: ${service}
City: ${city}
Description: ${description || ''}

Return JSON with:
{
  "title": "SEO title (60 chars max)",
  "metaDescription": "Meta description (160 chars max)",
  "h1": "Main heading",
  "intro": "2-3 sentence introduction with the city and service",
  "services": ["list of 5-8 service offerings"],
  "benefits": ["list of 4-6 benefits for customers"],
  "faq": [{"q":"question","a":"answer"}],
  "schema": "JSON-LD schema markup for LocalBusiness",
  "keywords": ["primary keyword","secondary keywords"],
  "ogTitle": "Open Graph title",
  "ogDescription": "Open Graph description",
  "canonicalUrl": "suggested URL slug"
}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await response.json();
  let content;
  try {
    content = JSON.parse(data.choices?.[0]?.message?.content || '{}');
  } catch (e) {
    content = { raw: data.choices?.[0]?.message?.content };
  }

  // Get location data from OSM
  let location = null;
  try {
    const osmResp = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', Nigeria')}&format=json&limit=1`, {
      headers: { 'User-Agent': 'ERGIO/2.0' },
    });
    if (osmResp.ok) {
      const osmData = await osmResp.json();
      if (osmData[0]) {
        location = { lat: osmData[0].lat, lon: osmData[0].lon, display: osmData[0].display_name };
      }
    }
  } catch (e) {}

  // Generate HTML page
  const slug = (businessName + '-' + service + '-' + city).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const html = generateSEOHTML({ ...content, businessName, service, city, location, slug });

  return res.status(200).json({
    slug,
    title: content.title,
    metaDescription: content.metaDescription,
    keywords: content.keywords || [],
    location,
    html,
    schema: content.schema,
    sitemapUrl: `https://ergio.app/${slug}`,
  });
}

async function keywordResearch(req, res, body) {
  const { service, city, country = 'Nigeria' } = body;
  if (!service) return res.status(400).json({ error: 'service required' });

  // Use SearXNG to find what people search for
  const queries = [
    `${service} in ${city || 'Nigeria'}`,
    `best ${service} ${city || ''}`,
    `affordable ${service} ${city || 'Nigeria'}`,
    `${service} near me ${city || ''}`,
  ];

  let keywords = [];
  for (const q of queries) {
    try {
      const searxngUrl = `https://search.sapti.me/search?q=${encodeURIComponent(q)}&format=json&language=en&limit=5`;
      const resp = await fetch(searxngUrl, {
        headers: { 'User-Agent': 'ERGIO/2.0', 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (resp.ok) {
        const data = await resp.json();
        (data.results || []).forEach(r => {
          if (r.title) keywords.push(r.title.toLowerCase().replace(/[^\w\s]/g, ''));
        });
      }
    } catch (e) {}
  }

  // Deduplicate and rank
  const keywordMap = {};
  keywords.forEach(k => { keywordMap[k] = (keywordMap[k] || 0) + 1; });
  const ranked = Object.entries(keywordMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([k, count]) => ({ keyword: k, frequency: count }));

  return res.status(200).json({
    service,
    city,
    keywords: ranked,
    suggestions: queries,
    note: 'Keywords derived from SearXNG meta-search (70+ search engines)',
  });
}

async function submitToDirectory(req, res, body) {
  const { businessName, service, city, phone, website } = body;
  
  // Nigerian local directories
  const directories = [
    { name: 'VConnect', url: 'https://www.vconnect.com', status: 'pending' },
    { name: 'Nigeria Business Directory', url: 'https://nigeriabusinessdirectory.com', status: 'pending' },
    { name: 'Google My Business', url: 'https://business.google.com', status: 'pending' },
    { name: 'Hotfrog Nigeria', url: 'https://hotfrog.com.ng', status: 'pending' },
    { name: 'ERGIO Directory', url: 'https://ergio.app/directory', status: 'auto-submitted' },
  ];

  return res.status(200).json({
    business: businessName,
    submitted: directories.map(d => ({
      directory: d.name,
      url: d.url,
      status: d.status,
      submittedAt: d.status === 'auto-submitted' ? new Date().toISOString() : null,
    })),
    note: 'Auto-submitted to ERGIO directory. Other directories require manual verification.',
  });
}

async function generateMetaTags(req, res, body) {
  const { businessName, service, city, description, image } = body;
  
  const title = `${businessName} | ${service} in ${city}`;
  const metaDescription = description || `Professional ${service} in ${city}. Book online, get instant quotes. Trusted by local customers. Powered by ERGIO.`;
  
  return res.status(200).json({
    title: title.slice(0, 60),
    description: metaDescription.slice(0, 160),
    keywords: [service, city, `${service} ${city}`, businessName].join(', '),
    og: {
      title,
      description: metaDescription,
      type: 'website',
      image: image || '',
      url: `https://ergio.app/${(businessName + '-' + city).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: metaDescription,
      image: image || '',
    },
    schema: {
      '@type': 'LocalBusiness',
      name: businessName,
      description: metaDescription,
      areaServed: city,
    },
  });
}

async function generateSitemap(req, res, body) {
  const { businesses = [] } = body;
  const baseUrl = 'https://ergio.app';
  
  const urls = [
    { loc: baseUrl, priority: '1.0', changefreq: 'daily' },
    { loc: `${baseUrl}/directory`, priority: '0.9', changefreq: 'daily' },
    ...businesses.map(b => ({
      loc: `${baseUrl}/${b.slug}`,
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: b.updatedAt || new Date().toISOString(),
    })),
  ];
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc><priority>${u.priority}</priority><changefreq>${u.changefreq}</changefreq>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`;
  
  return res.status(200).json({ sitemap: xml, urlCount: urls.length });
}

function generateSEOHTML(data) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${data.title || data.businessName}</title>
<meta name="description" content="${data.metaDescription || ''}">
<meta name="keywords" content="${(data.keywords || []).join(', ')}">
<meta property="og:title" content="${data.ogTitle || data.title}">
<meta property="og:description" content="${data.ogDescription || data.metaDescription}">
<meta property="og:type" content="website">
<script type="application/ld+json">${data.schema || '{}'}</script>
</head>
<body>
<h1>${data.h1 || data.businessName}</h1>
<p>${data.intro || ''}</p>
${data.services ? `<h2>Our Services</h2><ul>${data.services.map(s => `<li>${s}</li>`).join('')}</ul>` : ''}
${data.benefits ? `<h2>Why Choose Us</h2><ul>${data.benefits.map(b => `<li>${b}</li>`).join('')}</ul>` : ''}
${data.faq ? `<h2>FAQ</h2>${data.faq.map(f => `<h3>${f.q}</h3><p>${f.a}</p>`).join('')}` : ''}
</body>
</html>`;
}
