// ============================================================
// ERGIO DESIGN LINTER v1.0
// Analyzes generated website HTML and returns a quality score
// with actionable fixes. Used by the "Fix Layout" button.
// ============================================================

export function lintWebsite(html, data = {}) {
  const issues = [];
  const passes = [];
  let score = 100;

  // ── 1. SEMANTIC HTML CHECK ─────────────────────────────────
  const hasHeader = /<header/i.test(html);
  const hasFooter = /<footer/i.test(html);
  const hasNav = /<nav/i.test(html) || /class=".*nav.*"/i.test(html);
  const hasMain = /<main/i.test(html) || /<section.*id="home"/i.test(html);
  const hasSections = (html.match(/<section/gi) || []).length;

  if (!hasHeader) { issues.push({ type: 'semantic', severity: 'warn', message: 'No <header> tag found — add semantic header', fix: 'add-header' }); score -= 5; }
  else passes.push('Semantic header present');

  if (!hasFooter) { issues.push({ type: 'semantic', severity: 'error', message: 'No <footer> tag found', fix: 'add-footer' }); score -= 10; }
  else passes.push('Semantic footer present');

  if (hasSections < 3) { issues.push({ type: 'structure', severity: 'warn', message: `Only ${hasSections} sections — consider adding more content`, fix: 'add-sections' }); score -= 5; }
  else passes.push(`${hasSections} content sections detected`);

  // ── 2. RESPONSIVE CHECK ─────────────────────────────────────
  const hasViewport = /viewport.*width=device-width/i.test(html);
  const hasMediaQueries = /@media[^{]+\{/i.test(html);
  const hasResponsiveClasses = /grid|flex|responsive|mobile|container/i.test(html);

  if (!hasViewport) { issues.push({ type: 'responsive', severity: 'error', message: 'Missing viewport meta tag — site will not scale on mobile', fix: 'add-viewport' }); score -= 15; }
  else passes.push('Viewport meta tag present');

  if (!hasMediaQueries && !hasResponsiveClasses) {
    issues.push({ type: 'responsive', severity: 'warn', message: 'No media queries detected — layout may break on mobile', fix: 'add-media-queries' });
    score -= 10;
  } else passes.push('Responsive layout detected');

  // ── 3. ACCESSIBILITY CHECK ──────────────────────────────────
  const imgCount = (html.match(/<img/gi) || []).length;
  const altCount = (html.match(/alt=/gi) || []).length;
  const hasAriaLabels = /aria-label|aria-labelledby|role=/i.test(html);

  if (imgCount > 0 && altCount < imgCount) {
    issues.push({ type: 'accessibility', severity: 'warn', message: `${imgCount - altCount} images missing alt attributes`, fix: 'add-alt-text' });
    score -= 5;
  } else if (imgCount > 0) passes.push('All images have alt text');

  if (!hasAriaLabels) {
    issues.push({ type: 'accessibility', severity: 'info', message: 'No ARIA labels — add for screen reader support', fix: 'add-aria' });
    score -= 3;
  } else passes.push('ARIA attributes present');

  // ── 4. PERFORMANCE CHECK ───────────────────────────────────
  const hasLazyLoading = /loading="lazy"/i.test(html);
  const hasMinifiedCSS = !/\n\s{4,}/.test(html.match(/<style>[\s\S]*?<\/style>/i)?.[0] || '');
  const imgWithSize = (html.match(/<img[^>]*(?:width|srcset)/gi) || []).length;

  if (!hasLazyLoading && imgCount > 2) {
    issues.push({ type: 'performance', severity: 'warn', message: 'Images missing lazy loading — will slow initial page load', fix: 'add-lazy-loading' });
    score -= 5;
  } else if (hasLazyLoading) passes.push('Lazy loading enabled');

  if (imgCount > 0 && imgWithSize < imgCount) {
    issues.push({ type: 'performance', severity: 'info', message: 'Images missing explicit dimensions — may cause layout shift', fix: 'add-img-dimensions' });
    score -= 3;
  }

  // ── 5. SEO CHECK ────────────────────────────────────────────
  const hasTitle = /<title>[^<]+<\/title>/i.test(html);
  const hasMetaDesc = /<meta[^>]*name="description"[^>]*content="[^"]+"/i.test(html);
  const hasOGTags = /<meta[^>]*property="og:/i.test(html);
  const hasCanonical = /<link[^>]*rel="canonical"/i.test(html);
  const hasH1 = (html.match(/<h1/gi) || []).length === 1;

  if (!hasTitle) { issues.push({ type: 'seo', severity: 'error', message: 'Missing <title> tag', fix: 'add-title' }); score -= 10; }
  else passes.push('Title tag present');

  if (!hasMetaDesc) { issues.push({ type: 'seo', severity: 'warn', message: 'Missing meta description — critical for search ranking', fix: 'add-meta-desc' }); score -= 8; }
  else passes.push('Meta description present');

  if (!hasOGTags) { issues.push({ type: 'seo', severity: 'info', message: 'No Open Graph tags — social sharing will look plain', fix: 'add-og-tags' }); score -= 3; }
  else passes.push('Open Graph tags present');

  if (!hasH1) {
    const h1Count = (html.match(/<h1/gi) || []).length;
    if (h1Count === 0) { issues.push({ type: 'seo', severity: 'error', message: 'No H1 tag — critical for SEO', fix: 'add-h1' }); score -= 10; }
    else { issues.push({ type: 'seo', severity: 'warn', message: `Multiple H1 tags (${h1Count}) — should be exactly one`, fix: 'fix-h1' }); score -= 5; }
  } else passes.push('Exactly one H1 tag');

  // ── 6. CONTENT CHECK ────────────────────────────────────────
  const wordCount = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  if (wordCount < 100) {
    issues.push({ type: 'content', severity: 'warn', message: `Only ~${wordCount} words — add more content for better SEO`, fix: 'add-content' });
    score -= 8;
  } else if (wordCount < 300) {
    issues.push({ type: 'content', severity: 'info', message: `~${wordCount} words — aim for 500+ for best SEO`, fix: 'add-content' });
    score -= 3;
  } else passes.push(`Good content depth (~${wordCount} words)`);

  const hasCTA = /btn-primary|btn-cta|get.started|contact.*us|book.*now/i.test(html);
  if (!hasCTA) { issues.push({ type: 'content', severity: 'warn', message: 'No clear call-to-action detected — users won\\'t know what to do', fix: 'add-cta' }); score -= 5; }
  else passes.push('Clear call-to-action present');

  // ── 7. DESIGN CONSISTENCY CHECK ─────────────────────────────
  const colorCount = new Set(
    (html.match(/#[0-9a-fA-F]{3,8}/g) || []).map(c => c.toLowerCase())
  ).size;
  if (colorCount > 12) {
    issues.push({ type: 'design', severity: 'info', message: `${colorCount} unique colors detected — consider a tighter palette`, fix: 'limit-colors' });
    score -= 3;
  } else passes.push(`Consistent color palette (${colorCount} colors)`);

  const fontCount = new Set(
    (html.match(/font-family:\s*([^;"]+)/gi) || [])
      .map(f => f.replace(/font-family:\s*/i, '').replace(/['"]/g, '').split(',')[0].trim().toLowerCase())
  ).size;
  if (fontCount > 4) {
    issues.push({ type: 'design', severity: 'info', message: `${fontCount} different fonts — limit to 2-3 for consistency`, fix: 'limit-fonts' });
    score -= 3;
  } else passes.push(`Good font discipline (${fontCount} fonts)`);

  // ── 8. ERGIO BRANDING CHECK ─────────────────────────────────
  const hasErgioBrand = /powered.*er gio|er gio.*ai.*business/i.test(html) || /powered.*ERGIO/i.test(html);
  if (!hasErgioBrand) {
    issues.push({ type: 'branding', severity: 'warn', message: 'Missing "Powered by ERGIO" footer branding', fix: 'add-er gio-branding' });
    score -= 5;
  } else passes.push('ERGIO branding present');

  // Clamp score
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Grade
  let grade;
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  return {
    score,
    grade,
    issues,
    passes,
    summary: {
      total: issues.length + passes.length,
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warn').length,
      info: issues.filter(i => i.severity === 'info').length,
      passed: passes.length,
    },
    recommendations: issues.map(i => i.message),
  };
}

// ── AUTO-FIX FUNCTION ─────────────────────────────────────────
// Applies the most critical fixes to HTML
export function autoFixHtml(html, data = {}) {
  let fixed = html;

  // Fix: Add viewport if missing
  if (!/viewport.*width=device-width/i.test(fixed)) {
    fixed = fixed.replace(/<head>/i, '<head>\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">');
  }

  // Fix: Add meta description if missing
  if (!/<meta[^>]*name="description"/i.test(fixed)) {
    const desc = data.description || data.tagline || `${data.name || 'Business'} — Professional services in ${data.city || 'Lagos'}, Nigeria`;
    fixed = fixed.replace(/<head>/i, `<head>\n    <meta name="description" content="${desc}">`);
  }

  // Fix: Add OG tags if missing
  if (!/<meta[^>]*property="og:/i.test(fixed)) {
    const ogTags = `
    <meta property="og:title" content="${data.name || 'Business'}">
    <meta property="og:description" content="${data.tagline || data.description || ''}">
    <meta property="og:type" content="website">`;
    fixed = fixed.replace(/<\/head>/i, `${ogTags}\n</head>`);
  }

  // Fix: Add lazy loading to images
  fixed = fixed.replace(/<img(?![^>]*loading=)/gi, '<img loading="lazy"');

  // Fix: Add alt text to images without it
  fixed = fixed.replace(/<img(?![^>]*alt=)([^>]*)>/gi, (match, rest) => {
    const srcMatch = rest.match(/src="([^"]+)"/);
    const alt = srcMatch ? srcMatch[1].split('/').pop().split('.')[0].replace(/[-_]/g, ' ') : 'Image';
    return `<img${rest} alt="${alt}">`;
  });

  // Fix: Ensure "Powered by ERGIO" footer
  if (!/powered.*ERGIO/i.test(fixed)) {
    fixed = fixed.replace(/<\/body>/i, `
<footer style="text-align:center; padding:2rem; background:${data.colors?.surface || '#111'}; color:${data.colors?.muted || '#888'}; font-size:0.85rem;">
  <p>Powered by <strong style="color:${data.colors?.primary || '#00D9FF'};">ERGIO</strong> — AI Business OS for Africa</p>
</footer>
</body>`);
  }

  return fixed;
}

export default { lintWebsite, autoFixHtml };
