// ========================================
// ERGIO Client-Side Configuration
// The anon key is safe to expose publicly (RLS protects your data)
// ========================================

window.ERGIO_CONFIG = {
  // Supabase - Ergio project (ACTIVE_HEALTHY)
  supabaseUrl: 'https://owcxfzlanlrulflsyvlr.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Y3hmemxhbmxydWxmbHN5dmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNzI5NDIsImV4cCI6MjA5OTc0ODk0Mn0.k6IISu8k8QoU1CGLF0U3319qqDvEIwYY8PPXXvwfbAw',
  
  // API Base URL (for Vercel deployment)
  apiBase: window.location.origin.includes('github.io') 
    ? 'https://ergio.vercel.app' 
    : window.location.origin,
  
  // AI Models
  groqModel: 'llama-3.3-70b-versatile',
  groqFallbackModel: 'llama-3.1-8b-instant',
  groqGemmaModel: 'gemma2-9b-it',
  
  // OpenRouter (for additional AI models)
  openRouterModel: 'meta-llama/llama-3.1-70b-instruct',
  
  // Open-Source Engines
  engines: {
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
  
  // Payment - Paystack (live keys)
  paystackPublicKey: 'pk_live_b73d27d70e64ebb36f0523cb5754e77deba9080b',
  
  // WhatsApp Business
  whatsappEnabled: true,
  
  // Analytics
  analyticsEnabled: true,
};
