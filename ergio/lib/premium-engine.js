// ============================================================
// ERGIO PREMIUM GENERATION ENGINE v3.0
// World-class website generation — Awwwards-level quality
// ============================================================

// ── LAYOUT ARCHETYPES ─────────────────────────────────────
export const LAYOUT_ARCHETYPES = {
  magazine: { name:'Magazine', desc:'Editorial multi-column with oversized headlines', sections:['hero-billboard','feature-split','stats-bar','testimonial-quote','cta-band'] },
  apple: { name:'Apple Style', desc:'Full-bleed centered, massive reveals', sections:['hero-centered','feature-split','feature-grid-3','stats-bar','testimonial-row','cta-minimal'] },
  stripe: { name:'Stripe Style', desc:'Gradient mesh, floating UI cards', sections:['hero-gradient','feature-grid-3','stats-bar','testimonial-row','cta-gradient'] },
  tesla: { name:'Tesla Style', desc:'Full-screen heroes, minimal text', sections:['hero-fullscreen','feature-split','stats-bar','testimonial-row','cta-minimal'] },
  glassmorphism: { name:'Glassmorphism', desc:'Frosted glass, blur, gradient orbs', sections:['hero-glass','glass-cards','stats-glass','testimonial-row','cta-glass'] },
  brutalist: { name:'Brutalist', desc:'Raw HTML, bold borders, monospace', sections:['hero-raw','grid-blocks','stats-bar','testimonial-row','cta-band'] },
  swiss: { name:'Swiss Design', desc:'Grid-based, minimal color, mathematical', sections:['hero-centered','feature-grid-3','stats-bar','testimonial-row','cta-minimal'] },
  immersive: { name:'Immersive Scroll', desc:'Story-driven, pinned sections', sections:['hero-pinned','feature-split','stats-bar','testimonial-quote','cta-band'] },
  neomorphic: { name:'Neomorphic', desc:'Soft UI, extruded surfaces', sections:['hero-centered','feature-grid-3','stats-glass','testimonial-row','cta-minimal'] },
  split3d: { name:'3D Split', desc:'Three.js 3D hero, mouse-tilt', sections:['hero-3d','feature-split','feature-grid-3','testimonial-row','cta-gradient'] },
  luxury: { name:'Dark Luxury', desc:'Black/gold, Playfair, cinematic', sections:['hero-cinematic','feature-split','gold-stats','testimonial-quote','cta-minimal'] },
  dashboard: { name:'Dashboard Style', desc:'SaaS dashboard, data viz', sections:['hero-dashboard','feature-grid-3','stats-bar','testimonial-row','cta-gradient'] },
};


// ── COMPONENT LIBRARY ─────────────────────────────────────
export const COMPONENTS = {
  heroes: {
    'hero-billboard': (d) => heroBillboard(d),
    'hero-centered': (d) => heroCentered(d),
    'hero-gradient': (d) => heroGradient(d),
    'hero-glass': (d) => heroGlass(d),
    'hero-3d': (d) => hero3D(d),
    'hero-cinematic': (d) => heroCinematic(d),
    'hero-raw': (d) => heroRaw(d),
    'hero-fullscreen': (d) => heroFullscreen(d),
    'hero-pinned': (d) => heroPinned(d),
    'hero-dashboard': (d) => heroDashboard(d),
  },
  features: {
    'feature-split': (d) => featureSplit(d),
    'feature-grid-3': (d) => featureGrid3(d),
    'glass-cards': (d) => glassCards(d),
    'grid-blocks': (d) => gridBlocks(d),
  },
  stats: {
    'stats-bar': (d) => statsBar(d),
    'stats-glass': (d) => statsGlass(d),
    'gold-stats': (d) => goldStats(d),
  },
  testimonials: {
    'testimonial-quote': (d) => testimonialQuote(d),
    'testimonial-row': (d) => testimonialRow(d),
  },
  ctas: {
    'cta-band': (d) => ctaBand(d),
    'cta-minimal': (d) => ctaMinimal(d),
    'cta-gradient': (d) => ctaGradient(d),
    'cta-glass': (d) => ctaGlass(d),
  },
  faq: (d) => faqSection(d),
  contact: (d) => contactSection(d),
  footer: (d) => footerSection(d),
};

// ── HERO GENERATORS ───────────────────────────────────────
function heroBillboard(d) {
  const bg = d.colors?.bg || '#09090B';
  const primary = d.colors?.primary || '#00D9FF';
  const text = d.colors?.text || '#f0f4ff';
  const muted = d.colors?.muted || '#8892a4';
  const heroImg = d.heroImage || d.images?.hero?.[0]?.url || '';
  
  return `<section style="min-height:100vh;position:relative;overflow:hidden;display:grid;grid-template-columns:1fr 1fr;background:${bg}">
    <!-- Left: Typography -->
    <div style="display:flex;flex-direction:column;justify-content:center;padding:8% 6% 8% 7%;position:relative;z-index:2">
      <div style="font-size:clamp(.65rem,1vw,.75rem);font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${primary};margin-bottom:1.5rem;opacity:0;animation:fadeIn .6s .1s forwards">
        ${d.category || d.type || 'Business'} · ${d.city || 'Nigeria'} · Est. ${new Date().getFullYear()}
      </div>
      <h1 style="font-size:clamp(2.5rem,7vw,5.5rem);font-weight:900;line-height:0.92;letter-spacing:-0.04em;color:${text};margin-bottom:1.8rem;opacity:0;animation:fadeUp .8s .2s forwards">
        ${d.headline || d.businessName}
      </h1>
      <p style="font-size:clamp(1rem,1.8vw,1.25rem);color:${muted};max-width:440px;line-height:1.7;margin-bottom:2.5rem;opacity:0;animation:fadeUp .8s .4s forwards">
        ${d.subheadline || d.tagline || ''}
      </p>
      <div style="display:flex;gap:1rem;flex-wrap:wrap;opacity:0;animation:fadeUp .8s .6s forwards">
        <a href="#contact" style="display:inline-flex;align-items:center;gap:.5rem;background:${primary};color:${bg};padding:1rem 2.2rem;border-radius:4px;font-weight:800;font-size:1rem;text-decoration:none;letter-spacing:-.01em;transition:all .3s;box-shadow:0 8px 24px ${primary}44">
          ${d.cta || 'Get Started'} <span style="font-size:1.1rem">→</span>
        </a>
        <a href="#about" style="display:inline-flex;align-items:center;gap:.5rem;background:transparent;color:${text};padding:1rem 2rem;border-radius:4px;font-weight:700;font-size:1rem;text-decoration:none;border:1px solid rgba(255,255,255,0.15);transition:all .3s">
          Learn More
        </a>
      </div>
      <!-- Stats strip -->
      <div style="display:flex;gap:2.5rem;margin-top:3.5rem;padding-top:2rem;border-top:1px solid rgba(255,255,255,.08);opacity:0;animation:fadeIn .8s .8s forwards">
        ${(d.stats||[{label:'Happy Clients',value:'500+'},{label:'Projects',value:'200+'},{label:'Years',value:'5+'}]).slice(0,3).map(s => `
          <div>
            <div style="font-size:1.6rem;font-weight:900;color:${primary};letter-spacing:-.03em">${s.value}</div>
            <div style="font-size:.72rem;color:${muted};text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-top:.2rem">${s.label}</div>
          </div>`).join('')}
      </div>
    </div>
    <!-- Right: Full-bleed image -->
    <div style="position:relative;overflow:hidden;min-height:100vh">
      ${heroImg 
        ? `<img src="${heroImg}" alt="${d.businessName}" style="width:100%;height:100%;object-fit:cover;display:block;filter:brightness(.85) contrast(1.05)">`
        : `<div style="width:100%;height:100%;background:linear-gradient(145deg,${primary}22 0%,${bg} 100%);display:flex;align-items:center;justify-content:center">
            <div style="font-size:8rem;opacity:.3">🏢</div>
          </div>`}
      <!-- Overlay gradient -->
      <div style="position:absolute;inset:0;background:linear-gradient(to right,${bg} 0%,transparent 25%,transparent 75%,${bg}88 100%)"></div>
      <!-- Floating badge -->
      <div style="position:absolute;bottom:2rem;right:2rem;background:rgba(0,0,0,.7);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:1rem 1.4rem">
        <div style="font-size:.65rem;color:${muted};text-transform:uppercase;letter-spacing:.1em;font-weight:600">Based in</div>
        <div style="font-size:1rem;font-weight:800;color:${text};margin-top:.2rem">${d.city || 'Nigeria'}</div>
      </div>
    </div>
    <!-- Scroll indicator -->
    <div style="position:absolute;bottom:2rem;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:.4rem;opacity:.4;animation:float 2s ease-in-out infinite">
      <span style="font-size:.65rem;color:${muted};text-transform:uppercase;letter-spacing:.1em;font-weight:600">Scroll</span>
      <div style="width:1px;height:40px;background:linear-gradient(to bottom,${muted},transparent)"></div>
    </div>
  </section>`;
}


function heroCentered(d) {
  return `<section class="hero" style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:${d.colors.bg};position:relative;overflow:hidden">
    <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 30%,${d.colors.primary}15,transparent 70%);z-index:0"></div>
    <div style="position:relative;z-index:2;padding:0 5%;max-width:900px">
      <h1 style="font-size:clamp(3rem,10vw,7rem);font-weight:800;letter-spacing:-0.04em;line-height:1;margin-bottom:1.5rem;opacity:0;animation:fadeUp 1s .1s forwards;background:linear-gradient(180deg,${d.colors.text},${d.colors.muted});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${d.headline}</h1>
      <p style="font-size:clamp(1.1rem,3vw,1.6rem);color:${d.colors.muted};margin-bottom:2.5rem;opacity:0;animation:fadeUp 1s .3s forwards">${d.subheadline}</p>
      <div style="opacity:0;animation:fadeUp 1s .5s forwards">
        <a href="#contact" style="background:${d.colors.primary};color:${d.colors.bg};padding:1.2rem 2.5rem;border-radius:100px;font-weight:700;text-decoration:none;font-size:1.1rem;transition:all .3s;box-shadow:0 8px 30px ${d.colors.primary}66;display:inline-block">${d.cta||'Get Started'}</a>
      </div>
    </div>
    <div style="position:absolute;bottom:2rem;left:50%;transform:translateX(-50%);opacity:0;animation:fadeIn 1s 1s forwards;color:${d.colors.muted};font-size:0.8rem">Scroll to explore</div>
  </section>`;
}

