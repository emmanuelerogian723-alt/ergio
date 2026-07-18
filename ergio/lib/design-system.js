// ============================================================
// ERGIO PREMIUM DESIGN SYSTEM v2.0 — Wix Harmony Quality
// 20 professional design styles with full CSS/component sets
// ============================================================

export const DESIGN_STYLES = {
  // ── MODERN / TECH ──────────────────────────────────────────
  nova: {
    name: 'Nova', emoji: '🌟',
    desc: 'Futuristic dark with cyan accents — perfect for tech & SaaS',
    palette: { bg: '#08090f', surface: '#111827', border: 'rgba(0,217,255,0.15)', 
               text: '#f0f4ff', muted: '#8892a4', primary: '#00D9FF', accent: '#7c3aed', cta: '#00D9FF' },
    fonts: { heading: 'Sora', body: 'Inter', mono: 'Fira Code' },
    mood: 'dark tech saas startup',
  },
  aria: {
    name: 'Aria', emoji: '✨',
    desc: 'Clean minimalist light — like Notion, Linear, Wix Harmony',
    palette: { bg: '#ffffff', surface: '#f8f9fa', border: '#e5e7eb',
               text: '#111827', muted: '#6b7280', primary: '#2563eb', accent: '#7c3aed', cta: '#2563eb' },
    fonts: { heading: 'Plus Jakarta Sans', body: 'Inter', mono: 'JetBrains Mono' },
    mood: 'minimal clean professional saas',
  },
  onyx: {
    name: 'Onyx', emoji: '🖤',
    desc: 'Premium all-black with gold — luxury brands & agencies',
    palette: { bg: '#0a0a0a', surface: '#111111', border: 'rgba(212,175,55,0.2)',
               text: '#f5f5f0', muted: '#888882', primary: '#D4AF37', accent: '#C0A020', cta: '#D4AF37' },
    fonts: { heading: 'Playfair Display', body: 'Lato', mono: 'Courier New' },
    mood: 'luxury premium gold dark elegant',
  },

  // ── VIBRANT / BOLD ─────────────────────────────────────────
  pulse: {
    name: 'Pulse', emoji: '⚡',
    desc: 'Electric purple gradient — nightlife, events & entertainment',
    palette: { bg: '#0d0118', surface: '#160228', border: 'rgba(167,139,250,0.2)',
               text: '#f8f0ff', muted: '#a78bfa', primary: '#8b5cf6', accent: '#ec4899', cta: '#8b5cf6' },
    fonts: { heading: 'Nunito', body: 'DM Sans', mono: 'Fira Code' },
    mood: 'vibrant entertainment events club',
  },
  flame: {
    name: 'Flame', emoji: '🔥',
    desc: 'Bold red-orange energy — fitness, food & passion brands',
    palette: { bg: '#0f0a00', surface: '#1a1200', border: 'rgba(251,146,60,0.2)',
               text: '#fff7ed', muted: '#d97706', primary: '#f97316', accent: '#ef4444', cta: '#f97316' },
    fonts: { heading: 'Bebas Neue', body: 'Nunito', mono: 'monospace' },
    mood: 'bold energetic fitness food sport',
  },
  bloom: {
    name: 'Bloom', emoji: '🌸',
    desc: 'Soft pastel feminine — beauty, wellness & lifestyle brands',
    palette: { bg: '#fff5f7', surface: '#fff0f3', border: '#fecdd3',
               text: '#881337', muted: '#be185d', primary: '#ec4899', accent: '#f472b6', cta: '#ec4899' },
    fonts: { heading: 'Cormorant Garamond', body: 'Montserrat', mono: 'Georgia' },
    mood: 'beauty salon spa wellness feminine',
  },

  // ── NATURAL / ORGANIC ──────────────────────────────────────
  terra: {
    name: 'Terra', emoji: '🌿',
    desc: 'Earthy greens and browns — agriculture, food & eco brands',
    palette: { bg: '#0f1a0f', surface: '#1a2e1a', border: 'rgba(134,239,172,0.15)',
               text: '#f0fdf4', muted: '#86efac', primary: '#22c55e', accent: '#84cc16', cta: '#22c55e' },
    fonts: { heading: 'Merriweather', body: 'Source Sans Pro', mono: 'monospace' },
    mood: 'natural organic eco food agriculture',
  },
  ivory: {
    name: 'Ivory', emoji: '🏛️',
    desc: 'Warm cream and tan — professional services & real estate',
    palette: { bg: '#fefce8', surface: '#fef9c3', border: '#d97706',
               text: '#1c1917', muted: '#78716c', primary: '#92400e', accent: '#b45309', cta: '#92400e' },
    fonts: { heading: 'Crimson Text', body: 'Libre Baskerville', mono: 'Georgia' },
    mood: 'professional trust classic real estate legal',
  },

  // ── CORPORATE / FINANCE ────────────────────────────────────
  slate: {
    name: 'Slate', emoji: '🏢',
    desc: 'Corporate navy blue — finance, legal & consulting',
    palette: { bg: '#0a1628', surface: '#0f2044', border: 'rgba(59,130,246,0.2)',
               text: '#f0f6ff', muted: '#7ba7d4', primary: '#3b82f6', accent: '#0ea5e9', cta: '#3b82f6' },
    fonts: { heading: 'IBM Plex Sans', body: 'Source Sans Pro', mono: 'IBM Plex Mono' },
    mood: 'corporate finance banking consulting legal',
  },
  zinc: {
    name: 'Zinc', emoji: '⚙️',
    desc: 'Industrial grey — manufacturing, logistics & B2B',
    palette: { bg: '#18181b', surface: '#27272a', border: 'rgba(161,161,170,0.2)',
               text: '#fafafa', muted: '#71717a', primary: '#a1a1aa', accent: '#e4e4e7', cta: '#ffffff' },
    fonts: { heading: 'Roboto Condensed', body: 'Roboto', mono: 'Roboto Mono' },
    mood: 'industrial manufacturing logistics b2b',
  },

  // ── AFRICAN / LOCAL ────────────────────────────────────────
  naija: {
    name: 'Naija', emoji: '🇳🇬',
    desc: 'Bold green & white — proudly Nigerian brands',
    palette: { bg: '#001a00', surface: '#002200', border: 'rgba(0,180,0,0.25)',
               text: '#f0fff0', muted: '#4ade80', primary: '#16a34a', accent: '#22c55e', cta: '#16a34a' },
    fonts: { heading: 'Nunito', body: 'Open Sans', mono: 'monospace' },
    mood: 'nigerian african local government ngo',
  },
  kente: {
    name: 'Kente', emoji: '🪡',
    desc: 'Vibrant Afro patterns — culture, fashion & arts',
    palette: { bg: '#1a0500', surface: '#2a0800', border: 'rgba(251,191,36,0.25)',
               text: '#fffbeb', muted: '#f59e0b', primary: '#f59e0b', accent: '#ef4444', cta: '#f59e0b' },
    fonts: { heading: 'Pacifico', body: 'Nunito', mono: 'monospace' },
    mood: 'african culture fashion arts fashion',
  },

  // ── MEDICAL / HEALTH ───────────────────────────────────────
  pulse_med: {
    name: 'MedCare', emoji: '🏥',
    desc: 'Clean clinical blue & white — clinics & hospitals',
    palette: { bg: '#f0f9ff', surface: '#e0f2fe', border: '#bae6fd',
               text: '#0c4a6e', muted: '#0284c7', primary: '#0369a1', accent: '#06b6d4', cta: '#0369a1' },
    fonts: { heading: 'Plus Jakarta Sans', body: 'Inter', mono: 'monospace' },
    mood: 'medical clinic hospital pharmacy health',
  },

  // ── RESTAURANT / FOOD ─────────────────────────────────────
  feast: {
    name: 'Feast', emoji: '🍽️',
    desc: 'Warm restaurant ambiance — dining, catering & food delivery',
    palette: { bg: '#1a0a00', surface: '#2d1500', border: 'rgba(220,120,50,0.25)',
               text: '#fff8f0', muted: '#d97706', primary: '#ea580c', accent: '#f59e0b', cta: '#ea580c' },
    fonts: { heading: 'Playfair Display', body: 'Lato', mono: 'Georgia' },
    mood: 'restaurant food dining catering',
  },

  // ── ECOMMERCE ─────────────────────────────────────────────
  market: {
    name: 'Market', emoji: '🛍️',
    desc: 'Bold conversion-focused — ecommerce, retail & shops',
    palette: { bg: '#ffffff', surface: '#f9fafb', border: '#e5e7eb',
               text: '#111827', muted: '#6b7280', primary: '#7c3aed', accent: '#ec4899', cta: '#7c3aed' },
    fonts: { heading: 'Inter', body: 'Inter', mono: 'monospace' },
    mood: 'ecommerce shop retail fashion market',
  },

  // ── PORTFOLIO / CREATIVE ───────────────────────────────────
  canvas: {
    name: 'Canvas', emoji: '🎨',
    desc: 'Creative portfolio — designers, photographers & artists',
    palette: { bg: '#0a0a0a', surface: '#111111', border: 'rgba(255,255,255,0.1)',
               text: '#ffffff', muted: '#888888', primary: '#ffffff', accent: '#888888', cta: '#ffffff' },
    fonts: { heading: 'Space Grotesk', body: 'DM Sans', mono: 'Fira Code' },
    mood: 'portfolio creative design photography art',
  },

  // ── REAL ESTATE ───────────────────────────────────────────
  estate: {
    name: 'Estate', emoji: '🏠',
    desc: 'Sophisticated property — real estate & architecture',
    palette: { bg: '#0f1117', surface: '#1c1f2e', border: 'rgba(100,116,139,0.25)',
               text: '#f1f5f9', muted: '#94a3b8', primary: '#64748b', accent: '#c0a060', cta: '#c0a060' },
    fonts: { heading: 'Cormorant Garamond', body: 'Jost', mono: 'monospace' },
    mood: 'real estate property architecture luxury',
  },

  // ── EDUCATION ─────────────────────────────────────────────
  scholar: {
    name: 'Scholar', emoji: '🎓',
    desc: 'Trust and knowledge — schools, courses & academia',
    palette: { bg: '#fafaf9', surface: '#f5f5f4', border: '#d6d3d1',
               text: '#1c1917', muted: '#78716c', primary: '#0f766e', accent: '#0d9488', cta: '#0f766e' },
    fonts: { heading: 'Merriweather', body: 'Source Serif Pro', mono: 'monospace' },
    mood: 'education school course learning academy',
  },

  // ── FITNESS ───────────────────────────────────────────────
  iron: {
    name: 'Iron', emoji: '💪',
    desc: 'Raw power and grit — gyms, sports & fitness brands',
    palette: { bg: '#09090b', surface: '#18181b', border: 'rgba(239,68,68,0.2)',
               text: '#f4f4f5', muted: '#a1a1aa', primary: '#ef4444', accent: '#f97316', cta: '#ef4444' },
    fonts: { heading: 'Bebas Neue', body: 'Barlow', mono: 'monospace' },
    mood: 'fitness gym sports workout health club',
  },

  // ── SAAS / STARTUP ────────────────────────────────────────
  gradient: {
    name: 'Gradient', emoji: '🌈',
    desc: 'Modern gradient mesh — SaaS, apps & AI startups',
    palette: { bg: '#030014', surface: '#0f0524', border: 'rgba(139,92,246,0.2)',
               text: '#f8fafc', muted: '#94a3b8', primary: '#6366f1', accent: '#8b5cf6', cta: '#6366f1' },
    fonts: { heading: 'Sora', body: 'Inter', mono: 'JetBrains Mono' },
    mood: 'saas app startup ai gradient modern',
  },
};

