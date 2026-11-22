CREATE OR REPLACE FUNCTION public.admin_login_email_for_phone(_phone text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.email::text FROM public.profiles p JOIN auth.users u ON u.id = p.id
  WHERE right(regexp_replace(coalesce(p.phone,''),'\D','','g'),10) = right(regexp_replace(coalesce(_phone,''),'\D','','g'),10)
    AND length(regexp_replace(coalesce(_phone,''),'\D','','g')) >= 10
    AND public.has_role(p.id,'admin')
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.admin_login_email_for_phone(text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_login_email_for_phone(text) TO anon, authenticated;