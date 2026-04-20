ALTER TABLE public.diagnostic_leads
  ADD COLUMN IF NOT EXISTS pipeline_stage text NOT NULL DEFAULT 'cold',
  ADD COLUMN IF NOT EXISTS contacted_at timestamptz,
  ADD COLUMN IF NOT EXISTS stage_updated_at timestamptz NOT NULL DEFAULT now();

CREATE POLICY "Admins update diagnostic leads"
  ON public.diagnostic_leads FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

ALTER TABLE public.diagnostic_leads REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.diagnostic_leads;