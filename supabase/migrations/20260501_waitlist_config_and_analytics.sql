-- Add app_config table for feature toggles and configuration
CREATE TABLE IF NOT EXISTS public.app_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_config_key ON public.app_config(key);

-- Enable Row Level Security (RLS)
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read config
CREATE POLICY "Admins can read config"
  ON public.app_config
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Policy: Only admins can update config
CREATE POLICY "Admins can update config"
  ON public.app_config
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Policy: Only admins can insert config
CREATE POLICY "Admins can insert config"
  ON public.app_config
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Insert default waitlist config (disabled by default)
INSERT INTO public.app_config (key, value, description)
VALUES
  ('waitlist_enabled', '{"enabled": false}'::jsonb, 'Toggle waitlist signup mode on landing page')
ON CONFLICT (key) DO NOTHING;

-- Add comment to table
COMMENT ON TABLE public.app_config IS 'Application-wide configuration and feature toggles';

---
--- WAITLIST ANALYTICS FUNCTIONS
---

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
    ROUND((COUNT(*)::NUMERIC / totals.total * 100), 1) AS percentage
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

-- Grant execute permissions to authenticated users (admin-only via RLS on the calling context)
GRANT EXECUTE ON FUNCTION get_waitlist_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_waitlist_by_use_case() TO authenticated;
GRANT EXECUTE ON FUNCTION get_waitlist_by_referral() TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_waitlist_signups(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_waitlist_daily_signups(INT) TO authenticated;
