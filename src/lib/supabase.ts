// import { createClient } from '@supabase/supabase-js'

// const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
// const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

// export const supabase = createClient(supabaseUrl, supabaseAnonKey)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://wsefpprvwjxtiwbmfaiq.supabase.co"//process.env.REACT_APP_SUPABASE_URL!
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZWZwcHJ2d2p4dGl3Ym1mYWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTUxMjUsImV4cCI6MjA2ODY3MTEyNX0.ksptP7xW7Z7C3coMdXPV3_FSWzxn3Gp6xQDNvMmx50o" //process.env.REACT_APP_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)