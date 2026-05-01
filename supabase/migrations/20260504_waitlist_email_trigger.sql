-- Migration: Add email trigger for waitlist signups
-- This will automatically send a welcome email when someone joins the waitlist

-- Enable the http extension to make HTTP requests from PostgreSQL
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Create a function to call the edge function
CREATE OR REPLACE FUNCTION send_waitlist_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
  payload JSONB;
BEGIN
  -- Get the Supabase project URL and service role key from environment
  -- You'll need to set these as environment variables or update them here
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-waitlist-email';
  service_role_key := current_setting('app.settings.supabase_service_role_key', true);

  -- Build the payload
  payload := jsonb_build_object('record', row_to_json(NEW));

  -- Make async HTTP request to edge function
  PERFORM
    extensions.http((
      'POST',
      function_url,
      ARRAY[
        extensions.http_header('Authorization', 'Bearer ' || service_role_key),
        extensions.http_header('Content-Type', 'application/json')
      ],
      'application/json',
      payload::text
    ));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires after INSERT on waitlist table
DROP TRIGGER IF EXISTS waitlist_email_trigger ON public.waitlist;
CREATE TRIGGER waitlist_email_trigger
  AFTER INSERT ON public.waitlist
  FOR EACH ROW
  EXECUTE FUNCTION send_waitlist_welcome_email();

-- Add comment
COMMENT ON FUNCTION send_waitlist_welcome_email() IS 'Automatically sends welcome email to new waitlist signups via Edge Function';
