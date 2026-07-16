// ========================================
// ERGIO Client-Side Configuration v5.0
// Firebase Authentication + Supabase DB
// ========================================

window.ERGIO_CONFIG = {
  // ── Supabase (database only — auth is handled by Firebase) ──
  supabaseUrl: 'https://owcxfzlanlrulflsyvlr.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Y3hmemxhbmxydWxmbHN5dmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNzI5NDIsImV4cCI6MjA5OTc0ODk0Mn0.k6IISu8k8QoU1CGLF0U3319qqDvEIwYY8PPXXvwfbAw',

  // ── Firebase Authentication config (loaded dynamically) ──
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "585541885776",
    appId: ""
  },

  // ── API Base URL ──
  apiBase: window.location.origin.includes('github.io')
    ? 'https://ergio.vercel.app'
    : window.location.origin,

  // ── Groq AI Models ──
  groqModel: 'llama-3.3-70b-versatile',
  groqFallbackModel: 'llama-3.1-8b-instant',
  groqGemmaModel: 'gemma2-9b-it',

  // ── Open-Source Engines ──
  engines: {
    janAi: 'http://localhost:1337/v1',
    pollinations: 'https://image.pollinations.ai',
    pollinationsText: 'https://text.pollinations.ai',
    osm: 'https://nominatim.openstreetmap.org',
    overpass: 'https://overpass-api.de/api/interpreter',
    searxng: [
      'https://search.sapti.me',
      'https://searx.be',
      'https://search.bus-hit.me',
    ],
  },

  // ── Payment ──
  paystackPublicKey: 'YOUR_PAYSTACK_PUBLIC_KEY',

  // ── Features ──
  whatsappEnabled: true,
  analyticsEnabled: true,
};

// ── Load Firebase config from secure API endpoint ──
(async function loadFirebaseConfig() {
  try {
    const base = window.ERGIO_CONFIG.apiBase;
    const res = await fetch(base + '/api/firebase-config');
    if (!res.ok) return;
    const text = await res.text();
    // Execute the returned script which patches ERGIO_CONFIG.firebase
    const script = document.createElement('script');
    script.textContent = text;
    document.head.appendChild(script);
  } catch(e) {
    console.warn('Could not load Firebase config:', e.message);
  }
})();
