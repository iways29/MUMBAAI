-- =====================================================
-- USER LIMITS & TIERS SYSTEM
-- Run this in Supabase SQL Editor
-- Created: 2025-03-13
-- =====================================================

-- =====================================================
-- 1. CREATE USER_TIERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,

  -- Limits (NULL = unlimited)
  daily_token_limit INTEGER,
  monthly_token_limit INTEGER,
  daily_merge_limit INTEGER,
  requests_per_minute INTEGER DEFAULT 20,

  -- Model Access (NULL = all enabled models)
  allowed_model_ids TEXT[],

  -- Display
  color TEXT DEFAULT '#6b7280',
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one default tier allowed
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_tiers_default
  ON public.user_tiers (is_default) WHERE is_default = TRUE;

-- =====================================================
-- 2. CREATE USER_LIMITS TABLE (Per-user overrides)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE UNIQUE,
  tier_id UUID REFERENCES public.user_tiers(id) ON DELETE SET NULL,

  -- Override limits (NULL = use tier's value)
  daily_token_limit_override INTEGER,
  monthly_token_limit_override INTEGER,
  daily_merge_limit_override INTEGER,
  requests_per_minute_override INTEGER,
  allowed_model_ids_override TEXT[],

  -- Status
  is_suspended BOOLEAN DEFAULT FALSE,
  suspension_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE USER_USAGE_DAILY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_usage_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  tokens_used INTEGER DEFAULT 0,
  merges_performed INTEGER DEFAULT 0,
  requests_count INTEGER DEFAULT 0,

  UNIQUE(user_id, date)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_usage_daily_user_date
  ON public.user_usage_daily(user_id, date);

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.user_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage_daily ENABLE ROW LEVEL SECURITY;

-- User Tiers: Anyone can read, only admins can modify
DROP POLICY IF EXISTS "Anyone can view tiers" ON public.user_tiers;
CREATE POLICY "Anyone can view tiers"
  ON public.user_tiers FOR SELECT
  TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage tiers" ON public.user_tiers;
CREATE POLICY "Admins can manage tiers"
  ON public.user_tiers FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- User Limits: Users can read own, admins can manage all
DROP POLICY IF EXISTS "Users can view own limits" ON public.user_limits;
CREATE POLICY "Users can view own limits"
  ON public.user_limits FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all limits" ON public.user_limits;
CREATE POLICY "Admins can manage all limits"
  ON public.user_limits FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- User Usage Daily: Users can read/update own, admins can read all
DROP POLICY IF EXISTS "Users can view own usage" ON public.user_usage_daily;
CREATE POLICY "Users can view own usage"
  ON public.user_usage_daily FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "System can insert usage" ON public.user_usage_daily;
CREATE POLICY "System can insert usage"
  ON public.user_usage_daily FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "System can update usage" ON public.user_usage_daily;
CREATE POLICY "System can update usage"
  ON public.user_usage_daily FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Get effective limits for a user (tier + overrides merged)
CREATE OR REPLACE FUNCTION public.get_effective_user_limits(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_result JSONB;
  v_is_admin BOOLEAN;
  v_tier RECORD;
  v_limits RECORD;
BEGIN
  -- Check if user is admin (exempt from limits)
  SELECT is_admin INTO v_is_admin FROM public.user_profiles WHERE id = p_user_id;

  IF v_is_admin = TRUE THEN
    RETURN jsonb_build_object(
      'is_admin', true,
      'is_suspended', false,
      'daily_token_limit', null,
      'monthly_token_limit', null,
      'daily_merge_limit', null,
      'requests_per_minute', null,
      'allowed_model_ids', null
    );
  END IF;

  -- Get user's limits and tier
  SELECT ul.*, ut.daily_token_limit as tier_daily_token_limit,
         ut.monthly_token_limit as tier_monthly_token_limit,
         ut.daily_merge_limit as tier_daily_merge_limit,
         ut.requests_per_minute as tier_requests_per_minute,
         ut.allowed_model_ids as tier_allowed_model_ids,
         ut.name as tier_name,
         ut.display_name as tier_display_name,
         ut.color as tier_color
  INTO v_limits
  FROM public.user_limits ul
  LEFT JOIN public.user_tiers ut ON ul.tier_id = ut.id
  WHERE ul.user_id = p_user_id;

  -- If no limits record, check for default tier
  IF v_limits IS NULL THEN
    SELECT * INTO v_tier FROM public.user_tiers WHERE is_default = TRUE LIMIT 1;

    RETURN jsonb_build_object(
      'is_admin', false,
      'is_suspended', false,
      'tier_id', v_tier.id,
      'tier_name', v_tier.name,
      'tier_display_name', v_tier.display_name,
      'tier_color', v_tier.color,
      'daily_token_limit', v_tier.daily_token_limit,
      'monthly_token_limit', v_tier.monthly_token_limit,
      'daily_merge_limit', v_tier.daily_merge_limit,
      'requests_per_minute', COALESCE(v_tier.requests_per_minute, 20),
      'allowed_model_ids', v_tier.allowed_model_ids,
      'has_overrides', false
    );
  END IF;

  -- Return merged limits (overrides take precedence)
  RETURN jsonb_build_object(
    'is_admin', false,
    'is_suspended', COALESCE(v_limits.is_suspended, false),
    'suspension_reason', v_limits.suspension_reason,
    'tier_id', v_limits.tier_id,
    'tier_name', v_limits.tier_name,
    'tier_display_name', v_limits.tier_display_name,
    'tier_color', v_limits.tier_color,
    'daily_token_limit', COALESCE(v_limits.daily_token_limit_override, v_limits.tier_daily_token_limit),
    'monthly_token_limit', COALESCE(v_limits.monthly_token_limit_override, v_limits.tier_monthly_token_limit),
    'daily_merge_limit', COALESCE(v_limits.daily_merge_limit_override, v_limits.tier_daily_merge_limit),
    'requests_per_minute', COALESCE(v_limits.requests_per_minute_override, v_limits.tier_requests_per_minute, 20),
    'allowed_model_ids', COALESCE(v_limits.allowed_model_ids_override, v_limits.tier_allowed_model_ids),
    'has_overrides', (
      v_limits.daily_token_limit_override IS NOT NULL OR
      v_limits.monthly_token_limit_override IS NOT NULL OR
      v_limits.daily_merge_limit_override IS NOT NULL OR
      v_limits.requests_per_minute_override IS NOT NULL OR
      v_limits.allowed_model_ids_override IS NOT NULL
    )
  );
END;
$$;

-- Get user's current usage for today
CREATE OR REPLACE FUNCTION public.get_user_daily_usage(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_usage RECORD;
  v_monthly_tokens BIGINT;
BEGIN
  -- Get today's usage
  SELECT * INTO v_usage
  FROM public.user_usage_daily
  WHERE user_id = p_user_id AND date = CURRENT_DATE;

  -- Get monthly token usage
  SELECT COALESCE(SUM(tokens_used), 0) INTO v_monthly_tokens
  FROM public.user_usage_daily
  WHERE user_id = p_user_id
    AND date >= DATE_TRUNC('month', CURRENT_DATE);

  RETURN jsonb_build_object(
    'daily_tokens_used', COALESCE(v_usage.tokens_used, 0),
    'daily_merges_performed', COALESCE(v_usage.merges_performed, 0),
    'daily_requests_count', COALESCE(v_usage.requests_count, 0),
    'monthly_tokens_used', v_monthly_tokens
  );
END;
$$;

-- Check if user can proceed with an action
CREATE OR REPLACE FUNCTION public.check_user_can_proceed(
  p_user_id UUID,
  p_model_id TEXT DEFAULT NULL,
  p_action TEXT DEFAULT 'message', -- 'message' or 'merge'
  p_estimated_tokens INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_limits JSONB;
  v_usage JSONB;
  v_daily_token_limit INTEGER;
  v_monthly_token_limit INTEGER;
  v_daily_merge_limit INTEGER;
  v_allowed_models TEXT[];
BEGIN
  -- Get effective limits
  v_limits := public.get_effective_user_limits(p_user_id);

  -- Admin bypass
  IF (v_limits->>'is_admin')::boolean = true THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'admin');
  END IF;

  -- Check suspension
  IF (v_limits->>'is_suspended')::boolean = true THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'suspended',
      'message', COALESCE(v_limits->>'suspension_reason', 'Your account has been suspended')
    );
  END IF;

  -- Get current usage
  v_usage := public.get_user_daily_usage(p_user_id);

  -- Check model access
  IF p_model_id IS NOT NULL AND v_limits->'allowed_model_ids' IS NOT NULL THEN
    v_allowed_models := ARRAY(SELECT jsonb_array_elements_text(v_limits->'allowed_model_ids'));
    IF NOT (p_model_id = ANY(v_allowed_models)) THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'model_not_allowed',
        'message', 'You do not have access to this model'
      );
    END IF;
  END IF;

  -- Check daily token limit
  v_daily_token_limit := (v_limits->>'daily_token_limit')::integer;
  IF v_daily_token_limit IS NOT NULL THEN
    IF (v_usage->>'daily_tokens_used')::integer + p_estimated_tokens > v_daily_token_limit THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'daily_token_limit',
        'message', 'Daily token limit reached',
        'limit', v_daily_token_limit,
        'used', (v_usage->>'daily_tokens_used')::integer
      );
    END IF;
  END IF;

  -- Check monthly token limit
  v_monthly_token_limit := (v_limits->>'monthly_token_limit')::integer;
  IF v_monthly_token_limit IS NOT NULL THEN
    IF (v_usage->>'monthly_tokens_used')::integer + p_estimated_tokens > v_monthly_token_limit THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'monthly_token_limit',
        'message', 'Monthly token limit reached',
        'limit', v_monthly_token_limit,
        'used', (v_usage->>'monthly_tokens_used')::integer
      );
    END IF;
  END IF;

  -- Check merge limit
  IF p_action = 'merge' THEN
    v_daily_merge_limit := (v_limits->>'daily_merge_limit')::integer;
    IF v_daily_merge_limit IS NOT NULL THEN
      IF (v_usage->>'daily_merges_performed')::integer >= v_daily_merge_limit THEN
        RETURN jsonb_build_object(
          'allowed', false,
          'reason', 'daily_merge_limit',
          'message', 'Daily merge limit reached',
          'limit', v_daily_merge_limit,
          'used', (v_usage->>'daily_merges_performed')::integer
        );
      END IF;
    END IF;
  END IF;

  -- All checks passed
  RETURN jsonb_build_object(
    'allowed', true,
    'limits', v_limits,
    'usage', v_usage
  );
