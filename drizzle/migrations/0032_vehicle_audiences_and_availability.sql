CREATE TABLE public.vehicle_availability (
 post_id uuid PRIMARY KEY REFERENCES public.posts(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, available boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vehicle_availability TO authenticated;
GRANT ALL ON public.vehicle_availability TO service_role;
ALTER TABLE public.vehicle_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_vehicle_availability ON public.vehicle_availability FOR SELECT TO authenticated USING(user_id=auth.uid() AND public.account_allowed(auth.uid()));
CREATE TABLE public.vehicle_availability_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), notified_at timestamptz, UNIQUE(user_id,post_id)
);
GRANT SELECT,DELETE ON public.vehicle_availability_requests TO authenticated;
GRANT ALL ON public.vehicle_availability_requests TO service_role;
ALTER TABLE public.vehicle_availability_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_vehicle_availability_requests ON public.vehicle_availability_requests TO authenticated USING(user_id=auth.uid() AND public.account_allowed(auth.uid())) WITH CHECK(user_id=auth.uid() AND public.account_allowed(auth.uid()));
CREATE TRIGGER active_actor_guard BEFORE INSERT OR UPDATE OR DELETE ON public.vehicle_availability_requests FOR EACH ROW EXECUTE FUNCTION public.require_active_actor();
CREATE FUNCTION public.vehicle_alert_context(_user uuid,_target uuid) RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE result uuid; p public.posts;
BEGIN
 IF NOT public.account_allowed(_user) THEN RETURN NULL; END IF;
 SELECT * INTO p FROM public.posts WHERE id=_target AND module='vehicle' AND status='active' AND (visible_after IS NULL OR visible_after<=now()) AND (job_expires_at IS NULL OR job_expires_at>now()) AND public.account_allowed(user_id);
 IF p.id IS NULL THEN RETURN NULL; END IF;
 IF EXISTS(SELECT 1 FROM public.profiles WHERE id=_user AND is_prime AND prime_until>(now() AT TIME ZONE 'Asia/Kolkata')::date) THEN RETURN p.id; END IF;
 SELECT o.id INTO result FROM public.posts o JOIN public.post_sharing_evidence e ON e.post_id=o.id AND e.user_id=o.user_id JOIN public.vehicle_post_points g ON g.post_id=o.id JOIN public.vehicle_post_points v ON v.post_id=p.id
 WHERE o.user_id=_user AND o.module='vehicle' AND o.kind IN('business','owner') AND o.status='active' AND o.trip_date=p.trip_date AND (o.visible_after IS NULL OR o.visible_after<=now()) AND (o.job_expires_at IS NULL OR o.job_expires_at>now()) AND e.purpose='notifications' AND e.status='approved'
 AND public.straight_line_km(g.from_lat,g.from_lng,v.from_lat,v.from_lng)<=public.straight_line_km(v.from_lat,v.from_lng,v.to_lat,v.to_lng)*0.20
 AND public.straight_line_km(g.to_lat,g.to_lng,v.to_lat,v.to_lng)<=public.straight_line_km(v.from_lat,v.from_lng,v.to_lat,v.to_lng)*0.20 LIMIT 1;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.vehicle_alert_context(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.vehicle_alert_context(uuid,uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.save_vehicle_post_points(_post uuid,_from_lat double precision,_from_lng double precision,_to_lat double precision,_to_lng double precision) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.posts; radius double precision;
BEGIN
 IF auth.uid() IS NULL OR NOT public.account_allowed(auth.uid()) THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
 SELECT * INTO p FROM public.posts WHERE id=_post AND user_id=auth.uid() AND module='vehicle' FOR UPDATE;
 IF p.id IS NULL THEN RAISE EXCEPTION 'OWN_VEHICLE_POST_REQUIRED'; END IF;
 IF _from_lat IS NULL OR _from_lng IS NULL OR _to_lat IS NULL OR _to_lng IS NULL OR NOT(_from_lat BETWEEN -90 AND 90 AND _to_lat BETWEEN -90 AND 90 AND _from_lng BETWEEN -180 AND 180 AND _to_lng BETWEEN -180 AND 180) THEN RAISE EXCEPTION 'INVALID_COORDINATES'; END IF;
 radius:=public.straight_line_km(_from_lat,_from_lng,_to_lat,_to_lng)*0.20;
 IF radius<=0 THEN RAISE EXCEPTION 'DISTINCT_ENDPOINTS_REQUIRED'; END IF;
 IF EXISTS(SELECT 1 FROM public.vehicle_post_points WHERE post_id=_post) THEN RAISE EXCEPTION 'POINTS_ALREADY_REGISTERED'; END IF;
 INSERT INTO public.vehicle_post_points(post_id,user_id,from_lat,from_lng,to_lat,to_lng) VALUES(_post,auth.uid(),_from_lat,_from_lng,_to_lat,_to_lng);
 INSERT INTO public.vehicle_availability(post_id,user_id,available) VALUES(_post,auth.uid(),false) ON CONFLICT DO NOTHING;
 INSERT INTO public.approximate_route_alerts(user_id,route_id,post_id)
 SELECT r.user_id,r.id,p.id FROM public.vehicle_route_preferences r JOIN public.vehicle_route_points g ON g.route_id=r.id AND g.user_id=r.user_id
 WHERE r.enabled AND r.user_id<>p.user_id AND public.account_allowed(r.user_id)
 AND public.straight_line_km(_from_lat,_from_lng,g.from_lat,g.from_lng)<=radius
 AND public.straight_line_km(_to_lat,_to_lng,g.to_lat,g.to_lng)<=radius ON CONFLICT(user_id,post_id) DO NOTHING;
END $$;
CREATE FUNCTION public.request_vehicle_availability(_post uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT public.account_allowed(auth.uid()) THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.posts WHERE id=_post AND module='vehicle' AND kind='owner' AND status='active' AND user_id<>auth.uid() AND (visible_after IS NULL OR visible_after<=now()) AND trip_date>=(now() AT TIME ZONE 'Asia/Kolkata')::date AND public.account_allowed(user_id)) THEN RAISE EXCEPTION 'POST_UNAVAILABLE'; END IF;
 PERFORM 1 FROM public.profiles WHERE id=auth.uid() FOR UPDATE;
 INSERT INTO public.vehicle_availability_requests(user_id,post_id) VALUES(auth.uid(),_post) ON CONFLICT(user_id,post_id) DO UPDATE SET user_id=excluded.user_id RETURNING id INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.request_vehicle_availability(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.request_vehicle_availability(uuid) TO authenticated;
CREATE FUNCTION public.set_vehicle_available(_post uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.account_allowed(auth.uid()) THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.posts WHERE id=_post AND user_id=auth.uid() AND module='vehicle' AND kind='owner' AND status='active' AND trip_date=(now() AT TIME ZONE 'Asia/Kolkata')::date AND (visible_after IS NULL OR visible_after<=now())) THEN RAISE EXCEPTION 'OWN_VISIBLE_TODAY_POST_REQUIRED'; END IF;
 INSERT INTO public.vehicle_availability(post_id,user_id,available) VALUES(_post,auth.uid(),true) ON CONFLICT(post_id) DO UPDATE SET available=true,updated_at=now() WHERE vehicle_availability.user_id=auth.uid();
END $$;
REVOKE ALL ON FUNCTION public.set_vehicle_available(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_vehicle_available(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.dispatch_approximate_route_alerts() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE q public.approximate_route_alerts; p public.posts; own_post uuid; notice uuid; total integer:=0; g public.vehicle_route_points; v public.vehicle_post_points;
BEGIN
 FOR q IN SELECT * FROM public.approximate_route_alerts WHERE processed_at IS NULL ORDER BY created_at LIMIT 100 FOR UPDATE SKIP LOCKED LOOP
 SELECT * INTO p FROM public.posts WHERE id=q.post_id;
 IF p.id IS NULL OR p.status<>'active' OR NOT public.account_allowed(p.user_id) OR NOT public.account_allowed(q.user_id) OR (p.job_expires_at IS NOT NULL AND p.job_expires_at<=now()) OR p.trip_date<(now() AT TIME ZONE 'Asia/Kolkata')::date OR NOT EXISTS(SELECT 1 FROM public.vehicle_route_preferences WHERE id=q.route_id AND enabled AND user_id=q.user_id) THEN UPDATE public.approximate_route_alerts SET processed_at=now() WHERE id=q.id; CONTINUE; END IF;
 SELECT * INTO g FROM public.vehicle_route_points WHERE route_id=q.route_id AND user_id=q.user_id;
 SELECT * INTO v FROM public.vehicle_post_points WHERE post_id=q.post_id;
 IF g.route_id IS NULL OR v.post_id IS NULL OR public.straight_line_km(g.from_lat,g.from_lng,v.from_lat,v.from_lng)>public.straight_line_km(v.from_lat,v.from_lng,v.to_lat,v.to_lng)*0.20 OR public.straight_line_km(g.to_lat,g.to_lng,v.to_lat,v.to_lng)>public.straight_line_km(v.from_lat,v.from_lng,v.to_lat,v.to_lng)*0.20 THEN UPDATE public.approximate_route_alerts SET processed_at=now() WHERE id=q.id; CONTINUE; END IF;
 PERFORM 1 FROM public.profiles WHERE id=q.user_id FOR UPDATE;
 own_post:=public.vehicle_alert_context(q.user_id,q.post_id); notice:=NULL;
 IF own_post IS NULL OR NOT public.can_notify(q.user_id) THEN CONTINUE; END IF;
 IF EXISTS(SELECT 1 FROM public.notifications WHERE user_id=q.user_id AND (post_id=p.id OR matched_post_id=p.id)) THEN UPDATE public.approximate_route_alerts SET processed_at=now() WHERE id=q.id; CONTINUE; END IF;
 INSERT INTO public.notifications(user_id,post_id,matched_post_id,message) VALUES(q.user_id,own_post,CASE WHEN own_post=p.id THEN NULL ELSE p.id END,'మీ కోరిన మార్గపు ఉజ్జాయింపు 20% పరిధిలో కొత్త వాహన సమాచారం వచ్చింది; ఇది బుకింగ్ కాదు · New vehicle route information within approximate 20% endpoint radius; not a booking') RETURNING id INTO notice;
 IF notice IS NOT NULL THEN UPDATE public.approximate_route_alerts SET processed_at=now(),notification_id=notice WHERE id=q.id; total:=total+1; END IF;
 END LOOP;
 RETURN total;
END $$;
CREATE FUNCTION public.dispatch_vehicle_availability() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE q public.vehicle_availability_requests; context_post uuid; notice uuid; total integer:=0;
BEGIN
 FOR q IN SELECT r.* FROM public.vehicle_availability_requests r JOIN public.vehicle_availability a ON a.post_id=r.post_id AND a.available JOIN public.posts p ON p.id=r.post_id AND p.status='active' AND p.trip_date=(now() AT TIME ZONE 'Asia/Kolkata')::date WHERE r.notified_at IS NULL ORDER BY r.created_at LIMIT 100 FOR UPDATE OF r SKIP LOCKED LOOP
 PERFORM 1 FROM public.profiles WHERE id=q.user_id FOR UPDATE;
 context_post:=public.vehicle_alert_context(q.user_id,q.post_id);notice:=NULL;
 IF context_post IS NULL OR NOT public.can_notify(q.user_id) THEN CONTINUE; END IF;
 INSERT INTO public.notifications(user_id,post_id,matched_post_id,message) VALUES(q.user_id,context_post,CASE WHEN context_post=q.post_id THEN NULL ELSE q.post_id END,'మీరు సూచన కోరిన వాహనం అందుబాటులో ఉందని యజమాని తెలిపారు; బుకింగ్ నిర్ధారణ కాదు · Owner marked the requested vehicle available; not a confirmed booking') RETURNING id INTO notice;
 IF notice IS NOT NULL THEN UPDATE public.vehicle_availability_requests SET notified_at=now() WHERE id=q.id;total:=total+1; END IF;
 END LOOP;RETURN total;
END $$;
REVOKE ALL ON FUNCTION public.dispatch_vehicle_availability() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_vehicle_availability() TO service_role;
CREATE FUNCTION public.request_own_bell_notice(_device uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE notice uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT public.account_allowed(auth.uid()) THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
 PERFORM 1 FROM public.profiles WHERE id=auth.uid() FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND phone~'^[6-9][0-9]{9}$') THEN RAISE EXCEPTION 'MOBILE_REQUIRED'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.push_devices WHERE id=_device AND user_id=auth.uid()) THEN RAISE EXCEPTION 'DEVICE_REQUIRED'; END IF;
 IF NOT public.can_notify(auth.uid()) THEN RAISE EXCEPTION 'NOTIFICATION_PREFERENCES'; END IF;
 INSERT INTO public.notifications(user_id,message) VALUES(auth.uid(),'గాయత్రి వన్ గంటను నొక్కి ఈ ఫోన్‌కు సూచన కోరారు · You requested a bell notification on this device') RETURNING id INTO notice;
 DELETE FROM public.push_deliveries WHERE notification_id=notice AND device_id<>_device;
 RETURN notice;
END $$;
REVOKE ALL ON FUNCTION public.request_own_bell_notice(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.request_own_bell_notice(uuid) TO authenticated;
COMMENT ON TABLE public.vehicle_availability_requests IS 'Explicit owner-private availability notification requests, not bookings or completed travel.';
COMMENT ON TABLE public.vehicle_availability IS 'Owner-declared availability, never synthesized from a date or movement.';