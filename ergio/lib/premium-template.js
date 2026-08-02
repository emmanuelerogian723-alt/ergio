// ERGIO Premium Website Template System
// Designed to surpass Framer AI with scroll animations, glassmorphism, interactive components

export function getPremiumCSS(colors, fonts) {
  const primary = colors?.primary || '#00D9FF';
  const secondary = colors?.secondary || '#6366f1';
  const accent = colors?.accent || '#00FF9D';
  const bg = colors?.bg || '#09090B';
  const headingFont = fonts?.heading || 'Space Grotesk';
  const bodyFont = fonts?.body || 'Inter';
  
  return `
:root{--p:${primary};--s:${secondary};--a:${accent};--bg:${bg};--card:rgba(255,255,255,.03);--border:rgba(255,255,255,.08);--text:#F8FAFC;--muted:#94A3B8;--hf:'${headingFont}',sans-serif;--bf:'${bodyFont}',sans-serif;--radius:16px;--glow:0 0 40px rgba(0,217,255,.15)}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--bf);background:var(--bg);color:var(--text);line-height:1.7;overflow-x:hidden;position:relative}
body::before{content:'';position:fixed;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle at 20% 30%,rgba(0,217,255,.06) 0%,transparent 50%),radial-gradient(circle at 80% 70%,rgba(99,102,241,.05) 0%,transparent 50%);z-index:-1;pointer-events:none;animation:meshShift 20s ease-in-out infinite}
@keyframes meshShift{0%,100%{transform:translate(0,0)}50%{transform:translate(-3%,-2%)}}
::selection{background:var(--p);color:#000}
::-webkit-scrollbar{width:8px}
::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:var(--p);border-radius:4px;opacity:.3}

/* Typography */
h1,h2,h3,h4{font-family:var(--hf);font-weight:700;letter-spacing:-.02em;line-height:1.2}
.eyebrow{display:inline-flex;align-items:center;gap:.4rem;padding:.35rem 1rem;border-radius:100px;background:rgba(0,217,255,.08);border:1px solid rgba(0,217,255,.15);color:var(--p);font-size:.8rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;margin-bottom:1rem}
.gradient-text{background:linear-gradient(135deg,var(--p),var(--s));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}

/* Navigation */
.nav{display:flex;justify-content:space-between;align-items:center;padding:1rem 5%;position:sticky;top:0;background:rgba(9,9,11,.7);backdrop-filter:blur(24px) saturate(1.5);-webkit-backdrop-filter:blur(24px) saturate(1.5);z-index:1000;border-bottom:1px solid rgba(255,255,255,.05);transition:padding .3s}
.nav.scrolled{padding:.6rem 5%;box-shadow:0 4px 30px rgba(0,0,0,.3)}
.nav .logo{display:flex;align-items:center;gap:.6rem;font-weight:800;font-family:var(--hf);color:#fff;text-decoration:none;font-size:1.1rem}
.nav .links{display:flex;align-items:center;gap:2rem}
.nav .links a{color:var(--muted);text-decoration:none;font-size:.9rem;font-weight:500;transition:color .2s;position:relative}
.nav .links a:hover{color:var(--text)}
.nav .links a::after{content:'';position:absolute;bottom:-4px;left:0;width:0;height:2px;background:var(--p);transition:width .3s}
.nav .links a:hover::after{width:100%}
.nav .cta{background:var(--p);color:#000;padding:.55rem 1.4rem;border-radius:100px;font-weight:700;font-size:.85rem;text-decoration:none;transition:transform .2s,box-shadow .2s}
.nav .cta:hover{transform:scale(1.05);box-shadow:var(--glow)}
.nav .menu-btn{display:none;background:none;border:none;color:#fff;font-size:1.5rem;cursor:pointer}

/* Buttons */
.btn{display:inline-flex;align-items:center;gap:.5rem;padding:.9rem 2rem;border-radius:100px;font-weight:700;font-family:var(--hf);text-decoration:none;transition:all .3s cubic-bezier(.4,0,.2,1);cursor:pointer;border:none;font-size:.95rem}
.btn-p{background:var(--p);color:#000;box-shadow:0 4px 20px rgba(0,217,255,.2)}
.btn-p:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(0,217,255,.3)}
.btn-s{background:transparent;border:1px solid var(--border);color:#fff}
.btn-s:hover{border-color:var(--p);background:rgba(0,217,255,.05)}
.btn-g{background:linear-gradient(135deg,var(--p),var(--s));color:#000;background-size:200% 200%;animation:gradientShift 3s ease infinite}
@keyframes gradientShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}

/* Hero */
.hero{text-align:center;padding:7rem 5% 5rem;position:relative;overflow:hidden}
.hero h1{font-size:clamp(2.5rem,7vw,5rem);margin-bottom:1.2rem;line-height:1.1}
.hero .sub{color:var(--muted);font-size:clamp(1rem,2vw,1.3rem);margin-bottom:2.5rem;max-width:620px;margin-left:auto;margin-right:auto}
.hero-cta{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}
.hero-badge{display:inline-flex;align-items:center;gap:.5rem;padding:.4rem 1rem;border-radius:100px;background:rgba(0,255,157,.08);border:1px solid rgba(0,255,157,.2);color:var(--a);font-size:.8rem;font-weight:600;margin-bottom:1.5rem;animation:pulse 2s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.7}}

/* Sections */
.section{padding:5rem 5%;max-width:1200px;margin:0 auto;position:relative}
.section-header{text-align:center;margin-bottom:3rem}
.section-header h2{font-size:clamp(1.8rem,4vw,2.8rem);margin-bottom:.8rem}
.section-header p{color:var(--muted);font-size:1.05rem;max-width:500px;margin:0 auto}

/* Cards */
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem}
.card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:2rem;transition:all .4s cubic-bezier(.4,0,.2,1);position:relative;overflow:hidden}
.card::before{content:'';position:absolute;top:0;left:0;width:100%;height:1px;background:linear-gradient(90deg,transparent,var(--p),transparent);opacity:0;transition:opacity .3s}
.card:hover{transform:translateY(-6px);border-color:rgba(0,217,255,.2);background:rgba(255,255,255,.05)}
.card:hover::before{opacity:1}
.card .icon{width:48px;height:48px;border-radius:12px;background:rgba(0,217,255,.1);display:flex;align-items:center;justify-content:center;font-size:1.4rem;margin-bottom:1rem}
.card h3{font-size:1.25rem;margin-bottom:.5rem}
.card .price{font-size:1.8rem;font-weight:800;color:var(--p);margin-top:.8rem;font-family:var(--hf)}
.card .price small{font-size:.8rem;color:var(--muted);font-weight:400}

/* About */
.about-grid{display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center}
.about-text p{color:var(--muted);margin-bottom:1rem;font-size:1.05rem}
.about-stats{display:flex;gap:2rem;margin-top:2rem;flex-wrap:wrap}
.stat{text-align:center}
.stat .num{font-size:2.5rem;font-weight:800;color:var(--p);font-family:var(--hf)}
.stat .label{font-size:.85rem;color:var(--muted)}

/* Testimonials */
.testimonial{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:2rem;position:relative;margin-bottom:1.5rem}
.testimonial::before{content:'"';position:absolute;top:-10px;left:20px;font-size:5rem;color:var(--p);opacity:.2;font-family:Georgia,serif}
.testimonial p{font-style:italic;color:#CBD5E1;margin-bottom:1rem}
.testimonial .author{display:flex;align-items:center;gap:.8rem}
.testimonial .avatar{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--p),var(--s));display:flex;align-items:center;justify-content:center;color:#000;font-weight:700}
.testimonial .name{font-weight:600}
.testimonial .location{font-size:.85rem;color:var(--muted)}

/* FAQ Accordion */
.faq-item{background:var(--card);border:1px solid var(--border);border-radius:12px;margin-bottom:.8rem;overflow:hidden;transition:border-color .3s}
.faq-item:hover{border-color:rgba(0,217,255,.2)}
.faq-q{padding:1.2rem 1.5rem;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-weight:600;font-size:1.05rem;list-style:none}
.faq-q::-webkit-details-marker{display:none}
.faq-q .icon{transition:transform .3s;color:var(--p)}
.faq-item[open] .faq-q .icon{transform:rotate(45deg)}
.faq-a{padding:0 1.5rem 1.2rem;color:var(--muted);line-height:1.7;animation:fadeIn .3s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}

/* Contact */
.contact-card{background:var(--card);border:1px solid var(--border);border-radius:24px;padding:3.5rem;text-align:center;position:relative;overflow:hidden}
.contact-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--p),var(--s),transparent)}
.contact-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1.5rem;margin-top:2rem}
.contact-item{padding:1.5rem;border-radius:12px;background:rgba(255,255,255,.02);border:1px solid var(--border);transition:all .3s}
.contact-item:hover{border-color:rgba(0,217,255,.2);transform:translateY(-2px)}
.contact-item .icon{font-size:1.5rem;margin-bottom:.5rem}
.contact-item .label{font-size:.8rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.3rem}
.contact-item .value{color:var(--p);font-weight:600}

/* CTA Banner */
.cta-banner{background:linear-gradient(135deg,rgba(0,217,255,.05),rgba(99,102,241,.05));border:1px solid var(--border);border-radius:24px;padding:4rem;text-align:center;margin:3rem auto;max-width:1000px;position:relative;overflow:hidden}
.cta-banner::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,var(--p),transparent 70%);opacity:.05;animation:rotate 20s linear infinite}
@keyframes rotate{from{transform:rotate(0)}to{transform:rotate(360deg)}}
.cta-banner h2{font-size:clamp(1.8rem,4vw,2.5rem);margin-bottom:1rem;position:relative}
.cta-banner p{color:var(--muted);margin-bottom:2rem;position:relative}

/* Footer */
footer{text-align:center;padding:3rem 5%;border-top:1px solid rgba(255,255,255,.05);color:var(--muted)}
footer a{color:var(--p);text-decoration:none}
.footer-links{display:flex;justify-content:center;gap:2rem;margin-bottom:1.5rem;flex-wrap:wrap}
.footer-links a{color:var(--muted);font-size:.9rem;transition:color .2s}
.footer-links a:hover{color:var(--p)}

/* Scroll Animations */
.reveal{opacity:0;transform:translateY(30px);transition:opacity .8s cubic-bezier(.4,0,.2,1),transform .8s cubic-bezier(.4,0,.2,1)}
.reveal.active{opacity:1;transform:translateY(0)}
.reveal-delay-1{transition-delay:.1s}
.reveal-delay-2{transition-delay:.2s}
.reveal-delay-3{transition-delay:.3s}
.reveal-delay-4{transition-delay:.4s}
.reveal-scale{opacity:0;transform:scale(.95);transition:opacity .6s,transform .6s}
.reveal-scale.active{opacity:1;transform:scale(1)}
.reveal-left{opacity:0;transform:translateX(-40px);transition:opacity .8s,transform .8s}
.reveal-left.active{opacity:1;transform:translateX(0)}
.reveal-right{opacity:0;transform:translateX(40px);transition:opacity .8s,transform .8s}
.reveal-right.active{opacity:1;transform:translateX(0)}

/* Image effects */
.img-glow{border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.4);transition:transform .4s}
.img-glow:hover{transform:scale(1.02)}
.img-frame{border-radius:16px;overflow:hidden;border:1px solid var(--border);position:relative}
.img-frame img{width:100%;display:block;transition:transform .5s}
.img-frame:hover img{transform:scale(1.05)}

/* Stats counter */
.counter{display:inline-block;font-variant-numeric:tabular-nums}

/* Mobile */
@media(max-width:768px){
  .nav .links{display:none;position:fixed;top:60px;left:0;right:0;background:rgba(9,9,11,.95);backdrop-filter:blur(20px);flex-direction:column;padding:2rem;gap:1.5rem;border-bottom:1px solid var(--border)}
  .nav .links.open{display:flex}
  .nav .menu-btn{display:block}
  .about-grid{grid-template-columns:1fr;gap:2rem}
  .hero{padding:4rem 5% 3rem}
  .section{padding:3rem 5%}
  .cta-banner{padding:2.5rem 1.5rem}
  .contact-card{padding:2rem 1.5rem}
  .footer-links{gap:1rem}
}
@media(max-width:480px){
  .hero h1{font-size:2rem}
  .btn{padding:.8rem 1.5rem;font-size:.9rem}
}
`;
}

