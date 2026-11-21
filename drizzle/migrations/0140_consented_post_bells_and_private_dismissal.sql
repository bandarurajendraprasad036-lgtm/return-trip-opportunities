ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS public_bell_consent boolean NOT NULL DEFAULT false;
GRANT UPDATE(public_bell_consent) ON public.profiles TO authenticated;
CREATE TABLE public.dashboard_dismissals(user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, kind text NOT NULL CHECK(kind IN('message','bell')), item_id uuid NOT NULL, source text NOT NULL DEFAULT '', PRIMARY KEY(user_id,kind,item_id,source));
GRANT SELECT ON public.dashboard_dismissals TO authenticated;
GRANT ALL ON public.dashboard_dismissals TO service_role;
ALTER TABLE public.dashboard_dismissals ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_dismissals ON public.dashboard_dismissals FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY messages_not_dismissed ON public.messages AS RESTRICTIVE FOR SELECT TO authenticated USING(NOT EXISTS(SELECT 1 FROM public.dashboard_dismissals d WHERE d.user_id=auth.uid() AND d.kind='message' AND d.item_id=messages.id));
CREATE OR REPLACE FUNCTION public.dismiss_chat_items(_other uuid DEFAULT NULL, _message uuid DEFAULT NULL, _all boolean DEFAULT false, _post uuid DEFAULT NULL) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE affected integer; BEGIN
IF auth.uid() IS NULL OR NOT public.account_allowed(auth.uid()) THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
IF (_all AND (_other IS NULL OR _message IS NOT NULL)) OR (NOT _all AND _message IS NULL) THEN RAISE EXCEPTION 'INVALID_TARGET'; END IF;
INSERT INTO public.dashboard_dismissals(user_id,kind,item_id)
SELECT auth.uid(),'message',m.id FROM public.messages m WHERE auth.uid() IN(m.sender_id,m.receiver_id) AND CASE WHEN _all THEN _other IN(m.sender_id,m.receiver_id) AND (_post IS NULL OR m.post_id=_post) ELSE m.id=_message END ON CONFLICT DO NOTHING;
GET DIAGNOSTICS affected=ROW_COUNT; RETURN affected; END $$;
REVOKE ALL ON FUNCTION public.dismiss_chat_items(uuid,uuid,boolean,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.dismiss_chat_items(uuid,uuid,boolean,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.list_post_bell_contacts(_post uuid) RETURNS TABLE(id uuid,source text,post_id uuid,area text,need text,other_id uuid,full_name text,phone text,photo text,can_delete boolean) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
WITH p AS(SELECT po.*, (po.user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) AS privileged FROM public.posts po WHERE po.id=_post AND (po.user_id=auth.uid() OR public.has_role(auth.uid(),'admin') OR public.post_listing_visible(po))),
b AS(
SELECT i.id,'free'::text AS source,p.id AS post_id,i.area,i.category AS need,i.user_id,p.privileged FROM public.free_work_interests i JOIN p ON i.source='post' AND i.entry_id=p.id::text
UNION ALL SELECT i.id,'post',p.id,i.area,i.need,i.user_id,p.privileged FROM public.post_bell_interests i JOIN p ON i.post_id=p.id
UNION ALL SELECT d.id,'vehicle',p.id,d.from_place||' → '||d.to_place,d.vehicle_type,d.user_id,p.privileged FROM public.vehicle_bell_demands d JOIN p ON d.post_id=p.id)
SELECT b.id,b.source,b.post_id,b.area,b.need,b.user_id,
CASE WHEN pr.hide_name AND NOT public.has_role(auth.uid(),'admin') THEN '' ELSE coalesce(pr.full_name,'') END,
CASE WHEN pr.hide_phone AND NOT public.has_role(auth.uid(),'admin') THEN '' ELSE coalesce(pr.phone,'') END,
CASE WHEN pr.hide_photo AND NOT public.has_role(auth.uid(),'admin') THEN '' WHEN coalesce(pr.photo_path,'')<>'' THEN pr.photo_path WHEN pr.public_photo ~ '^https://' THEN pr.public_photo ELSE '' END,
coalesce(b.privileged,false)
FROM b JOIN public.profiles pr ON pr.id=b.user_id WHERE public.account_allowed(b.user_id) AND (coalesce(b.privileged,false) OR pr.public_bell_consent) AND NOT EXISTS(SELECT 1 FROM public.dashboard_dismissals d WHERE d.user_id=auth.uid() AND d.kind='bell' AND d.item_id=b.id AND d.source=b.source) $$;
REVOKE ALL ON FUNCTION public.list_post_bell_contacts(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_post_bell_contacts(uuid) TO anon,authenticated;
CREATE OR REPLACE FUNCTION public.dismiss_incoming_bell(_id uuid,_source text,_section text,_post uuid DEFAULT NULL) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF auth.uid() IS NULL OR NOT public.account_allowed(auth.uid()) THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
IF NOT EXISTS(SELECT 1 FROM public.my_incoming_bells(_section,_post) b WHERE b.id=_id AND b.source=_source) AND NOT (_post IS NOT NULL AND EXISTS(SELECT 1 FROM public.list_post_bell_contacts(_post) b WHERE b.id=_id AND b.source=_source AND b.can_delete)) THEN RAISE EXCEPTION 'BELL_UNAVAILABLE'; END IF;
INSERT INTO public.dashboard_dismissals(user_id,kind,item_id,source) VALUES(auth.uid(),'bell',_id,_source) ON CONFLICT DO NOTHING; RETURN true; END $$;
REVOKE ALL ON FUNCTION public.dismiss_incoming_bell(uuid,text,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.dismiss_incoming_bell(uuid,text,text,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.public_bell_photo_allowed(_path text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.profiles pr WHERE pr.photo_path=_path AND pr.public_bell_consent AND NOT pr.hide_photo AND public.account_allowed(pr.id) AND EXISTS(SELECT 1 FROM public.posts po WHERE public.post_listing_visible(po) AND (EXISTS(SELECT 1 FROM public.free_work_interests i WHERE i.source='post' AND i.entry_id=po.id::text AND i.user_id=pr.id) OR EXISTS(SELECT 1 FROM public.post_bell_interests i WHERE i.post_id=po.id AND i.user_id=pr.id) OR EXISTS(SELECT 1 FROM public.vehicle_bell_demands d WHERE d.post_id=po.id AND d.user_id=pr.id)))) $$;
REVOKE ALL ON FUNCTION public.public_bell_photo_allowed(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_bell_photo_allowed(text) TO anon,authenticated;
CREATE POLICY consented_bell_photo_read ON storage.objects FOR SELECT TO anon,authenticated USING(bucket_id='profile-photos' AND public.public_bell_photo_allowed(name));