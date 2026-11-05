CREATE TABLE public.vehicle_route_preferences (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 from_place text NOT NULL,
 to_place text NOT NULL,
 enabled boolean NOT NULL DEFAULT true,
 radius_percent integer NOT NULL DEFAULT 20 CHECK (radius_percent = 20),
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT route_places_valid CHECK (length(trim(from_place)) BETWEEN 1 AND 120 AND length(trim(to_place)) BETWEEN 1 AND 120)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_route_preferences TO authenticated;
GRANT ALL ON public.vehicle_route_preferences TO service_role;
ALTER TABLE public.vehicle_route_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_vehicle_routes ON public.vehicle_route_preferences TO authenticated USING (auth.uid()=user_id AND public.account_allowed(auth.uid())) WITH CHECK (auth.uid()=user_id AND public.account_allowed(auth.uid()));
CREATE UNIQUE INDEX vehicle_route_preferences_unique ON public.vehicle_route_preferences(user_id,lower(trim(from_place)),lower(trim(to_place)));
CREATE TRIGGER active_actor_guard BEFORE INSERT OR UPDATE OR DELETE ON public.vehicle_route_preferences FOR EACH ROW EXECUTE FUNCTION public.require_active_actor();
CREATE FUNCTION public.save_vehicle_route(_from text, _to text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT public.account_allowed(auth.uid()) THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
 PERFORM 1 FROM public.profiles WHERE id=auth.uid() FOR UPDATE;
 IF length(trim(_from)) NOT BETWEEN 1 AND 120 OR length(trim(_to)) NOT BETWEEN 1 AND 120 THEN RAISE EXCEPTION 'ROUTE_REQUIRED'; END IF;
 SELECT id INTO result FROM public.vehicle_route_preferences WHERE user_id=auth.uid() AND lower(trim(from_place))=lower(trim(_from)) AND lower(trim(to_place))=lower(trim(_to));
 IF result IS NOT NULL THEN RETURN result; END IF;
 IF (SELECT count(*) FROM public.vehicle_route_preferences WHERE user_id=auth.uid())>=20 THEN RAISE EXCEPTION 'ROUTE_LIMIT'; END IF;
 INSERT INTO public.vehicle_route_preferences(user_id,from_place,to_place) VALUES(auth.uid(),trim(_from),trim(_to)) RETURNING id INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.save_vehicle_route(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_vehicle_route(text,text) TO authenticated;
COMMENT ON TABLE public.vehicle_route_preferences IS 'Private consented route needs; not evidence of booking or travel. Geographic delivery requires verified route data.';