// ERGIO Client-Side Configuration
window.ERGIO_CONFIG = {
  // API Base URL
  apiBase: window.location.origin.includes('github.io') 
    ? 'https://ergio.vercel.app' 
    : window.location.origin,
  
  // Payment
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