export function getAnimationJS() {
  return `
<script>
// ERGIO Animation Engine
(function(){
  // Scroll reveal animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Counter animation
        if (entry.target.classList.contains('counter')) {
          const target = parseInt(entry.target.dataset.target || '0');
          const suffix = entry.target.dataset.suffix || '';
          let current = 0;
          const step = target / 40;
          const timer = setInterval(() => {
            current += step;
            if (current >= target) { current = target; clearInterval(timer); }
            entry.target.textContent = Math.round(current).toLocaleString() + suffix;
          }, 25);
        }
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal,.reveal-scale,.reveal-left,.reveal-right,.counter').forEach(el => observer.observe(el));

  // Nav scroll effect
  const nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    });
  }

  // Mobile menu toggle
  const menuBtn = document.querySelector('.nav .menu-btn');
  const navLinks = document.querySelector('.nav .links');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
  }

  // FAQ accordion
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    if (q) q.addEventListener('click', () => {
      document.querySelectorAll('.faq-item').forEach(other => { if (other !== item) other.open = false; });
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

  // Parallax hero image
  const heroImg = document.querySelector('.hero img');
  if (heroImg) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      if (scrolled < 600) heroImg.style.transform = 'translateY(' + scrolled * 0.15 + 'px)';
    });
  }
})();
</script>
`;
}

export function getGoogleFonts() {
  return `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">`;
}
