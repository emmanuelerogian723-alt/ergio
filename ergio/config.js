// ERGIO Client-Side Configuration
window.ERGIO_CONFIG = {
  // API Base URL
  apiBase: window.location.origin.includes('github.io') 
    ? 'https://ergio.vercel.app' 
    : window.location.origin,

  // Firebase Auth (main authentication)
  firebase: {
    apiKey: "AIzaSyPlaceholder-ConfigureInFirebaseConsole",
    authDomain: "ergio-app.firebaseapp.com",
    projectId: "ergio-app",
    storageBucket: "ergio-app.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:placeholder"
  },

  // Supabase (database only)
  supabaseUrl: 'https://owcxfzlanlrulflsyvlr.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Y3hmemxhbmxydWxmbHN5dmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNzI5NDIsImV4cCI6MjA5OTc0ODk0Mn0.k6IISu8k8QoU1CGLF0U3319qqDvEIwYY8PPXXvwfbAw',
  
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
