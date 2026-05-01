-- COMBINED WAITLIST SYSTEM MIGRATION
-- This replaces the two separate 20260501 files

-- ============================================
-- PART 1: CREATE WAITLIST TABLE
-- ============================================

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON public.waitlist(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.waitlist;
DROP POLICY IF EXISTS "Allow authenticated reads" ON public.waitlist;
DROP POLICY IF EXISTS "Allow service role full access" ON public.waitlist;

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

-- ============================================
-- PART 2: CREATE APP_CONFIG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.app_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);

-- Create index on key
CREATE INDEX IF NOT EXISTS idx_app_config_key ON public.app_config(key);

-- Enable RLS
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can read config" ON public.app_config;
DROP POLICY IF EXISTS "Admins can update config" ON public.app_config;
DROP POLICY IF EXISTS "Admins can insert config" ON public.app_config;

-- Policy: Allow ALL authenticated users to read config (not just admins)
-- This ensures the HomePage can fetch the waitlist_enabled setting
CREATE POLICY "Allow authenticated reads of config"
  ON public.app_config
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Policy: Only admins can update config
CREATE POLICY "Admins can update config"
  ON public.app_config
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Policy: Only admins can insert config
CREATE POLICY "Admins can insert config"
  ON public.app_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Insert default waitlist config (disabled by default)
INSERT INTO public.app_config (key, value, description)
VALUES
  ('waitlist_enabled', '{"enabled": false}'::jsonb, 'Toggle waitlist signup mode on landing page')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- PART 3: ANALYTICS FUNCTIONS
-- ============================================

-- Function: Get waitlist overview stats
CREATE OR REPLACE FUNCTION get_waitlist_stats()
RETURNS TABLE (
  total_signups BIGINT,
  beta_testers BIGINT,
  signups_today BIGINT,
  signups_this_week BIGINT,
  unique_companies BIGINT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT
    COUNT(*)::BIGINT AS total_signups,
    COUNT(*) FILTER (WHERE beta_tester = true)::BIGINT AS beta_testers,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::BIGINT AS signups_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')::BIGINT AS signups_this_week,
    COUNT(DISTINCT company) FILTER (WHERE company IS NOT NULL AND company != '')::BIGINT AS unique_companies
  FROM waitlist;
$$;

-- Function: Get waitlist breakdown by AI use case
CREATE OR REPLACE FUNCTION get_waitlist_by_use_case()
RETURNS TABLE (
  use_case TEXT,
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
    ai_use AS use_case,
    COUNT(*)::BIGINT AS count,
    ROUND((COUNT(*)::NUMERIC / NULLIF(totals.total, 0) * 100), 1) AS percentage
  FROM waitlist, totals
  GROUP BY ai_use, totals.total
  ORDER BY count DESC;
$$;

-- Function: Get waitlist breakdown by referral source
CREATE OR REPLACE FUNCTION get_waitlist_by_referral()
RETURNS TABLE (
  source TEXT,
  count BIGINT,
  percentage NUMERIC
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  WITH totals AS (
    SELECT COUNT(*) FILTER (WHERE referral_source IS NOT NULL AND referral_source != '')::NUMERIC AS total
    FROM waitlist
  )
  SELECT
    COALESCE(referral_source, 'Not specified') AS source,
    COUNT(*)::BIGINT AS count,
    ROUND((COUNT(*)::NUMERIC / NULLIF(totals.total, 0) * 100), 1) AS percentage
  FROM waitlist, totals
  WHERE referral_source IS NOT NULL AND referral_source != ''
  GROUP BY referral_source, totals.total
  ORDER BY count DESC;
$$;

-- Function: Get recent waitlist signups
CREATE OR REPLACE FUNCTION get_recent_waitlist_signups(limit_count INT DEFAULT 10)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  ai_use TEXT,
  company TEXT,
  beta_tester BOOLEAN,
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
    ai_use,
    company,
    beta_tester,
    created_at
  FROM waitlist
  ORDER BY created_at DESC
  LIMIT limit_count;
$$;

-- Function: Get daily waitlist signups (last N days)
CREATE OR REPLACE FUNCTION get_waitlist_daily_signups(days_back INT DEFAULT 14)
RETURNS TABLE (
  date DATE,
  signups BIGINT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  WITH date_series AS (
    SELECT generate_series(
      CURRENT_DATE - (days_back - 1),
      CURRENT_DATE,
      '1 day'::interval
    )::date AS date
  )
  SELECT
    ds.date,
    COALESCE(COUNT(w.id), 0)::BIGINT AS signups
  FROM date_series ds
  LEFT JOIN waitlist w ON DATE(w.created_at) = ds.date
  GROUP BY ds.date
  ORDER BY ds.date;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_waitlist_stats() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_waitlist_by_use_case() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_waitlist_by_referral() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_recent_waitlist_signups(INT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_waitlist_daily_signups(INT) TO authenticated, anon;
