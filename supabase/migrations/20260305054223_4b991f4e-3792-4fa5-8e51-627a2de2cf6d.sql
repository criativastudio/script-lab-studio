CREATE TABLE public.briefing_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  business_name text NOT NULL,
  contact_name text,
  contact_email text,
  contact_whatsapp text,
  project_name text NOT NULL,
  video_quantity integer NOT NULL DEFAULT 3,
  form_answers jsonb,
  persona text,
  positioning text,
  tone_of_voice text,
  content_strategy text,
  status text NOT NULL DEFAULT 'pending',
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.briefing_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own briefing_requests" ON public.briefing_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own briefing_requests" ON public.briefing_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own briefing_requests" ON public.briefing_requests FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can delete own briefing_requests" ON public.briefing_requests FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anon can read briefing_requests by token" ON public.briefing_requests FOR SELECT TO anon
  USING (true);
CREATE POLICY "Anon can update briefing_requests by token" ON public.briefing_requests FOR UPDATE TO anon
  USING (true);