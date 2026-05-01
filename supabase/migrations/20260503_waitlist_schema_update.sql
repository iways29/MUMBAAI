-- Update waitlist table schema
-- Remove old fields and add new simplified fields

-- Drop the old waitlist table if it exists (or alter it)
-- Since we're in development, safest to recreate
DROP TABLE IF EXISTS public.waitlist CASCADE;

-- Create updated waitlist table with new schema
CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  company TEXT,
  solving_real_problem TEXT NOT NULL CHECK (solving_real_problem IN ('yes', 'no', 'maybe')),
  additional_comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_waitlist_email ON public.waitlist(email);
CREATE INDEX idx_waitlist_created_at ON public.waitlist(created_at DESC);
CREATE INDEX idx_waitlist_solving_real_problem ON public.waitlist(solving_real_problem);

-- Enable Row Level Security
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

-- Add comments
COMMENT ON TABLE public.waitlist IS 'Waitlist signups - temporary table for beta launch phase';
COMMENT ON COLUMN public.waitlist.id IS 'Unique identifier for waitlist entry';
COMMENT ON COLUMN public.waitlist.name IS 'Full name of the user';
COMMENT ON COLUMN public.waitlist.email IS 'Email address (unique)';
COMMENT ON COLUMN public.waitlist.company IS 'Company or organization (optional)';
COMMENT ON COLUMN public.waitlist.solving_real_problem IS 'Do they think we are solving a real problem? (yes/no/maybe)';
COMMENT ON COLUMN public.waitlist.additional_comments IS 'Optional additional feedback from the user';
COMMENT ON COLUMN public.waitlist.created_at IS 'Timestamp when entry was created';

-- Update analytics functions to work with new schema

-- Drop old functions first to avoid signature conflicts (with specific signatures)
DROP FUNCTION IF EXISTS get_waitlist_stats();
DROP FUNCTION IF EXISTS get_waitlist_by_use_case();
DROP FUNCTION IF EXISTS get_waitlist_by_referral();
DROP FUNCTION IF EXISTS get_recent_waitlist_signups(integer);
DROP FUNCTION IF EXISTS get_waitlist_daily_signups(integer);

-- Function: Get waitlist overview stats (updated)
CREATE OR REPLACE FUNCTION get_waitlist_stats()
RETURNS TABLE (
  total_signups BIGINT,
  signups_today BIGINT,
  signups_this_week BIGINT,
  unique_companies BIGINT,
  solving_yes BIGINT,
  solving_no BIGINT,
  solving_maybe BIGINT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT
    COUNT(*)::BIGINT AS total_signups,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::BIGINT AS signups_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')::BIGINT AS signups_this_week,
    COUNT(DISTINCT company) FILTER (WHERE company IS NOT NULL AND company != '')::BIGINT AS unique_companies,
    COUNT(*) FILTER (WHERE solving_real_problem = 'yes')::BIGINT AS solving_yes,
    COUNT(*) FILTER (WHERE solving_real_problem = 'no')::BIGINT AS solving_no,
    COUNT(*) FILTER (WHERE solving_real_problem = 'maybe')::BIGINT AS solving_maybe
  FROM waitlist;
$$;

-- Function: Get waitlist breakdown by problem validation response
CREATE OR REPLACE FUNCTION get_waitlist_by_problem_validation()
RETURNS TABLE (
  response TEXT,
  count BIGINT,
  percentage NUMERIC
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  WITH totals AS (
    SELECT COUNT(*)::NUMERIC AS total FROM waitlist
  )
  SELECT
    solving_real_problem AS response,
    COUNT(*)::BIGINT AS count,
    ROUND((COUNT(*)::NUMERIC / NULLIF(totals.total, 0) * 100), 1) AS percentage
  FROM waitlist, totals
  GROUP BY solving_real_problem, totals.total
  ORDER BY count DESC;
$$;

-- Function: Get recent waitlist signups (updated)
CREATE OR REPLACE FUNCTION get_recent_waitlist_signups(limit_count INT DEFAULT 10)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  company TEXT,
  solving_real_problem TEXT,
  additional_comments TEXT,
  created_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT
    id,
    name,
    email,
    company,
    solving_real_problem,
    additional_comments,
    created_at
  FROM waitlist
  ORDER BY created_at DESC
  LIMIT limit_count;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_waitlist_stats() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_waitlist_by_problem_validation() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_recent_waitlist_signups(INT) TO authenticated, anon;
