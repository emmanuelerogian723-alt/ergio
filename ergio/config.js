// ========================================
// ERGIO Client-Side Configuration v6.0
// Supabase Auth + Database
// ========================================

window.ERGIO_CONFIG = {
  // ── Supabase (auth + database) ──
  supabaseUrl: 'https://owcxfzlanlrulflsyvlr.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Y3hmemxhbmxydWxmbHN5dmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNzI5NDIsImV4cCI6MjA5OTc0ODk0Mn0.k6IISu8k8QoU1CGLF0U3319qqDvEIwYY8PPXXvwfbAw',

  // ── API Base URL ──
  apiBase: window.location.origin.includes('github.io')
    ? 'https://ergio.vercel.app'
    : window.location.origin,

  // ── Groq AI Models ──
  groqModel: 'llama-3.3-70b-versatile',
  groqFallbackModel: 'llama-3.1-8b-instant',
  groqGemmaModel: 'gemma2-9b-it',
};
