// ERGIO Client-Side Configuration
// Security: Firebase config is loaded from /api/firebase-config.js (env vars)
// Auth pages include /api/firebase-config.js script tag before Firebase init
window.ERGIO_CONFIG = {
  // API Base URL
  apiBase: window.location.origin.includes('github.io') 
    ? 'https://ergio.vercel.app' 
    : window.location.origin,

  // ERGIO Engines Backend (Render — Python FastAPI)
  enginesApiBase: window.location.origin.includes('localhost')
    ? 'http://localhost:8000'  // Local dev
    : 'https://ergio-engines.onrender.com',  // Render production

  // Firebase Auth — loaded from /api/firebase-config.js (env vars)
  // Auth pages include this script tag before Firebase init
  firebase: {},

  // Supabase (database — anon key is safe for frontend)
  supabaseUrl: 'https://owcxfzlanlrulflsyvlr.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Y3hmemxhbmxydWxmbHN5dmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNzI5NDIsImV4cCI6MjA5OTc0ODk0Mn0.k6IISu8k8QoU1CGLF0U3319qqDvEIwYY8PPXXvwfbAw',
  
  // Payment (public key — safe for frontend)
  paystackPublicKey: 'pk_test_a7bc94e0c4e8622cd6cfe3c9a2c6f7e1d0b3a4c5',
  
  // AI Models
  primaryModel: 'meta-llama/llama-3.3-70b-instruct',
  fallbackModel: 'meta-llama/llama-3.1-8b-instruct',
  
  // Open-Source Engines
  engines: {
    pollinations: 'https://image.pollinations.ai',
    pollinationsText: 'https://text.pollinations.ai',
    searxng: ['https://search.sapti.me','https://searx.be'],
  },
  
  // Features
  whatsappEnabled: true,
  analyticsEnabled: true,
};
