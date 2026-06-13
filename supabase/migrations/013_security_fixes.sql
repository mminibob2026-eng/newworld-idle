-- Migration 013: Fix Supabase security warnings
-- 1. Set search_path on all custom functions
-- 2. Revoke public execute on handle_new_user (trigger-only)
-- 3. Tighten game-assets bucket policy

-- Fix function search paths using ALTER (preserves existing signatures)
ALTER FUNCTION public.increment_counter(UUID, TEXT, INTEGER) SET search_path = public;
ALTER FUNCTION public.calculate_xp_for_level(INTEGER) SET search_path = public;
ALTER FUNCTION public.process_offline_activity(UUID, TEXT) SET search_path = public;
ALTER FUNCTION public.transfer_to_storage(UUID, TEXT, BIGINT) SET search_path = public;
ALTER FUNCTION public.get_active_activities(UUID) SET search_path = public;

-- Recreate handle_new_user with search_path (SECURITY DEFINER is needed for trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Revoke direct execute on handle_new_user from anon and authenticated
-- (it should only be called by the auth trigger, not via API)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- Mark calculate_xp_for_level as IMMUTABLE (it was defined without it)
-- Note: We can't change return type via ALTER, so we recreate it
CREATE OR REPLACE FUNCTION public.calculate_xp_for_level(level INTEGER)
RETURNS BIGINT
LANGUAGE plpgsql
IMMUTABLE STRICT SET search_path = public
AS $$
BEGIN
  RETURN FLOOR(100 * POWER(level, 1.5))::BIGINT;
END;
$$;

-- Tighten game-assets bucket: replace broad SELECT with targeted policy
DROP POLICY IF EXISTS public_read_game_assets ON storage.objects;
CREATE POLICY "public_read_game_assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'game-assets');