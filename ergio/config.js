// ========================================
// ERGIO Client-Side Configuration
// The anon key is safe to expose publicly (RLS protects your data)
// ========================================

window.ERGIO_CONFIG = {
  // Supabase - Ergio project (active)
  supabaseUrl: 'https://owcxfzlanlrulflsyvlr.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Y3hmemxhbmxydWxmbHN5dmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNzI5NDIsImV4cCI6MjA5OTc0ODk0Mn0.k6IISu8k8QoU1CGLF0U3319qqDvEIwYY8PPXXvwfbAw',
  
  // API Base URL (for Vercel deployment, this will be your domain)
  apiBase: window.location.origin.includes('github.io') 
    ? 'https://ergio.vercel.app' 
    : window.location.origin,
  
  // Groq AI Models (free tier)
  groqModel: 'llama-3.3-70b-versatile',
  groqFallbackModel: 'llama-3.1-8b-instant',
  groqGemmaModel: 'gemma2-9b-it',
  
  // Open-Source Engines
  engines: {
    janAi: 'http://localhost:1337/v1', // Local Jan AI (when available)
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
  
  // Payment
  paystackPublicKey: 'YOUR_PAYSTACK_PUBLIC_KEY',
  
  // WhatsApp Business
  whatsappEnabled: true,
  
  // Analytics
  analyticsEnabled: true,
};