function heroGradient(d) {
  return `<section class="hero" style="min-height:92vh;display:flex;align-items:center;position:relative;overflow:hidden;background:linear-gradient(135deg,${d.colors.bg} 0%,${d.colors.surface} 50%,${d.colors.bg} 100%)">
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 20% 50%,${d.colors.primary}33,transparent 50%),radial-gradient(ellipse at 80% 50%,${d.colors.accent}22,transparent 50%);z-index:0;animation:gradientShift 8s ease-in-out infinite alternate"></div>
    <div style="position:relative;z-index:2;max-width:1200px;margin:0 auto;padding:0 5%;width:100%;display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center" class="hero-grid">
      <div>
        <div style="display:inline-block;padding:0.4rem 1rem;border-radius:100px;background:${d.colors.primary}22;color:${d.colors.primary};font-size:0.8rem;font-weight:600;margin-bottom:1.5rem;opacity:0;animation:fadeUp .8s .1s forwards">${d.category||'Platform'}</div>
        <h1 style="font-size:clamp(2.5rem,6vw,5rem);font-weight:800;line-height:1.05;letter-spacing:-0.02em;margin-bottom:1.5rem;opacity:0;animation:fadeUp .8s .2s forwards">${d.headline}</h1>
        <p style="font-size:clamp(1rem,2.5vw,1.3rem);color:${d.colors.muted};margin-bottom:2rem;opacity:0;animation:fadeUp .8s .3s forwards">${d.subheadline}</p>
        <div style="opacity:0;animation:fadeUp .8s .4s forwards">
          <a href="#contact" style="background:${d.colors.primary};color:${d.colors.bg};padding:1rem 2rem;border-radius:8px;font-weight:700;text-decoration:none;display:inline-block;transition:all .3s">${d.cta||'Start Free'}</a>
        </div>
      </div>
      <div style="position:relative;opacity:0;animation:fadeIn 1s .5s forwards" class="hero-visual">
        <div style="background:${d.colors.surface};border:1px solid ${d.colors.border};border-radius:16px;padding:2rem;box-shadow:0 20px 60px rgba(0,0,0,0.3);backdrop-filter:blur(20px)">
          <div style="display:flex;gap:0.5rem;margin-bottom:1.5rem"><div style="width:12px;height:12px;border-radius:50%;background:#ff5f57"></div><div style="width:12px;height:12px;border-radius:50%;background:#febc2e"></div><div style="width:12px;height:12px;border-radius:50%;background:#28c840"></div></div>
          <div style="font-family:monospace;font-size:0.85rem;color:${d.colors.muted};line-height:1.8">
            <div style="color:${d.colors.primary}">const biz = await ERGIO.create({</div>
            <div style="padding-left:1.5rem">name: <span style="color:${d.colors.accent}">"${d.businessName||'Your Business'}"</span>,</div>
            <div style="padding-left:3rem">type: <span style="color:${d.colors.accent}">"${d.type||'service'}"</span>,</div>
            <div style="padding-left:1.5rem">});</div>
            <div style="color:${d.colors.primary};margin-top:1rem">Website generated</div>
            <div style="color:${d.colors.primary}">Payments configured</div>
            <div style="color:${d.colors.primary}">Clients acquired</div>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

function heroGlass(d) {
  return `<section class="hero" style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:${d.colors.bg};position:relative;overflow:hidden">
    <div style="position:absolute;width:600px;height:600px;border-radius:50%;background:${d.colors.primary};filter:blur(120px);opacity:0.3;top:-100px;left:-100px;animation:float 6s ease-in-out infinite"></div>
    <div style="position:absolute;width:500px;height:500px;border-radius:50%;background:${d.colors.accent};filter:blur(100px);opacity:0.2;bottom:-50px;right:-50px;animation:float 8s ease-in-out infinite reverse"></div>
    <div style="position:relative;z-index:2;text-align:center;padding:0 5%;max-width:800px">
      <div style="background:rgba(255,255,255,0.08);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.12);border-radius:24px;padding:3rem 2rem;box-shadow:0 8px 32px rgba(0,0,0,0.1)">
        <h1 style="font-size:clamp(2.5rem,7vw,5rem);font-weight:800;letter-spacing:-0.03em;line-height:1.05;margin-bottom:1.5rem;opacity:0;animation:fadeUp .8s .2s forwards">${d.headline}</h1>
        <p style="font-size:clamp(1rem,2.5vw,1.4rem);color:${d.colors.muted};margin-bottom:2.5rem;opacity:0;animation:fadeUp .8s .3s forwards">${d.subheadline}</p>
        <div style="opacity:0;animation:fadeUp .8s .4s forwards">
          <a href="#contact" style="background:rgba(255,255,255,0.15);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.2);color:${d.colors.text};padding:1rem 2.5rem;border-radius:100px;font-weight:700;text-decoration:none;display:inline-block;transition:all .3s">${d.cta||'Get Started'}</a>
        </div>
      </div>
    </div>
  </section>`;
}

function hero3D(d) {
  return `<section class="hero" style="min-height:100vh;display:flex;align-items:center;background:${d.colors.bg};position:relative;overflow:hidden">
    <canvas id="hero-3d-canvas" style="position:absolute;inset:0;z-index:0;opacity:0.7"></canvas>
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 0%,${d.colors.bg}cc 80%,${d.colors.bg} 100%);z-index:1"></div>
    <div style="position:relative;z-index:2;max-width:1200px;margin:0 auto;padding:0 5%;width:100%;text-align:center">
      <h1 style="font-size:clamp(3rem,10vw,7rem);font-weight:900;letter-spacing:-0.04em;line-height:0.95;margin-bottom:1.5rem;opacity:0;animation:fadeUp 1s .3s forwards;background:linear-gradient(135deg,${d.colors.text},${d.colors.primary});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${d.headline}</h1>
      <p style="font-size:clamp(1.1rem,3vw,1.6rem);color:${d.colors.muted};margin-bottom:2.5rem;opacity:0;animation:fadeUp 1s .5s forwards">${d.subheadline}</p>
      <div style="opacity:0;animation:fadeUp 1s .7s forwards">
        <a href="#contact" style="background:${d.colors.primary};color:${d.colors.bg};padding:1.2rem 3rem;border-radius:100px;font-weight:800;text-decoration:none;font-size:1.1rem;display:inline-block;box-shadow:0 10px 40px ${d.colors.primary}55;transition:all .3s">${d.cta||'Get Started'}</a>
      </div>
    </div>
  </section>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>
  <script>
    (function(){
      const canvas=document.getElementById('hero-3d-canvas');
      if(!canvas||!window.THREE)return;
      const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,0.1,1000);
      const renderer=new THREE.WebGLRenderer({canvas,alpha:true});renderer.setSize(innerWidth,innerHeight);
      const geo=new THREE.IcosahedronGeometry(3,1);const mat=new THREE.MeshStandardMaterial({color:0x${(d.colors.primary||'#00D9FF').replace('#','')},wireframe:true,transparent:true,opacity:0.6});
      const mesh=new THREE.Mesh(geo,mat);scene.add(mesh);
      const light=new THREE.PointLight(0x${(d.colors.accent||'#00FF9D').replace('#','')},1,100);light.position.set(10,10,10);scene.add(light);
      camera.position.z=8;let mx=0,my=0;
      document.addEventListener('mousemove',e=>{mx=(e.clientX/innerWidth-0.5)*2;my=(e.clientY/innerHeight-0.5)*2;});
      function animate(){requestAnimationFrame(animate);mesh.rotation.x+=0.005;mesh.rotation.y+=0.005;camera.position.x+=(mx*2-camera.position.x)*0.05;camera.position.y+=(-my*2-camera.position.y)*0.05;camera.lookAt(scene.position);renderer.render(scene,camera);}animate();
      addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
    })();
  <\/script>`;
}

function heroCinematic(d) {
  return `<section class="hero" style="min-height:100vh;display:flex;align-items:flex-end;background:linear-gradient(180deg,${d.colors.bg} 0%,${d.colors.surface} 100%);position:relative;overflow:hidden">
    ${d.heroImage?`<div style="position:absolute;inset:0;z-index:0"><img src="${d.heroImage}" alt="${d.businessName}" style="width:100%;height:100%;object-fit:cover;opacity:0.3" loading="eager"></div><div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 0%,${d.colors.bg} 100%);z-index:1"></div>`:''}
    <div style="position:relative;z-index:2;max-width:1200px;margin:0 auto;padding:0 5% 6rem;width:100%">
      <div style="width:60px;height:2px;background:${d.colors.primary};margin-bottom:2rem;opacity:0;animation:fadeIn 1s .3s forwards"></div>
      <h1 style="font-family:serif;font-size:clamp(3rem,8vw,6rem);font-weight:400;line-height:1.05;letter-spacing:-0.02em;margin-bottom:1.5rem;opacity:0;animation:fadeUp 1.2s .4s forwards">${d.headline}</h1>
      <p style="font-size:clamp(1rem,2.5vw,1.4rem);color:${d.colors.muted};font-style:italic;margin-bottom:2.5rem;max-width:600px;opacity:0;animation:fadeUp 1.2s .6s forwards">${d.subheadline}</p>
      <div style="opacity:0;animation:fadeUp 1.2s .8s forwards">
        <a href="#contact" style="background:transparent;border:1px solid ${d.colors.primary};color:${d.colors.primary};padding:1rem 3rem;text-decoration:none;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;font-size:0.85rem;transition:all .3s;display:inline-block">${d.cta||'Discover'}</a>
      </div>
    </div>
  </section>`;
}

function heroRaw(d) {
  return `<section class="hero" style="min-height:90vh;display:flex;flex-direction:column;justify-content:center;background:${d.colors.bg};border-bottom:4px solid ${d.colors.text};padding:4rem 5%">
    <div style="max-width:1200px;margin:0 auto;width:100%">
      <div style="font-family:monospace;font-size:0.8rem;color:${d.colors.primary};margin-bottom:2rem">[ ${d.category||'BUSINESS'} — EST. ${new Date().getFullYear()} ]</div>
      <h1 style="font-size:clamp(3rem,12vw,9rem);font-weight:900;letter-spacing:-0.05em;line-height:0.9;margin-bottom:2rem;text-transform:uppercase">${d.headline}</h1>
      <p style="font-size:clamp(1rem,3vw,1.8rem);color:${d.colors.muted};max-width:700px;border-left:4px solid ${d.colors.primary};padding-left:1.5rem;margin-bottom:2.5rem">${d.subheadline}</p>
      <a href="#contact" style="background:${d.colors.text};color:${d.colors.bg};padding:1rem 3rem;text-decoration:none;font-weight:900;text-transform:uppercase;font-size:0.9rem;letter-spacing:0.1em;display:inline-block;border:3px solid ${d.colors.text};transition:all .2s">${d.cta||'Start Now'}</a>
    </div>
  </section>`;
}

function heroFullscreen(d) {
  return `<section class="hero" style="height:100vh;display:flex;align-items:center;justify-content:center;background:${d.colors.bg};position:relative;overflow:hidden">
    ${d.heroImage?`<div style="position:absolute;inset:0;z-index:0"><img src="${d.heroImage}" alt="${d.businessName}" style="width:100%;height:100%;object-fit:cover" loading="eager"></div><div style="position:absolute;inset:0;background:linear-gradient(180deg,${d.colors.bg}33 0%,${d.colors.bg}cc 100%);z-index:1"></div>`:''}
    <div style="position:relative;z-index:2;text-align:center;padding:0 5%">
      <h1 style="font-size:clamp(3rem,10vw,8rem);font-weight:700;letter-spacing:-0.03em;line-height:1;margin-bottom:1rem;opacity:0;animation:fadeUp 1.5s .5s forwards">${d.headline}</h1>
      <p style="font-size:clamp(1.2rem,4vw,2rem);color:${d.colors.muted};margin-bottom:0;opacity:0;animation:fadeUp 1.5s 1s forwards">${d.subheadline}</p>
    </div>
  </section>`;
}

function heroPinned(d) {
  return `<section class="hero" style="height:100vh;display:flex;align-items:center;background:${d.colors.bg};position:relative;overflow:hidden;position:sticky;top:0">
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at center,${d.colors.primary}11,transparent 70%);z-index:0"></div>
    <div style="position:relative;z-index:2;max-width:1200px;margin:0 auto;padding:0 5%;width:100%">
      <h1 style="font-size:clamp(3rem,12vw,8rem);font-weight:900;letter-spacing:-0.05em;line-height:0.9;margin-bottom:1.5rem;opacity:0;animation:fadeUp 1s .3s forwards">${d.headline}</h1>
      <p style="font-size:clamp(1.2rem,4vw,2rem);color:${d.colors.muted};max-width:700px;opacity:0;animation:fadeUp 1s .5s forwards">${d.subheadline}</p>
    </div>
  </section>`;
}

function heroDashboard(d) {
  return `<section class="hero" style="min-height:90vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,${d.colors.bg} 0%,${d.colors.surface} 100%);position:relative;padding:4rem 5%">
    <div style="text-align:center;max-width:800px;margin-bottom:3rem">
      <h1 style="font-size:clamp(2.5rem,7vw,5rem);font-weight:800;letter-spacing:-0.03em;line-height:1.05;margin-bottom:1.5rem;opacity:0;animation:fadeUp .8s .2s forwards">${d.headline}</h1>
      <p style="font-size:clamp(1rem,2.5vw,1.4rem);color:${d.colors.muted};opacity:0;animation:fadeUp .8s .3s forwards">${d.subheadline}</p>
    </div>
    <div style="width:100%;max-width:900px;background:${d.colors.surface};border:1px solid ${d.colors.border};border-radius:12px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3);opacity:0;animation:fadeUp .8s .5s forwards">
      <div style="display:flex;border-bottom:1px solid ${d.colors.border}">
        <div style="width:200px;border-right:1px solid ${d.colors.border};padding:1rem">
          <div style="height:30px;background:${d.colors.primary}33;border-radius:6px;margin-bottom:0.8rem"></div>
          <div style="height:20px;background:${d.colors.border};border-radius:4px;margin-bottom:0.5rem;width:80%"></div>
          <div style="height:20px;background:${d.colors.border};border-radius:4px;margin-bottom:0.5rem;width:60%"></div>
          <div style="height:20px;background:${d.colors.primary}22;border-radius:4px;width:70%"></div>
        </div>
        <div style="flex:1;padding:1.5rem">
          <div style="display:flex;gap:1rem;margin-bottom:1.5rem">
            <div style="flex:1;background:${d.colors.bg};border-radius:8px;padding:1rem"><div style="font-size:0.7rem;color:${d.colors.muted};margin-bottom:0.5rem">Revenue</div><div style="font-size:1.5rem;font-weight:800;color:${d.colors.primary}">₦${(Math.random()*900+100).toFixed(0)}K</div></div>
            <div style="flex:1;background:${d.colors.bg};border-radius:8px;padding:1rem"><div style="font-size:0.7rem;color:${d.colors.muted};margin-bottom:0.5rem">Clients</div><div style="font-size:1.5rem;font-weight:800">${Math.floor(Math.random()*200+50)}</div></div>
            <div style="flex:1;background:${d.colors.bg};border-radius:8px;padding:1rem"><div style="font-size:0.7rem;color:${d.colors.muted};margin-bottom:0.5rem">Growth</div><div style="font-size:1.5rem;font-weight:800;color:${d.colors.accent}">+${Math.floor(Math.random()*30+10)}%</div></div>
          </div>
          <div style="height:180px;background:${d.colors.bg};border-radius:8px;padding:1rem;display:flex;align-items:flex-end;gap:0.5rem">
            ${Array.from({length:12},()=>`<div style="flex:1;height:${Math.random()*80+20}%;background:linear-gradient(180deg,${d.colors.primary},${d.colors.primary}44);border-radius:4px 4px 0 0"></div>`).join('')}
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

// ── FEATURE GENERATORS ─────────────────────────────────────
function featureSplit(d) {
  return `<section id="about" style="padding:6rem 5%;background:${d.colors.surface}" class="reveal">
    <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center" class="about-grid">
      <div class="reveal-left">
        <div style="font-size:0.8rem;letter-spacing:0.15em;text-transform:uppercase;color:${d.colors.primary};font-weight:700;margin-bottom:1rem">${d.aboutLabel||'About Us'}</div>
        <h2 style="font-size:clamp(2rem,5vw,3.5rem);font-weight:800;letter-spacing:-0.02em;margin-bottom:1.5rem;line-height:1.1">${d.aboutTitle||d.headline}</h2>
        <p style="color:${d.colors.muted};font-size:1.1rem;line-height:1.8;margin-bottom:2rem">${d.about||d.subheadline}</p>
        <div style="display:flex;gap:2rem;flex-wrap:wrap">
          ${(d.whyChooseUs||['Expert Team','Trusted Quality','Fast Service']).slice(0,3).map(w=>`<div style="display:flex;align-items:center;gap:0.5rem;font-size:0.95rem;font-weight:600"><span style="color:${d.colors.primary};font-size:1.2rem">✓</span> ${w}</div>`).join('')}
        </div>
      </div>
      <div class="reveal-right" style="position:relative">
        <div style="aspect-ratio:4/3;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.2)">
          ${d.aboutImage?`<img src="${d.aboutImage}" alt="About ${d.businessName}" style="width:100%;height:100%;object-fit:cover" loading="lazy">`:`<div style="width:100%;height:100%;background:linear-gradient(135deg,${d.colors.primary}33,${d.colors.accent}22);display:flex;align-items:center;justify-content:center;font-size:4rem">${d.emoji||'🎨'}</div>`}
        </div>
      </div>
    </div>
  </section>`;
}

