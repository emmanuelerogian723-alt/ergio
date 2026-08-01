// ============================================================
// ERGIO PREMIUM GENERATION ENGINE v3.0
// World-class website generation — Awwwards-level quality
// ============================================================

// ── LAYOUT ARCHETYPES ─────────────────────────────────────
export const LAYOUT_ARCHETYPES = {
  magazine: {
    name: 'Magazine',
    desc: 'Editorial multi-column with oversized headlines',
    sections: ['hero-billboard', 'feature-split', 'gallery-mosaic', 'stats-bar', 'testimonial-quote', 'cta-band'],
    navStyle: 'minimal-top',
    spacing: 'editorial',
  },
  apple: {
    name: 'Apple Style',
    desc: 'Full-bleed centered sections, massive reveals',
    sections: ['hero-centered', 'feature-split', 'feature-grid-3', 'stats-bar', 'testimonial-row', 'cta-minimal'],
    navStyle: 'sticky-blur',
    spacing: 'generous',
  },
  stripe: {
    name: 'Stripe Style',
    desc: 'Gradient mesh, floating UI cards, animated code',
    sections: ['hero-gradient', 'feature-grid-3', 'stats-bar', 'testimonial-row', 'cta-gradient'],
    navStyle: 'sticky-transparent',
    spacing: 'balanced',
  },
  tesla: {
    name: 'Tesla Style',
    desc: 'Full-screen heroes, minimal text, 100vh sections',
    sections: ['hero-fullscreen', 'feature-split', 'stats-bar', 'testimonial-row', 'cta-minimal'],
    navStyle: 'fixed-overlay',
    spacing: 'fullscreen',
  },
  glassmorphism: {
    name: 'Glassmorphism',
    desc: 'Frosted glass, blur, gradient orbs, floating cards',
    sections: ['hero-glass', 'glass-cards', 'stats-glass', 'testimonial-row', 'cta-glass'],
    navStyle: 'glass-bar',
    spacing: 'airy',
  },
  brutalist: {
    name: 'Brutalist',
    desc: 'Raw HTML, bold borders, monospace, high contrast',
    sections: ['hero-raw', 'grid-blocks', 'stats-bar', 'testimonial-row', 'cta-band'],
    navStyle: 'brutalist-bar',
    spacing: 'tight',
  },
  swiss: {
    name: 'Swiss Design',
    desc: 'Grid-based, Helvetica, minimal color, mathematical',
    sections: ['hero-centered', 'feature-grid-3', 'stats-bar', 'testimonial-row', 'cta-minimal'],
    navStyle: 'swiss-top',
    spacing: 'mathematical',
  },
  immersive: {
    name: 'Immersive Scroll',
    desc: 'Story-driven scroll, pinned sections, cinematic',
    sections: ['hero-pinned', 'feature-split', 'stats-bar', 'testimonial-quote', 'cta-band'],
    navStyle: 'progress-bar',
    spacing: 'cinematic',
  },
  neomorphic: {
    name: 'Neomorphic',
    desc: 'Soft UI, extruded surfaces, subtle shadows',
    sections: ['hero-centered', 'feature-grid-3', 'stats-glass', 'testimonial-row', 'cta-minimal'],
    navStyle: 'neomorphic-bar',
    spacing: 'soft',
  },
  split3d: {
    name: '3D Split',
    desc: 'Three.js 3D hero, split screen, mouse-tilt cards',
    sections: ['hero-3d', 'feature-split', 'feature-grid-3', 'testimonial-row', 'cta-gradient'],
    navStyle: 'floating-3d',
    spacing: 'dramatic',
  },
  luxury: {
    name: 'Dark Luxury',
    desc: 'Black/gold, Playfair, cinematic fades, gold dividers',
    sections: ['hero-cinematic', 'feature-split', 'gold-stats', 'testimonial-quote', 'cta-minimal'],
    navStyle: 'luxury-fixed',
    spacing: 'theatrical',
  },
  dashboard: {
    name: 'Dashboard Style',
    desc: 'SaaS dashboard preview, data viz, animated charts',
    sections: ['hero-dashboard', 'feature-grid-3', 'stats-bar', 'testimonial-row', 'cta-gradient'],
    navStyle: 'saas-nav',
    spacing: 'compact',
  },
};
