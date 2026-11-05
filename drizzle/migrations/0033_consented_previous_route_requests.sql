CREATE FUNCTION public.follow_vehicle_route(_post uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.posts; g public.vehicle_post_points; result uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT public.account_allowed(auth.uid()) THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
 SELECT * INTO p FROM public.posts WHERE id=_post AND module='vehicle' AND status='active' AND (visible_after IS NULL OR visible_after<=now()) AND public.account_allowed(user_id);
 SELECT * INTO g FROM public.vehicle_post_points WHERE post_id=p.id;
 IF p.id IS NULL OR g.post_id IS NULL THEN RAISE EXCEPTION 'ROUTE_COORDINATES_UNAVAILABLE'; END IF;
 result:=public.save_vehicle_route_points(p.from_place,p.to_place,g.from_lat,g.from_lng,g.to_lat,g.to_lng);
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.follow_vehicle_route(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.follow_vehicle_route(uuid) TO authenticated;