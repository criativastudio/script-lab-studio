-- Restrict authenticated SELECT on briefing_requests to owners or admins.
-- The previous "USING (true)" leaked all briefings (including contact PII) to any logged-in user.
DROP POLICY IF EXISTS "Users can view own briefing_requests" ON public.briefing_requests;

CREATE POLICY "Users can view own briefing_requests"
  ON public.briefing_requests
  FOR SELECT
  TO authenticated
  USING ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));