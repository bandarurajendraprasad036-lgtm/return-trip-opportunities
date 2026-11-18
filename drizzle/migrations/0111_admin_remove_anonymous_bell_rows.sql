CREATE OR REPLACE FUNCTION public.admin_remove_bell_row(_id uuid, _source text, _section text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE removed integer;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') OR NOT public.account_allowed(auth.uid()) THEN RAISE EXCEPTION 'ADMIN_ONLY'; END IF;
 IF _source='interest' AND _section IN ('work-wanted','work-offered','service-providers','service-wanted') THEN
  DELETE FROM public.free_work_interests WHERE id=_id AND section=_section;
 ELSIF _source='vehicle' AND _section IN ('goods','returns','cars') THEN
  DELETE FROM public.vehicle_demand_chat_pairs WHERE demand_id=_id AND EXISTS(SELECT 1 FROM public.vehicle_bell_demands WHERE id=_id AND category=_section);
  DELETE FROM public.vehicle_bell_demands WHERE id=_id AND category=_section;
 ELSIF _source='post' AND _section IN ('work-wanted','work-offered','service-providers','service-wanted') THEN
  DELETE FROM public.post_bell_interests WHERE id=_id AND section=_section;
 ELSIF _source='service' AND _section='service-providers' THEN
  DELETE FROM public.service_request_pairs WHERE request_id=_id;
  DELETE FROM public.service_requests WHERE id=_id;
 ELSE RAISE EXCEPTION 'INVALID_BOARD_ROW'; END IF;
 GET DIAGNOSTICS removed=ROW_COUNT;
 RETURN removed>0;
END $$;
REVOKE ALL ON FUNCTION public.admin_remove_bell_row(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_remove_bell_row(uuid,text,text) TO authenticated;