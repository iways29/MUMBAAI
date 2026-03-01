-- =====================================================
-- FIX: Add missing admin policies for user_profiles
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add UPDATE policy for admins on user_profiles
-- This allows admins to grant/revoke admin status
CREATE POLICY "Admins can update profiles"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Add DELETE policy for admins on user_profiles (future-proofing)
CREATE POLICY "Admins can delete profiles"
ON public.user_profiles
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- =====================================================
-- VERIFICATION QUERIES (run these to check)
-- =====================================================

-- Check all policies on user_profiles:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'user_profiles';

-- Check all policies on app_prompts:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'app_prompts';

-- Check all policies on app_models:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'app_models';