// ── AUTO-DETECT best style from business type ──────────────
export function autoDetectStyle(businessType, category, description = '', tone = 'professional') {
  const combined = (businessType + ' ' + category + ' ' + description + ' ' + tone).toLowerCase();

  if (/restaurant|food|dining|cafe|catering|kitchen|bistro|bar|chef/.test(combined)) return 'feast';
  if (/salon|beauty|spa|hair|nail|makeup|skincare|wellness|massage/.test(combined)) return 'bloom';
  if (/gym|fitness|yoga|crossfit|workout|sport|training|athlete/.test(combined)) return 'iron';
  if (/clinic|hospital|doctor|medical|dental|pharmacy|health/.test(combined)) return 'pulse_med';
  if (/school|university|academy|course|education|training|tutor|learn/.test(combined)) return 'scholar';
  if (/real.estate|property|house|apartment|housing|rent|agent|mortgage/.test(combined)) return 'estate';
  if (/fashion|clothing|boutique|wear|style|apparel/.test(combined)) return 'market';
  if (/photo|design|creative|artist|portfolio|studio|gallery/.test(combined)) return 'canvas';
  if (/saas|software|app|platform|api|tech|startup|digital/.test(combined)) return 'nova';
  if (/finance|bank|invest|insurance|legal|law|consult/.test(combined)) return 'slate';
  if (/church|ministry|ngo|foundation|charity/.test(combined)) return 'naija';
  if (/african|naija|nigeria|local|market|ankara|kente/.test(combined)) return 'kente';
  if (/luxury|premium|exclusive|vip|concierge/.test(combined)) return 'onyx';
  if (/event|party|wedding|entertainment|nightlife|club/.test(combined)) return 'pulse';
  if (/shop|store|ecommerce|product|sell|retail/.test(combined)) return 'market';
  if (/agency|marketing|branding|pr|advertis/.test(combined)) return 'gradient';
  if (/farm|agric|organic|eco|green|nature|food.production/.test(combined)) return 'terra';
  if (/construction|building|contractor|architecture|engineering/.test(combined)) return 'zinc';
  if (tone === 'luxury' || tone === 'premium') return 'onyx';
  if (tone === 'casual' || tone === 'friendly') return 'aria';

  return 'nova'; // default
}

// ── Generate premium CSS variables from style ──────────────
export function generateStyleCSS(styleKey) {
  const style = DESIGN_STYLES[styleKey] || DESIGN_STYLES.nova;
  const p = style.palette;
  const f = style.fonts;

  return `
  /* ERGIO Design System — ${style.name} */
  @import url('https://fonts.googleapis.com/css2?family=${f.heading.replace(/ /g,'+')}:wght@400;600;700;800;900&family=${f.body.replace(/ /g,'+')}:wght@400;500;600&display=swap');
  
  :root {
    --bg: ${p.bg};
    --surface: ${p.surface};
    --border: ${p.border};
    --text: ${p.text};
    --muted: ${p.muted};
    --primary: ${p.primary};
    --accent: ${p.accent};
    --cta: ${p.cta};
    --font-heading: '${f.heading}', sans-serif;
    --font-body: '${f.body}', sans-serif;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--font-body); }
  h1,h2,h3,h4,h5 { font-family: var(--font-heading); }
  `;
}

export default DESIGN_STYLES;