function featureGrid3(d) {
  return `<section id="features" style="padding:6rem 5%;background:${d.colors.bg}" class="reveal">
    <div style="max-width:1200px;margin:0 auto">
      <div style="text-align:center;margin-bottom:4rem">
        <h2 style="font-size:clamp(2rem,5vw,3.5rem);font-weight:800;letter-spacing:-0.02em;margin-bottom:1rem">${d.featuresTitle||'Why Choose Us'}</h2>
        <p style="color:${d.colors.muted};font-size:1.1rem;max-width:600px;margin:0 auto">${d.featuresSub||'Everything you need to succeed'}</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:2rem" class="stagger">
        ${(d.features||[]).map((f,i)=>`<div style="background:${d.colors.surface};border:1px solid ${d.colors.border};border-radius:16px;padding:2.5rem;transition:all .4s" onmouseover="this.style.transform='translateY(-8px)';this.style.boxShadow='0 20px 40px rgba(0,0,0,0.2)';this.style.borderColor='${d.colors.primary}44'" onmouseout="this.style.transform='';this.style.boxShadow='';this.style.borderColor='${d.colors.border}'">
          <div style="width:56px;height:56px;border-radius:14px;background:${d.colors.primary}15;display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin-bottom:1.5rem">${['🚀','⚡','🎯','💎','🔥','✨'][i%6]}</div>
          <h3 style="font-size:1.3rem;font-weight:700;margin-bottom:0.8rem">${f.title||f.name||f}</h3>
          <p style="color:${d.colors.muted};line-height:1.6;font-size:0.95rem">${f.description||f.desc||''}</p>
        </div>`).join('')}
      </div>
    </div>
  </section>`;
}

function glassCards(d) {
  return `<section id="features" style="padding:6rem 5%;background:${d.colors.bg};position:relative;overflow:hidden" class="reveal">
    <div style="position:absolute;width:400px;height:400px;border-radius:50%;background:${d.colors.primary};filter:blur(100px);opacity:0.1;top:20%;right:-100px"></div>
    <div style="max-width:1200px;margin:0 auto;position:relative;z-index:1">
      <div style="text-align:center;margin-bottom:4rem"><h2 style="font-size:clamp(2rem,5vw,3.5rem);font-weight:800;margin-bottom:1rem">${d.featuresTitle||'Features'}</h2></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem" class="stagger">
        ${(d.features||[]).map((f,i)=>`<div style="background:rgba(255,255,255,0.05);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:2rem;transition:all .4s" onmouseover="this.style.background='rgba(255,255,255,0.08)';this.style.transform='translateY(-4px)'" onmouseout="this.style.background='rgba(255,255,255,0.05)';this.style.transform=''">
          <div style="font-size:2rem;margin-bottom:1rem">${['🔮','⚡','🎯','💎','🚀','✨'][i%6]}</div>
          <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:0.5rem">${f.title||f.name||f}</h3>
          <p style="color:${d.colors.muted};font-size:0.9rem;line-height:1.6">${f.description||f.desc||''}</p>
        </div>`).join('')}
      </div>
    </div>
  </section>`;
}

function gridBlocks(d) {
  return `<section id="features" style="padding:4rem 5%;background:${d.colors.bg};border-top:4px solid ${d.colors.text};border-bottom:4px solid ${d.colors.text}" class="reveal">
    <div style="max-width:1200px;margin:0 auto">
      <h2 style="font-size:clamp(2rem,6vw,4rem);font-weight:900;text-transform:uppercase;margin-bottom:3rem;letter-spacing:-0.03em">${d.featuresTitle||'What We Do'}</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:0;border:2px solid ${d.colors.text}" class="stagger">
        ${(d.features||[]).map((f,i)=>`<div style="padding:2rem;border-right:${i%3!==2?'2px solid '+d.colors.text:'none'};border-bottom:2px solid ${d.colors.text};background:${i%2===0?d.colors.surface:d.colors.bg};transition:background .2s" onmouseover="this.style.background='${d.colors.primary}11'" onmouseout="this.style.background='${i%2===0?d.colors.surface:d.colors.bg}'">
          <div style="font-family:monospace;font-size:0.7rem;color:${d.colors.primary};margin-bottom:0.5rem">0${i+1}</div>
          <h3 style="font-size:1.2rem;font-weight:900;text-transform:uppercase;margin-bottom:0.5rem">${f.title||f.name||f}</h3>
          <p style="color:${d.colors.muted};font-size:0.9rem;line-height:1.5">${f.description||f.desc||''}</p>
        </div>`).join('')}
      </div>
    </div>
  </section>`;
}

// ── STATS GENERATORS ──────────────────────────────────────
function statsBar(d) {
  return `<section style="padding:4rem 5%;background:${d.colors.primary};color:${d.colors.bg}" class="reveal">
    <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:2rem;text-align:center">
      ${(d.stats||[{label:'Clients',value:'500+'},{label:'Projects',value:'1200+'},{label:'Years',value:'10+'},{label:'Satisfaction',value:'100%'}]).map(s=>`<div>
        <div style="font-size:clamp(2.5rem,5vw,4rem);font-weight:900;letter-spacing:-0.03em" class="counter" data-target="${s.numericValue||s.value}">${s.value}</div>
        <div style="font-size:0.85rem;text-transform:uppercase;letter-spacing:0.1em;opacity:0.8;margin-top:0.5rem;font-weight:600">${s.label}</div>
      </div>`).join('')}
    </div>
  </section>`;
}

function statsGlass(d) {
  return `<section style="padding:4rem 5%;background:${d.colors.bg};position:relative;overflow:hidden">
    <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1.5rem" class="stagger">
      ${(d.stats||[{label:'Clients',value:'500+'},{label:'Projects',value:'1200+'},{label:'Satisfaction',value:'100%'}]).map(s=>`<div style="background:rgba(255,255,255,0.05);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:2rem;text-align:center">
        <div style="font-size:clamp(2rem,4vw,3rem);font-weight:800;color:${d.colors.primary}" class="counter" data-target="${s.numericValue||s.value}">${s.value}</div>
        <div style="font-size:0.85rem;color:${d.colors.muted};text-transform:uppercase;letter-spacing:0.1em;margin-top:0.5rem">${s.label}</div>
      </div>`).join('')}
    </div>
  </section>`;
}

function goldStats(d) {
  return `<section style="padding:5rem 5%;background:${d.colors.bg};border-top:1px solid ${d.colors.primary}33;border-bottom:1px solid ${d.colors.primary}33" class="reveal">
    <div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:3rem;text-align:center">
      ${(d.stats||[{label:'Years',value:'15+'},{label:'Clients',value:'800+'},{label:'Projects',value:'1500+'},{label:'Awards',value:'25'}]).map(s=>`<div>
        <div style="font-family:serif;font-size:clamp(2.5rem,5vw,4rem);font-weight:400;color:${d.colors.primary};margin-bottom:0.5rem" class="counter" data-target="${s.numericValue||s.value}">${s.value}</div>
        <div style="width:40px;height:1px;background:${d.colors.primary};margin:0.5rem auto"></div>
        <div style="font-size:0.8rem;text-transform:uppercase;letter-spacing:0.15em;color:${d.colors.muted}">${s.label}</div>
      </div>`).join('')}
    </div>
  </section>`;
}

// ── TESTIMONIAL GENERATORS ─────────────────────────────────
function testimonialQuote(d) {
  const t=(d.testimonials||[{}])[0]||{};
  return `<section id="testimonials" style="padding:6rem 5%;background:${d.colors.surface}" class="reveal">
    <div style="max-width:900px;margin:0 auto;text-align:center">
      <div style="font-size:5rem;line-height:0.5;color:${d.colors.primary};opacity:0.3;font-family:serif;margin-bottom:1rem">"</div>
      <blockquote style="font-size:clamp(1.3rem,3vw,2rem);line-height:1.5;font-weight:500;margin-bottom:2rem;font-style:italic">${t.text||'Outstanding service that exceeded all expectations.'}</blockquote>
      <div style="display:flex;align-items:center;justify-content:center;gap:1rem">
        <div style="width:50px;height:50px;border-radius:50%;background:${d.colors.primary}33;display:flex;align-items:center;justify-content:center;font-weight:700;color:${d.colors.primary}">${(t.author||'C')[0]}</div>
        <div style="text-align:left"><div style="font-weight:700">${t.author||'Happy Client'}</div><div style="font-size:0.85rem;color:${d.colors.muted}">${t.role||'Verified Customer'}</div></div>
      </div>
    </div>
  </section>`;
}

function testimonialRow(d) {
  const items=d.testimonials||[{text:'Amazing experience!',author:'John D.',role:'Client'},{text:'Highly recommended.',author:'Sarah K.',role:'Customer'},{text:'Best decision ever.',author:'Mike A.',role:'Partner'}];
  return `<section id="testimonials" style="padding:6rem 5%;background:${d.colors.bg}" class="reveal">
    <div style="max-width:1200px;margin:0 auto">
      <h2 style="text-align:center;font-size:clamp(2rem,5vw,3.5rem);font-weight:800;margin-bottom:3rem">What People Say</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem" class="stagger">
        ${items.map(t=>`<div style="background:${d.colors.surface};border:1px solid ${d.colors.border};border-radius:16px;padding:2rem;transition:all .3s" onmouseover="this.style.transform='translateY(-4px)';this.style.borderColor='${d.colors.primary}44'" onmouseout="this.style.transform='';this.style.borderColor='${d.colors.border}'">
          <div style="color:${d.colors.primary};font-size:1.2rem;margin-bottom:1rem">★★★★★</div>
          <p style="color:${d.colors.muted};line-height:1.7;margin-bottom:1.5rem">"${t.text||t.quote||''}"</p>
          <div style="display:flex;align-items:center;gap:0.8rem"><div style="width:40px;height:40px;border-radius:50%;background:${d.colors.primary}22;display:flex;align-items:center;justify-content:center;font-weight:700;color:${d.colors.primary}">${(t.author||'C')[0]}</div><div><div style="font-weight:700;font-size:0.9rem">${t.author||'Client'}</div><div style="font-size:0.8rem;color:${d.colors.muted}">${t.role||''}</div></div></div>
        </div>`).join('')}
      </div>
    </div>
  </section>`;
}

// ── CTA GENERATORS ────────────────────────────────────────
function ctaBand(d) {
  return `<section id="contact" style="padding:6rem 5%;background:${d.colors.primary};color:${d.colors.bg};text-align:center" class="reveal">
    <div style="max-width:700px;margin:0 auto">
      <h2 style="font-size:clamp(2rem,5vw,3.5rem);font-weight:900;letter-spacing:-0.02em;margin-bottom:1.5rem">${d.ctaTitle||'Ready to Get Started?'}</h2>
      <p style="font-size:1.2rem;opacity:0.9;margin-bottom:2.5rem">${d.ctaSub||'Join us today and grow your business'}</p>
      <a href="#book" style="background:${d.colors.bg};color:${d.colors.primary};padding:1.2rem 3rem;border-radius:8px;text-decoration:none;font-weight:800;font-size:1.1rem;display:inline-block;transition:all .3s">${d.cta||'Get Started Now'}</a>
    </div>
  </section>`;
}

function ctaMinimal(d) {
  return `<section id="contact" style="padding:8rem 5%;background:${d.colors.bg};text-align:center" class="reveal">
    <h2 style="font-size:clamp(2.5rem,6vw,4.5rem);font-weight:800;letter-spacing:-0.03em;margin-bottom:1.5rem">${d.ctaTitle||'Get started today'}</h2>
    <p style="font-size:1.2rem;color:${d.colors.muted};margin-bottom:2.5rem">${d.ctaSub||'It only takes a minute'}</p>
    <a href="#book" style="background:${d.colors.primary};color:${d.colors.bg};padding:1.2rem 3rem;border-radius:100px;text-decoration:none;font-weight:700;font-size:1.1rem;display:inline-block;transition:all .3s;box-shadow:0 10px 30px ${d.colors.primary}44">${d.cta||'Get Started'}</a>
  </section>`;
}

function ctaGradient(d) {
  return `<section id="contact" style="padding:6rem 5%;background:linear-gradient(135deg,${d.colors.primary},${d.colors.accent});text-align:center;color:${d.colors.bg}" class="reveal">
    <div style="max-width:700px;margin:0 auto">
      <h2 style="font-size:clamp(2rem,5vw,3.5rem);font-weight:900;margin-bottom:1.5rem">${d.ctaTitle||'Start Your Journey'}</h2>
      <p style="font-size:1.2rem;opacity:0.9;margin-bottom:2.5rem">${d.ctaSub||'Transform your business today'}</p>
      <a href="#book" style="background:${d.colors.bg};color:${d.colors.primary};padding:1.2rem 3rem;border-radius:100px;text-decoration:none;font-weight:800;font-size:1.1rem;display:inline-block;transition:all .3s">${d.cta||'Get Started'}</a>
    </div>
  </section>`;
}

function ctaGlass(d) {
  return `<section id="contact" style="padding:6rem 5%;background:${d.colors.bg};position:relative;overflow:hidden;text-align:center" class="reveal">
    <div style="position:absolute;width:500px;height:500px;border-radius:50%;background:${d.colors.primary};filter:blur(120px);opacity:0.15;left:50%;transform:translateX(-50%);top:0"></div>
    <div style="position:relative;z-index:1;max-width:700px;margin:0 auto">
      <div style="background:rgba(255,255,255,0.05);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:3rem">
        <h2 style="font-size:clamp(2rem,5vw,3.5rem);font-weight:800;margin-bottom:1.5rem">${d.ctaTitle||'Ready to Begin?'}</h2>
        <p style="font-size:1.2rem;color:${d.colors.muted};margin-bottom:2.5rem">${d.ctaSub||"Let's build something great together"}</p>
        <a href="#book" style="background:${d.colors.primary};color:${d.colors.bg};padding:1.2rem 3rem;border-radius:100px;text-decoration:none;font-weight:700;font-size:1.1rem;display:inline-block;transition:all .3s">${d.cta||'Get Started'}</a>
      </div>
    </div>
  </section>`;
}

// ── FAQ ───────────────────────────────────────────────────
function faqSection(d) {
  const items=d.faq||[{q:'How do I get started?',a:'Simply click the button above and we will guide you.'},{q:'What are your prices?',a:'We offer flexible pricing starting from ₦3,000/month.'}];
  return `<section id="faq" style="padding:5rem 5%;background:${d.colors.surface}" class="reveal">
    <div style="max-width:800px;margin:0 auto">
      <h2 style="font-size:clamp(2rem,5vw,3rem);font-weight:800;margin-bottom:3rem;text-align:center">Frequently Asked Questions</h2>
      ${items.map((item,i)=>`<details style="border:1px solid ${d.colors.border};border-radius:12px;margin-bottom:0.8rem;overflow:hidden" ${i===0?'open':''}>
        <summary style="padding:1.5rem;font-weight:700;cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;background:${d.colors.bg}">${item.q||item.question}<span style="color:${d.colors.primary};font-size:1.5rem">+</span></summary>
        <div style="padding:0 1.5rem 1.5rem;color:${d.colors.muted};line-height:1.7">${item.a||item.answer}</div>
      </details>`).join('')}
    </div>
  </section>`;
}

