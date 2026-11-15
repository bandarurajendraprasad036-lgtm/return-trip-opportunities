CREATE FUNCTION public.ring_vehicle_board(_demand uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE d public.vehicle_bell_demands; caller uuid:=auth.uid(); target uuid; existed boolean; previous text:=coalesce(current_setting('app.bell_notice',true),'');
BEGIN
IF caller IS NULL OR NOT public.account_allowed(caller) OR NOT public.has_paid_bell(caller) THEN RAISE EXCEPTION 'PAID_BELL_REQUIRED'; END IF;
SELECT * INTO d FROM public.vehicle_bell_demands WHERE id=_demand FOR UPDATE;
IF d.id IS NULL OR NOT public.account_allowed(d.user_id) THEN RAISE EXCEPTION 'DEMAND_UNAVAILABLE'; END IF;
IF d.user_id=caller THEN RETURN NULL; END IF;
SELECT EXISTS(SELECT 1 FROM public.vehicle_demand_chat_pairs WHERE demand_id=d.id AND member_id=caller) INTO existed;
target:=public.open_vehicle_demand_chat(d.id);
IF NOT existed THEN
PERFORM set_config('app.bell_notice','interest',true);
PERFORM 1 FROM public.profiles WHERE id=target FOR UPDATE;
INSERT INTO public.notifications(user_id,message) VALUES(target,'మీ వాహన అవసరం గంటను ఒకరు నొక్కారు; సంభాషణలో స్పందించండి.');
IF NOT EXISTS(SELECT 1 FROM public.messages WHERE sender_id=caller AND receiver_id=target AND post_id IS NULL) THEN
INSERT INTO public.messages(sender_id,receiver_id,body) VALUES(caller,target,'హాయ్ · Hi');
END IF;
PERFORM set_config('app.bell_notice',previous,true);
END IF;
RETURN target;
END $$;
REVOKE ALL ON FUNCTION public.ring_vehicle_board(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ring_vehicle_board(uuid) TO authenticated;
COMMENT ON FUNCTION public.ring_vehicle_board(uuid) IS 'Explicit anonymous vehicle demand bell creates the existing paid private pair and one owner-only interest notice. Plain chat remains silent; notification guards retain consent, receipt eligibility, quota and deferred dispatch.';