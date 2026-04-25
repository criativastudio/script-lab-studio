CREATE TABLE public.ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_token_quota bigint,
  warning_threshold_percent int NOT NULL DEFAULT 80,
  openai_enabled boolean NOT NULL DEFAULT false,
  last_check_at timestamptz,
  last_check_result jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage ai_settings"
  ON public.ai_settings
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

INSERT INTO public.ai_settings (warning_threshold_percent) VALUES (80);

CREATE TABLE public.ai_gateway_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  status_code int NOT NULL,
  message text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_gateway_errors_occurred_at ON public.ai_gateway_errors(occurred_at DESC);
CREATE INDEX idx_ai_gateway_errors_status ON public.ai_gateway_errors(status_code, occurred_at DESC);

ALTER TABLE public.ai_gateway_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read gateway errors"
  ON public.ai_gateway_errors
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));