CREATE OR REPLACE FUNCTION public.my_incoming_bells(_section text, _post uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, source text, post_id uuid, area text, need text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 SELECT i.id,'free'::text,CASE WHEN i.source='post' THEN p.id ELSE NULL::uuid END,i.area,i.category FROM public.free_work_interests i LEFT JOIN public.posts p ON i.source='post' AND p.id::text=i.entry_id WHERE auth.uid() IS NOT NULL AND public.account_allowed(auth.uid()) AND (CASE WHEN i.source='post' AND p.id IS NOT NULL THEN CASE WHEN p.service_type='service' THEN CASE WHEN p.kind='seeker' THEN 'service-wanted' ELSE 'service-providers' END ELSE CASE WHEN p.kind='seeker' THEN 'work-wanted' ELSE 'work-offered' END END ELSE i.section END)=_section AND i.user_id<>auth.uid() AND public.account_allowed(i.user_id) AND (_post IS NULL OR p.id=_post) AND (p.user_id=auth.uid() OR (i.source='entry' AND EXISTS(SELECT 1 FROM public.free_work_entries e WHERE e.id::text=i.entry_id AND e.user_id=auth.uid())) OR (i.source='provider' AND i.entry_id=auth.uid()::text) OR (i.source='interest' AND EXISTS(SELECT 1 FROM public.free_work_interests original WHERE original.id::text=i.entry_id AND original.user_id=auth.uid())))
 UNION ALL SELECT i.id,'post',p.id,i.area,i.need FROM public.post_bell_interests i JOIN public.posts p ON p.id=i.post_id WHERE p.user_id=auth.uid() AND public.account_allowed(auth.uid()) AND public.account_allowed(i.user_id) AND i.section=_section AND (_post IS NULL OR p.id=_post)
 UNION ALL SELECT d.id,'vehicle',p.id,d.from_place||' → '||d.to_place,d.vehicle_type FROM public.vehicle_bell_demands d JOIN public.posts p ON p.id=d.post_id WHERE p.user_id=auth.uid() AND public.account_allowed(auth.uid()) AND public.account_allowed(d.user_id) AND d.category=_section AND (_post IS NULL OR p.id=_post)
 UNION ALL SELECT d.id,'board',NULL::uuid,d.from_place||' → '||d.to_place,d.vehicle_type FROM public.vehicle_bell_demands d JOIN public.vehicle_demand_chat_pairs pair ON pair.demand_id=d.id WHERE pair.owner_id=auth.uid() AND pair.board_rang_at IS NOT NULL AND public.account_allowed(auth.uid()) AND public.account_allowed(pair.member_id) AND d.category=_section AND _post IS NULL;
$function$;

-- Chat header identity: only the post owner who received a genuine bell from this person (or an admin) sees their name, phone and photo.
CREATE OR REPLACE FUNCTION public.chat_peer_identity(_other uuid)
RETURNS TABLE(full_name text, phone text, photo text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
 SELECT coalesce(p.full_name,''), coalesce(p.phone,''), CASE WHEN p.public_photo ~ '^https://' THEN p.public_photo ELSE '' END
 FROM public.profiles p
 WHERE p.id=_other AND auth.uid() IS NOT NULL AND auth.uid()<>_other
   AND (public.has_role(auth.uid(),'admin') OR public.incoming_bell_reply_allowed(_other,NULL)
        OR EXISTS(SELECT 1 FROM public.post_chat_pairs pair WHERE pair.owner_id=auth.uid() AND pair.member_id=_other)
        OR EXISTS(SELECT 1 FROM public.vehicle_bell_demands d JOIN public.posts po ON po.id=d.post_id WHERE po.user_id=auth.uid() AND d.user_id=_other)) $$;
REVOKE ALL ON FUNCTION public.chat_peer_identity(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chat_peer_identity(uuid) TO authenticated, service_role;