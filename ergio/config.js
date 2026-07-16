// ========================================
// ERGIO Client-Side Configuration
// Replace these with your actual Supabase credentials
// The anon key is safe to expose publicly (RLS protects your data)
// ========================================

window.ERGIO_CONFIG = {
  supabaseUrl: 'YOUR_SUPABASE_URL.supabase.co',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
  apiBase: window.location.origin,
  groqModel: 'llama-3.3-70b-versatile'
};
