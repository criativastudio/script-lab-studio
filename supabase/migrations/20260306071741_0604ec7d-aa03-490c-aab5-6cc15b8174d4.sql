
-- Usage logs table
CREATE TABLE public.usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  generation_type text NOT NULL,
  tokens_used integer DEFAULT 0,
  prompt_hash text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_usage_logs_user_month ON public.usage_logs (user_id, created_at);
CREATE INDEX idx_usage_logs_prompt_hash ON public.usage_logs (prompt_hash);
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" ON public.usage_logs FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Generation cache table
CREATE TABLE public.generation_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_hash text UNIQUE NOT NULL,
  function_name text NOT NULL,
  response_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);
CREATE INDEX idx_cache_hash ON public.generation_cache (prompt_hash);
ALTER TABLE public.generation_cache ENABLE ROW LEVEL SECURITY;
