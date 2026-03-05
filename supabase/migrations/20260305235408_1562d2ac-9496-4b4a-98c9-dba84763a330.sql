
-- Create client_content_memory table
CREATE TABLE public.client_content_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  context_id uuid NOT NULL REFERENCES public.client_strategic_contexts(id) ON DELETE CASCADE,
  script_id uuid REFERENCES public.scripts(id) ON DELETE SET NULL,
  idea_id uuid REFERENCES public.content_ideas(id) ON DELETE SET NULL,
  topic text,
  hook text,
  content_category text,
  angle text,
  was_selected boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_content_memory ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own memory" ON public.client_content_memory
  FOR SELECT USING ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own memory" ON public.client_content_memory
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own memory" ON public.client_content_memory
  FOR UPDATE USING ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own memory" ON public.client_content_memory
  FOR DELETE USING ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Add content_category to content_ideas
ALTER TABLE public.content_ideas ADD COLUMN IF NOT EXISTS content_category text;
