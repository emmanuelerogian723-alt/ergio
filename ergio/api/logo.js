// ========================================
// ERGIO API — /api/logo (AI Logo Generator)
// Generates professional logos using Pollinations AI image generation
// ========================================

const AI_MODELS = [
  'flux', 'flux-realism', 'flux-anime', 'flux-3d',
  'turbo', 'stable-diffusion-3.5-large'
];

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const params = url.searchParams;

  // ── GET: Generate logo ──
  if (req.method === 'GET') {
    const businessName = params.get('name') || params.get('business');
    const industry = params.get('industry') || params.get('type') || 'business';
    const style = params.get('style') || 'modern';
    const colors = params.get('colors') || '';
    const format = params.get('format') || 'single'; // single | grid | variations
    const model = params.get('model') || 'flux';

    if (!businessName) {
      return res.status(400).json({ success: false, error: 'Business name is required' });
    }

    // Build logo generation prompts
    const styleMap = {
      modern: 'sleek modern minimalist logo, clean geometric shapes, flat design, vector style',
      luxury: 'luxury premium logo, elegant gold accents, sophisticated serif, high-end brand',
      playful: 'playful fun logo, vibrant colors, rounded shapes, friendly mascot style',
      tech: 'tech startup logo, futuristic, gradient, digital, circuit-inspired',
      vintage: 'vintage retro logo, classic emblem, badge style, aged texture',
      eco: 'eco-friendly green logo, nature-inspired, organic shapes, sustainable',
      bold: 'bold typography logo, strong sans-serif, high contrast, impactful',
      creative: 'creative artistic logo, abstract, unique concept, memorable'
    };

    const stylePrompt = styleMap[style] || styleMap.modern;
    const colorPrompt = colors ? `with color palette of ${colors}` : '';

    const basePrompt = `Professional logo design for "${businessName}", a ${industry} business. ${stylePrompt} ${colorPrompt}. Centered, white background, high quality, memorable branding. No text watermark.`;

    if (format === 'variations') {
      // Generate 4 variations with different models/styles
      const variations = ['modern', 'luxury', 'tech', 'creative'].map(s => {
        const p = `Professional logo design for "${businessName}", a ${industry} business. ${styleMap[s]} ${colorPrompt}. Centered, white background, high quality.`;
        const seed = Math.floor(Math.random() * 100000);
        return {
          style: s,
          imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=512&height=512&model=${model}&nologo=true&seed=${seed}`,
          prompt: p
        };
      });
      return res.status(200).json({
        success: true,
        businessName,
        industry,
        variations,
        downloadUrl: variations[0].imageUrl
      });
    }

    // Single logo
    const seed = params.get('seed') || Math.floor(Math.random() * 100000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(basePrompt)}?width=1024&height=1024&model=${model}&nologo=true&seed=${seed}`;

    // Generate favicon version too
    const faviconUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(basePrompt + ' favicon icon style, simple, minimal')}&width=64&height=64&model=${model}&nologo=true&seed=${seed}`;

    return res.status(200).json({
      success: true,
      businessName,
      industry,
      style,
      imageUrl,
      faviconUrl,
      prompt: basePrompt,
      model,
      seed
    });
  }

  // ── POST: Generate with full customization ──
  if (req.method === 'POST') {
    let body = {};
    try { body = JSON.parse(req.body || '{}'); } catch { body = {}; }
    
    const { name, industry, style, colors, description, format } = body;
    if (!name) return res.status(400).json({ success: false, error: 'Business name is required' });

    const desc = description ? `${description}. ` : '';
    const styleMap = {
      modern: 'sleek modern minimalist logo, clean geometric shapes, flat design',
      luxury: 'luxury premium logo, elegant gold accents, sophisticated',
      playful: 'playful fun logo, vibrant colors, rounded shapes',
      tech: 'tech startup logo, futuristic, gradient, digital',
      vintage: 'vintage retro logo, classic emblem, badge style',
      eco: 'eco-friendly green logo, nature-inspired, organic',
      bold: 'bold typography logo, strong sans-serif, high contrast',
      creative: 'creative artistic logo, abstract, unique concept'
    };
    const s = styleMap[style] || styleMap.modern;
    const c = colors ? `with colors ${colors}` : '';
    const prompt = `Professional logo design for "${name}", a ${industry || 'business'}. ${desc}${s} ${c}. Centered, white background, high quality branding. No text watermark.`;

    if (format === 'variations') {
      const variations = ['modern', 'luxury', 'tech', 'creative'].map(st => {
        const p = `Professional logo design for "${name}", a ${industry || 'business'}. ${styleMap[st]} ${c}. Centered, white background, high quality.`;
        return { style: st, imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random()*100000)}` };
      });
      return res.status(200).json({ success: true, businessName: name, industry, variations, downloadUrl: variations[0].imageUrl });
    }

    const seed = Math.floor(Math.random() * 100000);
    return res.status(200).json({
      success: true,
      businessName: name,
      industry,
      style,
      imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${seed}`,
      faviconUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ' favicon icon style, simple, minimal')}&width=64&height=64&nologo=true&seed=${seed}`,
      prompt,
      seed
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
