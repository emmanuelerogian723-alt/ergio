// ========================================
// ERGIO — Image Intelligence Library
// Fetches real photos from Pixabay + Unsplash
// Agentic: AI decides what images to search for
// ========================================

const PIXABAY_KEY = process.env.PIXABAY_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

/**
 * Search Pixabay for high-quality images
 * Free API: 100 requests/minute
 */
export async function searchPixabay(query, options = {}) {
  if (!PIXABAY_KEY) return [];
  
  const perPage = options.perPage || 5;
  const orientation = options.orientation || 'horizontal';
  const category = options.category || '';
  const minHeight = options.minHeight || 600;
  
  const params = new URLSearchParams({
    key: PIXABAY_KEY,
    q: query,
    image_type: 'photo',
    orientation: orientation,
    per_page: perPage.toString(),
    min_width: 800,
    min_height: minHeight.toString(),
    safesearch: 'true',
    order: 'popular',
    pretty: 'false'
  });
  if (category) params.set('category', category);
  
  try {
    const res = await fetch(`https://pixabay.com/api/?${params}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.hits || []).map(hit => ({
      url: hit.largeImageURL || hit.webformatURL,
      thumb: hit.previewURL,
      width: hit.imageWidth,
      height: hit.imageHeight,
      tags: hit.tags,
      source: 'pixabay'
    }));
  } catch (e) {
    console.error('Pixabay error:', e.message);
    return [];
  }
}

/**
 * Search Unsplash for premium-quality images
 * Free API: 50 requests/hour
 */
export async function searchUnsplash(query, options = {}) {
  if (!UNSPLASH_ACCESS_KEY) return [];
  
  const perPage = options.perPage || 5;
  const orientation = options.orientation || 'landscape';
  
  try {
    const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=${orientation}&content_filter=high`, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1'
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(photo => ({
      url: photo.urls.regular || photo.urls.full,
      thumb: photo.urls.thumb,
      width: photo.width,
      height: photo.height,
      tags: photo.alt_description || photo.description || '',
      source: 'unsplash',
      credit: photo.user?.name,
      creditUrl: photo.user?.links?.html
    }));
  } catch (e) {
    console.error('Unsplash error:', e.message);
    return [];
  }
}

/**
 * Multi-source image search with fallback chain
 * Pixabay (fast, many images) → Unsplash (premium quality) → Pollinations (AI-generated fallback)
 */
export async function searchImages(query, options = {}) {
  const queryStr = query.trim();
  if (!queryStr) return [];
  
  // Search both sources in parallel
  const [pixabayResults, unsplashResults] = await Promise.all([
    searchPixabay(queryStr, options),
    searchUnsplash(queryStr, options)
  ]);
  
  // Merge and deduplicate by URL
  const all = [...pixabayResults, ...unsplashResults];
  const seen = new Set();
  const deduped = all.filter(img => {
    if (seen.has(img.url)) return false;
    seen.add(img.url);
    return true;
  });
  
  // Sort: Unsplash first (premium quality), then Pixabay by relevance
  deduped.sort((a, b) => {
    if (a.source === 'unsplash' && b.source !== 'unsplash') return -1;
    if (a.source !== 'unsplash' && b.source === 'unsplash') return 1;
    return 0;
  });
  
  return deduped.slice(0, options.perPage || 10);
}

/**
 * Agentic image planner — decides what images the website needs based on business type
 */
// Business type → specific image search queries for highest quality results
const TYPE_IMAGE_QUERIES = {
  restaurant: { hero: 'upscale restaurant interior ambient lighting', about: 'chef cooking kitchen professional', gallery: 'plated food gourmet dish' },
  salon: { hero: 'luxury hair salon interior modern', about: 'hairdresser styling client professional', gallery: 'hair coloring salon treatment' },
  fitness: { hero: 'modern gym interior equipment', about: 'personal trainer workout coaching', gallery: 'fitness class exercise group' },
  clinic: { hero: 'modern medical clinic reception', about: 'doctor consulting patient professional', gallery: 'medical equipment healthcare' },
  tattoo: { hero: 'tattoo studio interior dark aesthetic', about: 'tattoo artist working professional', gallery: 'tattoo design artwork portfolio' },
  agency: { hero: 'creative agency office modern workspace', about: 'team working together office', gallery: 'design work creative portfolio' },
  ecommerce: { hero: 'modern retail store interior', about: 'customer shopping experience quality', gallery: 'product photography white background' },
  realestate: { hero: 'luxury property exterior modern', about: 'real estate agent professional', gallery: 'interior design living room luxury' },
  portfolio: { hero: 'creative studio workspace photography', about: 'photographer designer working professional', gallery: 'creative portfolio design work' },
  education: { hero: 'modern classroom students learning', about: 'teacher student education professional', gallery: 'education books studying library' },
  events: { hero: 'grand event venue setup elegant', about: 'event coordinator planning professional', gallery: 'event decoration setup beautiful' },
  default: { hero: 'professional business office modern', about: 'business team meeting professional', gallery: 'business service professional quality' }
};

export async function planImages(businessName, businessType, services, city) {
  const t = (businessType||'business').toLowerCase();
  const queries = TYPE_IMAGE_QUERIES[Object.keys(TYPE_IMAGE_QUERIES).find(k => t.includes(k)) || 'default'];
  const cityStr = city || 'Lagos';
  
  const imagePlan = [
    { placement: 'hero', query: `${queries.hero} ${cityStr}`, orientation: 'landscape', count: 3 },
    { placement: 'about', query: `${queries.about}`, orientation: 'landscape', count: 2 },
    { placement: 'gallery', query: `${queries.gallery}`, orientation: 'square', count: 4 },
    { placement: 'services', query: `${businessType} service premium quality`, orientation: 'landscape', count: 2 }
  ];
  
  return imagePlan;
}

/**
 * Fetch all images for a website plan
 * Returns a map of placement → array of image objects
 */
export async function fetchWebsiteImages(imagePlan) {
  const results = {};
  
  const promises = imagePlan.map(async (item) => {
    let images = [];
    
    // Try real image APIs first (Pixabay, Unsplash)
    try {
      images = await Promise.race([
        searchImages(item.query, {
          orientation: item.orientation,
          perPage: item.count || 3
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000))
      ]);
    } catch(e) {
      images = [];
    }
    
    // If no real images found, use Pollinations AI as fallback
    if (!images || images.length === 0) {
      const seed = Math.floor(Math.random() * 999999);
      const aiQuery = item.query || 'professional business Nigeria';
      const dims = item.orientation === 'square' ? '800x800' : '1200x800';
      const [w, h] = dims.split('x');
      images = [{
        url: `https://image.pollinations.ai/prompt/${encodeURIComponent(aiQuery + ' professional high quality photography')}&width=${w}&height=${h}&nologo=true&model=flux&seed=${seed}`,
        source: 'pollinations',
        credit: '',
        tags: aiQuery
      }];
    }
    
    results[item.placement] = images.map(img => ({
      url: img.url,
      source: img.source,
      credit: img.credit || '',
      tags: img.tags || ''
    }));
  });
  
  await Promise.all(promises);
  return results;
}

/**
 * Generate AI image via Pollinations (free fallback)
 */
export function generateAIImage(prompt, width = 800, height = 600) {
  const seed = Math.floor(Math.random() * 1000000);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;
}

/**
 * Get a fallback image URL when no real images found
 */
export function getFallbackImage(query, width = 800, height = 600) {
  return generateAIImage(`${query}, professional, high quality, 4k`, width, height);
}