END;
$$;

-- Increment user usage
CREATE OR REPLACE FUNCTION public.increment_user_usage(
  p_user_id UUID,
  p_tokens INTEGER DEFAULT 0,
  p_is_merge BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_usage_daily (user_id, date, tokens_used, merges_performed, requests_count)
  VALUES (p_user_id, CURRENT_DATE, p_tokens, CASE WHEN p_is_merge THEN 1 ELSE 0 END, 1)
  ON CONFLICT (user_id, date) DO UPDATE SET
    tokens_used = user_usage_daily.tokens_used + p_tokens,
    merges_performed = user_usage_daily.merges_performed + CASE WHEN p_is_merge THEN 1 ELSE 0 END,
    requests_count = user_usage_daily.requests_count + 1;
END;
$$;

-- Admin function: Get user limits with usage for admin panel
CREATE OR REPLACE FUNCTION public.get_user_limits_for_admin(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_limits JSONB;
  v_usage JSONB;
  v_user_limits RECORD;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;

  v_limits := public.get_effective_user_limits(p_user_id);
  v_usage := public.get_user_daily_usage(p_user_id);

  -- Get raw user_limits record for overrides
  SELECT * INTO v_user_limits FROM public.user_limits WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'effective', v_limits,
    'usage', v_usage,
    'overrides', CASE WHEN v_user_limits IS NOT NULL THEN jsonb_build_object(
      'daily_token_limit_override', v_user_limits.daily_token_limit_override,
      'monthly_token_limit_override', v_user_limits.monthly_token_limit_override,
      'daily_merge_limit_override', v_user_limits.daily_merge_limit_override,
      'requests_per_minute_override', v_user_limits.requests_per_minute_override,
      'allowed_model_ids_override', v_user_limits.allowed_model_ids_override,
      'is_suspended', v_user_limits.is_suspended,
      'suspension_reason', v_user_limits.suspension_reason
    ) ELSE NULL END
  );
END;
$$;

-- Admin function: Get all tiers
CREATE OR REPLACE FUNCTION public.get_all_tiers()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;

  RETURN COALESCE(
    (SELECT jsonb_agg(row_to_json(t) ORDER BY t.sort_order, t.created_at)
     FROM public.user_tiers t),
    '[]'::jsonb
  );
END;
$$;

-- =====================================================
-- 6. SEED DEFAULT TIERS (Optional)
-- =====================================================

-- Insert default tiers if none exist
INSERT INTO public.user_tiers (name, display_name, description, daily_token_limit, monthly_token_limit, daily_merge_limit, requests_per_minute, color, sort_order, is_default)
SELECT 'free', 'Free', 'Free tier with basic limits', 10000, 100000, 5, 10, '#6b7280', 1, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.user_tiers WHERE name = 'free');

INSERT INTO public.user_tiers (name, display_name, description, daily_token_limit, monthly_token_limit, daily_merge_limit, requests_per_minute, color, sort_order, is_default)
SELECT 'pro', 'Pro', 'Pro tier with higher limits', 100000, 1000000, 50, 30, '#8b5cf6', 2, FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.user_tiers WHERE name = 'pro');

INSERT INTO public.user_tiers (name, display_name, description, daily_token_limit, monthly_token_limit, daily_merge_limit, requests_per_minute, color, sort_order, is_default)
SELECT 'enterprise', 'Enterprise', 'Unlimited access', NULL, NULL, NULL, 60, '#f59e0b', 3, FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.user_tiers WHERE name = 'enterprise');

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check tables created:
-- SELECT * FROM user_tiers;
-- SELECT * FROM user_limits;
-- SELECT * FROM user_usage_daily;

-- Test functions:
-- SELECT public.get_effective_user_limits('your-user-id');
-- SELECT public.check_user_can_proceed('your-user-id', 'claude-sonnet-4-20250514', 'message', 100);
