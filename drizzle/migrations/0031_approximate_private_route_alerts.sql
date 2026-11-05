CREATE TABLE public.vehicle_route_points (
 route_id uuid PRIMARY KEY REFERENCES public.vehicle_route_preferences(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 from_lat double precision NOT NULL CHECK(from_lat BETWEEN -90 AND 90), from_lng double precision NOT NULL CHECK(from_lng BETWEEN -180 AND 180),
 to_lat double precision NOT NULL CHECK(to_lat BETWEEN -90 AND 90), to_lng double precision NOT NULL CHECK(to_lng BETWEEN -180 AND 180)
);
GRANT SELECT ON public.vehicle_route_points TO authenticated;
GRANT ALL ON public.vehicle_route_points TO service_role;
ALTER TABLE public.vehicle_route_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_route_points ON public.vehicle_route_points FOR SELECT TO authenticated USING(user_id=auth.uid() AND public.account_allowed(auth.uid()));
CREATE TABLE public.vehicle_post_points (
 post_id uuid PRIMARY KEY REFERENCES public.posts(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 from_lat double precision NOT NULL CHECK(from_lat BETWEEN -90 AND 90), from_lng double precision NOT NULL CHECK(from_lng BETWEEN -180 AND 180),
 to_lat double precision NOT NULL CHECK(to_lat BETWEEN -90 AND 90), to_lng double precision NOT NULL CHECK(to_lng BETWEEN -180 AND 180),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vehicle_post_points TO authenticated;
GRANT ALL ON public.vehicle_post_points TO service_role;
ALTER TABLE public.vehicle_post_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_post_points ON public.vehicle_post_points FOR SELECT TO authenticated USING(user_id=auth.uid() AND public.account_allowed(auth.uid()));
CREATE TABLE public.approximate_route_alerts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 route_id uuid NOT NULL REFERENCES public.vehicle_route_preferences(id) ON DELETE CASCADE,
 post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
 notification_id uuid REFERENCES public.notifications(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(), processed_at timestamptz,
 UNIQUE(user_id,post_id)
);
GRANT ALL ON public.approximate_route_alerts TO service_role;
ALTER TABLE public.approximate_route_alerts ENABLE ROW LEVEL SECURITY;
CREATE INDEX approximate_route_alerts_pending ON public.approximate_route_alerts(created_at) WHERE processed_at IS NULL;
CREATE FUNCTION public.straight_line_km(a_lat double precision,a_lng double precision,b_lat double precision,b_lng double precision) RETURNS double precision LANGUAGE sql IMMUTABLE STRICT SET search_path=public AS $$
 SELECT 6371.0088 * 2 * asin(sqrt(least(1.0,power(sin(radians(b_lat-a_lat)/2),2)+cos(radians(a_lat))*cos(radians(b_lat))*power(sin(radians(b_lng-a_lng)/2),2))))
$$;
REVOKE ALL ON FUNCTION public.straight_line_km(double precision,double precision,double precision,double precision) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.straight_line_km(double precision,double precision,double precision,double precision) TO service_role;
CREATE FUNCTION public.save_vehicle_route_points(_from text,_to text,_from_lat double precision,_from_lng double precision,_to_lat double precision,_to_lng double precision) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT public.account_allowed(auth.uid()) THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
 IF _from_lat IS NULL OR _from_lng IS NULL OR _to_lat IS NULL OR _to_lng IS NULL OR NOT (_from_lat BETWEEN -90 AND 90 AND _to_lat BETWEEN -90 AND 90 AND _from_lng BETWEEN -180 AND 180 AND _to_lng BETWEEN -180 AND 180) THEN RAISE EXCEPTION 'INVALID_COORDINATES'; END IF;
 IF public.straight_line_km(_from_lat,_from_lng,_to_lat,_to_lng)<=0 THEN RAISE EXCEPTION 'DISTINCT_ENDPOINTS_REQUIRED'; END IF;
 result:=public.save_vehicle_route(_from,_to);
 INSERT INTO public.vehicle_route_points(route_id,user_id,from_lat,from_lng,to_lat,to_lng) VALUES(result,auth.uid(),_from_lat,_from_lng,_to_lat,_to_lng)
 ON CONFLICT(route_id) DO UPDATE SET from_lat=excluded.from_lat,from_lng=excluded.from_lng,to_lat=excluded.to_lat,to_lng=excluded.to_lng;
 UPDATE public.vehicle_route_preferences SET enabled=true WHERE id=result AND user_id=auth.uid();
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.save_vehicle_route_points(text,text,double precision,double precision,double precision,double precision) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_vehicle_route_points(text,text,double precision,double precision,double precision,double precision) TO authenticated;
CREATE FUNCTION public.save_vehicle_post_points(_post uuid,_from_lat double precision,_from_lng double precision,_to_lat double precision,_to_lng double precision) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.posts; radius double precision;
BEGIN
 IF auth.uid() IS NULL OR NOT public.account_allowed(auth.uid()) THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
 SELECT * INTO p FROM public.posts WHERE id=_post AND user_id=auth.uid() AND module='vehicle' FOR UPDATE;
 IF p.id IS NULL THEN RAISE EXCEPTION 'OWN_VEHICLE_POST_REQUIRED'; END IF;
 IF _from_lat IS NULL OR _from_lng IS NULL OR _to_lat IS NULL OR _to_lng IS NULL OR NOT (_from_lat BETWEEN -90 AND 90 AND _to_lat BETWEEN -90 AND 90 AND _from_lng BETWEEN -180 AND 180 AND _to_lng BETWEEN -180 AND 180) THEN RAISE EXCEPTION 'INVALID_COORDINATES'; END IF;
 radius:=public.straight_line_km(_from_lat,_from_lng,_to_lat,_to_lng)*0.20;
 IF radius<=0 THEN RAISE EXCEPTION 'DISTINCT_ENDPOINTS_REQUIRED'; END IF;
 IF EXISTS(SELECT 1 FROM public.vehicle_post_points WHERE post_id=_post) THEN RAISE EXCEPTION 'POINTS_ALREADY_REGISTERED'; END IF;
 INSERT INTO public.vehicle_post_points(post_id,user_id,from_lat,from_lng,to_lat,to_lng) VALUES(_post,auth.uid(),_from_lat,_from_lng,_to_lat,_to_lng);
 IF p.kind='owner' THEN
 INSERT INTO public.approximate_route_alerts(user_id,route_id,post_id)
 SELECT r.user_id,r.id,p.id FROM public.vehicle_route_preferences r JOIN public.vehicle_route_points g ON g.route_id=r.id AND g.user_id=r.user_id
 WHERE r.enabled AND r.user_id<>p.user_id AND public.account_allowed(r.user_id)
 AND public.straight_line_km(_from_lat,_from_lng,g.from_lat,g.from_lng)<=radius
 AND public.straight_line_km(_to_lat,_to_lng,g.to_lat,g.to_lng)<=radius
 ON CONFLICT(user_id,post_id) DO NOTHING;
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.save_vehicle_post_points(uuid,double precision,double precision,double precision,double precision) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_vehicle_post_points(uuid,double precision,double precision,double precision,double precision) TO authenticated;
CREATE FUNCTION public.dispatch_approximate_route_alerts() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE q public.approximate_route_alerts; p public.posts; own_post uuid; notice uuid; paid boolean; total integer:=0;
BEGIN
 FOR q IN SELECT * FROM public.approximate_route_alerts WHERE processed_at IS NULL ORDER BY created_at LIMIT 100 FOR UPDATE SKIP LOCKED LOOP
 SELECT * INTO p FROM public.posts WHERE id=q.post_id;
 IF p.id IS NULL OR p.status<>'active' OR NOT public.account_allowed(p.user_id) OR NOT public.account_allowed(q.user_id) OR (p.job_expires_at IS NOT NULL AND p.job_expires_at<=now()) OR (p.trip_date IS NOT NULL AND p.trip_date<(now() AT TIME ZONE 'Asia/Kolkata')::date) OR q.created_at<now()-interval '7 days' OR NOT EXISTS(SELECT 1 FROM public.vehicle_route_preferences WHERE id=q.route_id AND enabled AND user_id=q.user_id) THEN
 UPDATE public.approximate_route_alerts SET processed_at=now() WHERE id=q.id; CONTINUE;
 END IF;
 IF p.visible_after>now() THEN CONTINUE; END IF;
 PERFORM 1 FROM public.profiles WHERE id=q.user_id FOR UPDATE;
 SELECT is_prime AND prime_until>(now() AT TIME ZONE 'Asia/Kolkata')::date INTO paid FROM public.profiles WHERE id=q.user_id;
 own_post:=NULL; notice:=NULL;
 IF NOT coalesce(paid,false) THEN
 SELECT o.id INTO own_post FROM public.posts o JOIN public.post_sharing_evidence e ON e.post_id=o.id AND e.user_id=o.user_id
 JOIN public.vehicle_post_points g ON g.post_id=o.id JOIN public.vehicle_post_points v ON v.post_id=p.id
 WHERE o.user_id=q.user_id AND o.module='vehicle' AND o.kind='business' AND o.status='active' AND o.trip_date=p.trip_date AND (o.visible_after IS NULL OR o.visible_after<=now()) AND (o.job_expires_at IS NULL OR o.job_expires_at>now()) AND e.purpose='notifications' AND e.status='approved'
 AND public.straight_line_km(g.from_lat,g.from_lng,v.from_lat,v.from_lng)<=public.straight_line_km(v.from_lat,v.from_lng,v.to_lat,v.to_lng)*0.20
 AND public.straight_line_km(g.to_lat,g.to_lng,v.to_lat,v.to_lng)<=public.straight_line_km(v.from_lat,v.from_lng,v.to_lat,v.to_lng)*0.20 LIMIT 1;
 IF own_post IS NULL THEN CONTINUE; END IF;
 END IF;
 IF NOT public.can_notify(q.user_id) THEN CONTINUE; END IF;
 IF EXISTS(SELECT 1 FROM public.notifications WHERE user_id=q.user_id AND (post_id=p.id OR matched_post_id=p.id)) THEN UPDATE public.approximate_route_alerts SET processed_at=now() WHERE id=q.id; CONTINUE; END IF;
 INSERT INTO public.notifications(user_id,post_id,matched_post_id,message)
 VALUES(q.user_id,coalesce(own_post,p.id),CASE WHEN own_post IS NULL THEN NULL ELSE p.id END,'మీ భద్రపరిచిన మార్గపు ఉజ్జాయింపు 20% పరిధిలో వాహన ప్రకటన వచ్చింది; ఇది బుకింగ్ కాదు · Vehicle listing within approximate 20% endpoint radius; not a booking') RETURNING id INTO notice;
 IF notice IS NOT NULL THEN UPDATE public.approximate_route_alerts SET processed_at=now(),notification_id=notice WHERE id=q.id; total:=total+1; END IF;
 END LOOP;
 RETURN total;
END $$;
REVOKE ALL ON FUNCTION public.dispatch_approximate_route_alerts() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_approximate_route_alerts() TO service_role;
COMMENT ON TABLE public.vehicle_post_points IS 'Private user-selected coordinates, not verified road geometry or live movement. Fixed once registered.';
COMMENT ON TABLE public.vehicle_route_points IS 'Owner-only user-selected approximate endpoint data. No paid distance API.';
COMMENT ON TABLE public.approximate_route_alerts IS 'Private durable saved-route candidates; rechecks visibility, approved evidence, account status, opt-out, quiet hours and quotas. No booking/travel inference.';