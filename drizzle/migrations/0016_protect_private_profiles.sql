DROP POLICY IF EXISTS "profiles readable by signed in" ON public.profiles;
CREATE POLICY "profiles owner or admin read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT ON public.profiles TO authenticated;
CREATE OR REPLACE FUNCTION public.support_admin_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT user_id FROM public.user_roles WHERE role = 'admin' AND auth.uid() IS NOT NULL ORDER BY id LIMIT 1 $$;
REVOKE ALL ON FUNCTION public.support_admin_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.support_admin_id() TO authenticated;