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
export async function planImages(businessName, businessType, services, city) {
  const imagePlan = [
    { placement: 'hero', query: `${businessType} business professional`, orientation: 'landscape', count: 3 },
    { placement: 'about', query: `${businessType} team working ${city || 'office'}`, orientation: 'landscape', count: 2 },
    { placement: 'services', query: `${businessType} service quality`, orientation: 'landscape', count: 2 },
    { placement: 'gallery', query: `${businessType} portfolio work`, orientation: 'square', count: 4 }
  ];
  
  // Add service-specific images
  if (services && services.length) {
    services.slice(0, 3).forEach(s => {
      imagePlan.push({
        placement: `service-${s.name}`,
        query: `${s.name} ${businessType}`,
        orientation: 'landscape',
        count: 1
      });
    });
  }
  
  return imagePlan;
}

/**
 * Fetch all images for a website plan
 * Returns a map of placement → array of image objects
 */
export async function fetchWebsiteImages(imagePlan) {
  const results = {};
  
  const promises = imagePlan.map(async (item) => {
    const images = await searchImages(item.query, {
      orientation: item.orientation,
      perPage: item.count
    });
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
