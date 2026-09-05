// ============================================================
// ERGIO DESIGN TOKEN SYSTEM v1.0
// Three-tier token architecture (Primitive -> Semantic -> Component)
// Inspired by Material Design 3, USWDS, and Tailwind's approach
// Generates CSS custom properties for consistent design language
// ============================================================

export function generateDesignTokens(styleName, customColors = {}) {
  const style = getStyleConfig(styleName);
  const colors = { ...style.palette, ...customColors };
  const ctaColor = colors.cta || colors.primary;
  const onPrimary = getContrastColor(colors.primary, colors.bg, colors.text);
  const onCta = getContrastColor(ctaColor, colors.bg, colors.text);
  
  return `<style>
:root {
  /* PRIMITIVE */
  --color-bg-raw: ${colors.bg};
  --color-surface-raw: ${colors.surface};
  --color-primary-raw: ${colors.primary};
  --color-accent-raw: ${colors.accent};
  --color-text-raw: ${colors.text};
  --color-muted-raw: ${colors.muted};
  --color-border-raw: ${colors.border};
  --color-cta-raw: ${ctaColor};
  
  /* SEMANTIC */
  --color-bg: var(--color-bg-raw);
  --color-surface: var(--color-surface-raw);
  --color-surface-hover: ${lighten(colors.surface, 5)};
  --color-elevated: ${lighten(colors.surface, 10)};
  --color-primary: var(--color-primary-raw);
  --color-primary-hover: ${lighten(colors.primary, 10)};
  --color-accent: var(--color-accent-raw);
  --color-cta: var(--color-cta-raw);
  --color-cta-hover: ${lighten(ctaColor, 10)};
  --color-text: var(--color-text-raw);
  --color-text-secondary: ${blend(colors.text, colors.muted, 0.5)};
  --color-muted: var(--color-muted-raw);
  --color-border: var(--color-border-raw);
  --color-border-strong: ${lighten(colors.border, 15)};
  --color-on-primary: ${onPrimary};
  --color-on-cta: ${onCta};
  
  /* SPACING (4px base, 1.5x ratio) */
  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem;
  --space-4: 1rem; --space-5: 1.5rem; --space-6: 2rem;
  --space-8: 3rem; --space-10: 4rem; --space-12: 6rem;
  --space-16: 8rem; --space-20: 10rem;
  
  /* SECTION */
  --section-py: clamp(3rem, 8vw, 7rem);
  --section-px: clamp(1.5rem, 5vw, 5rem);
  --container-max: 1200px;
  --container-narrow: 800px;
  --container-wide: 1400px;
  
  /* TYPOGRAPHY */
  --font-display: '${style.fonts.heading}', ${style.fonts.heading.includes('Playfair') || style.fonts.heading.includes('Crimson') || style.fonts.heading.includes('Cormorant') || style.fonts.heading.includes('Merriweather') ? 'serif' : 'sans-serif'};
  --font-body: '${style.fonts.body}', sans-serif;
  --font-mono: '${style.fonts.mono || 'monospace'}', monospace;
  
  --text-xs: 0.75rem; --text-sm: 0.875rem; --text-base: 1rem;
  --text-lg: 1.125rem; --text-xl: 1.25rem; --text-2xl: 1.5rem;
  --text-3xl: 1.875rem; --text-4xl: 2.25rem; --text-5xl: 3rem;
  --text-6xl: clamp(2.5rem, 6vw, 4.5rem);
  --text-7xl: clamp(3rem, 8vw, 6rem);
  
  --leading-tight: 1.1; --leading-snug: 1.3; --leading-normal: 1.6; --leading-relaxed: 1.8;
  --tracking-tight: -0.03em; --tracking-normal: 0; --tracking-wide: 0.025em;
  --tracking-wider: 0.05em; --tracking-widest: 0.1em;
  --weight-light: 300; --weight-normal: 400; --weight-medium: 500;
  --weight-semibold: 600; --weight-bold: 700; --weight-black: 900;
  
  /* RADIUS */
  --radius-sm: 0.25rem; --radius-md: 0.5rem; --radius-lg: 0.75rem;
  --radius-xl: 1rem; --radius-2xl: 1.5rem; --radius-full: 9999px;
  
  /* SHADOWS */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.12);
  --shadow-xl: 0 20px 40px rgba(0,0,0,0.15);
  --shadow-glow: 0 0 30px ${colors.primary}33;
  
  /* TRANSITIONS */
  --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-bounce: 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  
  /* Z-INDEX */
  --z-base: 1; --z-content: 2; --z-header: 50; --z-overlay: 100; --z-modal: 200; --z-toast: 300;
}

/* RESET */
* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
body { 
  font-family: var(--font-body); background: var(--color-bg); color: var(--color-text);
  font-size: var(--text-base); line-height: var(--leading-normal);
  -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

/* LAYOUT */
.container { max-width: var(--container-max); margin: 0 auto; padding: 0 var(--section-px); }
.container-narrow { max-width: var(--container-narrow); margin: 0 auto; padding: 0 var(--section-px); }
.container-wide { max-width: var(--container-wide); margin: 0 auto; padding: 0 var(--section-px); }
.section { padding: var(--section-py) 0; position: relative; }

/* TYPOGRAPHY */
.font-display { font-family: var(--font-display); }
.text-xs { font-size: var(--text-xs); } .text-sm { font-size: var(--text-sm); }
.text-base { font-size: var(--text-base); } .text-lg { font-size: var(--text-lg); }
.text-xl { font-size: var(--text-xl); } .text-2xl { font-size: var(--text-2xl); }
.text-4xl { font-size: var(--text-4xl); } .text-5xl { font-size: var(--text-5xl); }
.text-6xl { font-size: var(--text-6xl); } .text-7xl { font-size: var(--text-7xl); }
.text-primary { color: var(--color-primary); } .text-accent { color: var(--color-accent); }
.text-muted { color: var(--color-muted); } .text-secondary { color: var(--color-text-secondary); }
.tracking-widest { letter-spacing: var(--tracking-widest); }
.tracking-tight { letter-spacing: var(--tracking-tight); }
.uppercase { text-transform: uppercase; }
.font-light { font-weight: var(--weight-light); } .font-medium { font-weight: var(--weight-medium); }
.font-semibold { font-weight: var(--weight-semibold); } .font-bold { font-weight: var(--weight-bold); }
.font-black { font-weight: var(--weight-black); }

/* COMPONENTS */
.btn { 
  display: inline-flex; align-items: center; gap: var(--space-2);
  padding: var(--space-4) var(--space-6); border-radius: var(--radius-md);
  font-weight: var(--weight-semibold); font-size: var(--text-base);
  text-decoration: none; transition: all var(--transition-base); cursor: pointer;
  border: none; letter-spacing: var(--tracking-tight);
}
.btn-primary { background: var(--color-cta); color: var(--color-on-cta); box-shadow: var(--shadow-md); }
.btn-primary:hover { background: var(--color-cta-hover); transform: translateY(-2px); box-shadow: var(--shadow-lg); }
.btn-outline { background: transparent; color: var(--color-text); border: 1px solid var(--color-border-strong); }
.btn-outline:hover { background: var(--color-surface-hover); border-color: var(--color-primary); }
.btn-ghost { background: transparent; color: var(--color-text); }
.btn-ghost:hover { background: var(--color-surface); }

.card {
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-lg); padding: var(--space-6);
  transition: all var(--transition-base);
}
.card:hover { 
  background: var(--color-surface-hover); border-color: var(--color-border-strong);
  transform: translateY(-4px); box-shadow: var(--shadow-lg);
}

.badge {
  display: inline-block; padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full); font-size: var(--text-xs);
  font-weight: var(--weight-semibold); letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
}

.eyebrow {
  font-size: var(--text-xs); font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-widest); text-transform: uppercase;
  color: var(--color-primary); display: inline-block; margin-bottom: var(--space-3);
}

.heading-section {
  font-family: var(--font-display); font-size: var(--text-5xl);
  font-weight: var(--weight-bold); line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight); margin-bottom: var(--space-4);
}

.lead {
  font-size: var(--text-lg); line-height: var(--leading-relaxed);
  color: var(--color-text-secondary); max-width: 60ch;
}

/* ANIMATIONS */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
@keyframes fadeInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

.reveal { opacity: 1; transform: translateY(40px); transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
.reveal.active { opacity: 1; transform: translateY(0); }

/* RESPONSIVE */
@media (max-width: 768px) {
  :root {
    --section-py: clamp(2.5rem, 10vw, 4rem);
    --text-6xl: clamp(2rem, 8vw, 3rem);
    --text-7xl: clamp(2.5rem, 10vw, 4rem);
  }
  .container, .container-narrow, .container-wide { padding: 0 var(--space-4); }
}

/* ACCESSIBILITY */
:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  .reveal { opacity: 1; transform: none; }
}
</style>`;
}

