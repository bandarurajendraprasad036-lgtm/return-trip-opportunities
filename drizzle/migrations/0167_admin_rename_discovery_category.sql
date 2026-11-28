CREATE OR REPLACE FUNCTION public.admin_rename_discovery_category(_id uuid, _name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE old_name text; old_section text; clean text := trim(_name);
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') OR NOT public.account_allowed(auth.uid()) THEN RAISE EXCEPTION 'ADMIN_ONLY'; END IF;
 IF clean IS NULL OR length(clean) < 2 OR length(clean) > 40 THEN RAISE EXCEPTION 'INVALID_NAME'; END IF;
 SELECT name, section INTO old_name, old_section FROM public.discovery_categories WHERE id=_id FOR UPDATE;
 IF old_name IS NULL THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM public.discovery_categories WHERE section=old_section AND normalized_name=lower(clean) AND id<>_id) THEN RAISE EXCEPTION 'CATEGORY_EXISTS'; END IF;
 UPDATE public.discovery_categories SET name=clean WHERE id=_id;
 -- Keep existing bells under the renamed category so nobody's entry is lost.
 UPDATE public.free_work_entries SET category=clean WHERE section=old_section AND lower(trim(category))=lower(trim(old_name));
 UPDATE public.free_work_interests SET category=clean WHERE section=old_section AND lower(trim(category))=lower(trim(old_name));
 RETURN true;
END $function$;
REVOKE ALL ON FUNCTION public.admin_rename_discovery_category(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_rename_discovery_category(uuid,text) TO authenticated, service_role;