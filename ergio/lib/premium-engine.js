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
  return `<section class="hero" style="min-height:90vh;display:flex;align-items:center;background:linear-gradient(180deg,${d.colors.bg} 0%,${d.colors.surface} 100%);position:relative;overflow:hidden">
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 30% 50%,${d.colors.primary}22,transparent 60%);z-index:0"></div>
    <div style="position:relative;z-index:2;max-width:1200px;margin:0 auto;padding:0 5%;width:100%">
      <div style="font-size:0.75rem;letter-spacing:0.2em;text-transform:uppercase;color:${d.colors.primary};font-weight:700;margin-bottom:1.5rem;opacity:0;animation:fadeUp .8s .1s forwards">${d.category||'Premium'}</div>
      <h1 style="font-size:clamp(2.5rem,8vw,6rem);font-weight:900;line-height:0.95;letter-spacing:-0.03em;margin-bottom:1.5rem;opacity:0;animation:fadeUp .8s .2s forwards">${d.headline}</h1>
      <p style="font-size:clamp(1rem,2.5vw,1.5rem);color:${d.colors.muted};max-width:600px;margin-bottom:2.5rem;opacity:0;animation:fadeUp .8s .3s forwards">${d.subheadline}</p>
      <div style="display:flex;gap:1rem;flex-wrap:wrap;opacity:0;animation:fadeUp .8s .4s forwards">
        <a href="#contact" style="background:${d.colors.primary};color:${d.colors.bg};padding:1rem 2rem;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;transition:all .3s;box-shadow:0 4px 20px ${d.colors.primary}44">${d.cta||'Get Started'}</a>
        <a href="#about" style="border:2px solid ${d.colors.border};color:${d.colors.text};padding:1rem 2rem;border-radius:8px;font-weight:600;text-decoration:none;font-size:1rem;transition:all .3s">Learn More</a>
      </div>
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
    .nav{display:flex;justify-content:space-between;align-items:center;padding:1.2rem 5%;position:sticky;top:0;background:rgba(0,0,0,0.3);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);z-index:100;border-bottom:1px solid var(--border);transition:padding .3s}
    .nav.scrolled{padding:0.8rem 5%}
    .nav-brand{font-weight:800;font-size:1.2rem;color:var(--primary);text-decoration:none}
    .nav-links{display:flex;gap:1.5rem;font-size:0.9rem}
    .nav-links a{color:var(--muted);text-decoration:none;transition:color .3s;font-weight:600}
    .nav-links a:hover{color:var(--primary)}
  </style>
  ${generateSEO(d)}
</head>
<body>
  <a href="#main" style="position:absolute;left:-9999px" onfocus="this.style.cssText='position:fixed;left:10px;top:10px;padding:1rem;background:#000;color:#fff;z-index:9999'">Skip to main content</a>
  <nav class="nav" id="nav" role="navigation" aria-label="Main navigation">
    <a href="#" class="nav-brand">${logoUrl?`<img src="${logoUrl}" alt="${plan.businessName}" style="height:32px">`:plan.businessName}</a>
    <div class="nav-links"><a href="#about">About</a><a href="#features">Services</a><a href="#testimonials">Reviews</a><a href="#faq">FAQ</a><a href="#contact">Contact</a></div>
  </nav>
  <main id="main">
    ${heroFn(d)}${featureFn(d)}${statsFn(d)}${tFn(d)}${COMPONENTS.faq(d)}${ctaFn(d)}${COMPONENTS.contact(d)}
  </main>
  ${COMPONENTS.footer(d)}
  <script>${INTERACTION_JS}</script>
</body>
</html>`;
}
