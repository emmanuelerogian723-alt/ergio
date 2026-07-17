// api/firebase-config.js
// Serves Firebase config securely from Vercel env vars
// Called by the frontend to get Firebase config without hardcoding

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600');
  res.setHeader('Content-Type', 'application/javascript');

  const config = {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '585541885776',
    appId: process.env.FIREBASE_APP_ID || ''
  };

  // Serve as JS that patches ERGIO_CONFIG
  res.send(`
(function() {
  if (window.ERGIO_CONFIG) {
    window.ERGIO_CONFIG.firebase = ${JSON.stringify(config)};
  }
})();
  `.trim());
}
