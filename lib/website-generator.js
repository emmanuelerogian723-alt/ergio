// =============================================
// ERGIO WEBSITE GENERATOR v3.0
// Wix Aria-quality output with 15+ sections
// Rich animations, interactions, booking modal
// =============================================

export function generateRichWebsiteHTML(plan, brand, content, colors, logoUrl, images = {}) {
  const c = colors || { primary: '#00D9FF', secondary: '#09090B', accent: '#00FF9D', bg: '#09090B' };
  const hero = content.hero || {};
  const about = content.about || plan.description || '';
  const contact = content.contactInfo || {};
  const testimonials = content.testimonials || [];
  const whyChooseUs = content.whyChooseUs || [];
  const faq = content.faq || [];
  
  const heroImg = images.hero?.[0]?.url || `https://source.unsplash.com/1400x800/?${encodeURIComponent(plan.type + ' ' + plan.city)}`;
  const aboutImg = images.about?.[0]?.url || `https://source.unsplash.com/800x600/?${encodeURIComponent(plan.type + ' team')}`;
  const galleryImgs = (images.gallery || []).map(i => i.url);
  while (galleryImgs.length < 6) galleryImgs.push(`https://source.unsplash.com/600x400/?${encodeURIComponent(plan.type)}&sig=${galleryImgs.length}`);
  
  const services = plan.services || [];
  const slug = (plan.businessName || 'business').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const phone = contact.phone || '+234 800 000 0000';
  const whatsapp = contact.whatsapp || phone.replace(/[^0-9]/g, '');
  const address = contact.address || `${plan.city || 'Lagos'}, Nigeria`;
  const email = contact.email || `hello@${slug}.com`;

  // Pick design style based on business type
  const isDark = !['editorial-light', 'organic-soft', 'magazine-clean'].includes(plan.designStyle || '');
  const textColor = isDark ? '#F8FAFC' : '#0F172A';
  const mutedColor = isDark ? '#94A3B8' : '#64748B';
  const surfaceColor = isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.seoTitle || plan.businessName + ' — ' + plan.tagline}</title>
  <meta name="description" content="${content.seoDescription || plan.description || ''}">
  <meta name="keywords" content="${(plan.seoKeywords || []).join(', ')}">
  <meta property="og:title" content="${plan.businessName}">
  <meta property="og:description" content="${plan.tagline || ''}">
  <meta property="og:image" content="${heroImg}">
  <meta name="robots" content="index, follow">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    /* ===== RESET & ROOT ===== */
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
    :root {
      --primary: ${c.primary};
      --accent: ${c.accent};
      --bg: ${c.bg};
      --text: ${textColor};
      --muted: ${mutedColor};
      --surface: ${surfaceColor};
      --border: ${borderColor};
      --radius: 16px;
      --shadow: 0 20px 60px rgba(0,0,0,.25);
    }
    html { scroll-behavior: smooth; font-size: 16px; }
    body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; overflow-x: hidden; }
    img { display: block; max-width: 100%; }
    a { text-decoration: none; color: inherit; }
    button { cursor: pointer; font-family: inherit; }

    /* ===== ANIMATIONS ===== */
    @keyframes fadeUp { from { opacity:0; transform:translateY(50px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes scaleIn { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
    @keyframes slideLeft { from { opacity:0; transform:translateX(-60px); } to { opacity:1; transform:translateX(0); } }
    @keyframes slideRight { from { opacity:0; transform:translateX(60px); } to { opacity:1; transform:translateX(0); } }
    @keyframes float { 0%,100% { transform:translateY(0px); } 50% { transform:translateY(-16px); } }
    @keyframes gradient-move { 0% { background-position:0% 50%; } 50% { background-position:100% 50%; } 100% { background-position:0% 50%; } }
    @keyframes counter-up { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    @keyframes glow-pulse { 0%,100% { box-shadow:0 0 20px rgba(0,217,255,.2); } 50% { box-shadow:0 0 40px rgba(0,217,255,.5); } }
    @keyframes marquee { from { transform:translateX(0); } to { transform:translateX(-50%); } }
    @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
    @keyframes ping { 0% { transform:scale(1); opacity:1; } 75%,100% { transform:scale(1.8); opacity:0; } }
    @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
    
    .reveal { opacity:0; transform:translateY(40px); transition:opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1); }
    .reveal.visible { opacity:1; transform:translateY(0); }
    .reveal-left { opacity:0; transform:translateX(-50px); transition:all .7s cubic-bezier(.16,1,.3,1); }
    .reveal-left.visible { opacity:1; transform:translateX(0); }
    .reveal-right { opacity:0; transform:translateX(50px); transition:all .7s cubic-bezier(.16,1,.3,1); }
    .reveal-right.visible { opacity:1; transform:translateX(0); }
    .stagger-child { opacity:0; transform:translateY(30px); transition:all .6s cubic-bezier(.16,1,.3,1); }
    .stagger-child.visible { opacity:1; transform:translateY(0); }

    /* ===== NAVBAR ===== */
    .navbar { position:fixed; top:0; left:0; right:0; z-index:1000; padding:1rem 5%; display:flex; align-items:center; justify-content:space-between; background:rgba(${isDark ? '10,10,15' : '255,255,255'},.85); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); border-bottom:1px solid var(--border); transition:all .3s; }
    .navbar.scrolled { padding:.7rem 5%; box-shadow:0 4px 30px rgba(0,0,0,.1); }
    .nav-logo { display:flex; align-items:center; gap:.6rem; font-weight:800; font-size:1.15rem; font-family:'Space Grotesk',sans-serif; }
    .nav-logo img { width:36px; height:36px; border-radius:8px; object-fit:cover; }
    .nav-logo-text { background:linear-gradient(135deg,var(--primary),var(--accent)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
    .nav-menu { display:flex; align-items:center; gap:2rem; }
    .nav-menu a { font-size:.9rem; font-weight:500; color:var(--muted); transition:color .2s; }
    .nav-menu a:hover { color:var(--text); }
    .nav-actions { display:flex; align-items:center; gap:.8rem; }
    .nav-book-btn { background:var(--primary); color:#09090B; padding:.6rem 1.4rem; border-radius:100px; font-weight:700; font-size:.9rem; border:none; transition:all .3s; }
    .nav-book-btn:hover { transform:translateY(-2px); box-shadow:0 8px 25px rgba(0,217,255,.35); }
    .nav-hamburger { display:none; flex-direction:column; gap:4px; background:none; border:none; padding:4px; }
    .nav-hamburger span { display:block; width:22px; height:2px; background:var(--text); border-radius:2px; transition:all .3s; }
    
    /* ===== HERO ===== */
    .hero { position:relative; min-height:92vh; display:flex; align-items:center; justify-content:center; text-align:center; padding:8rem 5% 5rem; overflow:hidden; }
    .hero-bg { position:absolute; inset:0; z-index:0; }
    .hero-bg img { width:100%; height:100%; object-fit:cover; }
    .hero-bg::after { content:''; position:absolute; inset:0; background:${isDark ? 'linear-gradient(180deg, rgba(10,10,15,.55) 0%, rgba(10,10,15,.9) 100%)' : 'linear-gradient(180deg, rgba(255,255,255,.6) 0%, rgba(255,255,255,.95) 100%)'}; }
    .hero-content { position:relative; z-index:1; max-width:900px; margin:0 auto; }
    .hero-badge { display:inline-flex; align-items:center; gap:.5rem; padding:.4rem 1rem; border-radius:100px; background:rgba(0,217,255,.1); border:1px solid rgba(0,217,255,.2); color:var(--primary); font-size:.82rem; font-weight:600; margin-bottom:1.5rem; animation:fadeIn 1s ease forwards; }
    .hero-badge::before { content:''; width:6px; height:6px; border-radius:50%; background:var(--primary); animation:ping 1.5s infinite; }
    .hero h1 { font-size:clamp(2.5rem, 7vw, 5.5rem); font-weight:900; line-height:1.02; letter-spacing:-.03em; margin-bottom:1.3rem; font-family:'Space Grotesk',sans-serif; animation:fadeUp .8s ease .2s both; }
    .hero h1 .gradient-text { background:linear-gradient(135deg,var(--primary),var(--accent)); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; background-size:200%; animation:gradient-move 4s ease infinite; }
    .hero p { font-size:1.2rem; color:var(--muted); max-width:580px; margin:0 auto 2.5rem; animation:fadeUp .8s ease .35s both; }
    .hero-cta-group { display:flex; gap:1rem; justify-content:center; flex-wrap:wrap; animation:fadeUp .8s ease .5s both; }
    .btn-primary { display:inline-flex; align-items:center; gap:.5rem; background:var(--primary); color:#09090B; padding:1rem 2.2rem; border-radius:100px; font-weight:700; font-size:1rem; border:none; transition:all .3s; position:relative; overflow:hidden; }
    .btn-primary::before { content:''; position:absolute; top:0; left:-100%; width:200%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.3),transparent); transition:left .5s; }
    .btn-primary:hover { transform:translateY(-3px); box-shadow:0 12px 40px rgba(0,217,255,.35); }
    .btn-primary:hover::before { left:100%; }
    .btn-outline { display:inline-flex; align-items:center; gap:.5rem; background:transparent; color:var(--text); padding:1rem 2.2rem; border-radius:100px; font-weight:600; font-size:1rem; border:1px solid var(--border); transition:all .3s; backdrop-filter:blur(10px); }
    .btn-outline:hover { background:var(--surface); transform:translateY(-3px); }
    .hero-stats { display:flex; gap:2.5rem; justify-content:center; margin-top:3.5rem; flex-wrap:wrap; animation:fadeUp .8s ease .7s both; }
    .hero-stat { text-align:center; }
    .hero-stat .number { font-size:2rem; font-weight:800; font-family:'Space Grotesk',sans-serif; color:var(--primary); }
    .hero-stat .label { font-size:.82rem; color:var(--muted); margin-top:.2rem; }
    
    /* ===== TRUST BAR ===== */
    .trust-bar { padding:2rem 5%; border-top:1px solid var(--border); border-bottom:1px solid var(--border); background:var(--surface); overflow:hidden; }
    .trust-bar-inner { display:flex; align-items:center; gap:3rem; overflow:hidden; }
    .trust-label { font-size:.82rem; color:var(--muted); font-weight:500; white-space:nowrap; flex-shrink:0; }
    .trust-logos { display:flex; gap:3rem; align-items:center; animation:marquee 20s linear infinite; white-space:nowrap; }
    .trust-logo-item { font-size:.9rem; font-weight:700; color:var(--muted); opacity:.6; transition:opacity .3s; white-space:nowrap; }
    .trust-logo-item:hover { opacity:1; }
    
    /* ===== ABOUT / SPLIT SECTION ===== */
    .split-section { padding:6rem 5%; }
    .split-inner { display:grid; grid-template-columns:1fr 1fr; gap:5rem; align-items:center; max-width:1200px; margin:0 auto; }
    .split-inner.reverse { direction:rtl; }
    .split-inner.reverse > * { direction:ltr; }
    .split-text .section-badge { display:inline-block; padding:.3rem .9rem; border-radius:100px; background:rgba(0,217,255,.1); border:1px solid rgba(0,217,255,.2); color:var(--primary); font-size:.78rem; font-weight:600; margin-bottom:1rem; letter-spacing:.05em; text-transform:uppercase; }
    .split-text h2 { font-size:clamp(1.8rem,4vw,3rem); font-weight:800; line-height:1.1; margin-bottom:1rem; font-family:'Space Grotesk',sans-serif; }
    .split-text p { font-size:1rem; color:var(--muted); line-height:1.8; margin-bottom:1rem; }
    .split-img { border-radius:24px; overflow:hidden; position:relative; }
    .split-img img { width:100%; height:450px; object-fit:cover; transition:transform .6s cubic-bezier(.16,1,.3,1); }
    .split-img:hover img { transform:scale(1.04); }
    .split-img::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,transparent,rgba(0,217,255,.15)); z-index:1; pointer-events:none; }
    .floating-badge { position:absolute; bottom:1.5rem; left:1.5rem; z-index:2; background:rgba(10,10,15,.85); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,.1); border-radius:14px; padding:.8rem 1.2rem; display:flex; align-items:center; gap:.8rem; }
    .floating-badge .number { font-size:1.6rem; font-weight:800; color:var(--primary); font-family:'Space Grotesk',sans-serif; }
    .floating-badge .text { font-size:.8rem; color:var(--muted); }
    
    /* ===== STATS COUNTER ===== */
    .stats-section { padding:5rem 5%; background:linear-gradient(135deg,var(--primary)10,transparent); }
    .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:2rem; max-width:1100px; margin:0 auto; text-align:center; }
    .stat-card { padding:2rem; background:var(--surface); border:1px solid var(--border); border-radius:20px; transition:all .3s; position:relative; overflow:hidden; }
    .stat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,var(--primary),var(--accent)); transform:scaleX(0); transition:transform .4s; }
    .stat-card:hover::before { transform:scaleX(1); }
    .stat-card:hover { transform:translateY(-5px); border-color:rgba(0,217,255,.3); }
    .stat-number { font-size:3rem; font-weight:900; color:var(--primary); font-family:'Space Grotesk',sans-serif; line-height:1; }
    .stat-label { font-size:.9rem; color:var(--muted); margin-top:.5rem; }
    
    /* ===== SERVICES ===== */
    .services-section { padding:6rem 5%; }
    .section-header { text-align:center; max-width:700px; margin:0 auto 4rem; }
    .section-badge { display:inline-block; padding:.3rem .9rem; border-radius:100px; background:rgba(0,217,255,.1); border:1px solid rgba(0,217,255,.2); color:var(--primary); font-size:.78rem; font-weight:600; margin-bottom:1rem; letter-spacing:.05em; text-transform:uppercase; }
    .section-header h2 { font-size:clamp(1.8rem,4vw,3rem); font-weight:800; line-height:1.1; margin-bottom:.8rem; font-family:'Space Grotesk',sans-serif; }
    .section-header p { font-size:1rem; color:var(--muted); }
    .services-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:1.5rem; max-width:1200px; margin:0 auto; }
    .service-card { background:var(--surface); border:1px solid var(--border); border-radius:20px; padding:2rem; position:relative; overflow:hidden; transition:all .35s cubic-bezier(.16,1,.3,1); cursor:pointer; }
    .service-card::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(0,217,255,.06),transparent); opacity:0; transition:opacity .3s; }
    .service-card:hover { transform:translateY(-8px); border-color:rgba(0,217,255,.3); box-shadow:0 25px 60px rgba(0,0,0,.2); }
    .service-card:hover::before { opacity:1; }
    .service-icon { width:52px; height:52px; border-radius:14px; background:rgba(0,217,255,.12); display:flex; align-items:center; justify-content:center; font-size:1.6rem; margin-bottom:1.3rem; transition:transform .3s; }
    .service-card:hover .service-icon { transform:scale(1.1) rotate(5deg); }
    .service-card h3 { font-size:1.15rem; font-weight:700; margin-bottom:.6rem; }
    .service-card p { font-size:.9rem; color:var(--muted); margin-bottom:1.3rem; line-height:1.6; }
    .service-price { display:flex; align-items:center; justify-content:space-between; }
    .price-tag { font-size:1.2rem; font-weight:800; color:var(--primary); }
    .book-btn { background:var(--primary); color:#09090B; padding:.45rem 1.1rem; border-radius:100px; font-size:.85rem; font-weight:700; border:none; transition:all .3s; }
    .book-btn:hover { transform:scale(1.05); box-shadow:0 4px 15px rgba(0,217,255,.3); }
    
    /* ===== GALLERY / PORTFOLIO ===== */
    .gallery-section { padding:5rem 5%; }
    .gallery-grid { display:grid; grid-template-columns:repeat(3,1fr); grid-template-rows:auto auto; gap:1.2rem; max-width:1200px; margin:0 auto; }
    .gallery-grid .item:first-child { grid-row:span 2; }
    .gallery-item { border-radius:16px; overflow:hidden; position:relative; cursor:pointer; }
    .gallery-item img { width:100%; height:100%; object-fit:cover; transition:transform .5s cubic-bezier(.16,1,.3,1); min-height:200px; }
    .gallery-item:hover img { transform:scale(1.06); }
    .gallery-item::after { content:''; position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,.6),transparent); opacity:0; transition:opacity .3s; }
    .gallery-item:hover::after { opacity:1; }
    
    /* ===== WHY US ===== */
    .why-section { padding:6rem 5%; background:var(--surface); }
    .why-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:1.5rem; max-width:1200px; margin:0 auto; }
    .why-card { padding:1.8rem; border-radius:18px; border:1px solid var(--border); background:rgba(0,0,0,.15); transition:all .3s; position:relative; overflow:hidden; }
    .why-card::after { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:linear-gradient(90deg,var(--primary),var(--accent)); transform:scaleX(0); transition:transform .35s; transform-origin:left; }
    .why-card:hover::after { transform:scaleX(1); }
    .why-card:hover { transform:translateY(-4px); border-color:rgba(0,217,255,.25); }
    .why-icon { font-size:2rem; margin-bottom:1rem; }
    .why-card h3 { font-size:1.05rem; font-weight:700; margin-bottom:.5rem; }
    .why-card p { font-size:.88rem; color:var(--muted); line-height:1.6; }
    
    /* ===== PROCESS STEPS ===== */
    .process-section { padding:6rem 5%; }
    .process-steps { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:1.5rem; max-width:1100px; margin:0 auto; position:relative; }
    .process-steps::before { content:''; position:absolute; top:2.5rem; left:15%; right:15%; height:2px; background:linear-gradient(90deg,var(--primary),var(--accent)); opacity:.3; }
    .process-step { text-align:center; padding:2rem 1rem; }
    .step-num { width:50px; height:50px; border-radius:50%; background:linear-gradient(135deg,var(--primary),var(--accent)); color:#09090B; font-weight:800; font-size:1.1rem; display:flex; align-items:center; justify-content:center; margin:0 auto 1.2rem; font-family:'Space Grotesk',sans-serif; box-shadow:0 8px 25px rgba(0,217,255,.3); }
    .process-step h3 { font-weight:700; margin-bottom:.5rem; }
    .process-step p { font-size:.88rem; color:var(--muted); }
    
    /* ===== TESTIMONIALS ===== */
    .testimonials-section { padding:6rem 5%; background:var(--surface); }
    .testimonials-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:1.5rem; max-width:1200px; margin:0 auto; }
    .testimonial-card { background:rgba(0,0,0,.2); border:1px solid var(--border); border-radius:20px; padding:2rem; transition:all .3s; position:relative; }
    .testimonial-card::before { content:'"'; position:absolute; top:1rem; right:1.5rem; font-size:5rem; color:var(--primary); opacity:.12; font-family:Georgia,serif; line-height:1; }
    .testimonial-card:hover { transform:translateY(-4px); border-color:rgba(0,217,255,.25); }
    .stars { color:#FFB800; font-size:1rem; margin-bottom:1rem; }
    .testimonial-text { font-size:.95rem; color:var(--muted); line-height:1.7; margin-bottom:1.3rem; }
    .testimonial-author { display:flex; align-items:center; gap:.8rem; }
    .author-avatar { width:42px; height:42px; border-radius:50%; background:linear-gradient(135deg,var(--primary),var(--accent)); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:.9rem; color:#09090B; flex-shrink:0; }
    .author-name { font-weight:700; font-size:.92rem; }
    .author-location { font-size:.8rem; color:var(--muted); }
    
    /* ===== FAQ ===== */
    .faq-section { padding:6rem 5%; }
    .faq-list { max-width:760px; margin:0 auto; }
    .faq-item { border:1px solid var(--border); border-radius:14px; margin-bottom:.8rem; overflow:hidden; background:var(--surface); transition:border-color .3s; }
    .faq-item:hover { border-color:rgba(0,217,255,.3); }
    .faq-question { padding:1.3rem 1.5rem; display:flex; align-items:center; justify-content:space-between; cursor:pointer; font-weight:600; font-size:.95rem; gap:1rem; }
    .faq-icon { width:28px; height:28px; border-radius:50%; background:rgba(0,217,255,.1); color:var(--primary); display:flex; align-items:center; justify-content:center; font-size:1.2rem; transition:all .3s; flex-shrink:0; }
    .faq-answer { max-height:0; overflow:hidden; transition:max-height .4s cubic-bezier(.16,1,.3,1); }
    .faq-answer-inner { padding:0 1.5rem 1.3rem; color:var(--muted); font-size:.92rem; line-height:1.7; }
    .faq-item.open .faq-icon { transform:rotate(45deg); background:var(--primary); color:#09090B; }
    .faq-item.open .faq-answer { max-height:300px; }
    
    /* ===== CONTACT ===== */
    .contact-section { padding:6rem 5%; }
    .contact-inner { display:grid; grid-template-columns:1fr 1.2fr; gap:4rem; max-width:1100px; margin:0 auto; align-items:start; }
    .contact-info h2 { font-size:clamp(1.8rem,4vw,2.8rem); font-weight:800; margin-bottom:1rem; font-family:'Space Grotesk',sans-serif; }
    .contact-info p { color:var(--muted); margin-bottom:2rem; }
    .contact-item { display:flex; align-items:center; gap:1rem; margin-bottom:1.2rem; padding:1rem; border-radius:14px; background:var(--surface); border:1px solid var(--border); transition:all .3s; }
    .contact-item:hover { border-color:rgba(0,217,255,.3); transform:translateX(4px); }
    .contact-icon { width:42px; height:42px; border-radius:10px; background:rgba(0,217,255,.12); display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0; }
    .contact-form { background:var(--surface); border:1px solid var(--border); border-radius:24px; padding:2.5rem; }
    .form-row { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem; }
    .form-group { margin-bottom:1rem; }
    .form-group label { display:block; font-size:.85rem; font-weight:600; margin-bottom:.4rem; color:var(--text); }
    .form-input { width:100%; padding:.85rem 1.1rem; background:rgba(0,0,0,.2); border:1px solid var(--border); border-radius:10px; color:var(--text); font-size:.95rem; font-family:inherit; transition:all .3s; outline:none; }
    .form-input:focus { border-color:var(--primary); box-shadow:0 0 0 3px rgba(0,217,255,.1); }
    .form-input::placeholder { color:var(--muted); }
    textarea.form-input { resize:vertical; min-height:120px; }
    .form-submit { width:100%; padding:1rem; background:var(--primary); color:#09090B; border:none; border-radius:10px; font-weight:700; font-size:1rem; transition:all .3s; }
    .form-submit:hover { transform:translateY(-2px); box-shadow:0 8px 25px rgba(0,217,255,.35); }
    
    /* ===== BOOKING MODAL ===== */
    .modal-overlay { position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,.7); backdrop-filter:blur(8px); display:none; align-items:center; justify-content:center; padding:1.5rem; }
    .modal-overlay.open { display:flex; animation:fadeIn .3s ease; }
    .modal-box { background:${isDark ? '#0F141C' : '#fff'}; border:1px solid var(--border); border-radius:24px; width:100%; max-width:500px; padding:2.5rem; position:relative; box-shadow:0 30px 80px rgba(0,0,0,.4); animation:scaleIn .3s cubic-bezier(.16,1,.3,1); }
    .modal-close { position:absolute; top:1.2rem; right:1.2rem; width:36px; height:36px; border-radius:50%; background:var(--surface); border:1px solid var(--border); color:var(--muted); font-size:1.1rem; display:flex; align-items:center; justify-content:center; transition:all .2s; }
    .modal-close:hover { background:var(--border); color:var(--text); transform:rotate(90deg); }
    .modal-title { font-size:1.5rem; font-weight:800; margin-bottom:.4rem; font-family:'Space Grotesk',sans-serif; }
    .modal-subtitle { color:var(--muted); font-size:.9rem; margin-bottom:2rem; }
    
    /* ===== FOOTER ===== */
    .footer { padding:4rem 5% 2rem; background:${isDark ? '#07080D' : '#F1F5F9'}; border-top:1px solid var(--border); }
    .footer-top { display:grid; grid-template-columns:1.5fr 1fr 1fr 1fr; gap:3rem; margin-bottom:3rem; }
    .footer-brand p { font-size:.88rem; color:var(--muted); margin:.8rem 0 1.5rem; line-height:1.7; }
    .footer-col h4 { font-weight:700; margin-bottom:1rem; font-size:.92rem; }
    .footer-col a { display:block; font-size:.88rem; color:var(--muted); margin-bottom:.6rem; transition:color .2s; }
    .footer-col a:hover { color:var(--primary); }
    .footer-bottom { display:flex; align-items:center; justify-content:space-between; padding-top:2rem; border-top:1px solid var(--border); font-size:.82rem; color:var(--muted); flex-wrap:wrap; gap:1rem; }
    .social-links { display:flex; gap:1rem; }
    .social-link { width:36px; height:36px; border-radius:50%; background:var(--surface); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:.9rem; transition:all .3s; }
    .social-link:hover { background:var(--primary); color:#09090B; transform:translateY(-3px); }
    
    /* ===== WHATSAPP FLOAT ===== */
    .whatsapp-float { position:fixed; bottom:2rem; right:2rem; z-index:500; display:flex; flex-direction:column; align-items:flex-end; gap:.5rem; }
    .whatsapp-btn { width:58px; height:58px; border-radius:50%; background:#25D366; color:#fff; border:none; font-size:1.6rem; display:flex; align-items:center; justify-content:center; box-shadow:0 6px 25px rgba(37,211,102,.4); transition:all .3s; animation:glow-pulse 2s infinite; }
    .whatsapp-btn:hover { transform:scale(1.1); box-shadow:0 10px 35px rgba(37,211,102,.5); }
    .whatsapp-label { background:${isDark ? '#0F141C' : '#fff'}; border:1px solid var(--border); border-radius:10px; padding:.5rem .9rem; font-size:.82rem; font-weight:600; white-space:nowrap; box-shadow:0 4px 15px rgba(0,0,0,.15); opacity:0; transform:translateX(10px); transition:all .3s; }
    .whatsapp-float:hover .whatsapp-label { opacity:1; transform:translateX(0); }
    
    /* ===== BACK TO TOP ===== */
    .back-to-top { position:fixed; bottom:6.5rem; right:2.2rem; z-index:500; width:44px; height:44px; border-radius:50%; background:var(--surface); border:1px solid var(--border); color:var(--text); font-size:1.1rem; display:flex; align-items:center; justify-content:center; transition:all .3s; opacity:0; pointer-events:none; }
    .back-to-top.visible { opacity:1; pointer-events:auto; }
    .back-to-top:hover { background:var(--primary); color:#09090B; transform:translateY(-3px); }
    
    /* ===== CTA SECTION ===== */
    .cta-section { padding:6rem 5%; text-align:center; background:linear-gradient(135deg,rgba(0,217,255,.08),rgba(0,255,157,.05)); }
    .cta-box { max-width:700px; margin:0 auto; }
    .cta-box h2 { font-size:clamp(2rem,5vw,3.5rem); font-weight:900; margin-bottom:1rem; font-family:'Space Grotesk',sans-serif; }
    .cta-box p { color:var(--muted); font-size:1.1rem; margin-bottom:2.5rem; }
    
    /* ===== RIBBON MARQUEE ===== */
    .ribbon { padding:1rem 0; background:linear-gradient(135deg,var(--primary),var(--accent)); overflow:hidden; }
    .ribbon-inner { display:flex; gap:0; white-space:nowrap; animation:marquee 15s linear infinite; }
    .ribbon-item { padding:0 2rem; font-size:.9rem; font-weight:700; color:#09090B; opacity:.85; }
    
    /* ===== MEDIA QUERIES ===== */
    @media (max-width:768px) {
      .split-inner, .contact-inner, .footer-top { grid-template-columns:1fr; gap:2rem; }
      .split-inner.reverse { direction:ltr; }
      .stats-grid { grid-template-columns:1fr 1fr; }
      .gallery-grid { grid-template-columns:1fr 1fr; }
      .gallery-grid .item:first-child { grid-row:auto; }
      .process-steps::before { display:none; }
      .nav-menu { display:none; }
      .nav-hamburger { display:flex; }
      .hero h1 { font-size:clamp(2rem,8vw,3rem); }
      .form-row { grid-template-columns:1fr; }
    }
  </style>
</head>
<body>

<!-- ===== NAVBAR ===== -->
<nav class="navbar" id="navbar">
  <a href="#" class="nav-logo">
    ${logoUrl ? `<img src="${logoUrl}" alt="${plan.businessName}" onerror="this.style.display='none'">` : ''}
    <span class="nav-logo-text">${plan.businessName}</span>
  </a>
  <div class="nav-menu">
    <a href="#about">About</a>
    <a href="#services">Services</a>
    <a href="#gallery">Gallery</a>
    <a href="#testimonials">Reviews</a>
    <a href="#contact">Contact</a>
  </div>
  <div class="nav-actions">
    <button class="nav-book-btn" onclick="openBooking()">📅 Book Now</button>
  </div>
  <button class="nav-hamburger" onclick="toggleMobileMenu()" aria-label="Menu">
    <span></span><span></span><span></span>
  </button>
</nav>

<!-- ===== HERO ===== -->
<section class="hero" id="hero">
  <div class="hero-bg">
    <img src="${heroImg}" alt="${plan.businessName}" loading="eager" onerror="this.onerror=null;this.src='https://placehold.co/1400x900/${c.bg.replace('#','')}/${c.primary.replace('#','')}?text=${encodeURIComponent(plan.businessName)}'">
  </div>
  <div class="hero-content">
    <div class="hero-badge">● ${plan.type || 'Professional Business'} · ${plan.city || 'Lagos'}, Nigeria</div>
    <h1>${hero.headline || plan.businessName}<br><span class="gradient-text">${plan.tagline || 'Building the Future'}</span></h1>
    <p>${hero.subheadline || plan.description || 'Premium services tailored for you. Book now and experience the difference.'}</p>
    <div class="hero-cta-group">
      <button class="btn-primary" onclick="openBooking()">📅 ${hero.cta || 'Book Appointment'}</button>
      <a class="btn-outline" href="#services">🔍 View Services</a>
    </div>
    <div class="hero-stats">
      <div class="hero-stat"><div class="number" data-count="500">0</div><div class="label">Happy Clients</div></div>
      <div class="hero-stat"><div class="number" data-count="5">0</div><div class="label">Years Experience</div></div>
      <div class="hero-stat"><div class="number" data-count="98">0</div><div class="label">% Satisfaction</div></div>
    </div>
  </div>
</section>

<!-- ===== TRUST BAR ===== -->
<div class="trust-bar">
  <div class="trust-bar-inner">
    <span class="trust-label">Trusted by businesses across Nigeria:</span>
    <div class="trust-logos">
      <span class="trust-logo-item">✅ Paystack Verified</span>
      <span class="trust-logo-item">⭐ 4.9/5 Rating</span>
      <span class="trust-logo-item">🔒 Secure Payments</span>
      <span class="trust-logo-item">🚀 Instant Booking</span>
      <span class="trust-logo-item">📱 WhatsApp Support</span>
      <span class="trust-logo-item">✅ Paystack Verified</span>
      <span class="trust-logo-item">⭐ 4.9/5 Rating</span>
      <span class="trust-logo-item">🔒 Secure Payments</span>
      <span class="trust-logo-item">🚀 Instant Booking</span>
      <span class="trust-logo-item">📱 WhatsApp Support</span>
    </div>
  </div>
</div>

<!-- ===== ABOUT ===== -->
<section class="split-section" id="about">
  <div class="split-inner">
    <div class="split-text reveal-left">
      <span class="section-badge">Our Story</span>
      <h2>We Are ${plan.businessName}</h2>
      <p>${about || plan.description || 'We deliver exceptional quality and professional service to every client. Based in ' + (plan.city || 'Lagos') + ', we serve clients across Nigeria with pride.'}</p>
      <p>From the moment you walk in, our team is dedicated to exceeding your expectations. Quality, reliability, and excellence are not just words — they are our promise to you.</p>
      <div style="margin-top:1.8rem;display:flex;gap:2rem;flex-wrap:wrap">
        ${whyChooseUs.slice(0,2).map(w => `<div style="display:flex;align-items:center;gap:.5rem;font-size:.9rem;font-weight:600"><span style="color:var(--primary)">✓</span> ${w}</div>`).join('')}
      </div>
      <div style="margin-top:2rem">
        <button class="btn-primary" onclick="openBooking()">Book Appointment →</button>
      </div>
    </div>
    <div class="split-img reveal-right">
      <img src="${aboutImg}" alt="About ${plan.businessName}" loading="lazy" onerror="this.onerror=null;this.src='https://placehold.co/800x500/${c.bg.replace('#','')}/${c.primary.replace('#','')}?text=About+Us'">
      <div class="floating-badge">
        <div class="number">500+</div>
        <div class="text">Satisfied<br>Clients</div>
      </div>
    </div>
  </div>
</section>

<!-- ===== STATS ===== -->
<section class="stats-section">
  <div class="stats-grid stagger-child">
    <div class="stat-card reveal">
      <div class="stat-number" data-count="500">0</div>
      <div class="stat-label">Happy Clients</div>
    </div>
    <div class="stat-card reveal" style="transition-delay:.1s">
      <div class="stat-number" data-count="5">0</div>
      <div class="stat-label">Years Experience</div>
    </div>
    <div class="stat-card reveal" style="transition-delay:.2s">
      <div class="stat-number" data-count="98">0</div>
      <div class="stat-label">% Satisfaction Rate</div>
    </div>
    <div class="stat-card reveal" style="transition-delay:.3s">
      <div class="stat-number" data-count="50">0</div>
      <div class="stat-label">Team Members</div>
    </div>
  </div>
</section>

<!-- ===== SERVICES ===== -->
<section class="services-section" id="services">
  <div class="section-header reveal">
    <span class="section-badge">What We Offer</span>
    <h2>Our Services</h2>
    <p>Everything you need, all in one place. Choose from our range of premium services.</p>
  </div>
  <div class="services-grid">
    ${services.slice(0, 6).map((s, i) => {
      const icons = ['✂️', '💅', '🎨', '🍽️', '📸', '💆', '🏠', '⚡', '🔧', '💻', '📚', '🎯'];
      return `
    <div class="service-card reveal" style="transition-delay:${i * 0.08}s">
      <div class="service-icon">${icons[i % icons.length]}</div>
      <h3>${s.name}</h3>
      <p>${s.description || 'Professional service with exceptional results.'}</p>
      <div class="service-price">
        <span class="price-tag">₦${Number(s.price || 5000).toLocaleString()}</span>
        <button class="book-btn" onclick="openBooking('${s.name}')">Book →</button>
      </div>
    </div>`;
    }).join('')}
  </div>
</section>

<!-- ===== PROCESS ===== -->
<section class="process-section" id="process">
  <div class="section-header reveal">
    <span class="section-badge">How It Works</span>
    <h2>Simple 4-Step Process</h2>
    <p>From booking to completion, we make it effortless.</p>
  </div>
  <div class="process-steps">
    ${[{step:1,t:'Book Online',d:'Choose your service and preferred time slot in under 2 minutes'},{step:2,t:'Confirmation',d:'Get instant WhatsApp confirmation with all details'},{step:3,t:'Experience',d:'Our expert team delivers exceptional quality'},{step:4,t:'Follow Up',d:'We check in to ensure your complete satisfaction'}].map((p,i) => `
    <div class="process-step reveal" style="transition-delay:${i*0.12}s">
      <div class="step-num">${p.step}</div>
      <h3>${p.t}</h3>
      <p>${p.d}</p>
    </div>`).join('')}
  </div>
</section>

<!-- ===== GALLERY ===== -->
<section class="gallery-section" id="gallery">
  <div class="section-header reveal">
    <span class="section-badge">Our Work</span>
    <h2>Gallery</h2>
    <p>A glimpse into the quality we deliver every day.</p>
  </div>
  <div class="gallery-grid">
    ${galleryImgs.slice(0,5).map((img, i) => `
    <div class="gallery-item item reveal" style="transition-delay:${i*0.08}s">
      <img src="${img}" alt="Work sample ${i+1}" loading="lazy" onerror="this.onerror=null;this.src='https://placehold.co/600x400/${c.bg.replace('#','')}/${c.primary.replace('#','')}?text=Gallery'">
    </div>`).join('')}
  </div>
</section>

<!-- ===== WHY CHOOSE US ===== -->
<section class="why-section" id="why">
  <div class="section-header reveal">
    <span class="section-badge">Why Choose Us</span>
    <h2>The ${plan.businessName} Difference</h2>
    <p>What makes us stand out from every other option in ${plan.city || 'Lagos'}.</p>
  </div>
  <div class="why-grid">
    ${(whyChooseUs.length ? whyChooseUs : ['Top Quality', 'Affordable Prices', 'Expert Team', 'Fast Service']).slice(0, 6).map((w, i) => {
      const wIcons = ['🏆','💰','👑','⚡','🛡️','❤️'];
      return `
    <div class="why-card reveal" style="transition-delay:${i*0.08}s">
      <div class="why-icon">${wIcons[i % wIcons.length]}</div>
      <h3>${typeof w === 'string' ? w : w.title || 'Premium Quality'}</h3>
      <p>${typeof w === 'string' ? 'We deliver excellence in everything we do.' : (w.description || 'Excellence in every detail.')}</p>
    </div>`;
    }).join('')}
  </div>
</section>

<!-- ===== RIBBON ===== -->
<div class="ribbon">
  <div class="ribbon-inner">
    ${Array(8).fill(`<span class="ribbon-item">✦ Book Today</span><span class="ribbon-item">${plan.businessName}</span><span class="ribbon-item">✦ ${plan.city || 'Lagos'}, Nigeria</span><span class="ribbon-item">✦ Professional Service</span>`).join('')}
  </div>
</div>

<!-- ===== TESTIMONIALS ===== -->
<section class="testimonials-section" id="testimonials">
  <div class="section-header reveal">
    <span class="section-badge">What Clients Say</span>
    <h2>Real Reviews</h2>
    <p>Don't take our word for it — hear from clients who love us.</p>
  </div>
  <div class="testimonials-grid">
    ${(testimonials.length ? testimonials : [
      {name:'Adaeze Okafor',text:'Absolutely amazing service! The quality exceeded my expectations and the team was so professional.',location:'Victoria Island, Lagos'},
      {name:'Chukwuemeka Eze',text:'Best in Lagos hands down. I have been a loyal client for 2 years and I never look elsewhere.',location:'Ikeja, Lagos'},
      {name:'Fatima Abdullahi',text:'Booking was so easy and the result was perfect. Highly recommend to everyone!',location:'Abuja'}
    ]).slice(0, 3).map((t, i) => `
    <div class="testimonial-card reveal" style="transition-delay:${i*0.12}s">
      <div class="stars">⭐⭐⭐⭐⭐</div>
      <p class="testimonial-text">"${t.text || t}"</p>
      <div class="testimonial-author">
        <div class="author-avatar">${(t.name || 'C')[0]}</div>
        <div>
          <div class="author-name">${t.name || 'Client'}</div>
          <div class="author-location">📍 ${t.location || plan.city || 'Lagos'}</div>
        </div>
      </div>
    </div>`).join('')}
  </div>
</section>

<!-- ===== FAQ ===== -->
<section class="faq-section" id="faq">
  <div class="section-header reveal">
    <span class="section-badge">FAQ</span>
    <h2>Frequently Asked Questions</h2>
    <p>Got questions? We have answers.</p>
  </div>
  <div class="faq-list">
    ${(faq.length ? faq : [
      {q:'How do I book an appointment?',a:'Simply click the "Book Now" button on our website, choose your service and time, and you will receive instant WhatsApp confirmation.'},
      {q:'What are your payment methods?',a:'We accept cash, bank transfer, and card payments via Paystack. Pay securely online or at our location.'},
      {q:'Can I reschedule or cancel?',a:'Yes! You can reschedule or cancel up to 24 hours before your appointment with no charge.'},
      {q:'Do you offer home visits?',a:'Yes, for select services we offer home visits in ' + (plan.city || 'Lagos') + '. Contact us to arrange.'},
      {q:'How long does a session take?',a:'Duration varies by service. Most sessions take 30 minutes to 2 hours. Check each service for details.'}
    ]).slice(0,5).map((item, i) => `
    <div class="faq-item reveal" style="transition-delay:${i*0.07}s">
      <div class="faq-question" onclick="toggleFaq(this)">
        ${item.q}
        <span class="faq-icon">+</span>
      </div>
      <div class="faq-answer">
        <div class="faq-answer-inner">${item.a}</div>
      </div>
    </div>`).join('')}
  </div>
</section>

<!-- ===== CTA SECTION ===== -->
<section class="cta-section">
  <div class="cta-box reveal">
    <h2>Ready to Get Started?</h2>
    <p>Join hundreds of happy clients. Book your appointment today — it takes less than 2 minutes.</p>
    <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
      <button class="btn-primary" onclick="openBooking()">📅 Book Now — It's Free</button>
      <a href="https://wa.me/${whatsapp}?text=Hi, I would like to book a service at ${encodeURIComponent(plan.businessName)}" target="_blank" class="btn-outline" style="border-color:#25D366;color:#25D366">💬 Chat on WhatsApp</a>
    </div>
  </div>
</section>

<!-- ===== CONTACT ===== -->
<section class="contact-section" id="contact">
  <div class="contact-inner">
    <div class="reveal-left">
      <div class="contact-info">
        <span class="section-badge">Get In Touch</span>
        <h2>Contact Us</h2>
        <p>We are always happy to hear from you. Reach us through any of these channels.</p>
      </div>
      <div class="contact-item">
        <div class="contact-icon">📍</div>
        <div>
          <div style="font-weight:600;font-size:.9rem">Address</div>
          <div style="color:var(--muted);font-size:.88rem">${address}</div>
        </div>
      </div>
      <div class="contact-item">
        <div class="contact-icon">📞</div>
        <div>
          <div style="font-weight:600;font-size:.9rem">Phone</div>
          <div style="color:var(--muted);font-size:.88rem"><a href="tel:${phone}" style="color:var(--primary)">${phone}</a></div>
        </div>
      </div>
      <div class="contact-item">
        <div class="contact-icon">📧</div>
        <div>
          <div style="font-weight:600;font-size:.9rem">Email</div>
          <div style="color:var(--muted);font-size:.88rem"><a href="mailto:${email}" style="color:var(--primary)">${email}</a></div>
        </div>
      </div>
      <div class="contact-item">
        <div class="contact-icon">💬</div>
        <div>
          <div style="font-weight:600;font-size:.9rem">WhatsApp</div>
          <div style="color:var(--muted);font-size:.88rem"><a href="https://wa.me/${whatsapp}" target="_blank" style="color:#25D366">Chat with us →</a></div>
        </div>
      </div>
    </div>
    <div class="reveal-right">
      <div class="contact-form">
        <h3 style="font-size:1.3rem;font-weight:700;margin-bottom:.4rem;font-family:'Space Grotesk',sans-serif">Send a Message</h3>
        <p style="color:var(--muted);font-size:.88rem;margin-bottom:1.5rem">We'll get back to you within 2 hours.</p>
        <div class="form-row">
          <div class="form-group">
            <label>First Name</label>
            <input type="text" class="form-input" placeholder="Your first name">
          </div>
          <div class="form-group">
            <label>Last Name</label>
            <input type="text" class="form-input" placeholder="Your last name">
          </div>
        </div>
        <div class="form-group">
          <label>Phone / WhatsApp</label>
          <input type="tel" class="form-input" placeholder="+234 800 000 0000">
        </div>
        <div class="form-group">
          <label>Message</label>
          <textarea class="form-input" placeholder="Tell us how we can help you..."></textarea>
        </div>
        <button class="form-submit" onclick="submitContact()">Send Message ✓</button>
      </div>
    </div>
  </div>
</section>

<!-- ===== FOOTER ===== -->
<footer class="footer">
  <div class="footer-top">
    <div class="footer-brand">
      <div class="nav-logo" style="margin-bottom:.8rem">${plan.businessName}</div>
      <p>${plan.description || plan.tagline || 'Professional services you can trust.'}</p>
      <div class="social-links">
        <a href="https://wa.me/${whatsapp}" class="social-link" target="_blank" title="WhatsApp">💬</a>
        <a href="#" class="social-link" title="Instagram">📸</a>
        <a href="#" class="social-link" title="Facebook">👤</a>
        <a href="mailto:${email}" class="social-link" title="Email">📧</a>
      </div>
    </div>
    <div class="footer-col">
      <h4>Services</h4>
      ${services.slice(0, 4).map(s => `<a href="#services">${s.name}</a>`).join('')}
    </div>
    <div class="footer-col">
      <h4>Company</h4>
      <a href="#about">About Us</a>
      <a href="#gallery">Gallery</a>
      <a href="#testimonials">Reviews</a>
      <a href="#contact">Contact</a>
    </div>
    <div class="footer-col">
      <h4>Quick Contact</h4>
      <a href="tel:${phone}">${phone}</a>
      <a href="mailto:${email}">${email}</a>
      <a href="#contact">${address.substring(0, 30)}</a>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© 2026 ${plan.businessName}. All rights reserved.</span>
    <span style="color:var(--muted)">Built with <span style="color:var(--primary)">ERGIO</span> ⚡</span>
  </div>
</footer>

<!-- ===== BOOKING MODAL ===== -->
<div class="modal-overlay" id="bookingModal">
  <div class="modal-box">
    <button class="modal-close" onclick="closeBooking()">✕</button>
    <h2 class="modal-title">📅 Book Appointment</h2>
    <p class="modal-subtitle">Fill in your details and we'll confirm within 10 minutes via WhatsApp.</p>
    <div class="form-group">
      <label>Your Name</label>
      <input type="text" class="form-input" id="book-name" placeholder="Full name">
    </div>
    <div class="form-group">
      <label>WhatsApp Number</label>
      <input type="tel" class="form-input" id="book-phone" placeholder="+234 800 000 0000">
    </div>
    <div class="form-group">
      <label>Service</label>
      <select class="form-input" id="book-service">
        ${services.map(s => `<option value="${s.name}">${s.name} — ₦${Number(s.price||5000).toLocaleString()}</option>`).join('')}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Preferred Date</label>
        <input type="date" class="form-input" id="book-date" min="${new Date().toISOString().split('T')[0]}">
      </div>
      <div class="form-group">
        <label>Preferred Time</label>
        <select class="form-input" id="book-time">
          <option>9:00 AM</option><option>10:00 AM</option><option>11:00 AM</option>
          <option>12:00 PM</option><option>2:00 PM</option><option>3:00 PM</option>
          <option>4:00 PM</option><option>5:00 PM</option>
        </select>
      </div>
    </div>
    <button class="form-submit" onclick="confirmBooking()" style="margin-top:.5rem">Confirm Booking →</button>
    <p style="text-align:center;margin-top:1rem;font-size:.8rem;color:var(--muted)">You will receive a WhatsApp confirmation immediately</p>
  </div>
</div>

<!-- ===== WHATSAPP FLOAT ===== -->
<div class="whatsapp-float">
  <span class="whatsapp-label">Chat with us</span>
  <a href="https://wa.me/${whatsapp}?text=Hi! I found you on ${encodeURIComponent(plan.businessName)} website" target="_blank" class="whatsapp-btn" title="Chat on WhatsApp">💬</a>
</div>

<!-- ===== BACK TO TOP ===== -->
<button class="back-to-top" id="backToTop" onclick="window.scrollTo({top:0,behavior:'smooth'})" title="Back to top">↑</button>

<script>
  // ===== SCROLL ANIMATIONS =====
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(el => {
      if (el.isIntersecting) {
        el.target.classList.add('visible');
        // Counter animation
        const counter = el.target.querySelector('[data-count]') || (el.target.dataset.count ? el.target : null);
        if (counter) animateCounter(counter);
        el.target.querySelectorAll('[data-count]').forEach(animateCounter);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => observer.observe(el));
  
  // ===== COUNTER ANIMATION =====
  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    if (!target || el.dataset.animated) return;
    el.dataset.animated = true;
    let current = 0;
    const duration = 1500;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current) + (el.dataset.suffix || '+');
      if (current >= target) clearInterval(timer);
    }, 16);
  }
  
  // ===== NAVBAR SCROLL =====
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
    const btn = document.getElementById('backToTop');
    if (btn) btn.classList.toggle('visible', window.scrollY > 400);
  });
  
  // ===== FAQ ACCORDION =====
  function toggleFaq(el) {
    const item = el.parentElement;
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  }
  
  // ===== MOBILE NAV =====
  function toggleMobileMenu() {
    const menu = document.querySelector('.nav-menu');
    if (menu) { menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex'; menu.style.flexDirection = 'column'; menu.style.position = 'absolute'; menu.style.top = '100%'; menu.style.left = '0'; menu.style.right = '0'; menu.style.background = '${isDark ? '#0F141C' : '#fff'}'; menu.style.padding = '1rem 5%'; menu.style.borderBottom = '1px solid var(--border)'; }
  }
  
  // ===== BOOKING MODAL =====
  function openBooking(service) {
    document.getElementById('bookingModal').classList.add('open');
    if (service) { const sel = document.getElementById('book-service'); if (sel) { for (let o of sel.options) if (o.value === service) { sel.value = service; break; } } }
    document.body.style.overflow = 'hidden';
  }
  function closeBooking() {
    document.getElementById('bookingModal').classList.remove('open');
    document.body.style.overflow = '';
  }
  document.getElementById('bookingModal').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeBooking(); });
  
  function confirmBooking() {
    const name = document.getElementById('book-name').value.trim();
    const phone = document.getElementById('book-phone').value.trim();
    const service = document.getElementById('book-service').value;
    const date = document.getElementById('book-date').value;
    const time = document.getElementById('book-time').value;
    if (!name || !phone) { alert('Please fill in your name and phone number.'); return; }
    const msg = encodeURIComponent('Hi! I want to book ' + service + ' at ${plan.businessName}.\\nName: ' + name + '\\nDate: ' + date + ' at ' + time + '\\nPhone: ' + phone);
    window.open('https://wa.me/${whatsapp}?text=' + msg, '_blank');
    closeBooking();
  }
  
  function submitContact() {
    alert('Thank you! We will get back to you within 2 hours via WhatsApp.');
  }
  
  // ===== STAGGER CHILDREN =====
  document.querySelectorAll('.stagger-child').forEach(el => observer.observe(el));
  
  // ===== SMOOTH SCROLL LINKS =====
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({behavior:'smooth',block:'start'}); }
    });
  });
</script>
</body>
</html>`;
}
