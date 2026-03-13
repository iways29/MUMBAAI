-- =====================================================
-- ANALYTICS FUNCTIONS MIGRATION
-- Run this in Supabase SQL Editor
-- Created: 2025-03-13
-- =====================================================

-- =====================================================
-- 1. TRIGGER TO UPDATE last_active
-- Updates user's last_active when they create messages or conversations
-- =====================================================

-- Function to update last_active
CREATE OR REPLACE FUNCTION public.update_user_last_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    UPDATE public.user_profiles
    SET last_active = NOW()
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$;

-- Trigger on token_usage (fires when user makes API calls)
DROP TRIGGER IF EXISTS update_last_active_on_token_usage ON public.token_usage;
CREATE TRIGGER update_last_active_on_token_usage
    AFTER INSERT ON public.token_usage
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_last_active();

-- Trigger on conversations (fires when user creates a conversation)
DROP TRIGGER IF EXISTS update_last_active_on_conversation ON public.conversations;
CREATE TRIGGER update_last_active_on_conversation
    AFTER INSERT OR UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_last_active();


-- =====================================================
-- 2. ANALYTICS RPC FUNCTIONS (Admin only)
-- These are secure functions that only admins can call
-- Uses existing is_admin(uuid) function from your RLS policies
-- =====================================================


-- =====================================================
-- FUNCTION: Get overview stats
-- Returns: total_users, total_conversations, total_messages, total_tokens
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_admin_overview_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
STABLE
AS $$
DECLARE
    result JSON;
BEGIN
    -- Check admin access
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied: Admin only';
    END IF;

    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM public.user_profiles),
        'total_conversations', (SELECT COUNT(*) FROM public.conversations),
        'total_messages', (SELECT COUNT(*) FROM public.messages),
        'total_tokens', (SELECT COALESCE(SUM(total_tokens), 0) FROM public.token_usage)
    ) INTO result;

    RETURN result;
END;
$$;


-- =====================================================
-- FUNCTION: Get Daily Active Users (last 30 days)
-- Returns: array of {date, count}
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_daily_active_users(days_back INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
STABLE
AS $$
DECLARE
    result JSON;
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied: Admin only';
    END IF;

    SELECT json_agg(daily_stats ORDER BY date)
    INTO result
    FROM (
        SELECT
            DATE(created_at) as date,
            COUNT(DISTINCT user_id) as active_users
        FROM public.token_usage
        WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
        GROUP BY DATE(created_at)
    ) daily_stats;

    RETURN COALESCE(result, '[]'::JSON);
END;
$$;


-- =====================================================
-- FUNCTION: Get User Growth (weekly signups)
-- Returns: array of {week, new_users, cumulative_users}
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_growth(weeks_back INTEGER DEFAULT 12)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
STABLE
AS $$
DECLARE
    result JSON;
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied: Admin only';
    END IF;

    SELECT json_agg(weekly_stats ORDER BY week)
    INTO result
    FROM (
        SELECT
            DATE_TRUNC('week', created_at)::DATE as week,
            COUNT(*) as new_users,
            SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('week', created_at)) as cumulative_users
        FROM public.user_profiles
        WHERE created_at >= NOW() - (weeks_back || ' weeks')::INTERVAL
        GROUP BY DATE_TRUNC('week', created_at)
    ) weekly_stats;

    RETURN COALESCE(result, '[]'::JSON);
END;
$$;


-- =====================================================
-- FUNCTION: Get LLM Usage Distribution
-- Returns: array of {model, provider, message_count, token_count, percentage}
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_llm_usage_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
STABLE
AS $$
DECLARE
    result JSON;
    total_tokens BIGINT;
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied: Admin only';
    END IF;

    -- Get total tokens for percentage calculation
    SELECT COALESCE(SUM(total_tokens), 1) INTO total_tokens FROM public.token_usage;

    SELECT json_agg(model_stats ORDER BY token_count DESC)
    INTO result
    FROM (
        SELECT
            model,
            provider,
            COUNT(*) as message_count,
            SUM(total_tokens) as token_count,
            ROUND((SUM(total_tokens)::NUMERIC / total_tokens * 100), 2) as percentage
        FROM public.token_usage
        GROUP BY model, provider
    ) model_stats;

    RETURN COALESCE(result, '[]'::JSON);
END;
$$;


-- =====================================================
-- FUNCTION: Get Conversation Stats
-- Returns: avg messages per convo, avg tokens per convo, avg splits, avg merges
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_conversation_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
STABLE
AS $$
DECLARE
    result JSON;
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied: Admin only';
    END IF;

    SELECT json_build_object(
        'avg_messages_per_conversation', (
            SELECT ROUND(AVG(msg_count), 2)
            FROM (
                SELECT conversation_id, COUNT(*) as msg_count
                FROM public.messages
                GROUP BY conversation_id
            ) conv_msgs
        ),
        'avg_tokens_per_conversation', (
            SELECT ROUND(AVG(token_count), 2)
            FROM (
                SELECT conversation_id, SUM(total_tokens) as token_count
                FROM public.token_usage
                GROUP BY conversation_id
            ) conv_tokens
        ),
        'total_splits', (
            -- Count messages that have siblings (same parent_id)
            SELECT COUNT(*)
            FROM public.messages m1
            WHERE EXISTS (
                SELECT 1 FROM public.messages m2
                WHERE m2.parent_id = m1.parent_id
                AND m2.id != m1.id
                AND m1.parent_id IS NOT NULL
            )
        ),
        'total_merges', (
            SELECT COUNT(*) FROM public.messages WHERE is_merge_root = true
        )
    ) INTO result;

    RETURN result;
