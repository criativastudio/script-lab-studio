
-- Create client_strategic_contexts table
CREATE TABLE public.client_strategic_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_name text NOT NULL,
  business_niche text,
  products_services text,
  target_audience text,
  customer_persona text,
  tone_of_voice text,
  market_positioning text,
  pain_points text,
  differentiators text,
  marketing_objectives text,
  main_platforms text[] DEFAULT '{}',
  communication_style text,
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, business_name)
);

ALTER TABLE public.client_strategic_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contexts" ON public.client_strategic_contexts FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own contexts" ON public.client_strategic_contexts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own contexts" ON public.client_strategic_contexts FOR UPDATE USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can delete own contexts" ON public.client_strategic_contexts FOR DELETE USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Create content_ideas table
CREATE TABLE public.content_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  context_id uuid REFERENCES public.client_strategic_contexts(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.content_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ideas" ON public.content_ideas FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own ideas" ON public.content_ideas FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own ideas" ON public.content_ideas FOR UPDATE USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can delete own ideas" ON public.content_ideas FOR DELETE USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Alter projects table with new columns
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS campaign_objective text,
  ADD COLUMN IF NOT EXISTS funnel_stage text,
  ADD COLUMN IF NOT EXISTS content_style text,
  ADD COLUMN IF NOT EXISTS publishing_frequency text,
  ADD COLUMN IF NOT EXISTS video_count integer,
  ADD COLUMN IF NOT EXISTS context_id uuid REFERENCES public.client_strategic_contexts(id) ON DELETE SET NULL;

-- Trigger for updated_at on client_strategic_contexts
CREATE TRIGGER update_client_strategic_contexts_updated_at
  BEFORE UPDATE ON public.client_strategic_contexts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
