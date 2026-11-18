CREATE TABLE public.main_bell_actions(user_id uuid NOT NULL REFERENCES public.profiles(id),source text NOT NULL,target_id text NOT NULL,PRIMARY KEY(user_id,source,target_id));
GRANT SELECT ON public.main_bell_actions TO authenticated; GRANT ALL ON public.main_bell_actions TO service_role;
ALTER TABLE public.main_bell_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_main_bell_actions ON public.main_bell_actions FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE FUNCTION public.ring_my_main_bell() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE caller uuid:=auth.uid(); e record; t record; p record; marked integer; total integer:=0;
BEGIN
IF caller IS NULL OR NOT public.account_allowed(caller) THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
FOR e IN SELECT * FROM public.free_work_entries WHERE user_id=caller LOOP
PERFORM public.mark_free_work_category_bell(e.id);
FOR t IN SELECT * FROM public.list_free_work(public.free_work_opposite(e.section),e.area,e.category) LOOP
IF (t.source='entry' AND EXISTS(SELECT 1 FROM public.free_work_entries WHERE id::text=t.id AND user_id=caller)) OR (t.source='post' AND EXISTS(SELECT 1 FROM public.posts WHERE id::text=t.id AND user_id=caller)) OR (t.source='provider' AND t.id=caller::text) THEN CONTINUE; END IF;
INSERT INTO public.main_bell_actions VALUES(caller,t.source,t.id) ON CONFLICT DO NOTHING; GET DIAGNOSTICS marked=ROW_COUNT;
IF marked=1 THEN PERFORM public.ring_free_work(t.id,t.source,public.free_work_opposite(e.section)); total:=total+1; END IF;
END LOOP; END LOOP;
IF public.has_paid_bell(caller) THEN
FOR p IN SELECT v.* FROM public.posts v WHERE v.module='vehicle' AND v.user_id<>caller AND public.post_listing_visible(v) AND public.account_allowed(v.user_id) AND public.bell_route_within_radius(v.id,NULL,caller) AND EXISTS(SELECT 1 FROM public.posts own WHERE own.user_id=caller AND own.module='vehicle' AND public.post_listing_visible(own) AND own.kind<>v.kind AND own.kind IN('owner','business') AND v.kind IN('owner','business') AND own.trip_date=v.trip_date AND lower(trim(own.from_place))=lower(trim(v.from_place)) AND lower(trim(own.to_place))=lower(trim(v.to_place)) AND lower(trim(coalesce(own.vehicle_type,'')))=lower(trim(coalesce(v.vehicle_type,'')))) LOOP
INSERT INTO public.main_bell_actions VALUES(caller,'vehicle-post',p.id::text) ON CONFLICT DO NOTHING; GET DIAGNOSTICS marked=ROW_COUNT;
IF marked=1 THEN PERFORM public.ring_post(p.id); total:=total+1; END IF;
END LOOP; END IF;
RETURN total;
END $$;
REVOKE ALL ON FUNCTION public.ring_my_main_bell() FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.ring_my_main_bell() TO authenticated;