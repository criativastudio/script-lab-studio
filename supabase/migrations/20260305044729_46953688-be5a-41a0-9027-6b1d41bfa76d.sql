
-- Create strategic_reports table
CREATE TABLE public.strategic_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_name text NOT NULL,
  target_audience text,
  objectives text,
  brand_positioning text,
  production_capacity text,
  content_references text,
  persona text,
  positioning text,
  tone_of_voice text,
  content_funnel text,
  script_ideas jsonb,
  pdf_url text,
  status text DEFAULT 'processing',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.strategic_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own reports"
  ON public.strategic_reports FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own reports"
  ON public.strategic_reports FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reports"
  ON public.strategic_reports FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own reports"
  ON public.strategic_reports FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('strategic-reports', 'strategic-reports', true);

-- Storage RLS: users can upload their own files
CREATE POLICY "Users can upload own reports"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'strategic-reports' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage RLS: users can read their own files (public bucket but RLS scoped)
CREATE POLICY "Users can read own reports"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'strategic-reports' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admins can read all
CREATE POLICY "Admins can read all reports"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'strategic-reports' AND has_role(auth.uid(), 'admin'::app_role));
