-- =====================================================
-- BACKFILL last_active FROM EXISTING DATA
-- Run this AFTER running 20250313_analytics_functions.sql
-- =====================================================

-- Update last_active based on the most recent activity from token_usage
UPDATE public.user_profiles up
SET last_active = activity.latest_activity
FROM (
    SELECT
        user_id,
        MAX(created_at) as latest_activity
    FROM public.token_usage
    WHERE user_id IS NOT NULL
    GROUP BY user_id
) activity
WHERE up.id = activity.user_id
AND (up.last_active IS NULL OR up.last_active < activity.latest_activity);

-- For users with no token_usage, use their most recent conversation update
UPDATE public.user_profiles up
SET last_active = conv.latest_activity
FROM (
    SELECT
        user_id,
        MAX(COALESCE(updated_at, created_at)) as latest_activity
    FROM public.conversations
    WHERE user_id IS NOT NULL
    GROUP BY user_id
) conv
WHERE up.id = conv.user_id
AND up.last_active IS NULL;

-- For users with no activity at all, set last_active to their created_at
UPDATE public.user_profiles
SET last_active = created_at
WHERE last_active IS NULL;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check how many users now have last_active set:
-- SELECT COUNT(*) as total, COUNT(last_active) as with_last_active FROM user_profiles;

-- See the updated data:
-- SELECT id, email, created_at, last_active FROM user_profiles ORDER BY last_active DESC NULLS LAST LIMIT 10;
