
-- 1) Drop dangerous anon policies on briefing_requests
DROP POLICY IF EXISTS "Anon can read briefing_requests by token" ON public.briefing_requests;
DROP POLICY IF EXISTS "Anon can update briefing_requests by token" ON public.briefing_requests;

-- 2) Token-scoped SECURITY DEFINER RPCs for the public briefing form
CREATE OR REPLACE FUNCTION public.get_briefing_by_token(p_token text)
RETURNS TABLE (
  id uuid,
  business_name text,
  project_name text,
  video_quantity integer,
  status text,
  form_answers jsonb,
  niche text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, business_name, project_name, video_quantity, status, form_answers, niche
  FROM public.briefing_requests
  WHERE token = p_token
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.update_briefing_form_by_token(
  p_token text,
  p_form_answers jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF p_token IS NULL OR length(p_token) < 8 THEN
    RETURN false;
  END IF;
  UPDATE public.briefing_requests
  SET form_answers = p_form_answers
  WHERE token = p_token
    AND status IN ('pending', 'submitted');
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_briefing_by_token(
  p_token text,
  p_form_answers jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF p_token IS NULL OR length(p_token) < 8 THEN
    RETURN false;
  END IF;
  UPDATE public.briefing_requests
  SET form_answers = p_form_answers,
      status = 'submitted'
  WHERE token = p_token
    AND status IN ('pending', 'submitted');
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

-- Lock down EXECUTE: revoke from public/authenticated, grant only to anon (the form is public)
REVOKE ALL ON FUNCTION public.get_briefing_by_token(text) FROM PUBLIC, authenticated;
REVOKE ALL ON FUNCTION public.update_briefing_form_by_token(text, jsonb) FROM PUBLIC, authenticated;
REVOKE ALL ON FUNCTION public.submit_briefing_by_token(text, jsonb) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.get_briefing_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_briefing_form_by_token(text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_briefing_by_token(text, jsonb) TO anon, authenticated;

-- 3) Make strategic-reports bucket private
UPDATE storage.buckets SET public = false WHERE id = 'strategic-reports';

-- 4) generation_cache: explicit deny policy so RLS-enabled-no-policy lint is resolved.
--    Service role bypasses RLS, so edge functions still work.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'generation_cache' AND relnamespace = 'public'::regnamespace) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Deny all client access to generation_cache" ON public.generation_cache';
    EXECUTE 'CREATE POLICY "Deny all client access to generation_cache" ON public.generation_cache AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)';
  END IF;
END $$;

-- 5) Revoke EXECUTE on internal helper SECURITY DEFINER functions from anon/authenticated
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_client_id(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
-- has_role and get_user_client_id are still used inside RLS expressions (run as definer);
-- authenticated keeps EXECUTE so RLS policies that reference them keep working.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_client_id(uuid) TO authenticated;
