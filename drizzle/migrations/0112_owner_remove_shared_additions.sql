CREATE OR REPLACE FUNCTION public.my_manageable_additions()
RETURNS TABLE(id uuid,source text,section text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT id,'interest'::text,section FROM public.free_work_interests WHERE user_id=auth.uid()
 UNION ALL SELECT id,'vehicle',category FROM public.vehicle_bell_demands WHERE user_id=auth.uid()
 UNION ALL SELECT id,'post',section FROM public.post_bell_interests WHERE user_id=auth.uid()
 UNION ALL SELECT id,'category',section FROM public.discovery_categories WHERE created_by=auth.uid()
 UNION ALL SELECT id,'entry',section FROM public.free_work_entries WHERE user_id=auth.uid()
 UNION ALL SELECT id,'listing',CASE WHEN module='vehicle' THEN 'vehicle' ELSE 'work' END FROM public.posts WHERE user_id=auth.uid()
$$;
REVOKE ALL ON FUNCTION public.my_manageable_additions() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.my_manageable_additions() TO authenticated;
CREATE OR REPLACE FUNCTION public.remove_my_addition(_id uuid,_source text,_section text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE admin boolean; removed integer;
BEGIN
 IF auth.uid() IS NULL OR NOT public.account_allowed(auth.uid()) THEN RAISE EXCEPTION 'ACCOUNT_REQUIRED'; END IF;
 admin:=public.has_role(auth.uid(),'admin');
 IF NOT admin AND NOT EXISTS(SELECT 1 FROM public.my_manageable_additions() a WHERE a.id=_id AND a.source=_source AND a.section=_section) THEN RAISE EXCEPTION 'OWNER_ONLY'; END IF;
 IF admin AND _source IN ('interest','vehicle','post','service') THEN RETURN public.admin_remove_bell_row(_id,_source,_section); END IF;
 IF _source='category' THEN DELETE FROM public.discovery_categories WHERE id=_id AND section=_section AND (admin OR created_by=auth.uid());
 ELSIF _source='entry' THEN
 DELETE FROM public.free_work_notice_queue WHERE subscription_id=_id AND EXISTS(SELECT 1 FROM public.free_work_entries WHERE id=_id AND section=_section AND (admin OR user_id=auth.uid()));
 DELETE FROM public.free_work_interests WHERE entry_id=_id::text AND source='category' AND EXISTS(SELECT 1 FROM public.free_work_entries WHERE id=_id AND section=_section AND (admin OR user_id=auth.uid()));
 DELETE FROM public.free_work_entries WHERE id=_id AND section=_section AND (admin OR user_id=auth.uid());
 ELSIF _source='interest' THEN DELETE FROM public.free_work_interests WHERE id=_id AND section=_section AND user_id=auth.uid();
 ELSIF _source='vehicle' THEN
 DELETE FROM public.vehicle_demand_chat_pairs WHERE demand_id=_id;
 DELETE FROM public.vehicle_bell_demands WHERE id=_id AND category=_section AND user_id=auth.uid();
 ELSIF _source='post' THEN DELETE FROM public.post_bell_interests WHERE id=_id AND section=_section AND user_id=auth.uid();
 ELSIF _source='listing' THEN DELETE FROM public.posts WHERE id=_id AND (admin OR user_id=auth.uid());
 ELSE RAISE EXCEPTION 'INVALID_ADDITION'; END IF;
 GET DIAGNOSTICS removed=ROW_COUNT;RETURN removed>0;
END $$;
REVOKE ALL ON FUNCTION public.remove_my_addition(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.remove_my_addition(uuid,text,text) TO authenticated;