function getStyleConfig(name) {
  const styles = {
    nova: { name:'Nova', palette:{bg:'#08090f',surface:'#111827',border:'rgba(0,217,255,0.15)',text:'#f0f4ff',muted:'#8892a4',primary:'#00D9FF',accent:'#7c3aed',cta:'#00D9FF'}, fonts:{heading:'Sora',body:'Inter',mono:'Fira Code'} },
    aria: { name:'Aria', palette:{bg:'#ffffff',surface:'#f8f9fa',border:'#e5e7eb',text:'#111827',muted:'#6b7280',primary:'#2563eb',accent:'#7c3aed',cta:'#2563eb'}, fonts:{heading:'Plus Jakarta Sans',body:'Inter',mono:'JetBrains Mono'} },
    onyx: { name:'Onyx', palette:{bg:'#0a0a0a',surface:'#111111',border:'rgba(212,175,55,0.2)',text:'#f5f5f0',muted:'#888882',primary:'#D4AF37',accent:'#C0A020',cta:'#D4AF37'}, fonts:{heading:'Playfair Display',body:'Lato',mono:'Courier New'} },
    bloom: { name:'Bloom', palette:{bg:'#fff5f7',surface:'#fff0f3',border:'#fecdd3',text:'#881337',muted:'#be185d',primary:'#ec4899',accent:'#f472b6',cta:'#ec4899'}, fonts:{heading:'Cormorant Garamond',body:'Montserrat',mono:'Georgia'} },
    pulse: { name:'Pulse', palette:{bg:'#0d0118',surface:'#160228',border:'rgba(167,139,250,0.2)',text:'#f8f0ff',muted:'#a78bfa',primary:'#8b5cf6',accent:'#ec4899',cta:'#8b5cf6'}, fonts:{heading:'Nunito',body:'DM Sans',mono:'Fira Code'} },
    flame: { name:'Flame', palette:{bg:'#0f0a00',surface:'#1a1200',border:'rgba(251,146,60,0.2)',text:'#fff7ed',muted:'#d97706',primary:'#f97316',accent:'#ef4444',cta:'#f97316'}, fonts:{heading:'Bebas Neue',body:'Nunito',mono:'monospace'} },
    terra: { name:'Terra', palette:{bg:'#0f1a0f',surface:'#1a2e1a',border:'rgba(134,239,172,0.15)',text:'#f0fdf4',muted:'#86efac',primary:'#22c55e',accent:'#84cc16',cta:'#22c55e'}, fonts:{heading:'Merriweather',body:'Source Sans Pro',mono:'monospace'} },
    ivory: { name:'Ivory', palette:{bg:'#fefce8',surface:'#fef9c3',border:'#d97706',text:'#1c1917',muted:'#78716c',primary:'#92400e',accent:'#b45309',cta:'#92400e'}, fonts:{heading:'Crimson Text',body:'Libre Baskerville',mono:'Georgia'} },
    slate: { name:'Slate', palette:{bg:'#0f172a',surface:'#1e293b',border:'rgba(59,130,246,0.2)',text:'#f1f5f9',muted:'#94a3b8',primary:'#3b82f6',accent:'#6366f1',cta:'#3b82f6'}, fonts:{heading:'Inter',body:'Inter',mono:'JetBrains Mono'} },
    coastal: { name:'Coastal', palette:{bg:'#f0f9ff',surface:'#e0f2fe',border:'#7dd3fc',text:'#0c4a6e',muted:'#0369a1',primary:'#0284c7',accent:'#06b6d4',cta:'#0284c7'}, fonts:{heading:'Outfit',body:'Nunito',mono:'monospace'} },
    apple: { name:'Apple Keynote', palette:{bg:'#fbfbfd',surface:'#ffffff',border:'#d2d2d7',text:'#1d1d1f',muted:'#6e6e73',primary:'#0071e3',accent:'#2997ff',cta:'#0071e3'}, fonts:{heading:'Plus Jakarta Sans',body:'Inter',mono:'JetBrains Mono'} },
    dribbble: { name:'Dribbble Shot', palette:{bg:'#fafbff',surface:'#ffffff',border:'#e6e8f2',text:'#0d0c22',muted:'#6e6b8d',primary:'#ea4c89',accent:'#7b61ff',cta:'#ea4c89'}, fonts:{heading:'Space Grotesk',body:'DM Sans',mono:'JetBrains Mono'} },
    vercel: { name:'Geist Mono', palette:{bg:'#000000',surface:'#0a0a0a',border:'rgba(255,255,255,0.14)',text:'#ededed',muted:'#a1a1a1',primary:'#ffffff',accent:'#0070f3',cta:'#ffffff'}, fonts:{heading:'Inter',body:'Inter',mono:'JetBrains Mono'} },
    prism: { name:'Prism Glass', palette:{bg:'#f6f7ff',surface:'#ffffff',border:'#e3e6ff',text:'#0f1222',muted:'#5b6178',primary:'#6366f1',accent:'#d946ef',cta:'#6366f1'}, fonts:{heading:'Sora',body:'Inter',mono:'JetBrains Mono'} },
    kinetic: { name:'Kinetic Motion', palette:{bg:'#0b0021',surface:'#140031',border:'rgba(139,92,246,0.25)',text:'#f4f0ff',muted:'#a39bd6',primary:'#8b5cf6',accent:'#06b6d4',cta:'#8b5cf6'}, fonts:{heading:'Space Grotesk',body:'DM Sans',mono:'Fira Code'} },
    default: { name:'Default', palette:{bg:'#0a0a0a',surface:'#141414',border:'rgba(255,255,255,0.1)',text:'#f5f5f5',muted:'#888888',primary:'#00D9FF',accent:'#7c3aed',cta:'#00D9FF'}, fonts:{heading:'Inter',body:'Inter',mono:'monospace'} },
  };
  return styles[name] || styles.default;
}

