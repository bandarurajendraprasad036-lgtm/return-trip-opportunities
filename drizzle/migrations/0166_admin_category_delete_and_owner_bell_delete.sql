INSERT INTO public.discovery_categories (section, name, created_by)
SELECT s.section, c.name,
  COALESCE((SELECT user_id FROM public.user_roles WHERE role = 'admin' LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid)
FROM (VALUES ('work-wanted'), ('work-offered'), ('service-providers'), ('service-wanted')) AS s(section)
CROSS JOIN (VALUES
  ('ప్లంబర్'),
  ('ఎలక్ట్రీషియన్'),
  ('షాప్ కీపర్'),
  ('సాఫ్ట్వేర్ ఇంజనీర్'),
  ('డ్రైవర్'),
  ('మేస్త్రీ'),
  ('పెయింటర్'),
  ('కార్పెంటర్')
) AS c(name)
ON CONFLICT (section, normalized_name) DO NOTHING;

CREATE OR REPLACE FUNCTION public.my_manageable_additions()
 RETURNS TABLE(id uuid, source text, section text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 SELECT id,'interest'::text,section FROM public.free_work_interests WHERE user_id=auth.uid()
 UNION ALL SELECT id,'vehicle',category FROM public.vehicle_bell_demands WHERE user_id=auth.uid()
 UNION ALL SELECT id,'post',section FROM public.post_bell_interests WHERE user_id=auth.uid()
 UNION ALL SELECT id,'entry',section FROM public.free_work_entries WHERE user_id=auth.uid()
 UNION ALL SELECT id,'service','service-providers' FROM public.service_requests WHERE user_id=auth.uid()
 UNION ALL SELECT id,'listing',CASE WHEN module='vehicle' THEN 'vehicle' ELSE 'work' END FROM public.posts WHERE user_id=auth.uid()
$function$;

CREATE OR REPLACE FUNCTION public.admin_remove_bell_row(_id uuid, _source text, _section text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE removed integer;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') OR NOT public.account_allowed(auth.uid()) THEN RAISE EXCEPTION 'ADMIN_ONLY'; END IF;
 IF _source='interest' AND _section IN ('work-wanted','work-offered','service-providers','service-wanted') THEN
  DELETE FROM public.free_work_interests WHERE id=_id AND section=_section;
 ELSIF _source='vehicle' AND _section IN ('goods','returns','cars') THEN
  DELETE FROM public.vehicle_demand_chat_pairs WHERE demand_id=_id AND EXISTS(SELECT 1 FROM public.vehicle_bell_demands WHERE id=_id AND category=_section);
  DELETE FROM public.vehicle_bell_demands WHERE id=_id AND category=_section;
 ELSIF _source='post' AND _section IN ('goods','returns','cars','work-wanted','work-offered','service-providers','service-wanted') THEN
  DELETE FROM public.post_bell_interests WHERE id=_id AND section=_section;
 ELSIF _source='service' AND _section='service-providers' THEN
  DELETE FROM public.service_request_pairs WHERE request_id=_id;
  DELETE FROM public.service_requests WHERE id=_id;
 ELSE RAISE EXCEPTION 'INVALID_BOARD_ROW'; END IF;
 GET DIAGNOSTICS removed=ROW_COUNT;
 RETURN removed>0;
END $function$;

CREATE OR REPLACE FUNCTION public.remove_my_addition(_id uuid, _source text, _section text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE admin boolean; removed integer;
BEGIN
 IF auth.uid() IS NULL OR NOT public.account_allowed(auth.uid()) THEN RAISE EXCEPTION 'ACCOUNT_REQUIRED'; END IF;
 admin:=public.has_role(auth.uid(),'admin');
 IF _source='category' THEN
  IF NOT admin THEN RAISE EXCEPTION 'ADMIN_ONLY'; END IF;
  DELETE FROM public.discovery_categories WHERE id=_id AND section=_section;
  GET DIAGNOSTICS removed=ROW_COUNT;
  RETURN removed>0;
 END IF;
 IF NOT admin AND NOT EXISTS(SELECT 1 FROM public.my_manageable_additions() a WHERE a.id=_id AND a.source=_source AND a.section=_section) THEN RAISE EXCEPTION 'OWNER_ONLY'; END IF;
 IF admin AND _source IN ('interest','vehicle','post','service') THEN RETURN public.admin_remove_bell_row(_id,_source,_section); END IF;
 IF _source='entry' THEN
  DELETE FROM public.free_work_notice_queue WHERE subscription_id=_id AND EXISTS(SELECT 1 FROM public.free_work_entries WHERE id=_id AND section=_section AND (admin OR user_id=auth.uid()));
  DELETE FROM public.free_work_interests WHERE entry_id=_id::text AND source='category' AND EXISTS(SELECT 1 FROM public.free_work_entries WHERE id=_id AND section=_section AND (admin OR user_id=auth.uid()));
  DELETE FROM public.free_work_entries WHERE id=_id AND section=_section AND (admin OR user_id=auth.uid());
 ELSIF _source='interest' THEN DELETE FROM public.free_work_interests WHERE id=_id AND section=_section AND user_id=auth.uid();
 ELSIF _source='vehicle' THEN
  DELETE FROM public.vehicle_demand_chat_pairs WHERE demand_id=_id;
  DELETE FROM public.vehicle_bell_demands WHERE id=_id AND category=_section AND user_id=auth.uid();
 ELSIF _source='post' THEN DELETE FROM public.post_bell_interests WHERE id=_id AND section=_section AND user_id=auth.uid();
 ELSIF _source='service' THEN
  DELETE FROM public.service_request_pairs WHERE request_id=_id;
  DELETE FROM public.service_requests WHERE id=_id AND user_id=auth.uid();
 ELSIF _source='listing' THEN DELETE FROM public.posts WHERE id=_id AND (admin OR user_id=auth.uid());
 ELSE RAISE EXCEPTION 'INVALID_ADDITION'; END IF;
 GET DIAGNOSTICS removed=ROW_COUNT;
 RETURN removed>0;
END $function$;