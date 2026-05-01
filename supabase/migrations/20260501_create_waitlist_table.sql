-- WAITLIST ONLY — delete this file at launch

-- Create waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  ai_use TEXT NOT NULL,
  company TEXT,
  referral_source TEXT,
  beta_tester BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON public.waitlist(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (for the waitlist form)
CREATE POLICY "Allow anonymous inserts"
  ON public.waitlist
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow authenticated users to view all waitlist entries (for admin purposes)
CREATE POLICY "Allow authenticated reads"
  ON public.waitlist
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow service role full access (for admin operations)
CREATE POLICY "Allow service role full access"
  ON public.waitlist
  FOR ALL
  TO service_role
  USING (true);

-- Add comment to table
COMMENT ON TABLE public.waitlist IS 'Waitlist signups - temporary table for beta launch phase';
COMMENT ON COLUMN public.waitlist.id IS 'Unique identifier for waitlist entry';
COMMENT ON COLUMN public.waitlist.name IS 'Full name of the user';
COMMENT ON COLUMN public.waitlist.email IS 'Email address (unique)';
COMMENT ON COLUMN public.waitlist.ai_use IS 'Primary use case for AI';
COMMENT ON COLUMN public.waitlist.company IS 'Company or organization (optional)';
COMMENT ON COLUMN public.waitlist.referral_source IS 'How they heard about us (optional)';
COMMENT ON COLUMN public.waitlist.beta_tester IS 'Whether they want to be a beta tester';
COMMENT ON COLUMN public.waitlist.created_at IS 'Timestamp when entry was created';
