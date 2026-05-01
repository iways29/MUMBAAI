-- Debug script: Run this in Supabase SQL Editor to check waitlist setup

-- 1. Check if app_config table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'app_config'
) as app_config_exists;

-- 2. Check if waitlist_enabled config exists
SELECT * FROM public.app_config WHERE key = 'waitlist_enabled';

-- 3. Check if you're an admin (replace with your user ID)
SELECT is_admin(auth.uid()) as am_i_admin;

-- 4. Check if waitlist table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'waitlist'
) as waitlist_exists;

-- 5. Count waitlist signups
SELECT COUNT(*) as total_signups FROM public.waitlist;
