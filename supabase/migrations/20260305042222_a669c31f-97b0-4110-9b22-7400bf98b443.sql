
-- Add columns to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS objective text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS platform text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Add columns to scripts
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS title text;

-- Add columns to ideas
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS status text DEFAULT 'new';

-- Add column to briefings
ALTER TABLE public.briefings ADD COLUMN IF NOT EXISTS user_id uuid;

-- Enable RLS on all 4 tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefings ENABLE ROW LEVEL SECURITY;

-- Projects RLS
CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own projects" ON public.projects FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Scripts RLS
CREATE POLICY "Users can view own scripts" ON public.scripts FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own scripts" ON public.scripts FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own scripts" ON public.scripts FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own scripts" ON public.scripts FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Ideas RLS
CREATE POLICY "Users can view own ideas" ON public.ideas FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own ideas" ON public.ideas FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ideas" ON public.ideas FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own ideas" ON public.ideas FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Briefings RLS
CREATE POLICY "Users can view own briefings" ON public.briefings FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own briefings" ON public.briefings FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own briefings" ON public.briefings FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own briefings" ON public.briefings FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Subscriptions RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
