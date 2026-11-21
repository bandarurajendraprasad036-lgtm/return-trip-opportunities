ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_path text NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION public.guard_profile_photo_path() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
 IF NEW.photo_path<>'' AND (NEW.photo_path NOT LIKE NEW.id::text||'/%' OR NEW.photo_path LIKE '%..%') THEN RAISE EXCEPTION 'OWN_PHOTO_ONLY'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_profile_photo_path ON public.profiles;
CREATE TRIGGER guard_profile_photo_path BEFORE INSERT OR UPDATE OF photo_path ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.guard_profile_photo_path();

CREATE TABLE public.aadhaar_checks (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 path text NOT NULL,
 status text NOT NULL DEFAULT 'pending',
 name_matched boolean NOT NULL DEFAULT false,
 note text NOT NULL DEFAULT '',
 checked_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.aadhaar_checks TO authenticated;
GRANT ALL ON public.aadhaar_checks TO service_role;
ALTER TABLE public.aadhaar_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY aadhaar_owner_or_admin_read ON public.aadhaar_checks FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY profile_photo_own_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='profile-photos' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY profile_photo_own_update ON storage.objects FOR UPDATE TO authenticated USING (bucket_id='profile-photos' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY profile_photo_own_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id='profile-photos' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY profile_photo_visible_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id='profile-photos' AND ((storage.foldername(name))[1]=auth.uid()::text OR public.has_role(auth.uid(),'admin') OR EXISTS(SELECT 1 FROM public.profiles p WHERE p.id::text=(storage.foldername(name))[1] AND NOT p.hide_photo AND p.photo_path=name)));

CREATE POLICY aadhaar_own_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='aadhaar-cards' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY aadhaar_own_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id='aadhaar-cards' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY aadhaar_owner_admin_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id='aadhaar-cards' AND ((storage.foldername(name))[1]=auth.uid()::text OR public.has_role(auth.uid(),'admin')));

CREATE OR REPLACE FUNCTION public.my_incoming_bell_contacts(_section text, _post uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, source text, post_id uuid, area text, need text, other_id uuid, full_name text, phone text, photo text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
 WITH b AS (SELECT * FROM public.my_incoming_bells(_section,_post)),
 r AS (
  SELECT b.*, CASE b.source
    WHEN 'free' THEN (SELECT i.user_id FROM public.free_work_interests i WHERE i.id=b.id)
    WHEN 'post' THEN (SELECT i.user_id FROM public.post_bell_interests i WHERE i.id=b.id)
    WHEN 'vehicle' THEN (SELECT d.user_id FROM public.vehicle_bell_demands d WHERE d.id=b.id)
    WHEN 'board' THEN (SELECT pair.member_id FROM public.vehicle_demand_chat_pairs pair WHERE pair.demand_id=b.id AND pair.owner_id=auth.uid() LIMIT 1)
  END AS uid FROM b),
 a AS (SELECT public.has_role(auth.uid(),'admin') AS admin)
 SELECT r.id, r.source, r.post_id, r.area, r.need, r.uid,
   CASE WHEN p.hide_name AND NOT a.admin THEN '' ELSE coalesce(p.full_name,'') END,
   CASE WHEN p.hide_phone AND NOT a.admin THEN '' ELSE coalesce(p.phone,'') END,
   CASE WHEN p.hide_photo AND NOT a.admin THEN '' WHEN coalesce(p.photo_path,'')<>'' THEN p.photo_path WHEN p.public_photo ~ '^https://' THEN p.public_photo ELSE '' END
 FROM r CROSS JOIN a LEFT JOIN public.profiles p ON p.id=r.uid
 WHERE auth.uid() IS NOT NULL AND r.uid IS NOT NULL $function$;

CREATE OR REPLACE FUNCTION public.chat_peer_identity(_other uuid)
 RETURNS TABLE(full_name text, phone text, photo text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
 SELECT CASE WHEN p.hide_name AND NOT public.has_role(auth.uid(),'admin') THEN '' ELSE coalesce(p.full_name,'') END,
   CASE WHEN p.hide_phone AND NOT public.has_role(auth.uid(),'admin') THEN '' ELSE coalesce(p.phone,'') END,
   CASE WHEN p.hide_photo AND NOT public.has_role(auth.uid(),'admin') THEN '' WHEN coalesce(p.photo_path,'')<>'' THEN p.photo_path WHEN p.public_photo ~ '^https://' THEN p.public_photo ELSE '' END
 FROM public.profiles p
 WHERE p.id=_other AND auth.uid() IS NOT NULL AND auth.uid()<>_other
   AND (public.has_role(auth.uid(),'admin') OR public.incoming_bell_reply_allowed(_other,NULL)
        OR EXISTS(SELECT 1 FROM public.post_chat_pairs pair WHERE pair.owner_id=auth.uid() AND pair.member_id=_other)
        OR EXISTS(SELECT 1 FROM public.vehicle_bell_demands d JOIN public.posts po ON po.id=d.post_id WHERE po.user_id=auth.uid() AND d.user_id=_other)) $function$;

CREATE OR REPLACE FUNCTION public.admin_activity_feed()
 RETURNS TABLE(id uuid, message text, is_read boolean, created_at timestamptz, post_id uuid, detail text, section text, category text, post_label text, post_exists boolean, actor_id uuid, full_name text, phone text, photo text, hidden boolean)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
 SELECT n.id, n.message, n.is_read, n.created_at, n.post_id, n.detail, n.section, n.category,
  CASE WHEN po.id IS NULL THEN '' WHEN po.module='job' THEN concat_ws(' · ', nullif(coalesce(po.skill,po.title),''), nullif(po.location,'')) ELSE concat_ws(' → ', nullif(po.from_place,''), nullif(po.to_place,'')) END,
  po.id IS NOT NULL, n.actor_id, coalesce(p.full_name,''), coalesce(p.phone,''),
  CASE WHEN coalesce(p.photo_path,'')<>'' THEN p.photo_path WHEN p.public_photo ~ '^https://' THEN p.public_photo ELSE '' END,
  coalesce(p.hide_photo OR p.hide_name OR p.hide_phone,false)
 FROM public.admin_activity_notices n
 LEFT JOIN public.posts po ON po.id=n.post_id
 LEFT JOIN public.profiles p ON p.id=n.actor_id
 WHERE auth.uid() IS NOT NULL AND n.user_id=auth.uid() AND public.has_role(auth.uid(),'admin')
 ORDER BY n.created_at DESC LIMIT 200 $function$;