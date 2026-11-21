CREATE OR REPLACE FUNCTION public.post_edit_fields(_post uuid)
 RETURNS TABLE(description text, contact_phone text, driver_name text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT coalesce(p.description,''), coalesce(p.contact_phone,''), coalesce(p.driver_name,'') FROM public.posts p
 WHERE p.id=_post AND auth.uid() IS NOT NULL AND (p.user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) $$;
REVOKE ALL ON FUNCTION public.post_edit_fields(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.post_edit_fields(uuid) TO authenticated;