// ── CONTACT ──────────────────────────────────────────────
function contactSection(d) {
  return `<section id="book" style="padding:5rem 5%;background:${d.colors.bg}" class="reveal">
    <div style="max-width:600px;margin:0 auto">
      <h2 style="font-size:clamp(2rem,5vw,3rem);font-weight:800;margin-bottom:1rem;text-align:center">Get In Touch</h2>
      <p style="color:${d.colors.muted};text-align:center;margin-bottom:2.5rem">We would love to hear from you</p>
      <form style="display:flex;flex-direction:column;gap:1rem" onsubmit="event.preventDefault();alert('Thank you! We will get back to you.');this.reset()">
        <input type="text" placeholder="Your Name" required aria-label="Name" style="padding:1rem;border:1px solid ${d.colors.border};border-radius:10px;background:${d.colors.surface};color:${d.colors.text};font-size:1rem">
        <input type="email" placeholder="Email Address" required aria-label="Email" style="padding:1rem;border:1px solid ${d.colors.border};border-radius:10px;background:${d.colors.surface};color:${d.colors.text};font-size:1rem">
        <input type="tel" placeholder="Phone Number" aria-label="Phone" style="padding:1rem;border:1px solid ${d.colors.border};border-radius:10px;background:${d.colors.surface};color:${d.colors.text};font-size:1rem">
        <textarea placeholder="Your Message" rows="4" required aria-label="Message" style="padding:1rem;border:1px solid ${d.colors.border};border-radius:10px;background:${d.colors.surface};color:${d.colors.text};font-size:1rem;resize:vertical"></textarea>
        <button type="submit" style="background:${d.colors.primary};color:${d.colors.bg};padding:1.2rem;border-radius:10px;border:none;font-weight:800;font-size:1.1rem;cursor:pointer;transition:all .3s">${d.cta||'Send Message'}</button>
      </form>
      <div style="display:flex;justify-content:center;gap:2rem;margin-top:2rem;font-size:0.9rem;color:${d.colors.muted}">
        ${d.contactInfo?.phone?`<div>📞 ${d.contactInfo.phone}</div>`:''}
        ${d.contactInfo?.email?`<div>✉️ ${d.contactInfo.email}</div>`:''}
      </div>
    </div>
  </section>`;
}

// ── FOOTER ───────────────────────────────────────────────
function footerSection(d) {
  return `<footer style="padding:3rem 5%;background:${d.colors.surface};border-top:1px solid ${d.colors.border}">
    <div style="max-width:1200px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">
      <div>
        ${d.logoUrl?`<img src="${d.logoUrl}" alt="${d.businessName}" style="height:40px">`:`<div style="font-weight:800;font-size:1.3rem;color:${d.colors.primary}">${d.businessName}</div>`}
        <p style="font-size:0.85rem;color:${d.colors.muted};margin-top:0.5rem">© ${new Date().getFullYear()} ${d.businessName}. All rights reserved.</p>
      </div>
      <div style="display:flex;gap:1.5rem;font-size:0.9rem">
        <a href="#about" style="color:${d.colors.muted};text-decoration:none">About</a>
        <a href="#features" style="color:${d.colors.muted};text-decoration:none">Services</a>
        <a href="#contact" style="color:${d.colors.muted};text-decoration:none">Contact</a>
      </div>
    </div>
    <div style="text-align:center;margin-top:1.5rem;font-size:0.8rem;color:${d.colors.muted}">Powered by <a href="https://ergio.vercel.app" target="_blank" style="color:${d.colors.primary};text-decoration:none">ERGIO</a> — AI Business OS for Africa</div>
  </footer>`;
}

// ── SEO ENGINE ────────────────────────────────────────────
export function generateSEO(d) {
  const keywords=[d.businessName,d.type,d.city,'Nigeria',...(d.services||[]).map(s=>s.name)].filter(Boolean).join(', ');
  return `<title>${d.businessName} | ${d.tagline||d.type+' in '+(d.city||'Nigeria')}</title>
    <meta name="title" content="${d.businessName} | ${d.tagline||''}">
    <meta name="description" content="${(d.description||d.tagline||'').replace(/"/g,'')}">
    <meta name="keywords" content="${keywords}">
    <meta name="robots" content="index, follow">
    <meta name="author" content="${d.businessName}">
    <link rel="canonical" href="https://${(d.businessName||'business').toLowerCase().replace(/[^a-z0-9]+/g,'-')}.ergio.app/">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${d.businessName}">
    <meta property="og:description" content="${(d.description||d.tagline||'').replace(/"/g,'')}">
    <meta property="og:image" content="${d.heroImage||''}">
    <meta property="og:locale" content="en_NG">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${d.businessName}">
    <meta name="twitter:description" content="${(d.description||d.tagline||'').replace(/"/g,'')}">
    <meta name="twitter:image" content="${d.heroImage||''}">
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"${d.schemaType||'LocalBusiness'}","name":"${d.businessName}","description":"${(d.description||'').replace(/"/g,'')}","address":{"@type":"PostalAddress","addressLocality":"${d.city||'Lagos'}","addressCountry":"NG"},"areaServed":"Nigeria","url":"https://${(d.businessName||'business').toLowerCase().replace(/[^a-z0-9]+/g,'-')}.ergio.app/"}</script>`;
}

// ── INTERACTION JS ────────────────────────────────────────
export const INTERACTION_JS = `
    const observer=new IntersectionObserver((e)=>{e.forEach(en=>{if(en.isIntersecting)en.target.classList.add('active')})},{threshold:0.1,rootMargin:'0px 0px -50px 0px'});
    document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale,.stagger').forEach(el=>observer.observe(el));
    document.querySelectorAll('.counter').forEach(el=>{const t=el.dataset.target;if(!t||isNaN(parseInt(t)))return;const n=parseInt(t);let c=0;const inc=n/50;const u=()=>{c+=inc;if(c<n){el.textContent=Math.ceil(c)+'+';requestAnimationFrame(u)}else{el.textContent=t}};const co=new IntersectionObserver((e)=>{if(e[0].isIntersecting){u();co.disconnect()}});co.observe(el)});
    const nav=document.getElementById('nav');if(nav)window.addEventListener('scroll',()=>nav.classList.toggle('scrolled',scrollY>50));
    const hb=document.querySelector('.hero img');if(hb)window.addEventListener('scroll',()=>hb.style.transform='translateY('+scrollY*0.3+'px)');
    document.querySelectorAll('a[href^="#"]').forEach(b=>{b.addEventListener('mousemove',e=>{const r=b.getBoundingClientRect();const x=e.clientX-r.left-r.width/2;const y=e.clientY-r.top-r.height/2;b.style.transform='translate('+x*0.2+'px,'+y*0.2+'px)'});b.addEventListener('mouseleave',()=>b.style.transform='')});
    if(window.matchMedia('(pointer:fine)').matches){const c=document.createElement('div');c.style.cssText='position:fixed;width:20px;height:20px;border:2px solid '+getComputedStyle(document.body).getPropertyValue('--primary').trim()+';border-radius:50%;pointer-events:none;z-index:9999;transition:transform .15s,width .2s,height .2s;mix-blend-mode:difference';document.body.appendChild(c);document.addEventListener('mousemove',e=>{c.style.left=e.clientX+'px';c.style.top=e.clientY+'px'});document.querySelectorAll('a,button,details summary').forEach(el=>{el.addEventListener('mouseenter',()=>{c.style.width='40px';c.style.height='40px';c.style.marginLeft='-10px';c.style.marginTop='-10px'});el.addEventListener('mouseleave',()=>{c.style.width='20px';c.style.height='20px';c.style.marginLeft='0';c.style.marginTop='0'})})}`;

// ── LAYOUT ROUTER ─────────────────────────────────────────
export function selectLayout(websiteCategory, designStyle, websiteType) {
  const categoryLayouts={restaurant:'immersive',ecommerce:'dashboard',portfolio:'magazine',saas:'stripe',blog:'magazine',realestate:'luxury',fitness:'tesla',clinic:'swiss',agency:'glassmorphism',education:'split3d',events:'immersive',landing:'apple'};
  if(websiteType==='3d')return 'split3d';
  if(['onyx'].includes(designStyle))return 'luxury';
  if(['darkglass'].includes(designStyle))return 'glassmorphism';
  if(['bento'].includes(designStyle))return 'dashboard';
  if(['editorial','split'].includes(designStyle))return 'magazine';
  if(['transix','aurora'].includes(designStyle))return 'stripe';
  if(['clay'].includes(designStyle))return 'neomorphic';
  return categoryLayouts[websiteCategory]||'apple';
}

// ── MAIN ASSEMBLY ─────────────────────────────────────────
export function assemblePremiumWebsite(plan, content, colors, logoUrl, images, layoutKey) {
  const layout=LAYOUT_ARCHETYPES[layoutKey]||LAYOUT_ARCHETYPES.apple;
  const d={
    businessName:plan.businessName,headline:content.hero?.headline||plan.businessName,
    subheadline:content.hero?.subheadline||plan.tagline||plan.description||'',
    cta:content.hero?.cta||'Get Started',category:plan.type,type:plan.type,city:plan.city,
    tagline:plan.tagline,description:plan.description,
    about:content.about||plan.description||'',aboutTitle:plan.businessName,
    aboutImage:images.about?.[0]?.url,heroImage:images.hero?.[0]?.url,logoUrl,colors,
    features:(content.whyChooseUs||['Expert Team','Trusted Quality','Fast Service','Best Prices']).map((w,i)=>({title:w,description:content.features?.[i]||''})),
    featuresTitle:'Why Choose Us',featuresSub:'Everything you need',
    stats:content.stats||[{label:'Happy Clients',value:'500+',numericValue:500},{label:'Projects',value:'1200+',numericValue:1200},{label:'Years',value:'10+',numericValue:10},{label:'Satisfaction',value:'100%'}],
    testimonials:content.testimonials||[],faq:content.faq||[],contactInfo:content.contactInfo||{},
    services:plan.services||[],emoji:plan.emoji||'✨',schemaType:plan.schemaType||'LocalBusiness',
    whyChooseUs:content.whyChooseUs||['Expert Team','Trusted Quality','Fast Service'],
  };
  const heroKey=layout.sections[0];const heroFn=COMPONENTS.heroes[heroKey]||COMPONENTS.heroes['hero-centered'];
  const featureKey=layout.sections[1];const featureFn=COMPONENTS.features[featureKey]||COMPONENTS.features['feature-grid-3'];
  const statsKey=layout.sections.find(s=>s.startsWith('stats'))||'stats-bar';const statsFn=COMPONENTS.stats[statsKey]||COMPONENTS.stats['stats-bar'];
  const tKey=layout.sections.find(s=>s.startsWith('testimonial'))||'testimonial-row';const tFn=COMPONENTS.testimonials[tKey]||COMPONENTS.testimonials['testimonial-row'];
  const ctaKey=layout.sections.find(s=>s.startsWith('cta'))||'cta-minimal';const ctaFn=COMPONENTS.ctas[ctaKey]||COMPONENTS.ctas['cta-minimal'];
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Sora:wght@400;600;700;800&family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    :root{--primary:${colors.primary};--secondary:${colors.secondary};--accent:${colors.accent};--bg:${colors.bg};--surface:${colors.surface};--border:${colors.border};--text:${colors.text};--muted:${colors.muted};--cta:${colors.cta||colors.primary}}
    html{scroll-behavior:smooth}
    body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);line-height:1.6;overflow-x:hidden}
    a{color:inherit}img{max-width:100%;height:auto}
    @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
    @keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
    .reveal{opacity:0;transform:translateY(40px);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1)}
    .reveal.active{opacity:1;transform:translateY(0)}
    .reveal-left{opacity:0;transform:translateX(-50px);transition:all .8s cubic-bezier(.16,1,.3,1)}
    .reveal-left.active{opacity:1;transform:translateX(0)}
    .reveal-right{opacity:0;transform:translateX(50px);transition:all .8s cubic-bezier(.16,1,.3,1)}
    .reveal-right.active{opacity:1;transform:translateX(0)}
    .stagger>*{opacity:0;transform:translateY(30px);transition:all .6s cubic-bezier(.16,1,.3,1)}
    .stagger.active>*:nth-child(1){opacity:1;transform:none;transition-delay:.1s}
    .stagger.active>*:nth-child(2){opacity:1;transform:none;transition-delay:.2s}
    .stagger.active>*:nth-child(3){opacity:1;transform:none;transition-delay:.3s}
    .stagger.active>*:nth-child(4){opacity:1;transform:none;transition-delay:.4s}
    .stagger.active>*:nth-child(5){opacity:1;transform:none;transition-delay:.5s}
    .stagger.active>*:nth-child(6){opacity:1;transform:none;transition-delay:.6s}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
    @media(max-width:1024px){.hero-grid{grid-template-columns:1fr!important}.about-grid{grid-template-columns:1fr!important;gap:2rem!important}.hero-visual{display:none}}
    @media(max-width:768px){section{padding:3rem 5%!important}.nav-links{display:none!important}h1{font-size:clamp(2rem,8vw,3rem)!important}h2{font-size:clamp(1.5rem,6vw,2.5rem)!important}}
    @media(max-width:480px){section{padding:2.5rem 5%!important}body{font-size:0.95rem}}
    /* NAV */
    .nav{display:flex;justify-content:space-between;align-items:center;padding:1.2rem 5%;position:sticky;top:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);z-index:1000;border-bottom:1px solid var(--border);transition:all .3s}
    .nav.scrolled{padding:0.75rem 5%;background:rgba(0,0,0,.85)}
    .nav-brand{font-weight:900;font-size:1.15rem;color:var(--text);text-decoration:none;letter-spacing:-.02em;display:flex;align-items:center;gap:.5rem}
    .nav-brand img{height:30px;object-fit:contain;border-radius:4px}
    .nav-links{display:flex;gap:2rem;font-size:.88rem}
    .nav-links a{color:var(--muted);text-decoration:none;transition:color .2s;font-weight:600;letter-spacing:.01em}
    .nav-links a:hover{color:var(--text)}
    .nav-cta{background:var(--primary);color:var(--bg);padding:.55rem 1.4rem;border-radius:6px;font-weight:800;text-decoration:none;font-size:.88rem;transition:all .2s;letter-spacing:-.01em}
    .nav-cta:hover{transform:translateY(-1px);box-shadow:0 6px 20px var(--primary-shadow,rgba(0,217,255,.3))}
    /* Mobile nav */
    .nav-toggle{display:none;background:none;border:1px solid var(--border);border-radius:6px;padding:.45rem .6rem;cursor:pointer;color:var(--text);font-size:1rem}
    @media(max-width:768px){
      .nav-links,.nav-cta-wrap{display:none!important}
      .nav-toggle{display:block!important}
      .nav-mobile-open .nav-links{display:flex!important;flex-direction:column;position:absolute;top:100%;left:0;right:0;background:rgba(0,0,0,.95);padding:1.5rem 5%;gap:1rem;border-bottom:1px solid var(--border)}
    }
  </style>
  ${generateSEO(d)}
