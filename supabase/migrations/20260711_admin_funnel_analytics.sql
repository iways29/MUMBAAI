-- =====================================================
-- ADMIN ANALYTICS: ACTIVATION FUNNEL, RETENTION COHORTS, CLIENT ERROR LOG
-- NOT YET APPLIED — review and run in the Supabase SQL Editor.
-- Backs ADMIN_CONSOLE_PRD.md §2.1 (funnel), §2.2 (cohorts), §2.5 (error feed).
-- Uses the existing public.is_admin(uuid) helper from prior migrations.
-- Created: 2026-07-11
-- =====================================================

-- ---------------------------------------------------------------
-- 1. Activation funnel: signup → verified → first conversation →
--    first message → first branch → first merge
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_activation_funnel()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied: admin only';
    END IF;

    SELECT json_build_object(
        'signed_up', (SELECT COUNT(*) FROM auth.users),
        'email_verified', (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL),
        'created_conversation', (SELECT COUNT(DISTINCT user_id) FROM public.conversations),
        'sent_message', (
            SELECT COUNT(DISTINCT c.user_id)
            FROM public.conversations c
            WHERE EXISTS (
                SELECT 1 FROM public.messages m
                WHERE m.conversation_id = c.id AND m.type = 'user'
            )
        ),
        'created_branch', (
            -- a user has branched if any of their messages has a parent with 2+ children
            SELECT COUNT(DISTINCT c.user_id)
            FROM public.conversations c
            WHERE EXISTS (
                SELECT 1
                FROM public.messages m
                WHERE m.conversation_id = c.id
                  AND m.parent_id IS NOT NULL
                GROUP BY m.parent_id
                HAVING COUNT(*) >= 2
            )
        ),
        'performed_merge', (
            SELECT COUNT(DISTINCT c.user_id)
            FROM public.conversations c
            WHERE EXISTS (
                SELECT 1 FROM public.messages m
                WHERE m.conversation_id = c.id AND m.is_merge_root = true
            )
        )
    ) INTO result;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_activation_funnel() TO authenticated;

-- ---------------------------------------------------------------
-- 2. Retention cohorts: rows = signup week, cols = D1/D7/D30
--    "Retained at D-N" = any token_usage activity N+ days after signup.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_retention_cohorts(weeks_back int DEFAULT 8)
RETURNS TABLE (
    cohort_week date,
    cohort_size bigint,
    retained_d1 bigint,
    retained_d7 bigint,
    retained_d30 bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied: admin only';
    END IF;

    RETURN QUERY
    WITH cohorts AS (
        SELECT
            u.id,
            u.created_at,
            date_trunc('week', u.created_at)::date AS week
        FROM auth.users u
        WHERE u.created_at >= NOW() - (weeks_back || ' weeks')::interval
    ),
    activity AS (
        SELECT t.user_id, t.created_at
        FROM public.token_usage t
    )
    SELECT
        c.week AS cohort_week,
        COUNT(DISTINCT c.id) AS cohort_size,
        COUNT(DISTINCT c.id) FILTER (
            WHERE EXISTS (
                SELECT 1 FROM activity a
                WHERE a.user_id = c.id AND a.created_at >= c.created_at + interval '1 day'
            )
        ) AS retained_d1,
        COUNT(DISTINCT c.id) FILTER (
            WHERE EXISTS (
                SELECT 1 FROM activity a
                WHERE a.user_id = c.id AND a.created_at >= c.created_at + interval '7 days'
            )
        ) AS retained_d7,
        COUNT(DISTINCT c.id) FILTER (
            WHERE EXISTS (
                SELECT 1 FROM activity a
                WHERE a.user_id = c.id AND a.created_at >= c.created_at + interval '30 days'
            )
        ) AS retained_d30
    FROM cohorts c
    GROUP BY c.week
    ORDER BY c.week DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_retention_cohorts(int) TO authenticated;

-- ---------------------------------------------------------------
-- 3. Client error log: turns console.error-only failures into a feed
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_errors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    error_type text NOT NULL,           -- e.g. 'save_message', 'model_fetch', 'merge'
    message text NOT NULL,
    context jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.client_errors ENABLE ROW LEVEL SECURITY;

-- Any signed-in user may report their own errors; only admins may read.
DROP POLICY IF EXISTS client_errors_insert ON public.client_errors;
CREATE POLICY client_errors_insert ON public.client_errors
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS client_errors_admin_select ON public.client_errors;
CREATE POLICY client_errors_admin_select ON public.client_errors
    FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS client_errors_created_at_idx
    ON public.client_errors (created_at DESC);

-- Feed reader (admin-gated) with user email joined in
CREATE OR REPLACE FUNCTION public.get_recent_client_errors(limit_count int DEFAULT 50)
RETURNS TABLE (
    id uuid,
    user_email text,
    error_type text,
    message text,
    context jsonb,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied: admin only';
    END IF;

    RETURN QUERY
    SELECT e.id, u.email::text, e.error_type, e.message, e.context, e.created_at
    FROM public.client_errors e
    LEFT JOIN auth.users u ON u.id = e.user_id
    ORDER BY e.created_at DESC
    LIMIT limit_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_recent_client_errors(int) TO authenticated;
