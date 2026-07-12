-- =====================================================
-- DELETE OWN ACCOUNT
-- NOT YET APPLIED — review and run in the Supabase SQL Editor.
-- Required by the Profile page's danger zone (PROFILE_PRD.md §2/§3):
-- account deletion cannot be done from the client with the anon key alone.
-- Created: 2026-07-11
-- =====================================================

-- Deletes the calling user's own data and auth record. SECURITY DEFINER so it
-- can remove the auth.users row; scoped strictly to auth.uid() so a user can
-- only ever delete themselves.
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    uid uuid := auth.uid();
BEGIN
    IF uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- App data. Messages/node_positions cascade from conversations if FKs are
    -- ON DELETE CASCADE; delete explicitly anyway to be safe.
    DELETE FROM public.node_positions WHERE user_id = uid;
    DELETE FROM public.messages WHERE conversation_id IN (
        SELECT id FROM public.conversations WHERE user_id = uid
    );
    DELETE FROM public.conversations WHERE user_id = uid;
    DELETE FROM public.token_usage WHERE user_id = uid;
    DELETE FROM public.pro_interest_events WHERE user_id = uid;

    -- Limits/usage rows if present (tables from 20250313_user_limits.sql)
    DELETE FROM public.user_usage_daily WHERE user_id = uid;
    DELETE FROM public.user_limits WHERE user_id = uid;

    -- Profile row
    DELETE FROM public.user_profiles WHERE id = uid;

    -- Finally the auth record itself
    DELETE FROM auth.users WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_own_account() FROM public;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
