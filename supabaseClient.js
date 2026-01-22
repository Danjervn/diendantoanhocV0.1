// File này phải được load sau config.js và sau CDN supabase-js
const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
