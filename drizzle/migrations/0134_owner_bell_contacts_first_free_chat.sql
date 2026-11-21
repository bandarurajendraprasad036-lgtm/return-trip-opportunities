CREATE OR REPLACE FUNCTION public.first_free_chat_available(_other uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
 SELECT auth.uid() IS NOT NULL AND NOT EXISTS(
   SELECT 1 FROM public.messages m
   WHERE m.sender_id=auth.uid() AND m.receiver_id<>_other AND NOT m.is_auto
     AND m.receiver_id IS DISTINCT FROM public.support_admin_id()
     AND NOT public.has_role(m.receiver_id,'admin')
     AND NOT public.incoming_bell_reply_allowed(m.receiver_id,NULL)
 ) $$;
REVOKE ALL ON FUNCTION public.first_free_chat_available(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.first_free_chat_available(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.can_post_chat(_post uuid DEFAULT NULL::uuid, _other uuid DEFAULT NULL::uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$ SELECT auth.uid() IS NOT NULL AND auth.uid()<>_other AND public.account_allowed(auth.uid()) AND public.account_allowed(_other) AND CASE WHEN _other=public.support_admin_id() OR public.has_role(auth.uid(),'admin') THEN true WHEN NOT public.profile_ready_for_actions(auth.uid()) THEN false WHEN public.incoming_bell_reply_allowed(_other,_post) THEN true WHEN NOT public.has_paid_bell(auth.uid()) THEN public.first_free_chat_available(_other) WHEN _post IS NULL AND public.free_work_chat(_other) THEN true WHEN _post IS NULL THEN EXISTS(SELECT 1 FROM public.bell_board_chat_pairs WHERE (member_id=auth.uid() AND owner_id=_other) OR (owner_id=auth.uid() AND member_id=_other)) OR EXISTS(SELECT 1 FROM public.vehicle_demand_chat_pairs WHERE (member_id=auth.uid() AND owner_id=_other) OR (owner_id=auth.uid() AND member_id=_other)) OR EXISTS(SELECT 1 FROM public.service_request_pairs WHERE (member_id=auth.uid() AND owner_id=_other) OR (owner_id=auth.uid() AND member_id=_other)) OR EXISTS(SELECT 1 FROM public.service_chat_pairs WHERE (member_id=auth.uid() AND owner_id=_other) OR (owner_id=auth.uid() AND member_id=_other)) OR EXISTS(SELECT 1 FROM public.messages WHERE post_id IS NULL AND ((sender_id=auth.uid() AND receiver_id=_other) OR (receiver_id=auth.uid() AND sender_id=_other))) ELSE EXISTS(SELECT 1 FROM public.post_chat_pairs WHERE post_id=_post AND ((member_id=auth.uid() AND owner_id=_other) OR (owner_id=auth.uid() AND member_id=_other))) END $function$;

CREATE OR REPLACE FUNCTION public.my_incoming_bell_contacts(_section text, _post uuid DEFAULT NULL::uuid)
RETURNS TABLE(id uuid, source text, post_id uuid, area text, need text, other_id uuid, full_name text, phone text, photo text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
 WITH b AS (SELECT * FROM public.my_incoming_bells(_section,_post)),
 r AS (
  SELECT b.*, CASE b.source
    WHEN 'free' THEN (SELECT i.user_id FROM public.free_work_interests i WHERE i.id=b.id)
    WHEN 'post' THEN (SELECT i.user_id FROM public.post_bell_interests i WHERE i.id=b.id)
    WHEN 'vehicle' THEN (SELECT d.user_id FROM public.vehicle_bell_demands d WHERE d.id=b.id)
    WHEN 'board' THEN (SELECT pair.member_id FROM public.vehicle_demand_chat_pairs pair WHERE pair.demand_id=b.id AND pair.owner_id=auth.uid() LIMIT 1)
  END AS uid FROM b)
 SELECT r.id, r.source, r.post_id, r.area, r.need, r.uid, coalesce(p.full_name,''), coalesce(p.phone,''),
   CASE WHEN p.public_photo ~ '^https://' THEN p.public_photo ELSE '' END
 FROM r LEFT JOIN public.profiles p ON p.id=r.uid
 WHERE auth.uid() IS NOT NULL AND r.uid IS NOT NULL $$;
REVOKE ALL ON FUNCTION public.my_incoming_bell_contacts(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_incoming_bell_contacts(text, uuid) TO authenticated, service_role;