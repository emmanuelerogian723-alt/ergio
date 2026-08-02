// ============================================================
// ERGIO — BUSINESS DESIGN PROFILES v2.0
// Industry-specific website design intelligence
// Maps business types → optimal design style, layout, colors, sections & features
// Based on 2026 web design research across 20+ industries
// ============================================================

/**
 * Each profile defines:
 * - designStyle: Key from DESIGN_STYLES
 * - layout: Key from LAYOUT_ARCHETYPES
 * - heroStyle: Which hero component to use
 * - colorHints: Suggested color palette overrides
 * - sections: Ordered section list for the page
 * - features: Which premium v4 features to enable
 * - imageQueries: Type-specific image search queries
 * - fonts: Recommended font pairing
 * - tone: Copywriting tone
 * - ctaText: Default CTA button text
 */

export const BUSINESS_PROFILES = {
  // ── FITNESS / GYM ───────────────────────────────────────
  fitness: {
    keywords: ['gym', 'fitness', 'workout', 'crossfit', 'yoga', 'pilates', 'personal training', 'health club', 'wellness centre', 'zumba', 'boxing', 'martial arts'],
    designStyle: 'iron',
    layout: 'tesla',
    heroStyle: 'hero-fullscreen',
    colorHints: { primary: '#ef4444', accent: '#f97316', bg: '#09090b', surface: '#18181b' },
    sections: ['hero-fullscreen', 'feature-split', 'stats-bar', 'testimonial-row', 'cta-minimal'],
    features: { megaMenu: true, lottie: true, beforeAfter: true, virtualTour: false, interactiveMap: true, bookingForm: true, exitPopup: true, liveChat: true },
    imageQueries: { hero: 'modern gym interior equipment dramatic lighting', about: 'personal trainer coaching client workout', gallery: 'fitness class group exercise energy' },
    fonts: { heading: 'Bebas Neue', body: 'Barlow' },
    tone: 'energetic',
    ctaText: 'Join Now',
    designNotes: 'Dark theme with bold red/orange energy. Full-screen hero with gym imagery. Bold typography. Stats showing member count, classes, trainers. Before/after transformation slider. Class schedule display. Membership pricing cards.',
  },

  // ── RESTAURANT / FOOD ───────────────────────────────────
  restaurant: {
    keywords: ['restaurant', 'food', 'dining', 'cafe', 'catering', 'kitchen', 'bistro', 'bar', 'chef', 'menu', 'eatery', 'grill', 'pizza', 'fast food'],
    designStyle: 'feast',
    layout: 'immersive',
    heroStyle: 'hero-cinematic',
    colorHints: { primary: '#ea580c', accent: '#f59e0b', bg: '#1a0a00', surface: '#2d1500' },
    sections: ['hero-cinematic', 'feature-split', 'stats-bar', 'testimonial-quote', 'cta-band'],
    features: { megaMenu: true, lottie: true, beforeAfter: false, virtualTour: true, interactiveMap: true, bookingForm: true, exitPopup: true, liveChat: true },
    imageQueries: { hero: 'upscale restaurant interior ambient lighting', about: 'chef cooking kitchen professional plating', gallery: 'gourmet plated food dish closeup' },
    fonts: { heading: 'Playfair Display', body: 'Lato' },
    tone: 'warm',
    ctaText: 'Book a Table',
    designNotes: 'Warm restaurant ambiance. Cinematic hero with food/interior photography. Full menu display with categories. Reservation/booking system. Chef spotlight. Opening hours. Testimonials from diners. Virtual tour of the space.',
  },

  // ── SALON / BEAUTY / SPA / TATTOO ───────────────────────
  salon: {
    keywords: ['salon', 'beauty', 'spa', 'hair', 'nail', 'makeup', 'skincare', 'barber', 'massage', 'wellness', 'cosmetology', 'tattoo', 'tattoo studio'],
    designStyle: 'bloom',
    layout: 'glassmorphism',
    heroStyle: 'hero-glass',
    colorHints: { primary: '#ec4899', accent: '#f472b6', bg: '#fff5f7', surface: '#fff0f3' },
    sections: ['hero-glass', 'feature-split', 'stats-bar', 'testimonial-row', 'cta-glass'],
    features: { megaMenu: true, lottie: true, beforeAfter: true, virtualTour: false, interactiveMap: true, bookingForm: true, exitPopup: true, liveChat: true },
    imageQueries: { hero: 'luxury salon interior modern elegant', about: 'hairstylist beauty professional working client', gallery: 'beauty treatment result salon portfolio' },
    fonts: { heading: 'Cormorant Garamond', body: 'Montserrat' },
    tone: 'elegant',
    ctaText: 'Book Appointment',
    designNotes: 'Soft pastel feminine. Glassmorphism cards. Service menu with pricing. Before/after gallery for beauty transformations. Booking system. Staff profiles. Premium product showcase.',
  },

  // ── CLINIC / MEDICAL ───────────────────────────────────
  clinic: {
    keywords: ['clinic', 'doctor', 'hospital', 'medical', 'dental', 'pharmacy', 'health', 'healthcare', 'optometry', 'physiotherapy', 'dermatology', 'pediatric'],
    designStyle: 'pulse_med',
    layout: 'swiss',
    heroStyle: 'hero-centered',
    colorHints: { primary: '#0369a1', accent: '#06b6d4', bg: '#f0f9ff', surface: '#e0f2fe' },
    sections: ['hero-centered', 'feature-grid-3', 'stats-bar', 'testimonial-row', 'cta-minimal'],
    features: { megaMenu: true, lottie: false, beforeAfter: false, virtualTour: false, interactiveMap: true, bookingForm: true, exitPopup: false, liveChat: true },
    imageQueries: { hero: 'modern medical clinic reception clean', about: 'doctor consulting patient professional healthcare', gallery: 'medical facility equipment modern' },
    fonts: { heading: 'Plus Jakarta Sans', body: 'Inter' },
    tone: 'trustworthy',
    ctaText: 'Book Appointment',
    designNotes: 'Clean clinical blue & white. Trust-centered design. Doctor profiles with credentials. Services by specialty. Appointment booking. Insurance info. Patient testimonials. Health tips blog.',
  },

  // ── REAL ESTATE / PROPERTY ─────────────────────────────
  realestate: {
    keywords: ['real estate', 'property', 'house', 'apartment', 'housing', 'rent', 'agent', 'mortgage', 'land', 'villa', 'realty', 'property management'],
    designStyle: 'estate',
    layout: 'luxury',
    heroStyle: 'hero-cinematic',
    colorHints: { primary: '#64748b', accent: '#c0a060', bg: '#0f1117', surface: '#1c1f2e' },
    sections: ['hero-cinematic', 'feature-split', 'gold-stats', 'testimonial-quote', 'cta-minimal'],
    features: { megaMenu: true, lottie: true, beforeAfter: true, virtualTour: true, interactiveMap: true, bookingForm: true, exitPopup: true, liveChat: true },
    imageQueries: { hero: 'luxury property exterior modern architecture', about: 'real estate agent professional handshake', gallery: 'interior design living room luxury property' },
    fonts: { heading: 'Cormorant Garamond', body: 'Jost' },
    tone: 'sophisticated',
    ctaText: 'Schedule Viewing',
    designNotes: 'Quiet luxury aesthetic. Sophisticated muted tones with gold accents. Property gallery with high-quality images. Virtual tours. Agent profiles. Neighborhood guides. Mortgage calculator. Search/filter interface.',
  },

  // ── LAW FIRM / LEGAL ───────────────────────────────────
  law: {
    keywords: ['law', 'legal', 'attorney', 'lawyer', 'law firm', 'solicitor', 'barrister', 'legal services', 'notary', 'advocate'],
    designStyle: 'slate',
    layout: 'apple',
    heroStyle: 'hero-centered',
    colorHints: { primary: '#3b82f6', accent: '#0ea5e9', bg: '#0a1628', surface: '#0f2044' },
    sections: ['hero-centered', 'feature-split', 'stats-bar', 'testimonial-row', 'cta-minimal'],
    features: { megaMenu: true, lottie: false, beforeAfter: false, virtualTour: false, interactiveMap: true, bookingForm: true, exitPopup: false, liveChat: true },
    imageQueries: { hero: 'law office professional building exterior', about: 'lawyer attorney professional office meeting', gallery: 'legal team professional headshot' },
    fonts: { heading: 'IBM Plex Sans', body: 'Source Sans Pro' },
    tone: 'authoritative',
    ctaText: 'Schedule Consultation',
    designNotes: 'Corporate navy blue. Trust-centered design. Attorney profiles with bios and credentials. Practice areas grid. Case results. Client testimonials. Free consultation CTA. Awards & recognitions.',
  },

  // ── ECOMMERCE / RETAIL ─────────────────────────────────
  ecommerce: {
    keywords: ['shop', 'store', 'product', 'buy', 'sell', 'ecommerce', 'retail', 'boutique', 'marketplace', 'online store', 'shopify'],
    designStyle: 'market',
    layout: 'dashboard',
    heroStyle: 'hero-gradient',
    colorHints: { primary: '#7c3aed', accent: '#ec4899', bg: '#ffffff', surface: '#f9fafb' },
    sections: ['hero-gradient', 'feature-grid-3', 'stats-bar', 'testimonial-row', 'cta-gradient'],
    features: { megaMenu: true, lottie: true, beforeAfter: false, virtualTour: false, interactiveMap: false, bookingForm: false, exitPopup: true, liveChat: true },
    imageQueries: { hero: 'modern retail store product display', about: 'customer shopping experience quality product', gallery: 'product photography white background studio' },
    fonts: { heading: 'Inter', body: 'Inter' },
    tone: 'commercial',
    ctaText: 'Shop Now',
    designNotes: 'Bold conversion-focused. Bento grid layouts. Product grid with categories. Shopping cart. Customer reviews. Sale/promo banners. Newsletter signup. Dark mode toggle for premium feel.',
  },

  // ── PORTFOLIO / CREATIVE ───────────────────────────────
  portfolio: {
    keywords: ['portfolio', 'showcase', 'creative', 'design', 'photography', 'art', 'illustration', 'graphic design', 'web design', 'brand identity'],
    designStyle: 'canvas',
    layout: 'magazine',
    heroStyle: 'hero-billboard',
    colorHints: { primary: '#ffffff', accent: '#888888', bg: '#0a0a0a', surface: '#111111' },
    sections: ['hero-billboard', 'feature-split', 'stats-bar', 'testimonial-quote', 'cta-band'],
    features: { megaMenu: true, lottie: true, beforeAfter: false, virtualTour: false, interactiveMap: false, bookingForm: true, exitPopup: false, liveChat: true },
    imageQueries: { hero: 'creative studio workspace design photography', about: 'designer photographer working professional creative', gallery: 'creative portfolio design work showcase' },
    fonts: { heading: 'Space Grotesk', body: 'DM Sans' },
    tone: 'creative',
    ctaText: 'View Work',
    designNotes: 'Creative portfolio. Minimalist dark. Oversized typography. Large project images. Case study format. Client logos. Awards. Process showcase. Contact form for commissions.',
  },

  // ── AGENCY / MARKETING ────────────────────────────────
  agency: {
    keywords: ['agency', 'marketing', 'branding', 'advertising', 'pr', 'consultancy', 'digital agency', 'creative agency', 'media', 'communications'],
    designStyle: 'gradient',
    layout: 'stripe',
    heroStyle: 'hero-gradient',
    colorHints: { primary: '#6366f1', accent: '#8b5cf6', bg: '#030014', surface: '#0f0524' },
    sections: ['hero-gradient', 'feature-grid-3', 'stats-bar', 'testimonial-row', 'cta-gradient'],
    features: { megaMenu: true, lottie: true, beforeAfter: false, virtualTour: false, interactiveMap: true, bookingForm: true, exitPopup: true, liveChat: true },
    imageQueries: { hero: 'creative agency office modern workspace team', about: 'marketing team meeting brainstorming strategy', gallery: 'brand design work creative portfolio' },
    fonts: { heading: 'Sora', body: 'Inter' },
    tone: 'confident',
    ctaText: 'Get a Quote',
    designNotes: 'Modern gradient mesh. Floating UI cards. Case studies with metrics. Service packages. Team expertise. Client testimonials with logos. Process timeline. Free audit CTA.',
  },

  // ── SAAS / TECH STARTUP ────────────────────────────────
  saas: {
    keywords: ['saas', 'software', 'app', 'platform', 'api', 'tech', 'startup', 'digital product', 'fintech', 'dashboard', 'cloud', 'developer'],
    designStyle: 'nova',
    layout: 'stripe',
    heroStyle: 'hero-gradient',
    colorHints: { primary: '#00D9FF', accent: '#7c3aed', bg: '#08090f', surface: '#111827' },
    sections: ['hero-gradient', 'feature-grid-3', 'stats-bar', 'testimonial-row', 'cta-gradient'],
    features: { megaMenu: true, lottie: true, beforeAfter: false, virtualTour: false, interactiveMap: false, bookingForm: false, exitPopup: true, liveChat: true },
    imageQueries: { hero: 'saas dashboard interface screenshot modern', about: 'team working software development startup', gallery: 'app interface ui design clean modern' },
    fonts: { heading: 'Sora', body: 'Inter' },
    tone: 'professional',
    ctaText: 'Start Free',
    designNotes: 'Futuristic dark with cyan. Gradient mesh hero. Interactive product demos. Feature comparison table. Pricing tiers (Free/Pro/Enterprise). API documentation. Integration logos. Social proof stats. Newsletter signup.',
  },

  // ── EDUCATION / SCHOOL ─────────────────────────────────
  education: {
    keywords: ['school', 'university', 'academy', 'course', 'education', 'training', 'tutor', 'learn', 'teaching', 'elearning', 'bootcamp', 'certification'],
    designStyle: 'scholar',
    layout: 'apple',
    heroStyle: 'hero-centered',
    colorHints: { primary: '#0f766e', accent: '#0d9488', bg: '#fafaf9', surface: '#f5f5f4' },
    sections: ['hero-centered', 'feature-grid-3', 'stats-bar', 'testimonial-row', 'cta-minimal'],
    features: { megaMenu: true, lottie: true, beforeAfter: false, virtualTour: true, interactiveMap: true, bookingForm: true, exitPopup: true, liveChat: true },
    imageQueries: { hero: 'modern classroom students learning bright', about: 'teacher student education interaction professional', gallery: 'campus facility library education environment' },
    fonts: { heading: 'Merriweather', body: 'Source Serif Pro' },
    tone: 'inspiring',
    ctaText: 'Enroll Now',
    designNotes: 'Trust and knowledge. Clean light theme. Course catalog with categories. Instructor profiles. Student success stories. Enrollment CTA. Schedule/timeline. FAQ. Accreditation badges.',
  },

  // ── EVENTS / WEDDING ───────────────────────────────────
  events: {
    keywords: ['event', 'wedding', 'party', 'conference', 'festival', 'concert', 'celebration', 'venue', 'event planning', 'corporate event', 'gala'],
    designStyle: 'pulse',
    layout: 'immersive',
    heroStyle: 'hero-cinematic',
    colorHints: { primary: '#8b5cf6', accent: '#ec4899', bg: '#0d0118', surface: '#160228' },
    sections: ['hero-cinematic', 'feature-split', 'stats-bar', 'testimonial-quote', 'cta-band'],
    features: { megaMenu: true, lottie: true, beforeAfter: true, virtualTour: true, interactiveMap: true, bookingForm: true, exitPopup: true, liveChat: true },
    imageQueries: { hero: 'grand event venue setup elegant decoration', about: 'event planner coordinator professional setup', gallery: 'event decoration celebration party beautiful' },
    fonts: { heading: 'Nunito', body: 'DM Sans' },
    tone: 'exciting',
    ctaText: 'Book Your Event',
    designNotes: 'Vibrant purple gradient. Immersive scroll. Gallery of past events. Service packages (weddings, corporate, parties). Venue showcase. Testimonials. Booking inquiry. Timeline/process. Vendor partners.',
  },

  // ── CONSTRUCTION / CONTRACTOR ─────────────────────────
  construction: {
    keywords: ['construction', 'building', 'contractor', 'architecture', 'engineering', 'renovation', 'remodeling', 'builder', 'civil', 'infrastructure'],
    designStyle: 'zinc',
    layout: 'apple',
    heroStyle: 'hero-fullscreen',
    colorHints: { primary: '#a1a1aa', accent: '#e4e4e7', bg: '#18181b', surface: '#27272a' },
    sections: ['hero-fullscreen', 'feature-split', 'stats-bar', 'testimonial-row', 'cta-minimal'],
    features: { megaMenu: true, lottie: false, beforeAfter: true, virtualTour: false, interactiveMap: true, bookingForm: true, exitPopup: false, liveChat: true },
    imageQueries: { hero: 'construction site building project professional', about: 'construction team engineer worker site professional', gallery: 'completed building project architecture portfolio' },
    fonts: { heading: 'Roboto Condensed', body: 'Roboto' },
    tone: 'reliable',
    ctaText: 'Get a Quote',
    designNotes: 'Industrial grey. Bold typography. Project portfolio with before/after. Services grid (residential, commercial, renovation). Team credentials. Safety certifications. Timeline/process. Free estimate CTA.',
  },

  // ── FASHION / APPAREL ──────────────────────────────────
  fashion: {
    keywords: ['fashion', 'clothing', 'apparel', 'wear', 'style', 'garment', 'tailor', 'fashion designer', 'accessories', 'shoes', 'bags'],
    designStyle: 'market',
    layout: 'magazine',
    heroStyle: 'hero-billboard',
    colorHints: { primary: '#1a1a1a', accent: '#d4af37', bg: '#ffffff', surface: '#f5f5f5' },
    sections: ['hero-billboard', 'feature-split', 'stats-bar', 'testimonial-quote', 'cta-band'],
    features: { megaMenu: true, lottie: true, beforeAfter: false, virtualTour: false, interactiveMap: true, bookingForm: true, exitPopup: true, liveChat: true },
    imageQueries: { hero: 'fashion model editorial photography studio', about: 'fashion designer atelier workshop creative', gallery: 'fashion lookbook collection editorial style' },
    fonts: { heading: 'Playfair Display', body: 'DM Sans' },
    tone: 'chic',
    ctaText: 'Shop Collection',
    designNotes: 'Editorial magazine layout. Bold fashion photography. Lookbook gallery. Collection categories. Size guide. Designer bio. Look of the season. Newsletter for drops.',
  },

  // ── FINANCE / BANKING ──────────────────────────────────
  finance: {
    keywords: ['finance', 'bank', 'invest', 'insurance', 'wealth', 'asset', 'financial services', 'accounting', 'audit', 'tax', 'payroll'],
    designStyle: 'slate',
    layout: 'apple',
    heroStyle: 'hero-centered',
    colorHints: { primary: '#3b82f6', accent: '#0ea5e9', bg: '#0a1628', surface: '#0f2044' },
    sections: ['hero-centered', 'feature-grid-3', 'stats-bar', 'testimonial-row', 'cta-minimal'],
    features: { megaMenu: true, lottie: false, beforeAfter: false, virtualTour: false, interactiveMap: true, bookingForm: true, exitPopup: false, liveChat: true },
    imageQueries: { hero: 'modern financial office building professional', about: 'financial advisor consultant meeting professional', gallery: 'finance dashboard charts data professional' },
    fonts: { heading: 'IBM Plex Sans', body: 'Source Sans Pro' },
    tone: 'authoritative',
    ctaText: 'Get Started',
    designNotes: 'Corporate navy. Trust signals. Service tiers (personal, business, corporate). Regulatory badges. Rate tables. Calculator tools. Advisor bios. Market insights blog. Secure contact form.',
  },

  // ── AGRICULTURE / ECO ──────────────────────────────────
  agriculture: {
    keywords: ['farm', 'agric', 'organic', 'eco', 'green', 'nature', 'food production', 'agribusiness', 'livestock', 'crop', 'poultry', 'fishery'],
    designStyle: 'terra',
    layout: 'apple',
    heroStyle: 'hero-centered',
    colorHints: { primary: '#22c55e', accent: '#84cc16', bg: '#0f1a0f', surface: '#1a2e1a' },
    sections: ['hero-centered', 'feature-split', 'stats-bar', 'testimonial-row', 'cta-minimal'],
    features: { megaMenu: true, lottie: true, beforeAfter: false, virtualTour: true, interactiveMap: true, bookingForm: false, exitPopup: false, liveChat: true },
    imageQueries: { hero: 'organic farm field green agriculture landscape', about: 'farmer working field professional agriculture', gallery: 'fresh produce harvest organic farm' },
    fonts: { heading: 'Merriweather', body: 'Source Sans Pro' },
    tone: 'natural',
    ctaText: 'Learn More',
    designNotes: 'Earthy greens. Natural photography. Product catalog (crops, livestock). Sustainability story. Farm tour. Supply chain info. Certifications. Wholesale/retail inquiry.',
  },

  // ── NGO / GOVERNMENT ───────────────────────────────────
  ngo: {
    keywords: ['ngo', 'non-profit', 'charity', 'foundation', 'government', 'ministry', 'initiative', 'community', 'social impact', 'humanitarian'],
    designStyle: 'naija',
    layout: 'apple',
    heroStyle: 'hero-centered',
    colorHints: { primary: '#16a34a', accent: '#22c55e', bg: '#001a00', surface: '#002200' },
    sections: ['hero-centered', 'feature-grid-3', 'stats-bar', 'testimonial-row', 'cta-minimal'],
    features: { megaMenu: true, lottie: true, beforeAfter: false, virtualTour: false, interactiveMap: true, bookingForm: false, exitPopup: false, liveChat: true },
    imageQueries: { hero: 'community impact humanitarian work professional', about: 'volunteer team community outreach program', gallery: 'project impact community development results' },
    fonts: { heading: 'Nunito', body: 'Open Sans' },
    tone: 'inspiring',
    ctaText: 'Get Involved',
    designNotes: 'Proudly Nigerian green. Impact statistics. Program areas. Beneficiary stories. Donation CTA. Volunteer signup. Partner logos. Annual report. Newsletter. Events calendar.',
  },

  // ── LUXURY / PREMIUM ───────────────────────────────────
  luxury: {
    keywords: ['luxury', 'premium', 'exclusive', 'vip', 'concierge', 'high-end', 'boutique hotel', 'fine jewelry', 'luxury car', 'private jet'],
    designStyle: 'onyx',
    layout: 'luxury',
    heroStyle: 'hero-cinematic',
    colorHints: { primary: '#D4AF37', accent: '#C0A020', bg: '#0a0a0a', surface: '#111111' },
    sections: ['hero-cinematic', 'feature-split', 'gold-stats', 'testimonial-quote', 'cta-minimal'],
    features: { megaMenu: true, lottie: true, beforeAfter: true, virtualTour: true, interactiveMap: true, bookingForm: true, exitPopup: true, liveChat: true },
    imageQueries: { hero: 'luxury interior gold dark elegant premium', about: 'luxury service professional concierge premium', gallery: 'luxury product experience elegant gold black' },
    fonts: { heading: 'Playfair Display', body: 'Lato' },
    tone: 'luxury',
    ctaText: 'Experience Luxury',
    designNotes: 'Black & gold. Playfair serif. Cinematic dark imagery. Minimal text, maximum impact. Exclusive membership tiers. Concierge contact. Brand heritage story. Awards. Press features.',
  },

  // ── NIGHTLIFE / ENTERTAINMENT ──────────────────────────
  nightlife: {
    keywords: ['nightlife', 'club', 'lounge', 'bar', 'entertainment', 'music', 'dj', 'concert', 'live music', 'pub', 'karaoke'],
    designStyle: 'pulse',
    layout: 'immersive',
    heroStyle: 'hero-glass',
    colorHints: { primary: '#8b5cf6', accent: '#ec4899', bg: '#0d0118', surface: '#160228' },
    sections: ['hero-glass', 'feature-split', 'stats-bar', 'testimonial-row', 'cta-glass'],
    features: { megaMenu: true, lottie: true, beforeAfter: false, virtualTour: true, interactiveMap: true, bookingForm: true, exitPopup: true, liveChat: true },
    imageQueries: { hero: 'nightclub lounge bar neon ambient lighting', about: 'dj performer live music entertainment professional', gallery: 'nightlife event party crowd atmosphere' },
    fonts: { heading: 'Nunito', body: 'DM Sans' },
    tone: 'exciting',
    ctaText: 'Reserve VIP',
    designNotes: 'Electric purple gradient. Neon glow effects. Glassmorphism. Event calendar. VIP table booking. Drink menu. Photo gallery. DJ schedule. Social media feed. Newsletter for events.',
  },

  // ── DEFAULT / GENERAL BUSINESS ─────────────────────────
  default: {
    keywords: [],
    designStyle: 'nova',
    layout: 'apple',
    heroStyle: 'hero-centered',
    colorHints: {},
    sections: ['hero-centered', 'feature-grid-3', 'stats-bar', 'testimonial-row', 'cta-minimal'],
    features: { megaMenu: true, lottie: true, beforeAfter: false, virtualTour: false, interactiveMap: true, bookingForm: true, exitPopup: true, liveChat: true },
    imageQueries: { hero: 'professional business office modern', about: 'business team meeting professional', gallery: 'business service professional quality' },
    fonts: { heading: 'Inter', body: 'Inter' },
    tone: 'professional',
    ctaText: 'Get Started',
    designNotes: 'Clean modern default. Centered hero. Feature grid. Stats bar. Testimonials. Contact section. All premium features enabled.',
  },
};

/**
 * Detect the best business profile from user prompt
 * Returns the profile key (e.g. 'fitness', 'restaurant', 'salon')
 */
export function detectBusinessProfile(prompt, businessType, websiteCategory) {
  const combined = ((prompt || '') + ' ' + (businessType || '') + ' ' + (websiteCategory || '')).toLowerCase();
  
  let bestProfile = 'default';
  let bestScore = 0;
  
  for (const [key, profile] of Object.entries(BUSINESS_PROFILES)) {
    if (key === 'default') continue;
    let score = 0;
    for (const keyword of profile.keywords) {
      if (combined.includes(keyword)) {
        score += keyword.length > 5 ? 3 : 2;
      }
    }
    if (websiteCategory && key === websiteCategory.toLowerCase()) {
      score += 5;
    }
    if (score > bestScore) {
      bestScore = score;
      bestProfile = key;
    }
  }
  
  return bestProfile;
}

/**
 * Get the full profile by key
 */
export function getProfile(key) {
  return BUSINESS_PROFILES[key] || BUSINESS_PROFILES.default;
}

/**
 * Get all profile keys for display
 */
export function getAllProfileKeys() {
  return Object.keys(BUSINESS_PROFILES).filter(k => k !== 'default');
}
