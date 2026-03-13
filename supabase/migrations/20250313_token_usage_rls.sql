-- =====================================================
-- TOKEN USAGE RLS POLICIES
-- Run this in Supabase SQL Editor
-- Created: 2025-03-13
-- =====================================================

-- Enable RLS on token_usage table (if not already enabled)
ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can insert their own token usage" ON public.token_usage;
DROP POLICY IF EXISTS "Users can view their own token usage" ON public.token_usage;
DROP POLICY IF EXISTS "Admins can view all token usage" ON public.token_usage;

-- Policy: Users can insert their own token usage
CREATE POLICY "Users can insert their own token usage"
    ON public.token_usage
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own token usage
CREATE POLICY "Users can view their own token usage"
    ON public.token_usage
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: Admins can view all token usage (for analytics)
CREATE POLICY "Admins can view all token usage"
    ON public.token_usage
    FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'token_usage';

-- Check policies:
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'token_usage';