</head>
<body>
  <a href="#main" style="position:absolute;left:-9999px" onfocus="this.style.cssText='position:fixed;left:10px;top:10px;padding:1rem;background:#000;color:#fff;z-index:9999'">Skip to main content</a>
  <nav class="nav" id="nav" role="navigation" aria-label="Main navigation">
    <a href="#" class="nav-brand">
      ${logoUrl?`<img src="${logoUrl}" alt="${plan.businessName}" style="height:28px;border-radius:4px">`:''}
      <span>${plan.businessName}</span>
    </a>
    <button class="nav-toggle" id="navToggle" aria-label="Menu" onclick="document.querySelector('.nav').classList.toggle('nav-mobile-open')">☰</button>
    <div class="nav-links">
      <a href="#about">About</a>
      <a href="#features">Services</a>
      <a href="#testimonials">Reviews</a>
      <a href="#faq">FAQ</a>
      <a href="#contact">Contact</a>
    </div>
    <div class="nav-cta-wrap">
      <a href="#contact" class="nav-cta">${content.hero?.cta || 'Get Started'}</a>
    </div>
  </nav>
  <main id="main">
    ${heroFn(d)}${featureFn(d)}${statsFn(d)}${tFn(d)}${COMPONENTS.faq(d)}${ctaFn(d)}${COMPONENTS.contact(d)}
  </main>
  ${COMPONENTS.footer(d)}
  <script>${INTERACTION_JS}</script>
</body>
</html>`;
}

// ════════════════════════════════════════════════════════════
// ERGIO PREMIUM ENGINE v4.0 — 15 NEW FEATURES
// ════════════════════════════════════════════════════════════

// ── FEATURE 1: REAL 3D MODELS (GLTF Loading) ───────────────
export function hero3DWithModel(d) {
  const modelUrl = d.gltfModel || 'https://cdn.jsdelivr.net/npm/three-gltf-loader@0.0.1/example/duck.glb';
  return `<section class="hero" style="min-height:100vh;display:flex;align-items:center;background:${d.colors.bg};position:relative;overflow:hidden">
    <canvas id="hero-gltf-canvas" style="position:absolute;inset:0;z-index:0"></canvas>
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 0%,${d.colors.bg}cc 80%,${d.colors.bg} 100%);z-index:1"></div>
    <div style="position:relative;z-index:2;max-width:1200px;margin:0 auto;padding:0 5%;width:100%;text-align:center">
      <h1 style="font-size:clamp(3rem,10vw,7rem);font-weight:900;letter-spacing:-0.04em;line-height:0.95;margin-bottom:1.5rem;opacity:0;animation:fadeUp 1s .3s forwards;background:linear-gradient(135deg,${d.colors.text},${d.colors.primary});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${d.headline}</h1>
      <p style="font-size:clamp(1.1rem,3vw,1.6rem);color:${d.colors.muted};margin-bottom:2.5rem;opacity:0;animation:fadeUp 1s .5s forwards">${d.subheadline}</p>
      <div style="opacity:0;animation:fadeUp 1s .7s forwards">
        <a href="#contact" style="background:${d.colors.primary};color:${d.colors.bg};padding:1.2rem 3rem;border-radius:100px;font-weight:800;text-decoration:none;font-size:1.1rem;display:inline-block;box-shadow:0 10px 40px ${d.colors.primary}55">${d.cta||'Get Started'}</a>
      </div>
    </div>
  </section>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"><\/script>
  <script>
    (function(){
      const canvas=document.getElementById('hero-gltf-canvas');
      if(!canvas||!window.THREE)return;
      const scene=new THREE.Scene();scene.environment=null;
      const camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,0.1,1000);
      const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
      renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));
      renderer.outputEncoding=THREE.sRGBEncoding;renderer.physicallyCorrectLights=true;
      const hemi=new THREE.HemisphereLight(0xffffff,0x${(d.colors.bg||'#09090B').replace('#','')},1);scene.add(hemi);
      const dir=new THREE.DirectionalLight(0x${(d.colors.primary||'#00D9FF').replace('#','')},2);dir.position.set(5,10,7);scene.add(dir);
      const point=new THREE.PointLight(0x${(d.colors.accent||'#00FF9D').replace('#','')},1.5,50);point.position.set(-5,5,5);scene.add(point);
      const loader=new THREE.GLTFLoader();
      loader.load('${modelUrl}',function(gltf){
        const model=gltf.scene;const box=new THREE.Box3().setFromObject(model);
        const size=box.getSize(new THREE.Vector3());const center=box.getCenter(new THREE.Vector3());
        const maxDim=Math.max(size.x,size.y,size.z);const scale=4/maxDim;
        model.scale.setScalar(scale);model.position.sub(center.multiplyScalar(scale));
        scene.add(model);
        function animate(){requestAnimationFrame(animate);model.rotation.y+=0.005;renderer.render(scene,camera);}animate();
      },function(xhr){},function(err){
        // Fallback to wireframe sphere if GLTF fails
        const geo=new THREE.IcosahedronGeometry(3,1);
        const mat=new THREE.MeshStandardMaterial({color:0x${(d.colors.primary||'#00D9FF').replace('#','')},wireframe:true,transparent:true,opacity:0.6});
        const mesh=new THREE.Mesh(geo,mat);scene.add(mesh);
        function animate(){requestAnimationFrame(animate);mesh.rotation.x+=0.005;mesh.rotation.y+=0.005;renderer.render(scene,camera);}animate();
      });
      camera.position.z=8;let mx=0,my=0;
      document.addEventListener('mousemove',e=>{mx=(e.clientX/innerWidth-0.5)*2;my=(e.clientY/innerHeight-0.5)*2;});
      function camUpdate(){requestAnimationFrame(camUpdate);camera.position.x+=(mx*2-camera.position.x)*0.05;camera.position.y+=(-my*2-camera.position.y)*0.05;camera.lookAt(scene.position);}camUpdate();
      addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
    })();
  <\/script>`;
}

// ── FEATURE 2: VIDEO HERO SECTIONS ─────────────────────────
export function heroVideo(d) {
  const videoUrl = d.heroVideo || '';
  const fallbackImg = d.heroImage || `https://source.unsplash.com/1400x800/?${encodeURIComponent(d.type||'business')}`;
  return `<section class="hero" style="min-height:100vh;display:flex;align-items:center;position:relative;overflow:hidden;background:${d.colors.bg}">
    ${videoUrl ? `<video autoplay muted loop playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0" poster="${fallbackImg}">
      <source src="${videoUrl}" type="video/mp4">
    </video>` : `<div style="position:absolute;inset:0;z-index:0"><img src="${fallbackImg}" alt="${d.businessName}" style="width:100%;height:100%;object-fit:cover"></div>`}
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,${d.colors.bg}33 0%,${d.colors.bg}99 70%,${d.colors.bg} 100%);z-index:1"></div>
    <div style="position:relative;z-index:2;max-width:1200px;margin:0 auto;padding:0 5%;width:100%;text-align:center">
      <div style="display:inline-block;padding:0.4rem 1rem;border-radius:100px;background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);color:${d.colors.primary};font-size:0.8rem;font-weight:600;margin-bottom:1.5rem;opacity:0;animation:fadeIn 1s .1s forwards">▶ Video Experience</div>
      <h1 style="font-size:clamp(3rem,10vw,7rem);font-weight:900;letter-spacing:-0.04em;line-height:0.95;margin-bottom:1.5rem;opacity:0;animation:fadeUp 1s .3s forwards">${d.headline}</h1>
      <p style="font-size:clamp(1.1rem,3vw,1.6rem);color:${d.colors.muted};margin-bottom:2.5rem;max-width:600px;margin-left:auto;margin-right:auto;opacity:0;animation:fadeUp 1s .5s forwards">${d.subheadline}</p>
      <div style="opacity:0;animation:fadeUp 1s .7s forwards;display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
        <a href="#contact" style="background:${d.colors.primary};color:${d.colors.bg};padding:1.2rem 3rem;border-radius:100px;font-weight:800;text-decoration:none;font-size:1.1rem;display:inline-block;box-shadow:0 10px 40px ${d.colors.primary}55">${d.cta||'Get Started'}</a>
        <a href="#about" style="border:1px solid ${d.colors.border};color:${d.colors.text};padding:1.2rem 3rem;border-radius:100px;font-weight:600;text-decoration:none;font-size:1.1rem;display:inline-block">Learn More</a>
      </div>
    </div>
    <div style="position:absolute;bottom:2rem;left:50%;transform:translateX(-50%);z-index:2;color:${d.colors.muted};font-size:0.8rem;animation:fadeIn 1s 2s forwards;opacity:0">Scroll to explore ↓</div>
  </section>`;
}

// ── FEATURE 3: LOTTIE / SVG PATH ANIMATIONS ────────────────
export function lottieAnimationSection(d) {
  const animations = [
    { url: 'https://assets2.lottiefiles.com/packages/lf20_obhph3sh.json', label: 'Growth' },
    { url: 'https://assets10.lottiefiles.com/packages/lf20_4kx2q32n.json', label: 'Innovation' },
    { url: 'https://assets1.lottiefiles.com/packages/lf20_5tkzkblw.json', label: 'Quality' },
  ];
  return `<section id="animations" style="padding:5rem 5%;background:${d.colors.surface}" class="reveal">
    <div style="max-width:1200px;margin:0 auto;text-align:center">
      <h2 style="font-size:clamp(2rem,5vw,3.5rem);font-weight:800;margin-bottom:1rem">Why We Stand Out</h2>
      <p style="color:${d.colors.muted};margin-bottom:3rem;font-size:1.1rem">Experience our difference through motion</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:2rem">
        ${animations.map((a,i)=>`<div style="background:${d.colors.bg};border:1px solid ${d.colors.border};border-radius:20px;padding:2rem;transition:transform .3s" onmouseover="this.style.transform='translateY(-8px)'" onmouseout="this.style.transform=''">
          <div id="lottie-${i}" style="width:120px;height:120px;margin:0 auto 1rem"></div>
          <h3 style="font-weight:700;font-size:1.1rem;margin-bottom:0.5rem">${a.label}</h3>
          <p style="color:${d.colors.muted};font-size:0.9rem">${(d.features||[])[i]?.description||'Delivering excellence every step of the way'}</p>
        </div>`).join('')}
      </div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"><\/script>
    <script>
      (function(){
        const anims=[${animations.map(a=>`'${a.url}'`).join(',')}];
        anims.forEach((url,i)=>{
          if(!window.lottie)return;
          try{lottie.loadAnimation({container:document.getElementById('lottie-'+i),renderer:'svg',loop:true,autoplay:true,path:url});}catch(e){}
        });
        // SVG path animations
        document.querySelectorAll('[data-svg-anim]').forEach(path=>{
          const len=path.getTotalLength();path.style.strokeDasharray=len;path.style.strokeDashoffset=len;
          const obs=new IntersectionObserver((e)=>{if(e[0].isIntersecting){path.style.transition='stroke-dashoffset 2s ease';path.style.strokeDashoffset=0;obs.disconnect();}},{threshold:0.3});obs.observe(path);
        });
      })();
    <\/script>
    <svg style="position:absolute;width:0;height:0;overflow:hidden">
      <defs><path id="curve-${d.businessName?.replace(/[^a-z0-9]/gi,'')||'ergio'}" d="M 50,150 Q 150,50 250,150" fill="none"/></defs>
    </svg>
  </section>`;
}

// ── FEATURE 4: BEFORE/AFTER IMAGE SLIDER ──────────────────
export function beforeAfterSlider(d) {
  const beforeImg = d.beforeImage || `https://source.unsplash.com/800x600/?${encodeURIComponent('old '+d.type)}`;
  const afterImg = d.afterImage || `https://source.unsplash.com/800x600/?${encodeURIComponent('new '+d.type)}`;
  return `<section id="showcase" style="padding:5rem 5%;background:${d.colors.bg}" class="reveal">
    <div style="max-width:900px;margin:0 auto">
      <h2 style="font-size:clamp(2rem,5vw,3rem);font-weight:800;margin-bottom:1rem;text-align:center">Before & After</h2>
      <p style="color:${d.colors.muted};text-align:center;margin-bottom:3rem">See the transformation we deliver</p>
      <div class="ba-container" style="position:relative;width:100%;max-width:800px;margin:0 auto;overflow:hidden;border-radius:16px;cursor:col-resize;user-select:none" id="baSlider">
        <img src="${afterImg}" alt="After" style="width:100%;display:block" draggable="false" loading="lazy">
        <div class="ba-before" style="position:absolute;top:0;left:0;width:50%;height:100%;overflow:hidden">
          <img src="${beforeImg}" alt="Before" style="width:800px;height:100%;object-fit:cover;display:block;max-width:none" draggable="false" loading="lazy">
        </div>
        <div class="ba-handle" style="position:absolute;top:0;left:50%;width:4px;height:100%;background:${d.colors.primary};transform:translateX(-50%);pointer-events:none">
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:44px;height:44px;background:${d.colors.primary};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:${d.colors.bg};font-weight:bold;box-shadow:0 4px 20px ${d.colors.primary}66">⇆</div>
        </div>
        <div style="position:absolute;top:12px;left:12px;background:rgba(0,0,0,0.6);color:#fff;padding:4px 12px;border-radius:6px;font-size:0.8rem;pointer-events:none">Before</div>
        <div style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.6);color:#fff;padding:4px 12px;border-radius:6px;font-size:0.8rem;pointer-events:none">After</div>
      </div>
    </div>
    <script>
      (function(){
        const slider=document.getElementById('baSlider');if(!slider)return;
        const before=slider.querySelector('.ba-before');const handle=slider.querySelector('.ba-handle');
        let dragging=false;
        function setPos(x){const rect=slider.getBoundingClientRect();let pct=((x-rect.left)/rect.width)*100;pct=Math.max(0,Math.min(100,pct));before.style.width=pct+'%';handle.style.left=pct+'%';}
        slider.addEventListener('mousedown',e=>{dragging=true;setPos(e.clientX);});
        slider.addEventListener('touchstart',e=>{dragging=true;setPos(e.touches[0].clientX);},{passive:true});
        document.addEventListener('mousemove',e=>{if(dragging)setPos(e.clientX);});
        document.addEventListener('touchmove',e=>{if(dragging)setPos(e.touches[0].clientX);},{passive:true});
        document.addEventListener('mouseup',()=>dragging=false);
        document.addEventListener('touchend',()=>dragging=false);
      })();
    <\/script>
  </section>`;
}

