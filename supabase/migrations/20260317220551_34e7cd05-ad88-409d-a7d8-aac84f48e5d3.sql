
-- Create pdf_settings table
CREATE TABLE public.pdf_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  logo_url text,
  primary_color text NOT NULL DEFAULT '#2563eb',
  secondary_color text NOT NULL DEFAULT '#0f172a',
  font_family text NOT NULL DEFAULT 'Inter',
  font_size_title integer NOT NULL DEFAULT 32,
  font_size_body integer NOT NULL DEFAULT 10,
  logo_position text NOT NULL DEFAULT 'center',
  header_text text,
  footer_text text,
  show_cover_page boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.pdf_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own pdf_settings" ON public.pdf_settings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own pdf_settings" ON public.pdf_settings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pdf_settings" ON public.pdf_settings
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own pdf_settings" ON public.pdf_settings
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Create pdf-logos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('pdf-logos', 'pdf-logos', true);

-- Storage RLS policies
CREATE POLICY "Users can upload own logos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pdf-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own logos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'pdf-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own logos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'pdf-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view pdf logos" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'pdf-logos');
