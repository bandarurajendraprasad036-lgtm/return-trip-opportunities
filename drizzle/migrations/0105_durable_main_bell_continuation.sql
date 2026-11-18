CREATE TABLE public.main_bell_runs(user_id uuid PRIMARY KEY REFERENCES public.profiles(id),requested_at timestamptz NOT NULL DEFAULT now(),completed_at timestamptz,available_at timestamptz NOT NULL DEFAULT now(),attempts integer NOT NULL DEFAULT 0,last_error text);
GRANT SELECT ON public.main_bell_runs TO authenticated;
GRANT ALL ON public.main_bell_runs TO service_role;
ALTER TABLE public.main_bell_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_main_bell_runs ON public.main_bell_runs FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE FUNCTION public.run_main_bell_batch(_user uuid) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE caller uuid:=_user; e record; t record; p record; marked integer; total integer:=0;
BEGIN
IF caller IS NULL OR auth.uid() IS DISTINCT FROM caller OR NOT public.account_allowed(caller) THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
FOR e IN SELECT * FROM public.free_work_entries WHERE user_id=caller ORDER BY id LOOP
PERFORM public.mark_free_work_category_bell(e.id);
FOR t IN SELECT l.* FROM public.list_free_work(public.free_work_opposite(e.section),e.area,e.category) l WHERE lower(trim(l.area))=lower(trim(e.area)) AND NOT EXISTS(SELECT 1 FROM public.main_bell_actions a WHERE a.user_id=caller AND a.source=l.source AND a.target_id=l.id) AND NOT ((l.source='entry' AND EXISTS(SELECT 1 FROM public.free_work_entries x WHERE x.id::text=l.id AND x.user_id=caller)) OR (l.source='post' AND EXISTS(SELECT 1 FROM public.posts x WHERE x.id::text=l.id AND x.user_id=caller)) OR (l.source='provider' AND l.id=caller::text)) ORDER BY l.source,l.id LIMIT (100-total) LOOP
INSERT INTO public.main_bell_actions VALUES(caller,t.source,t.id) ON CONFLICT DO NOTHING; GET DIAGNOSTICS marked=ROW_COUNT;
IF marked=1 THEN PERFORM public.ring_free_work(t.id,t.source,public.free_work_opposite(e.section));total:=total+1;END IF;
END LOOP;
IF total>=100 THEN RETURN total;END IF;
END LOOP;
IF public.has_paid_bell(caller) THEN
FOR p IN SELECT v.* FROM public.posts v WHERE v.module='vehicle' AND v.user_id<>caller AND public.post_listing_visible(v) AND public.account_allowed(v.user_id) AND public.bell_route_within_radius(v.id,NULL,caller) AND NOT EXISTS(SELECT 1 FROM public.main_bell_actions a WHERE a.user_id=caller AND a.source='vehicle-post' AND a.target_id=v.id::text) AND EXISTS(SELECT 1 FROM public.posts own WHERE own.user_id=caller AND own.module='vehicle' AND public.post_listing_visible(own) AND own.kind<>v.kind AND own.kind IN('owner','business') AND v.kind IN('owner','business') AND own.trip_date=v.trip_date AND lower(trim(own.from_place))=lower(trim(v.from_place)) AND lower(trim(own.to_place))=lower(trim(v.to_place)) AND lower(trim(coalesce(own.vehicle_type,'')))=lower(trim(coalesce(v.vehicle_type,'')))) ORDER BY v.id LIMIT (100-total) LOOP
INSERT INTO public.main_bell_actions VALUES(caller,'vehicle-post',p.id::text) ON CONFLICT DO NOTHING;GET DIAGNOSTICS marked=ROW_COUNT;
IF marked=1 THEN PERFORM public.ring_post(p.id);total:=total+1;END IF;
END LOOP;END IF;RETURN total;
END $$;
REVOKE ALL ON FUNCTION public.run_main_bell_batch(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.run_main_bell_batch(uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.ring_my_main_bell() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE caller uuid:=auth.uid(); n integer:=0;
BEGIN
IF caller IS NULL OR NOT public.account_allowed(caller) THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED';END IF;
INSERT INTO public.main_bell_runs(user_id) VALUES(caller) ON CONFLICT(user_id) DO UPDATE SET requested_at=now(),completed_at=NULL,available_at=now(),attempts=0,last_error=NULL;
BEGIN
n:=public.run_main_bell_batch(caller);
UPDATE public.main_bell_runs SET completed_at=CASE WHEN n<100 THEN now() ELSE NULL END WHERE user_id=caller;
EXCEPTION WHEN OTHERS THEN
UPDATE public.main_bell_runs SET available_at=now()+interval '1 minute',attempts=1,last_error='BATCH_RETRY' WHERE user_id=caller;
END;
RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.ring_my_main_bell() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ring_my_main_bell() TO authenticated;
CREATE FUNCTION public.dispatch_main_bell_runs() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE q record; n integer; total integer:=0;old_sub text:=coalesce(current_setting('request.jwt.claim.sub',true),'');old_role text:=coalesce(current_setting('request.jwt.claim.role',true),'');old_claims text:=coalesce(current_setting('request.jwt.claims',true),'');
BEGIN
IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'SERVICE_ONLY'; END IF;
FOR q IN SELECT * FROM public.main_bell_runs WHERE completed_at IS NULL AND available_at<=now() ORDER BY available_at,user_id FOR UPDATE SKIP LOCKED LIMIT 5 LOOP
BEGIN
PERFORM set_config('request.jwt.claim.sub',q.user_id::text,true);
PERFORM set_config('request.jwt.claim.role','authenticated',true);
PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',q.user_id,'role','authenticated')::text,true);
IF public.account_allowed(q.user_id) THEN n:=public.run_main_bell_batch(q.user_id);ELSE n:=0;END IF;
UPDATE public.main_bell_runs SET completed_at=CASE WHEN n<100 THEN now() ELSE NULL END,available_at=now()+interval '1 minute',attempts=0,last_error=NULL WHERE user_id=q.user_id;
total:=total+n;
EXCEPTION WHEN OTHERS THEN
UPDATE public.main_bell_runs SET attempts=attempts+1,available_at=now()+interval '5 minutes',last_error='BATCH_RETRY' WHERE user_id=q.user_id;
END;
PERFORM set_config('request.jwt.claim.sub',old_sub,true);
PERFORM set_config('request.jwt.claim.role',old_role,true);
PERFORM set_config('request.jwt.claims',old_claims,true);
END LOOP;
RETURN total;
END $$;
REVOKE ALL ON FUNCTION public.dispatch_main_bell_runs() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_main_bell_runs() TO service_role;