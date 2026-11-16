ALTER TABLE public.notifications ADD COLUMN vehicle_bell boolean NOT NULL DEFAULT false;
CREATE FUNCTION public.vehicle_bell_route(_from text,_to text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path=public AS $$ SELECT coalesce(nullif(trim(_from),''),'…')||' → '||coalesce(nullif(trim(_to),''),'…') $$;
CREATE FUNCTION public.route_only_vehicle_notice() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE p public.posts; BEGIN IF coalesce(current_setting('app.bell_notice',true),'')='interest' AND NEW.post_id IS NOT NULL THEN SELECT * INTO p FROM public.posts WHERE id=NEW.post_id AND module='vehicle'; IF p.id IS NOT NULL THEN NEW.message:=public.vehicle_bell_route(p.from_place,p.to_place); NEW.vehicle_bell:=true; END IF; END IF; RETURN NEW; END $$;
CREATE TRIGGER a_route_only_vehicle_notice BEFORE INSERT ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.route_only_vehicle_notice();
REVOKE ALL ON FUNCTION public.route_only_vehicle_notice() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.vehicle_bell_route(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.vehicle_bell_route(text,text) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.ring_vehicle_board(_demand uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE d public.vehicle_bell_demands; caller uuid:=auth.uid(); target uuid; already_rang boolean; previous text:=coalesce(current_setting('app.bell_notice',true),'');
BEGIN
IF caller IS NULL OR NOT public.account_allowed(caller) OR NOT public.has_paid_bell(caller) THEN RAISE EXCEPTION 'PAID_BELL_REQUIRED'; END IF;
SELECT * INTO d FROM public.vehicle_bell_demands WHERE id=_demand FOR UPDATE;
IF d.id IS NULL OR NOT public.account_allowed(d.user_id) THEN RAISE EXCEPTION 'DEMAND_UNAVAILABLE'; END IF;
IF d.user_id=caller THEN RETURN NULL; END IF;
SELECT EXISTS(SELECT 1 FROM public.vehicle_demand_chat_pairs WHERE demand_id=d.id AND member_id=caller AND board_rang_at IS NOT NULL) INTO already_rang;
target:=public.open_vehicle_demand_chat(d.id);
IF NOT already_rang THEN
UPDATE public.vehicle_demand_chat_pairs SET board_rang_at=now() WHERE demand_id=d.id AND member_id=caller;
PERFORM set_config('app.bell_notice','interest',true);
PERFORM 1 FROM public.profiles WHERE id=target FOR UPDATE;
INSERT INTO public.notifications(user_id,message,vehicle_bell) VALUES(target,public.vehicle_bell_route(d.from_place,d.to_place),true);
IF NOT EXISTS(SELECT 1 FROM public.messages WHERE sender_id=caller AND receiver_id=target AND post_id IS NULL) THEN INSERT INTO public.messages(sender_id,receiver_id,body) VALUES(caller,target,'హాయ్ · Hi'); END IF;
PERFORM set_config('app.bell_notice',previous,true);
END IF;
RETURN target;
END $$;
CREATE OR REPLACE FUNCTION public.get_post_details(_post uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ DECLARE p public.posts; privileged boolean; BEGIN IF NOT public.my_profile_access_ready() THEN RAISE EXCEPTION 'PROFILE_REQUIRED'; END IF; SELECT * INTO p FROM public.posts WHERE id=_post AND (user_id=auth.uid() OR public.has_role(auth.uid(),'admin') OR (public.post_listing_visible(posts) AND public.account_allowed(user_id))); IF p.id IS NULL THEN RAISE EXCEPTION 'POST_UNAVAILABLE'; END IF; privileged:=p.user_id=auth.uid() OR public.has_role(auth.uid(),'admin'); IF p.module='vehicle' AND NOT privileged THEN RETURN jsonb_build_object('goods_type',p.goods_type,'capacity_tons',p.capacity_tons,'trip_date',p.trip_date,'vehicle_name',p.vehicle_name,'description',NULL,'vehicle_number',NULL,'driver_name',NULL,'contact_phone',NULL,'public_brand','','public_photo',''); END IF; RETURN jsonb_build_object('description',p.description,'goods_type',p.goods_type,'capacity_tons',p.capacity_tons,'trip_date',p.trip_date,'vehicle_name',CASE WHEN p.module='vehicle' THEN p.vehicle_name ELSE NULL END,'vehicle_number',CASE WHEN p.module='vehicle' THEN p.vehicle_number ELSE NULL END,'driver_name',CASE WHEN p.module='vehicle' AND p.show_contact THEN p.driver_name ELSE NULL END,'contact_phone',CASE WHEN p.show_contact THEN p.contact_phone ELSE NULL END,'public_brand',CASE WHEN p.show_contact THEN p.public_brand ELSE '' END,'public_photo',CASE WHEN p.show_contact AND p.public_photo ~ '^https://' THEN p.public_photo ELSE '' END); END $$;
COMMENT ON COLUMN public.notifications.vehicle_bell IS 'Route-only explicit vehicle interest; render non-data hidden identity placeholders. Not a delivery receipt or booking.';
COMMENT ON FUNCTION public.get_post_details(uuid) IS 'Vehicle subscription enables chat and bell only: ordinary viewers never receive vehicle identity or free-text description; owner/admin history and consented work/service details are preserved.';