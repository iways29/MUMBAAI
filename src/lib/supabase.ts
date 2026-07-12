import { createClient } from '@supabase/supabase-js'

// Env-first (REACT_APP_* is set in Vercel for all environments); the literal
// fallbacks keep local dev working without a .env. The anon key is public by
// design — RLS is the security boundary, not this string.
const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL || "https://wsefpprvwjxtiwbmfaiq.supabase.co"
const supabaseAnonKey =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZWZwcHJ2d2p4dGl3Ym1mYWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTUxMjUsImV4cCI6MjA2ODY3MTEyNX0.ksptP7xW7Z7C3coMdXPV3_FSWzxn3Gp6xQDNvMmx50o"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