function lighten(color, percent) {
  if (color.startsWith('rgba') || color.startsWith('rgb')) {
    const match = color.match(/[\d.]+/g);
    if (!match) return color;
    const r = Math.min(255, parseInt(match[0]) + Math.round(255 * percent / 100));
    const g = Math.min(255, parseInt(match[1]) + Math.round(255 * percent / 100));
    const b = Math.min(255, parseInt(match[2]) + Math.round(255 * percent / 100));
    const a = match[3] || '1';
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  const hex = color.replace('#', '');
  if (hex.length !== 6) return color;
  const r = Math.min(255, parseInt(hex.slice(0, 2), 16) + Math.round(255 * percent / 100));
  const g = Math.min(255, parseInt(hex.slice(2, 4), 16) + Math.round(255 * percent / 100));
  const b = Math.min(255, parseInt(hex.slice(4, 6), 16) + Math.round(255 * percent / 100));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function blend(c1, c2, ratio) {
  const hex1 = c1.replace('#', ''); const hex2 = c2.replace('#', '');
  if (hex1.length !== 6 || hex2.length !== 6) return c1;
  const r = Math.round(parseInt(hex1.slice(0, 2), 16) * (1 - ratio) + parseInt(hex2.slice(0, 2), 16) * ratio);
  const g = Math.round(parseInt(hex1.slice(2, 4), 16) * (1 - ratio) + parseInt(hex2.slice(2, 4), 16) * ratio);
  const b = Math.round(parseInt(hex1.slice(4, 6), 16) * (1 - ratio) + parseInt(hex2.slice(4, 6), 16) * ratio);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function getContrastColor(primary, bg, text) {
  const hex = primary.replace('#', '');
  if (hex.length !== 6) return text;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#0a0a0a' : '#ffffff';
}

export function generateFontLinks(styleName) {
  const style = getStyleConfig(styleName);
  const fonts = new Set([style.fonts.heading, style.fonts.body]);
  const fontMap = {
    'Sora': 'Sora:wght@300;400;600;700;800',
    'Inter': 'Inter:wght@300;400;500;600;700;800;900',
    'Plus Jakarta Sans': 'Plus+Jakarta+Sans:wght@400;500;600;700;800',
    'Playfair Display': 'Playfair+Display:wght@400;500;600;700;800;900',
    'Lato': 'Lato:wght@300;400;700;900',
    'Cormorant Garamond': 'Cormorant+Garamond:wght@400;500;600;700',
    'Montserrat': 'Montserrat:wght@300;400;500;600;700;800',
    'Nunito': 'Nunito:wght@300;400;600;700;800;900',
    'DM Sans': 'DM+Sans:wght@400;500;700',
    'Bebas Neue': 'Bebas+Neue',
    'Merriweather': 'Merriweather:wght@400;700;900',
    'Source Sans Pro': 'Source+Sans+Pro:wght@300;400;600;700',
    'Crimson Text': 'Crimson+Text:wght@400;600;700',
    'Libre Baskerville': 'Libre+Baskerville:wght@400;700',
    'Outfit': 'Outfit:wght@300;400;500;600;700;800',
    'Fira Code': 'Fira+Code:wght@400;500;600',
    'JetBrains Mono': 'JetBrains+Mono:wght@400;500;600;700',
    'Space Grotesk': 'Space+Grotesk:wght@300;400;500;600;700',
  };
  const googleFonts = [];
  fonts.forEach(f => { if (fontMap[f]) googleFonts.push(`family=${fontMap[f]}`); });
  if (googleFonts.length === 0) return '';
  return `https://fonts.googleapis.com/css2?${googleFonts.join('&')}&display=swap`;
}
