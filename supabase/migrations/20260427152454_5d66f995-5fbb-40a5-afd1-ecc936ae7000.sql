ALTER TABLE public.briefing_requests
ADD COLUMN IF NOT EXISTS blocked_by_limit boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_briefing_requests_user_active
ON public.briefing_requests (user_id, is_active);