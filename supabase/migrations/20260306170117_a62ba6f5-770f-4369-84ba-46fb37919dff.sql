DROP POLICY "Users can view own briefing_requests" ON public.briefing_requests;

CREATE POLICY "Users can view own briefing_requests"
ON public.briefing_requests
FOR SELECT
TO authenticated
USING (true);