// ── FEATURE 5: VIRTUAL TOURS (360 PANORAMA) ────────────────
export function virtualTourSection(d) {
  const panoImg = d.panoramaImage || `https://upload.wikimedia.org/wikipedia/commons/e/e6/Panorama_van_der_Graaf_Generator.jpg`;
  return `<section id="virtual-tour" style="padding:5rem 5%;background:${d.colors.surface}" class="reveal">
    <div style="max-width:1000px;margin:0 auto;text-align:center">
      <h2 style="font-size:clamp(2rem,5vw,3rem);font-weight:800;margin-bottom:1rem">Virtual Tour</h2>
      <p style="color:${d.colors.muted};margin-bottom:3rem">Drag to look around — experience it in 360°</p>
      <div id="pano-container" style="width:100%;height:400px;border-radius:16px;overflow:hidden;cursor:grab;background:${d.colors.bg};position:relative;touch-action:none">
        <div id="pano-inner" style="width:200%;height:100%;display:flex">
          <img src="${panoImg}" alt="360 panorama" style="width:100%;height:100%;object-fit:cover;pointer-events:none" draggable="false" loading="lazy">
          <img src="${panoImg}" alt="360 panorama repeat" style="width:100%;height:100%;object-fit:cover;pointer-events:none" draggable="false" loading="lazy">
        </div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:2rem;pointer-events:none;opacity:0.8">↺</div>
      </div>
    </div>
    <script>
      (function(){
        const container=document.getElementById('pano-container');if(!container)return;
        const inner=document.getElementById('pano-inner');
        let isDragging=false,startX=0,scrollPos=0;
        function onStart(x){isDragging=true;startX=x;container.style.cursor='grabbing';}
        function onMove(x){if(!isDragging)return;const delta=x-startX;startX=x;scrollPos-=delta;const maxW=container.offsetWidth;if(scrollPos<=-maxW)scrollPos=0;if(scrollPos>=0)scrollPos=-maxW;inner.style.transform='translateX('+scrollPos+'px)';}
        function onEnd(){isDragging=false;container.style.cursor='grab';}
        container.addEventListener('mousedown',e=>onStart(e.clientX));
        container.addEventListener('touchstart',e=>onStart(e.touches[0].clientX),{passive:true});
        document.addEventListener('mousemove',e=>onMove(e.clientX));
        document.addEventListener('touchmove',e=>onMove(e.touches[0].clientX),{passive:true});
        document.addEventListener('mouseup',onEnd);
        document.addEventListener('touchend',onEnd);
        // Auto-rotate
        let autoScroll=setInterval(()=>{if(!isDragging){scrollPos-=1;if(scrollPos<=-container.offsetWidth)scrollPos=0;inner.style.transform='translateX('+scrollPos+'px)';}},30);
      })();
    <\/script>
  </section>`;
}

// ── FEATURE 6: INTERACTIVE MAPS (Leaflet) ─────────────────
export function interactiveMapSection(d) {
  const lat = d.mapLat || 6.5244;
  const lng = d.mapLng || 3.3792;
  const address = d.contactInfo?.address || d.city || 'Lagos, Nigeria';
  return `<section id="location" style="padding:5rem 5%;background:${d.colors.bg}" class="reveal">
    <div style="max-width:1000px;margin:0 auto">
      <h2 style="font-size:clamp(2rem,5vw,3rem);font-weight:800;margin-bottom:1rem;text-align:center">Find Us</h2>
      <p style="color:${d.colors.muted};text-align:center;margin-bottom:3rem">${address}</p>
      <div id="map" style="width:100%;height:400px;border-radius:16px;overflow:hidden;border:1px solid ${d.colors.border}"></div>
    </div>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
    <script>
      (function(){
        if(!window.L)return;
        const map=L.map('map',{zoomControl:true,scrollWheelZoom:false}).setView([${lat},${lng}],14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(map);
        const marker=L.marker([${lat},${lng}]).addTo(map);
        marker.bindPopup('<strong>${d.businessName}</strong><br>${address}').openPopup();
        map.on('click',()=>map.scrollWheelZoom.enable());
      })();
    <\/script>
  </section>`;
}

// ── FEATURE 7: MULTI-PAGE WEBSITE GENERATION ──────────────
export function generateMultiPageSite(d, layout) {
  const slug = (d.businessName || 'business').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const pages = {
    'index': { title: d.businessName + ' — Home', sections: ['hero', 'features', 'stats', 'cta'] },
    'about': { title: 'About Us — ' + d.businessName, sections: ['about-content', 'team', 'values'] },
    'services': { title: 'Services — ' + d.businessName, sections: ['services-list', 'pricing', 'faq'] },
    'gallery': { title: 'Gallery — ' + d.businessName, sections: ['gallery-grid', 'before-after'] },
    'contact': { title: 'Contact — ' + d.businessName, sections: ['contact-form', 'map', 'hours'] },
  };
  const pageHTML = {};
  for (const [pageName, pageData] of Object.entries(pages)) {
    pageHTML[pageName] = generateSinglePage(pageName, pageData, d, slug);
  }
  return { pages: pageHTML, sitemap: generateSitemapMultiPage(slug, Object.keys(pages)), robots: generateRobotsTxt() };
}

function generateSinglePage(pageName, pageData, d, slug) {
  const isHome = pageName === 'index';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${pageData.title}</title>
  <link rel="canonical" href="https://${slug}.ergio.app/${pageName==='index'?'':pageName+'.html'}">
  <meta name="description" content="${(d.description||'').replace(/"/g,'')}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    :root{--primary:${d.colors.primary};--accent:${d.colors.accent};--bg:${d.colors.bg};--surface:${d.colors.surface};--border:${d.colors.border};--text:${d.colors.text};--muted:${d.colors.muted}}
    html{scroll-behavior:smooth}body{font-family:Inter,sans-serif;background:var(--bg);color:var(--text);line-height:1.6}
    a{color:inherit;text-decoration:none}img{max-width:100%;height:auto}
    .nav{display:flex;justify-content:space-between;align-items:center;padding:1.2rem 5%;position:sticky;top:0;background:rgba(0,0,0,.3);backdrop-filter:blur(20px);z-index:100;border-bottom:1px solid var(--border)}
    .nav-brand{font-weight:800;font-size:1.2rem;color:var(--primary)}
    .nav-links{display:flex;gap:1.5rem;font-size:0.9rem}
    .nav-links a{color:var(--muted);transition:color .3s;font-weight:600}
    .nav-links a:hover,.nav-links a.active{color:var(--primary)}
    .nav-toggle{display:none;background:none;border:none;color:var(--text);font-size:1.5rem;cursor:pointer}
    section{padding:5rem 5%}.reveal{opacity:0;transform:translateY(40px);transition:all .8s cubic-bezier(.16,1,.3,1)}.reveal.active{opacity:1;transform:translateY(0)}
    @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @media(max-width:768px){.nav-links{display:none}.nav-toggle{display:block}section{padding:3rem 5%}}
    footer{padding:3rem 5%;background:var(--surface);border-top:1px solid var(--border);text-align:center;color:var(--muted);font-size:0.85rem}
    footer a{margin:0 0.5rem}
    /* Page transition */
    .page-enter{opacity:0;transform:translateY(20px)}
    .page-enter-active{opacity:1;transform:translateY(0);transition:opacity .4s,transform .4s}
  </style>
</head>
<body>
  <nav class="nav">
    <a href="/" class="nav-brand">${d.businessName}</a>
    <div class="nav-links">
      <a href="/" class="${isHome?'active':''}">Home</a>
      <a href="/about.html" class="${pageName==='about'?'active':''}">About</a>
      <a href="/services.html" class="${pageName==='services'?'active':''}">Services</a>
      <a href="/gallery.html" class="${pageName==='gallery'?'active':''}">Gallery</a>
      <a href="/contact.html" class="${pageName==='contact'?'active':''}">Contact</a>
    </div>
    <button class="nav-toggle" onclick="document.querySelector('.nav-links').style.display=document.querySelector('.nav-links').style.display==='flex'?'none':'flex'">☰</button>
  </nav>
  <main class="page-enter page-enter-active">
    ${generatePageContent(pageName, pageData.sections, d)}
  </main>
  <footer>
    <div>© ${new Date().getFullYear()} ${d.businessName}. All rights reserved.</div>
    <div style="margin-top:0.5rem"><a href="/">Home</a><a href="/about.html">About</a><a href="/services.html">Services</a><a href="/contact.html">Contact</a></div>
    <div style="margin-top:1rem;font-size:0.75rem">Powered by <a href="https://ergio.vercel.app" target="_blank" style="color:var(--primary)">ERGIO</a></div>
  </footer>
  <script>
    new IntersectionObserver((e)=>{e.forEach(en=>{if(en.isIntersecting)en.target.classList.add('active')})},{threshold:0.1}).observe(document.querySelector('.reveal')||document.body);
    // Page transition on link click
    document.querySelectorAll('a[href^="/"]').forEach(a=>{a.addEventListener('click',e=>{if(a.target==='_blank')return;e.preventDefault();document.body.style.opacity='0';document.body.style.transition='opacity .3s';setTimeout(()=>location.href=a.href,300);});});
  </script>
</body>
</html>`;
}

function generatePageContent(pageName, sections, d) {
  const c = d.colors;
  let html = '';
  if (pageName === 'index') {
    html += `<section style="min-height:80vh;display:flex;align-items:center;justify-content:center;text-align:center;background:${c.bg};position:relative;overflow:hidden">
      <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 30%,${c.primary}15,transparent 70%)"></div>
      <div style="position:relative;z-index:1">
        <h1 style="font-size:clamp(3rem,8vw,5rem);font-weight:900;margin-bottom:1rem">${d.headline}</h1>
        <p style="font-size:1.3rem;color:${c.muted};max-width:600px;margin:0 auto 2rem">${d.subheadline}</p>
        <a href="/contact.html" style="background:${c.primary};color:${c.bg};padding:1rem 2.5rem;border-radius:100px;font-weight:800;display:inline-block">${d.cta||'Get Started'}</a>
      </div>
    </section>`;
    html += `<section class="reveal"><h2 style="font-size:2.5rem;text-align:center;margin-bottom:2rem">Why Choose Us</h2><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:2rem;max-width:1000px;margin:0 auto">${(d.features||[]).slice(0,3).map(f=>`<div style="background:${c.surface};border:1px solid ${c.border};border-radius:16px;padding:2rem"><h3 style="color:${c.primary};font-weight:700;margin-bottom:0.5rem">${f.title}</h3><p style="color:${c.muted}">${f.description}</p></div>`).join('')}</div></section>`;
  } else if (pageName === 'about') {
    html += `<section class="reveal" style="max-width:800px;margin:0 auto"><h1 style="font-size:clamp(2.5rem,6vw,4rem);font-weight:900;margin-bottom:1rem">About ${d.businessName}</h1><p style="font-size:1.2rem;color:${c.muted};line-height:1.8;margin-bottom:2rem">${d.about||d.description||''}</p></section>`;
  } else if (pageName === 'services') {
    html += `<section class="reveal"><h1 style="font-size:clamp(2.5rem,6vw,4rem);text-align:center;margin-bottom:3rem">Our Services</h1><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:2rem;max-width:1000px;margin:0 auto">${(d.services||[]).map(s=>`<div style="background:${c.surface};border:1px solid ${c.border};border-radius:16px;padding:2rem"><h3 style="color:${c.primary};margin-bottom:0.5rem">${s.name}</h3><p style="color:${c.muted};margin-bottom:1rem">${s.description||''}</p>${s.price?`<div style="font-weight:800;font-size:1.3rem;color:${c.accent}">₦${s.price.toLocaleString()}</div>`:''}</div>`).join('')}</div></section>`;
  } else if (pageName === 'gallery') {
    html += `<section class="reveal"><h1 style="font-size:clamp(2.5rem,6vw,4rem);text-align:center;margin-bottom:3rem">Gallery</h1><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;max-width:1000px;margin:0 auto">${[1,2,3,4,5,6].map(i=>`<div style="aspect-ratio:1;border-radius:12px;overflow:hidden;background:${c.surface}"><img src="https://source.unsplash.com/400x400/?${encodeURIComponent(d.type||'business')}&sig=${i}" alt="Gallery ${i}" style="width:100%;height:100%;object-fit:cover" loading="lazy"></div>`).join('')}</div></section>`;
  } else if (pageName === 'contact') {
    html += `<section class="reveal" style="max-width:600px;margin:0 auto"><h1 style="font-size:clamp(2.5rem,6vw,4rem);text-align:center;margin-bottom:2rem">Get In Touch</h1><form style="display:flex;flex-direction:column;gap:1rem" onsubmit="event.preventDefault();alert('Thank you! We will contact you soon.');this.reset()"><input type="text" placeholder="Name" required style="padding:1rem;border:1px solid ${c.border};border-radius:10px;background:${c.surface};color:${c.text}"><input type="email" placeholder="Email" required style="padding:1rem;border:1px solid ${c.border};border-radius:10px;background:${c.surface};color:${c.text}"><textarea placeholder="Message" rows="5" required style="padding:1rem;border:1px solid ${c.border};border-radius:10px;background:${c.surface};color:${c.text};resize:vertical"></textarea><button type="submit" style="background:${c.primary};color:${c.bg};padding:1.2rem;border-radius:10px;border:none;font-weight:800;cursor:pointer">Send Message</button></form>${d.contactInfo?.phone?`<p style="text-align:center;margin-top:2rem;color:${c.muted}">📞 ${d.contactInfo.phone}</p>`:''}</section>`;
  }
  return html;
}

