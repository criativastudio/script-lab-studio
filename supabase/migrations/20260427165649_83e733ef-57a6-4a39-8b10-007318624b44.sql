ALTER TABLE public.scripts
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS score jsonb,
  ADD COLUMN IF NOT EXISTS validation jsonb;