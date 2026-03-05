
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own record" ON public.users FOR SELECT TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage users" ON public.users FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