END;
$$;


-- =====================================================
-- FUNCTION: Get Per-User Stats (top users by usage)
-- Returns: array of user stats with token usage
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_usage_stats(limit_count INTEGER DEFAULT 20)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
STABLE
AS $$
DECLARE
    result JSON;
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied: Admin only';
    END IF;

    SELECT json_agg(user_stats)
    INTO result
    FROM (
        SELECT
            up.id as user_id,
            up.email,
            up.display_name,
            up.created_at as joined_at,
            up.last_active,
            COALESCE(conv_stats.conversation_count, 0) as conversation_count,
            COALESCE(token_stats.total_tokens, 0) as total_tokens,
            COALESCE(token_stats.message_count, 0) as message_count,
            -- Calculate days active (days with activity)
            COALESCE(activity_stats.days_active, 0) as days_active
        FROM public.user_profiles up
        LEFT JOIN (
            SELECT user_id, COUNT(*) as conversation_count
            FROM public.conversations
            GROUP BY user_id
        ) conv_stats ON conv_stats.user_id = up.id
        LEFT JOIN (
            SELECT user_id, SUM(total_tokens) as total_tokens, COUNT(*) as message_count
            FROM public.token_usage
            GROUP BY user_id
        ) token_stats ON token_stats.user_id = up.id
        LEFT JOIN (
            SELECT user_id, COUNT(DISTINCT DATE(created_at)) as days_active
            FROM public.token_usage
            GROUP BY user_id
        ) activity_stats ON activity_stats.user_id = up.id
        ORDER BY total_tokens DESC NULLS LAST, conversation_count DESC NULLS LAST, up.last_active DESC NULLS LAST
        LIMIT limit_count
    ) user_stats;

    RETURN COALESCE(result, '[]'::JSON);
END;
$$;


-- =====================================================
-- FUNCTION: Get Average Days Active across all users
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_avg_days_active()
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
STABLE
AS $$
DECLARE
    result JSON;
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied: Admin only';
    END IF;

    SELECT json_build_object(
        'avg_days_active', (
            SELECT ROUND(AVG(days_active), 2)
            FROM (
                SELECT user_id, COUNT(DISTINCT DATE(created_at)) as days_active
                FROM public.token_usage
                GROUP BY user_id
            ) user_activity
        ),
        'users_active_today', (
            SELECT COUNT(DISTINCT user_id)
            FROM public.token_usage
            WHERE DATE(created_at) = CURRENT_DATE
        ),
        'users_active_this_week', (
            SELECT COUNT(DISTINCT user_id)
            FROM public.token_usage
            WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)
        )
    ) INTO result;

    RETURN result;
END;
$$;


-- =====================================================
-- FUNCTION: Get Splits and Merges per Conversation
-- Returns: array of conversations with split/merge counts
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_branch_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
STABLE
AS $$
DECLARE
    result JSON;
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied: Admin only';
    END IF;

    SELECT json_build_object(
        'total_conversations', (SELECT COUNT(*) FROM public.conversations),
        'conversations_with_splits', (
            SELECT COUNT(DISTINCT conversation_id)
            FROM public.messages m1
            WHERE EXISTS (
                SELECT 1 FROM public.messages m2
                WHERE m2.parent_id = m1.parent_id
                AND m2.id != m1.id
                AND m1.parent_id IS NOT NULL
                AND m2.conversation_id = m1.conversation_id
            )
        ),
        'conversations_with_merges', (
            SELECT COUNT(DISTINCT conversation_id)
            FROM public.messages
            WHERE is_merge_root = true
        ),
        'avg_splits_per_conversation', (
            SELECT ROUND(AVG(split_count), 2)
            FROM (
                SELECT conversation_id, COUNT(*) as split_count
                FROM public.messages m1
                WHERE EXISTS (
                    SELECT 1 FROM public.messages m2
                    WHERE m2.parent_id = m1.parent_id
                    AND m2.id != m1.id
                    AND m1.parent_id IS NOT NULL
                )
                GROUP BY conversation_id
            ) splits
        ),
        'avg_merges_per_conversation', (
            SELECT ROUND(AVG(merge_count), 2)
            FROM (
                SELECT conversation_id, COUNT(*) as merge_count
                FROM public.messages
                WHERE is_merge_root = true
                GROUP BY conversation_id
            ) merges
        )
    ) INTO result;

    RETURN result;
END;
$$;


-- =====================================================
-- GRANT EXECUTE TO authenticated users
-- (RLS inside functions handles admin check)
-- =====================================================
GRANT EXECUTE ON FUNCTION public.get_admin_overview_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_active_users(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_growth(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_llm_usage_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversation_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_usage_stats(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_avg_days_active() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_branch_stats() TO authenticated;


-- =====================================================
-- VERIFICATION
-- =====================================================
-- Test these functions after running (as admin user):
-- SELECT public.get_admin_overview_stats();
-- SELECT public.get_daily_active_users(30);
-- SELECT public.get_user_growth(12);
-- SELECT public.get_llm_usage_stats();
-- SELECT public.get_conversation_stats();
-- SELECT public.get_user_usage_stats(20);
-- SELECT public.get_avg_days_active();
-- SELECT public.get_branch_stats();
