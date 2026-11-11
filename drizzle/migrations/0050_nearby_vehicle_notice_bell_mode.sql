CREATE OR REPLACE FUNCTION public.notify_nearby_vehicles(_post uuid) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE km numeric; pt public.vehicle_post_points; n integer:=0; c integer; r record; BEGIN
 IF auth.uid() IS NULL OR NOT public.account_allowed(auth.uid()) THEN RETURN 0; END IF;
 SELECT least(greatest(coalesce(nullif(value,'')::numeric,7),0.5),50) INTO km FROM public.app_settings WHERE key='nearby_vehicle_km'; km:=coalesce(km,7);
 SELECT * INTO pt FROM public.vehicle_post_points WHERE post_id=_post; IF pt.post_id IS NULL THEN RETURN 0; END IF;
 PERFORM set_config('app.bell_notice','interest',true);
 FOR r IN SELECT DISTINCT ON (p.user_id) p.user_id, public.straight_line_km(pt.from_lat,pt.from_lng,q.from_lat,q.from_lng) d
   FROM public.vehicle_post_points q JOIN public.posts p ON p.id=q.post_id
   WHERE p.status='active' AND p.module='vehicle' AND p.kind='owner' AND p.id<>_post AND p.user_id<>auth.uid()
     AND public.straight_line_km(pt.from_lat,pt.from_lng,q.from_lat,q.from_lng)<=km LIMIT 30 LOOP
   IF public.can_notify(r.user_id) AND NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=r.user_id AND post_id=_post AND created_at>now()-interval '1 day') THEN
     INSERT INTO public.notifications(user_id,post_id,message) VALUES(r.user_id,_post,'🔔 మీ దగ్గర (సుమారు '||round(r.d::numeric,1)||' కి.మీ సరళ రేఖ) వాహనం కోసం ఒకరు అడుగుతున్నారు. ఇది బుకింగ్ కాదు.');
     GET DIAGNOSTICS c = ROW_COUNT; n:=n+c; END IF;
 END LOOP; PERFORM set_config('app.bell_notice','',true); RETURN n; END $$;