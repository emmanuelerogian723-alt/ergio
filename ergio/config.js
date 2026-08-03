// ERGIO Client-Side Configuration
// Security: Firebase config is loaded from /api/firebase-config.js (env vars)
// Auth pages include /api/firebase-config.js script tag before Firebase init
window.ERGIO_CONFIG = {
  // API Base URL (Vercel)
  apiBase: window.location.origin.includes('github.io') 
    ? 'https://ergio.vercel.app' 
    : window.location.origin,

  // ERGIO Engines Backend (Render — Python FastAPI)
  enginesApiBase: window.location.origin.includes('localhost')
    ? 'http://localhost:8000'
    : 'https://ergio-engines.onrender.com',

  // Firebase Auth
  firebase: {
    apiKey: "AIzaSyBRhBF6Nscqz53rMCF0ykAcMnWuRIrfgJw",
    authDomain: "ominiassist-ai.firebaseapp.com",
    databaseURL: "https://ominiassist-ai-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "ominiassist-ai",
    storageBucket: "ominiassist-ai.firebasestorage.app",
    messagingSenderId: "585541885776",
    appId: "1:585541885776:web:28294a89e8e411cd3fd655",
    measurementId: "G-Z49NFZYTW3"
  },

  // Supabase (database — anon key is safe for frontend)
  supabaseUrl: 'https://owcxfzlanlrulflsyvlr.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Y3hmemxhbmxydWxmbHN5dmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNzI5NDIsImV4cCI6MjA5OTc0ODk0Mn0.k6IISu8k8QoU1CGLF0U3319qqDvEIwYY8PPXXvwfbAw',
  
  // Payment (public key — safe for frontend)
  paystackPublicKey: 'pk_live_b73d27d70e64ebb36f0523cb5754e77deba9080b',
  
  // AI Models
  primaryModel: 'openai/gpt-oss-120b',
  fallbackModel: 'openai/gpt-oss-20b',
  
  // Open-Source Engines
  engines: {
    pollinations: 'https://image.pollinations.ai',
    pollinationsText: 'https://text.pollinations.ai',
    searxng: ['https://searx.be', 'https://search.bus-hit.me', 'https://paulgo.io'],
  },
  
  // Integration endpoints
  integrations: {
    paystack: { name: 'Paystack', category: 'Payments', icon: '🇳🇬', color: '#00c3f7', description: 'Accept payments from customers across Africa', connectUrl: 'https://dashboard.paystack.com/#/settings/developer', docsUrl: 'https://paystack.com/docs/api/' },
    stripe: { name: 'Stripe', category: 'Payments', icon: 'S', color: '#635bff', description: 'Global payment processing for online businesses', connectUrl: 'https://dashboard.stripe.com/apikeys', docsUrl: 'https://stripe.com/docs/api' },
    flutterwave: { name: 'Flutterwave', category: 'Payments', icon: '🌍', color: '#f5a623', description: 'Pan-African payment gateway', connectUrl: 'https://dashboard.flutterwave.com/settings/apis', docsUrl: 'https://developer.flutterwave.com/docs' },
    whatsapp_business: { name: 'WhatsApp Business', category: 'Communication', icon: '💬', color: '#25d366', description: 'Automated WhatsApp messages and customer chat', connectUrl: 'https://developers.facebook.com/apps', docsUrl: 'https://developers.facebook.com/docs/whatsapp' },
    telegram: { name: 'Telegram', category: 'Communication', icon: '✈️', color: '#2aabee', description: 'Send messages and alerts via Telegram bots', connectUrl: 'https://t.me/BotFather', docsUrl: 'https://core.telegram.org/bots/api' },
    resend: { name: 'Resend', category: 'Communication', icon: '📧', color: '#7c3aed', description: 'Send transactional and marketing emails', connectUrl: 'https://resend.com/api-keys', docsUrl: 'https://resend.com/docs' },
    twilio: { name: 'Twilio', category: 'Communication', icon: '📞', color: '#f22f46', description: 'SMS, voice, and messaging API', connectUrl: 'https://console.twilio.com/', docsUrl: 'https://www.twilio.com/docs' },
    notion: { name: 'Notion', category: 'Productivity', icon: '📝', color: '#ffffff', description: 'Sync tasks, notes, and project data with Notion', connectUrl: 'https://www.notion.so/my-integrations', docsUrl: 'https://developers.notion.com/' },
    slack: { name: 'Slack', category: 'Productivity', icon: '💼', color: '#4a154b', description: 'Send notifications and alerts to Slack channels', connectUrl: 'https://api.slack.com/apps', docsUrl: 'https://api.slack.com/docs' },
    github: { name: 'GitHub', category: 'Productivity', icon: '🐙', color: '#ffffff', description: 'Deploy websites and manage code repositories', connectUrl: 'https://github.com/settings/tokens', docsUrl: 'https://docs.github.com/en/rest' },
    google_calendar: { name: 'Google Calendar', category: 'Productivity', icon: '📅', color: '#4285f4', description: 'Sync bookings and appointments with Google Calendar', connectUrl: 'https://console.cloud.google.com/', docsUrl: 'https://developers.google.com/calendar' },
    mailchimp: { name: 'Mailchimp', category: 'Marketing', icon: '🐒', color: '#ffe01b', description: 'Email marketing campaigns and automation', connectUrl: 'https://login.mailchimp.com/', docsUrl: 'https://mailchimp.com/developer/marketing/api/' },
    meta_ads: { name: 'Meta Ads', category: 'Marketing', icon: '👤', color: '#1877f2', description: 'Create and manage Facebook & Instagram ads', connectUrl: 'https://www.facebook.com/adsmanager', docsUrl: 'https://developers.facebook.com/docs/marketing-apis' },
    google_ads: { name: 'Google Ads', category: 'Analytics', icon: '🎯', color: '#fbbc04', description: 'Run Google search and display advertising', connectUrl: 'https://ads.google.com/', docsUrl: 'https://developers.google.com/google-ads/api' },
    canva: { name: 'Canva', category: 'Marketing', icon: '🎨', color: '#00c4cc', description: 'Design marketing materials and social media graphics', connectUrl: 'https://www.canva.com/settings/account/integrations', docsUrl: 'https://www.canva.com/developers/' },
    google_analytics: { name: 'Google Analytics', category: 'Analytics', icon: '📊', color: '#ff6d00', description: 'Track website visitors and user behavior', connectUrl: 'https://analytics.google.com/', docsUrl: 'https://developers.google.com/analytics' },
    mixpanel: { name: 'Mixpanel', category: 'Analytics', icon: '📈', color: '#7856ff', description: 'Product analytics and user event tracking', connectUrl: 'https://mixpanel.com/', docsUrl: 'https://developer.mixpanel.com/docs' },
    hotjar: { name: 'Hotjar', category: 'Analytics', icon: '🔥', color: '#fd3a5c', description: 'Heatmaps and session recordings for your website', connectUrl: 'https://insights.hotjar.com/', docsUrl: 'https://developer.hotjar.com/' },
    cal_com: { name: 'Cal.com', category: 'Productivity', icon: '📆', color: '#292929', description: 'Open-source scheduling and booking system', connectUrl: 'https://app.cal.com/settings/developer/api-keys', docsUrl: 'https://cal.com/docs/api-reference' },
    openai: { name: 'OpenAI', category: 'AI & Automation', icon: '🤖', color: '#10a37f', description: 'GPT-4 and DALL-E for advanced AI features', connectUrl: 'https://platform.openai.com/api-keys', docsUrl: 'https://platform.openai.com/docs' },
    groq: { name: 'Groq', category: 'AI & Automation', icon: '⚡', color: '#f55036', description: 'Ultra-fast AI inference — powers ERGIO engines', connectUrl: 'https://console.groq.com/keys', docsUrl: 'https://console.groq.com/docs/quickstart' },
    n8n: { name: 'n8n', category: 'AI & Automation', icon: '🔗', color: '#ea4b71', description: 'No-code workflow automation between apps', connectUrl: 'https://n8n.io/', docsUrl: 'https://docs.n8n.io/api/' },
    zapier: { name: 'Zapier', category: 'AI & Automation', icon: '⚡', color: '#ff4a00', description: 'Automate tasks between 5,000+ apps', connectUrl: 'https://zapier.com/app/connections', docsUrl: 'https://platform.zapier.com/docs' },
  },

  // Features
  whatsappEnabled: true,
  analyticsEnabled: true,
};