// ── FEATURE 8: MEGA MENU NAVIGATION ───────────────────────
export function megaMenuNav(d) {
  const menuItems = {
    'Services': d.services?.slice(0,4).map(s=>({label:s.name,href:'#features'})) || [],
    'Company': [{label:'About Us',href:'#about'},{label:'Our Team',href:'#team'},{label:'Careers',href:'#careers'},{label:'Blog',href:'#blog'}],
    'Resources': [{label:'FAQ',href:'#faq'},{label:'Gallery',href:'#gallery'},{label:'Testimonials',href:'#testimonials'},{label:'Pricing',href:'#pricing'}],
  };
  return `<nav class="nav mega-nav" id="nav" style="display:flex;justify-content:space-between;align-items:center;padding:1.2rem 5%;position:sticky;top:0;background:rgba(0,0,0,.3);backdrop-filter:blur(20px);z-index:1000;border-bottom:1px solid ${d.colors.border}">
    <a href="#" class="nav-brand" style="font-weight:800;font-size:1.2rem;color:${d.colors.primary}">${d.businessName}</a>
    <div class="mega-menu" style="display:flex;gap:2rem;align-items:center">
      ${Object.entries(menuItems).map(([cat,items])=>`<div class="mega-item" style="position:relative" onmouseover="this.querySelector('.mega-dropdown').style.display='grid'" onmouseout="this.querySelector('.mega-dropdown').style.display='none'">
        <a href="#" style="color:${d.colors.muted};font-weight:600;font-size:0.9rem;text-decoration:none;cursor:pointer">${cat} ▾</a>
        <div class="mega-dropdown" style="display:none;position:absolute;top:100%;left:-20px;min-width:280px;grid-template-columns:1fr 1fr;gap:0.5rem;padding:1.5rem;background:${d.colors.surface};border:1px solid ${d.colors.border};border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.3);z-index:100">
          ${items.map(i=>`<a href="${i.href}" style="padding:0.5rem 0.8rem;border-radius:8px;color:${d.colors.muted};font-size:0.85rem;transition:all .2s;display:flex;align-items:center;gap:0.5rem" onmouseover="this.style.background='${d.colors.primary}22';this.style.color='${d.colors.primary}'" onmouseout="this.style.background='';this.style.color='${d.colors.muted}'">→ ${i.label}</a>`).join('')}
        </div>
      </div>`).join('')}
      <a href="#contact" style="background:${d.colors.primary};color:${d.colors.bg};padding:0.6rem 1.5rem;border-radius:100px;font-weight:700;font-size:0.9rem">${d.cta||'Get Started'}</a>
    </div>
    <button class="nav-toggle" style="display:none;background:none;border:none;color:${d.colors.text};font-size:1.5rem;cursor:pointer" onclick="document.querySelector('.mega-menu').style.display=document.querySelector('.mega-menu').style.display==='flex'?'none':'flex'">☰</button>
  </nav>
  <style>
    @media(max-width:1024px){.mega-menu{display:none!important}.nav-toggle{display:block!important}}
    .mega-dropdown{animation:fadeIn .2s ease}
  </style>`;
}

// ── FEATURE 9: DARK MODE TOGGLE ───────────────────────────
export function darkModeToggle() {
  return `<button id="darkModeToggle" onclick="toggleDarkMode()" style="position:fixed;bottom:20px;right:20px;z-index:9998;width:48px;height:48px;border-radius:50%;border:1px solid rgba(255,255,255,.15);background:rgba(0,0,0,.8);backdrop-filter:blur(10px);color:#fff;font-size:1.3rem;cursor:pointer;transition:all .3s;box-shadow:0 4px 20px rgba(0,0,0,.3)" title="Toggle theme" aria-label="Toggle dark mode">🌙</button>
  <script>
    function toggleDarkMode(){
      const root=document.documentElement;
      const isDark=root.getAttribute('data-theme')!=='light';
      if(isDark){root.setAttribute('data-theme','light');document.body.style.background='#ffffff';document.body.style.color='#0f172a';localStorage.setItem('ergio-theme','light');document.getElementById('darkModeToggle').textContent='☀️';}
      else{root.setAttribute('data-theme','dark');document.body.style.background='';document.body.style.color='';localStorage.setItem('ergio-theme','dark');document.getElementById('darkModeToggle').textContent='🌙';}
    }
    (function(){const saved=localStorage.getItem('ergio-theme');if(saved==='light'){document.documentElement.setAttribute('data-theme','light');document.body.style.background='#ffffff';document.body.style.color='#0f172a';const b=document.getElementById('darkModeToggle');if(b)b.textContent='☀️';}})();
  <\/script>`;
}

// ── FEATURE 10: EXIT INTENT POPUP ──────────────────────────
export function exitIntentPopup(d) {
  return `<div id="exitPopup" style="display:none;position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.8);backdrop-filter:blur(8px);align-items:center;justify-content:center;padding:2rem">
    <div style="max-width:500px;width:100%;background:${d.colors.surface};border:1px solid ${d.colors.border};border-radius:24px;padding:3rem;text-align:center;position:relative;animation:scaleIn .4s ease" onclick="event.stopPropagation()">
      <button onclick="document.getElementById('exitPopup').style.display='none'" style="position:absolute;top:1rem;right:1rem;background:none;border:none;color:${d.colors.muted};font-size:1.5rem;cursor:pointer">×</button>
      <div style="font-size:3rem;margin-bottom:1rem">🎁</div>
      <h2 style="font-size:2rem;font-weight:800;margin-bottom:0.5rem;color:${d.colors.text}">Wait! Before You Go...</h2>
      <p style="color:${d.colors.muted};font-size:1.1rem;margin-bottom:2rem">Get an exclusive ${d.businessName} offer. Leave your email and we'll send you a special deal!</p>
      <form onsubmit="event.preventDefault();document.getElementById('exitPopup').style.display='none';alert('Thank you! Check your inbox soon.');this.reset()" style="display:flex;gap:0.5rem;margin-bottom:1rem">
        <input type="email" placeholder="Your email" required style="flex:1;padding:1rem;border:1px solid ${d.colors.border};border-radius:10px;background:${d.colors.bg};color:${d.colors.text};font-size:1rem">
        <button type="submit" style="background:${d.colors.primary};color:${d.colors.bg};padding:1rem 1.5rem;border-radius:10px;border:none;font-weight:700;cursor:pointer;white-space:nowrap">Get Offer</button>
      </form>
      <p style="font-size:0.8rem;color:${d.colors.muted};opacity:0.6">No spam. Unsubscribe anytime.</p>
    </div>
  </div>
  <script>
    (function(){
      let shown=false;
      function show(){if(shown)return;shown=true;const p=document.getElementById('exitPopup');p.style.display='flex';}
      // Exit intent detection (desktop)
      document.addEventListener('mouseout',e=>{if(!e.toElement&&!e.relatedTarget&&e.clientY<10&&!shown){show();}});
      // Mobile: show after 30s if no interaction
      setTimeout(()=>{if(!shown&&document.hidden){show();}},30000);
      // Show after 60s regardless
      setTimeout(show,60000);
      document.getElementById('exitPopup').addEventListener('click',e=>{if(e.target.id==='exitPopup')e.target.style.display='none';});
    })();
  <\/script>`;
}

// ── FEATURE 11: LIVE CHAT WIDGET ──────────────────────────
export function liveChatWidget(d) {
  const welcomeMsg = `Hi! 👋 Welcome to ${d.businessName}. How can we help you today?`;
  return `<div id="chatWidget" style="position:fixed;bottom:80px;right:20px;z-index:9998;display:none;flex-direction:column;width:340px;max-height:480px;background:${d.colors.surface};border:1px solid ${d.colors.border};border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3);animation:scaleIn .3s ease">
    <div style="padding:1rem 1.5rem;background:${d.colors.primary};color:${d.colors.bg};display:flex;justify-content:space-between;align-items:center">
      <div style="display:flex;align-items:center;gap:0.5rem">
        <div style="width:32px;height:32px;border-radius:50%;background:${d.colors.bg}22;display:flex;align-items:center;justify-content:center;font-size:1rem">💬</div>
        <div><div style="font-weight:800;font-size:0.95rem">${d.businessName}</div><div style="font-size:0.75rem;opacity:0.8">● Online</div></div>
      </div>
      <button onclick="document.getElementById('chatWidget').style.display='none';document.getElementById('chatToggle').style.display='flex'" style="background:none;border:none;color:${d.colors.bg};font-size:1.2rem;cursor:pointer">×</button>
    </div>
    <div id="chatMessages" style="flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:0.5rem">
      <div style="background:${d.colors.bg};padding:0.6rem 1rem;border-radius:12px;border-bottom-left-radius:4px;font-size:0.9rem;color:${d.colors.text};max-width:80%">${welcomeMsg}</div>
    </div>
    <div style="padding:0.8rem;border-top:1px solid ${d.colors.border};display:flex;gap:0.5rem">
      <input type="text" id="chatInput" placeholder="Type a message..." style="flex:1;padding:0.7rem;border:1px solid ${d.colors.border};border-radius:10px;background:${d.colors.bg};color:${d.colors.text};font-size:0.9rem" onkeydown="if(event.key==='Enter')sendChat()">
      <button onclick="sendChat()" style="background:${d.colors.primary};color:${d.colors.bg};border:none;padding:0.7rem 1rem;border-radius:10px;font-weight:700;cursor:pointer">→</button>
    </div>
  </div>
  <button id="chatToggle" onclick="document.getElementById('chatWidget').style.display='flex';this.style.display='none'" style="position:fixed;bottom:20px;right:20px;z-index:9998;width:56px;height:56px;border-radius:50%;background:${d.colors.primary};border:none;color:${d.colors.bg};font-size:1.5rem;cursor:pointer;box-shadow:0 4px 20px ${d.colors.primary}44;display:flex;align-items:center;justify-content:center;transition:transform .3s" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">💬</button>
  <script>
    function sendChat(){
      const input=document.getElementById('chatInput');const msg=input.value.trim();if(!msg)return;
      const container=document.getElementById('chatMessages');
      container.innerHTML+='<div style="background:${d.colors.primary};color:${d.colors.bg};padding:0.6rem 1rem;border-radius:12px;border-bottom-right-radius:4px;font-size:0.9rem;max-width:80%;align-self:flex-end">'+msg+'</div>';
      input.value='';container.scrollTop=container.scrollHeight;
      setTimeout(()=>{
        container.innerHTML+='<div style="background:${d.colors.bg};padding:0.6rem 1rem;border-radius:12px;border-bottom-left-radius:4px;font-size:0.9rem;color:${d.colors.text};max-width:80%">Thanks for reaching out! We\'ll get back to you shortly. 📩</div>';
        container.scrollTop=container.scrollHeight;
      },1000);
    }
  <\/script>`;
}

// ── FEATURE 12: MULTI-STEP BOOKING FORM ────────────────────
export function multiStepBookingForm(d) {
  const services = (d.services||[]).slice(0,5);
  return `<section id="book" style="padding:5rem 5%;background:${d.colors.surface}" class="reveal">
    <div style="max-width:600px;margin:0 auto">
      <h2 style="font-size:clamp(2rem,5vw,3rem);font-weight:800;margin-bottom:1rem;text-align:center">Book an Appointment</h2>
      <p style="color:${d.colors.muted};text-align:center;margin-bottom:2.5rem">Complete the steps below to schedule</p>
      <div id="bookingForm" style="background:${d.colors.bg};border:1px solid ${d.colors.border};border-radius:20px;padding:2rem">
        <div class="booking-steps" style="display:flex;justify-content:space-between;margin-bottom:2rem;position:relative">
          <div style="position:absolute;top:50%;left:10%;right:10%;height:2px;background:${d.colors.border};z-index:0"></div>
          <div class="step-indicator" data-step="1" style="position:relative;z-index:1;width:36px;height:36px;border-radius:50%;background:${d.colors.primary};color:${d.colors.bg};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.9rem;transition:all .3s">1</div>
          <div class="step-indicator" data-step="2" style="position:relative;z-index:1;width:36px;height:36px;border-radius:50%;background:${d.colors.border};color:${d.colors.muted};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.9rem;transition:all .3s">2</div>
          <div class="step-indicator" data-step="3" style="position:relative;z-index:1;width:36px;height:36px;border-radius:50%;background:${d.colors.border};color:${d.colors.muted};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.9rem;transition:all .3s">3</div>
          <div class="step-indicator" data-step="4" style="position:relative;z-index:1;width:36px;height:36px;border-radius:50%;background:${d.colors.border};color:${d.colors.muted};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.9rem;transition:all .3s">4</div>
        </div>
        <div id="step-1" class="booking-step" style="display:block">
          <h3 style="font-weight:700;margin-bottom:1rem">Choose a Service</h3>
          ${services.map((s,i)=>`<label style="display:block;padding:1rem;border:1px solid ${d.colors.border};border-radius:10px;margin-bottom:0.5rem;cursor:pointer;transition:all .2s" onclick="document.querySelectorAll('#step-1 label').forEach(l=>l.style.borderColor='${d.colors.border}');this.style.borderColor='${d.colors.primary}'">
            <input type="radio" name="service" value="${s.name}" style="margin-right:0.5rem" ${i===0?'checked':''}>
            <span style="font-weight:600">${s.name}</span> ${s.price?`<span style="color:${d.colors.accent};float:right">₦${s.price.toLocaleString()}</span>`:''}
          </label>`).join('')||'<p>No services available</p>'}
          <button onclick="goToStep(2)" style="width:100%;background:${d.colors.primary};color:${d.colors.bg};padding:1rem;border-radius:10px;border:none;font-weight:800;cursor:pointer;margin-top:1rem">Next →</button>
        </div>
        <div id="step-2" class="booking-step" style="display:none">
          <h3 style="font-weight:700;margin-bottom:1rem">Pick a Date & Time</h3>
          <input type="date" id="bookingDate" style="width:100%;padding:1rem;border:1px solid ${d.colors.border};border-radius:10px;background:${d.colors.surface};color:${d.colors.text};margin-bottom:0.5rem" min="${new Date().toISOString().split('T')[0]}">
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.5rem;margin-bottom:1rem">
            ${['9:00 AM','11:00 AM','1:00 PM','3:00 PM','5:00 PM','7:00 PM'].map((t,i)=>`<button onclick="document.querySelectorAll('#step-2 button').forEach(b=>b.style.background='${d.colors.surface}');this.style.background='${d.colors.primary}';this.style.color='${d.colors.bg}'" style="padding:0.7rem;border:1px solid ${d.colors.border};border-radius:8px;background:${d.colors.surface};color:${d.colors.text};cursor:pointer;font-size:0.85rem" data-time="${t}">${t}</button>`).join('')}
          </div>
          <div style="display:flex;gap:0.5rem">
            <button onclick="goToStep(1)" style="flex:1;padding:1rem;border:1px solid ${d.colors.border};border-radius:10px;background:transparent;color:${d.colors.text};cursor:pointer;font-weight:600">← Back</button>
            <button onclick="goToStep(3)" style="flex:1;background:${d.colors.primary};color:${d.colors.bg};padding:1rem;border-radius:10px;border:none;font-weight:800;cursor:pointer">Next →</button>
          </div>
        </div>
        <div id="step-3" class="booking-step" style="display:none">
          <h3 style="font-weight:700;margin-bottom:1rem">Your Details</h3>
          <input type="text" placeholder="Full Name" style="width:100%;padding:1rem;border:1px solid ${d.colors.border};border-radius:10px;background:${d.colors.surface};color:${d.colors.text};margin-bottom:0.5rem">
          <input type="email" placeholder="Email Address" style="width:100%;padding:1rem;border:1px solid ${d.colors.border};border-radius:10px;background:${d.colors.surface};color:${d.colors.text};margin-bottom:0.5rem">
          <input type="tel" placeholder="Phone Number" style="width:100%;padding:1rem;border:1px solid ${d.colors.border};border-radius:10px;background:${d.colors.surface};color:${d.colors.text};margin-bottom:1rem">
          <div style="display:flex;gap:0.5rem">
            <button onclick="goToStep(2)" style="flex:1;padding:1rem;border:1px solid ${d.colors.border};border-radius:10px;background:transparent;color:${d.colors.text};cursor:pointer;font-weight:600">← Back</button>
            <button onclick="goToStep(4)" style="flex:1;background:${d.colors.primary};color:${d.colors.bg};padding:1rem;border-radius:10px;border:none;font-weight:800;cursor:pointer">Next →</button>
          </div>
        </div>
        <div id="step-4" class="booking-step" style="display:none;text-align:center">
          <div style="font-size:3rem;margin-bottom:1rem">✅</div>
          <h3 style="font-weight:800;font-size:1.5rem;margin-bottom:0.5rem">Booking Confirmed!</h3>
          <p style="color:${d.colors.muted};margin-bottom:1.5rem">We've received your request and will confirm via email shortly.</p>
          <button onclick="document.getElementById('bookingForm').reset();goToStep(1)" style="background:${d.colors.primary};color:${d.colors.bg};padding:1rem 2rem;border-radius:10px;border:none;font-weight:800;cursor:pointer">Book Another</button>
        </div>
      </div>
    </div>
    <script>
      function goToStep(n){
        for(let i=1;i<=4;i++){document.getElementById('step-'+i).style.display=i===n?'block':'none';}
        document.querySelectorAll('.step-indicator').forEach(s=>{const step=parseInt(s.dataset.step);if(step<=n){s.style.background='${d.colors.primary}';s.style.color='${d.colors.bg}';}else{s.style.background='${d.colors.border}';s.style.color='${d.colors.muted}';}});
      }
    <\/script>
  </section>`;
}

