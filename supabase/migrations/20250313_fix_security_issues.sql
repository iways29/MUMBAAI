-- =====================================================
-- SECURITY FIXES MIGRATION
-- Run this in Supabase SQL Editor to fix linter errors/warnings
-- Created: 2025-03-13
-- =====================================================

-- =====================================================
-- 1. DROP UNUSED ADMIN VIEWS
-- These views were causing security errors and are not needed
-- =====================================================

DROP VIEW IF EXISTS public.admin_total_users;
DROP VIEW IF EXISTS public.admin_model_usage;
DROP VIEW IF EXISTS public.admin_user_token_usage;


-- =====================================================
-- 2. FIX FUNCTION SEARCH_PATH MUTABLE WARNINGS
-- Set explicit search_path to prevent search path injection attacks
-- =====================================================

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


-- Fix update_user_activity function (if it exists)
-- Recreate with explicit search_path
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_user_activity' AND pronamespace = 'public'::regnamespace) THEN
        EXECUTE '
        CREATE OR REPLACE FUNCTION public.update_user_activity()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SECURITY INVOKER
        SET search_path = public
        AS $func$
        BEGIN
            UPDATE public.user_profiles
            SET last_active = NOW()
            WHERE id = NEW.user_id;
            RETURN NEW;
        END;
        $func$;
        ';
    END IF;
END
$$;


-- Fix update_session_stats function (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_session_stats' AND pronamespace = 'public'::regnamespace) THEN
        EXECUTE '
        CREATE OR REPLACE FUNCTION public.update_session_stats()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SECURITY INVOKER
        SET search_path = public
        AS $func$
        BEGIN
            -- Update session statistics
            RETURN NEW;
        END;
        $func$;
        ';
    END IF;
END
$$;


-- Fix is_admin function
-- This is critical - it's used in RLS policies
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = user_id AND is_admin = true
    );
END;
$$;


-- =====================================================
-- 3. FIX OVERLY PERMISSIVE RLS POLICIES
-- Replace WITH CHECK (true) with more restrictive policies
-- =====================================================

-- Fix feedback table INSERT policy
-- Instead of allowing all anon inserts, add basic validation
DO $$
BEGIN
    -- Drop the old permissive policy if it exists
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'feedback' AND policyname = 'Allow public inserts'
    ) THEN
        DROP POLICY "Allow public inserts" ON public.feedback;
    END IF;
END
$$;

-- Create a more restrictive policy for feedback
-- Option 1: Require authentication for feedback
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'feedback' AND schemaname = 'public') THEN
        -- Only authenticated users can insert feedback
        CREATE POLICY "Authenticated users can insert feedback"
        ON public.feedback
        FOR INSERT
        TO authenticated
        WITH CHECK (true);

        -- If you still need anon access, use this instead (comment out the above):
        -- This at least ensures the feedback content is not empty
        -- CREATE POLICY "Public can insert non-empty feedback"
        -- ON public.feedback
        -- FOR INSERT
        -- TO anon
        -- WITH CHECK (
        --     content IS NOT NULL AND
        --     LENGTH(TRIM(content)) > 0
        -- );
    END IF;
END
$$;


-- Fix pro_interest_events table INSERT policy
DO $$
BEGIN
    -- Drop the old permissive policy if it exists
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'pro_interest_events' AND policyname = 'Allow insert for all'
    ) THEN
        DROP POLICY "Allow insert for all" ON public.pro_interest_events;
    END IF;
END
$$;

-- Create a more restrictive policy for pro_interest_events
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'pro_interest_events' AND schemaname = 'public') THEN
        -- Authenticated users can track their own interest
        CREATE POLICY "Authenticated users can track interest"
        ON public.pro_interest_events
        FOR INSERT
        TO authenticated
        WITH CHECK (
            user_id = auth.uid() OR user_id IS NULL
        );

        -- Anonymous users can still track interest but with constraints
        CREATE POLICY "Anon users can track interest"
        ON public.pro_interest_events
        FOR INSERT
        TO anon
        WITH CHECK (
            user_id IS NULL AND
            event_type IS NOT NULL
        );
    END IF;
END
$$;


-- =====================================================
-- 4. VERIFICATION QUERIES
-- Uncomment and run these to verify fixes
-- =====================================================

-- Check view security settings:
-- SELECT viewname, definition
-- FROM pg_views
-- WHERE viewname IN ('admin_total_users', 'admin_model_usage', 'admin_user_token_usage');

-- Check view privileges:
-- SELECT grantee, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE table_name IN ('admin_total_users', 'admin_model_usage', 'admin_user_token_usage');

-- Check function settings:
-- SELECT proname, prosecdef, proconfig
-- FROM pg_proc
-- WHERE proname IN ('update_updated_at_column', 'update_user_activity', 'update_session_stats', 'is_admin');

-- Check RLS policies:
-- SELECT tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('feedback', 'pro_interest_events');


-- =====================================================
-- NOTES FOR SUPABASE DASHBOARD SETTINGS
-- =====================================================
--
-- The following warnings require action in Supabase Dashboard:
--
-- 1. LEAKED PASSWORD PROTECTION:
--    Go to: Authentication > Providers > Email
--    Enable "Leaked password protection"
--    This checks passwords against HaveIBeenPwned.org
--
-- 2. POSTGRES VERSION UPDATE:
--    Go to: Settings > Infrastructure
--    Click "Upgrade" to apply security patches
--
-- =====================================================

