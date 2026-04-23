ALTER TABLE public.client_strategic_contexts 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;