// ── FEATURE 13: RESPONSIVE IMAGES (srcset) ────────────────
export function generateResponsiveImg(src, alt, sizes, lazy=true) {
  const widths = [400, 600, 800, 1200, 1600];
  const srcset = widths.map(w => {
    const url = src.includes('unsplash.com') ? src.replace(/(\d+)x(\d+)/, `${w}x${Math.round(w*0.667)}`) : src;
    return `${url} ${w}w`;
  }).join(', ');
  return `<img src="${src}" srcset="${srcset}" sizes="${sizes||'(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}" alt="${alt||''}" ${lazy?'loading="lazy"':'loading="eager"'} style="width:100%;height:auto;display:block">`;
}

// ── FEATURE 14: SITEMAP.XML + ROBOTS.TXT ──────────────────
export function generateSitemapMultiPage(slug, pages) {
  const baseUrl = `https://${slug}.ergio.app`;
  const now = new Date().toISOString();
  const urls = pages.map(page => `  <url>
    <loc>${baseUrl}/${page === 'index' ? '' : page + '.html'}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page === 'index' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function generateRobotsTxt(slug) {
  const baseUrl = `https://${slug}.ergio.app`;
  return `User-agent: *
Allow: /
Disallow: /api/
Sitemap: ${baseUrl}/sitemap.xml`;
}

// ── FEATURE 15: CSS MINIFICATION ──────────────────────────
export function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .replace(/:\s+/g, ':')
    .trim();
}

// ── PAGE TRANSITION ANIMATIONS (Feature 13 from list) ─────
export function pageTransitionsScript() {
  return `<script>
    (function(){
      // View Transitions API (modern browsers) + fallback
      const supportsVT=document.startViewTransition!==undefined;
      function navigate(url){
        if(supportsVT){
          document.startViewTransition(()=>{location.href=url;});
        }else{
          document.body.style.opacity='0';
          document.body.style.transition='opacity .3s';
          setTimeout(()=>location.href=url,300);
        }
      }
      // Smooth page enter animation
      document.body.style.opacity='0';
      document.body.style.transition='opacity .4s ease';
      requestAnimationFrame(()=>{document.body.style.opacity='1';});
      // Intercept internal links
      document.querySelectorAll('a[href^="/"]:not([target])').forEach(a=>{
        a.addEventListener('click',e=>{const href=a.getAttribute('href');if(href==='/'||href.startsWith('/')){e.preventDefault();navigate(href);}});
      });
    })();
  <\/script>`;
}

// ── PAGE TRANSITION CSS ───────────────────────────────────
export function pageTransitionCSS() {
  return `@media (prefers-reduced-motion: no-preference){
    ::view-transition-old(root),::view-transition-new(root){animation-duration:.4s}
    ::view-transition-old(root){animation-name:fade-out}
    ::view-transition-new(root){animation-name:fade-in}
    @keyframes fade-out{to{opacity:0;transform:translateY(-20px)}}
    @keyframes fade-in{from{opacity:0;transform:translateY(20px)}}
    .page-enter{animation:pageEnter .5s cubic-bezier(.16,1,.3,1) forwards}
    @keyframes pageEnter{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes scaleIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}
  }`;
}

// ════════════════════════════════════════════════════════════
// UPGRADED ASSEMBLY (v4.0) — includes all 15 features
// ════════════════════════════════════════════════════════════
export function assemblePremiumWebsiteV4(plan, content, colors, logoUrl, images, layoutKey, options = {}) {
  const layout = LAYOUT_ARCHETYPES[layoutKey] || LAYOUT_ARCHETYPES.apple;
  const d = {
    businessName: plan.businessName,
    headline: content.hero?.headline || plan.businessName,
    subheadline: content.hero?.subheadline || plan.tagline || plan.description || '',
    cta: content.hero?.cta || 'Get Started',
    category: plan.type, type: plan.type, city: plan.city,
    tagline: plan.tagline, description: plan.description,
    about: content.about || plan.description || '',
    aboutImage: images.about?.[0]?.url,
    heroImage: images.hero?.[0]?.url,
    heroVideo: options.heroVideo || content.hero?.videoUrl || '',
    beforeImage: options.beforeImage || images.gallery?.[0]?.url,
    afterImage: options.afterImage || images.gallery?.[1]?.url || images.gallery?.[0]?.url,
    panoramaImage: options.panoramaImage || '',
    gltfModel: options.gltfModel || '',
    mapLat: options.mapLat || parseFloat(content.contactInfo?.lat) || 6.5244,
    mapLng: options.mapLng || parseFloat(content.contactInfo?.lng) || 3.3792,
    logoUrl, colors,
    features: (content.whyChooseUs || ['Expert Team', 'Trusted Quality', 'Fast Service', 'Best Prices']).map((w, i) => ({
      title: w, description: content.features?.[i] || ''
    })),
    featuresTitle: 'Why Choose Us', featuresSub: 'Everything you need',
    stats: content.stats || [{label:'Happy Clients',value:'500+',numericValue:500},{label:'Projects',value:'1200+',numericValue:1200},{label:'Years',value:'10+',numericValue:10},{label:'Satisfaction',value:'100%'}],
    testimonials: content.testimonials || [],
    faq: content.faq || [],
    contactInfo: content.contactInfo || {},
    services: plan.services || [],
    emoji: plan.emoji || '✨', schemaType: plan.schemaType || 'LocalBusiness',
    whyChooseUs: content.whyChooseUs || ['Expert Team', 'Trusted Quality', 'Fast Service'],
  };

  // Build the page
  const heroKey = layout.sections[0];
  const heroFn = options.heroVideo ? heroVideo : (options.gltfModel ? hero3DWithModel : COMPONENTS.heroes[heroKey] || COMPONENTS.heroes['hero-centered']);
  const featureKey = layout.sections[1];
  const featureFn = COMPONENTS.features[featureKey] || COMPONENTS.features['feature-grid-3'];
  const statsKey = layout.sections.find(s => s.startsWith('stats')) || 'stats-bar';
  const statsFn = COMPONENTS.stats[statsKey] || COMPONENTS.stats['stats-bar'];
  const tKey = layout.sections.find(s => s.startsWith('testimonial')) || 'testimonial-row';
  const tFn = COMPONENTS.testimonials[tKey] || COMPONENTS.testimonials['testimonial-row'];
  const ctaKey = layout.sections.find(s => s.startsWith('cta')) || 'cta-minimal';
  const ctaFn = COMPONENTS.ctas[ctaKey] || COMPONENTS.ctas['cta-minimal'];

  // Optional sections (enabled via options)
  const megaMenu = options.megaMenu ? megaMenuNav(d) : '';
  const lottieSection = options.lottie ? lottieAnimationSection(d) : '';
  const beforeAfter = options.beforeAfter ? beforeAfterSlider(d) : '';
  const virtualTour = options.virtualTour ? virtualTourSection(d) : '';
  const interactiveMap = options.interactiveMap ? interactiveMapSection(d) : '';
  const bookingForm = options.bookingForm ? multiStepBookingForm(d) : '';

  // CSS to minify
  const rawCSS = `*{margin:0;padding:0;box-sizing:border-box}
    :root{--primary:${colors.primary};--secondary:${colors.secondary};--accent:${colors.accent};--bg:${colors.bg};--surface:${colors.surface};--border:${colors.border};--text:${colors.text};--muted:${colors.muted};--cta:${colors.cta||colors.primary}}
    html{scroll-behavior:smooth}body{font-family:Inter,sans-serif;background:var(--bg);color:var(--text);line-height:1.6;overflow-x:hidden}
    a{color:inherit;text-decoration:none}img{max-width:100%;height:auto}
    @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
    @keyframes scaleIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}
    @keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
    .reveal{opacity:0;transform:translateY(40px);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1)}
    .reveal.active{opacity:1;transform:translateY(0)}
    .reveal-left{opacity:0;transform:translateX(-50px);transition:all .8s cubic-bezier(.16,1,.3,1)}.reveal-left.active{opacity:1;transform:translateX(0)}
    .reveal-right{opacity:0;transform:translateX(50px);transition:all .8s cubic-bezier(.16,1,.3,1)}.reveal-right.active{opacity:1;transform:translateX(0)}
    .stagger>*{opacity:0;transform:translateY(30px);transition:all .6s cubic-bezier(.16,1,.3,1)}
    .stagger.active>*:nth-child(1){opacity:1;transform:none;transition-delay:.1s}
    .stagger.active>*:nth-child(2){opacity:1;transform:none;transition-delay:.2s}
    .stagger.active>*:nth-child(3){opacity:1;transform:none;transition-delay:.3s}
    .stagger.active>*:nth-child(4){opacity:1;transform:none;transition-delay:.4s}
    .stagger.active>*:nth-child(5){opacity:1;transform:none;transition-delay:.5s}
    .stagger.active>*:nth-child(6){opacity:1;transform:none;transition-delay:.6s}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
    @media(max-width:1024px){.hero-grid{grid-template-columns:1fr!important}.about-grid{grid-template-columns:1fr!important;gap:2rem!important}.hero-visual{display:none}}
    @media(max-width:768px){section{padding:3rem 5%!important}.nav-links{display:none!important}h1{font-size:clamp(2rem,8vw,3rem)!important}h2{font-size:clamp(1.5rem,6vw,2.5rem)!important}}
    @media(max-width:480px){section{padding:2.5rem 5%!important}body{font-size:0.95rem}}
    ${pageTransitionCSS()}`;

  const minifiedCSS = options.minifyCSS ? minifyCSS(rawCSS) : rawCSS;

  const navHTML = megaMenu || `<nav class="nav" id="nav" style="display:flex;justify-content:space-between;align-items:center;padding:1.2rem 5%;position:sticky;top:0;background:rgba(0,0,0,.3);backdrop-filter:blur(20px);z-index:100;border-bottom:1px solid ${colors.border}">
    <a href="#" style="font-weight:800;font-size:1.2rem;color:${colors.primary}">${logoUrl ? `<img src="${logoUrl}" alt="${plan.businessName}" style="height:32px">` : plan.businessName}</a>
    <div class="nav-links" style="display:flex;gap:1.5rem;font-size:0.9rem">
      <a href="#about" style="color:${colors.muted}">About</a><a href="#features" style="color:${colors.muted}">Services</a><a href="#testimonials" style="color:${colors.muted}">Reviews</a><a href="#faq" style="color:${colors.muted}">FAQ</a><a href="#contact" style="color:${colors.muted}">Contact</a>
    </div>
  </nav>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Sora:wght@400;600;700;800&family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${minifiedCSS}</style>
  ${generateSEO(d)}
</head>
<body>
  <a href="#main" style="position:absolute;left:-9999px" onfocus="this.style.cssText='position:fixed;left:10px;top:10px;padding:1rem;background:#000;color:#fff;z-index:9999'">Skip to main content</a>
  ${navHTML}
  <main id="main">
    ${heroFn(d)}${featureFn(d)}${lottieSection}${beforeAfter}${statsFn(d)}${tFn(d)}${virtualTour}${COMPONENTS.faq(d)}${bookingForm}${interactiveMap}${ctaFn(d)}${COMPONENTS.contact(d)}
  </main>
  ${COMPONENTS.footer(d)}
  ${darkModeToggle()}
  ${exitIntentPopup(d)}
  ${liveChatWidget(d)}
  <script>${INTERACTION_JS}</script>
  ${pageTransitionsScript()}
</body>
</html>`;
}
