ALTER TABLE public.admin_activity_notices ADD COLUMN IF NOT EXISTS actor_id uuid, ADD COLUMN IF NOT EXISTS post_id uuid, ADD COLUMN IF NOT EXISTS detail text NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hide_photo boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS hide_name boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS hide_phone boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.notice_admin_activity()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE actor uuid; label text; pid uuid; info text := '';
BEGIN
 IF TG_TABLE_NAME='messages' THEN
  actor:=NEW.sender_id; label:='కొత్త సందేశం నమోదైంది'; pid:=NEW.post_id;
 ELSIF TG_TABLE_NAME='posts' THEN
  actor:=NEW.user_id; label:='కొత్త ప్రకటన నమోదైంది'; pid:=NEW.id;
  info := CASE WHEN NEW.module='job' THEN concat_ws(' · ', nullif(coalesce(NEW.skill,NEW.title),''), nullif(NEW.location,'')) ELSE concat_ws(' → ', nullif(NEW.from_place,''), nullif(NEW.to_place,'')) END;
 ELSIF TG_TABLE_NAME='free_work_interests' THEN
  actor:=NEW.user_id; label:='ప్రకటనకు గంట నమోదైంది';
  IF NEW.source='post' AND NEW.entry_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN pid:=NEW.entry_id::uuid; END IF;
  info := concat_ws(' · ', nullif(NEW.category,''), nullif(NEW.area,''));
 ELSIF TG_TABLE_NAME='vehicle_bell_demands' THEN
  actor:=NEW.user_id; label:='ప్రకటనకు గంట నమోదైంది'; pid:=NEW.post_id;
  info := concat_ws(' · ', nullif(concat_ws(' → ', nullif(NEW.from_place,''), nullif(NEW.to_place,'')),''), nullif(NEW.vehicle_type,''));
 ELSE
  actor:=NEW.user_id; label:='ప్రకటనకు గంట నమోదైంది'; pid:=NEW.post_id;
  info := concat_ws(' · ', nullif(NEW.need,''), nullif(NEW.area,''));
 END IF;
 INSERT INTO public.admin_activity_notices(user_id,message,actor_id,post_id,detail)
 SELECT user_id,label,actor,pid,coalesce(info,'') FROM public.user_roles WHERE role='admin' AND user_id<>actor;
 RETURN NEW;
END $function$;

-- Backfill earlier bell notices from the matching bell record (same second window).
UPDATE public.admin_activity_notices n SET actor_id=f.user_id,
  post_id=CASE WHEN f.source='post' AND f.entry_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN f.entry_id::uuid END,
  detail=concat_ws(' · ', nullif(f.category,''), nullif(f.area,''))
FROM public.free_work_interests f
WHERE n.actor_id IS NULL AND n.message='ప్రకటనకు గంట నమోదైంది' AND f.user_id<>n.user_id AND abs(extract(epoch FROM (f.created_at-n.created_at)))<2;
UPDATE public.admin_activity_notices n SET actor_id=d.user_id, post_id=d.post_id,
  detail=concat_ws(' · ', nullif(concat_ws(' → ', nullif(d.from_place,''), nullif(d.to_place,'')),''), nullif(d.vehicle_type,''))
FROM public.vehicle_bell_demands d
WHERE n.actor_id IS NULL AND n.message='ప్రకటనకు గంట నమోదైంది' AND d.user_id<>n.user_id AND abs(extract(epoch FROM (d.rang_at-n.created_at)))<2;

CREATE OR REPLACE FUNCTION public.admin_activity_feed()
 RETURNS TABLE(id uuid, message text, is_read boolean, created_at timestamptz, post_id uuid, detail text, post_label text, post_exists boolean, actor_id uuid, full_name text, phone text, photo text, hidden boolean)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
 SELECT n.id, n.message, n.is_read, n.created_at, n.post_id, n.detail,
  CASE WHEN po.id IS NULL THEN '' WHEN po.module='job' THEN concat_ws(' · ', nullif(coalesce(po.skill,po.title),''), nullif(po.location,'')) ELSE concat_ws(' → ', nullif(po.from_place,''), nullif(po.to_place,'')) END,
  po.id IS NOT NULL, n.actor_id, coalesce(p.full_name,''), coalesce(p.phone,''),
  CASE WHEN p.public_photo ~ '^https://' THEN p.public_photo ELSE '' END,
  coalesce(p.hide_photo OR p.hide_name OR p.hide_phone,false)
 FROM public.admin_activity_notices n
 LEFT JOIN public.posts po ON po.id=n.post_id
 LEFT JOIN public.profiles p ON p.id=n.actor_id
 WHERE auth.uid() IS NOT NULL AND n.user_id=auth.uid() AND public.has_role(auth.uid(),'admin')
 ORDER BY n.created_at DESC LIMIT 200 $function$;

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
   CASE WHEN (p.hide_photo AND NOT a.admin) OR NOT (p.public_photo ~ '^https://') THEN '' ELSE coalesce(p.public_photo,'') END
 FROM r CROSS JOIN a LEFT JOIN public.profiles p ON p.id=r.uid
 WHERE auth.uid() IS NOT NULL AND r.uid IS NOT NULL $function$;

CREATE OR REPLACE FUNCTION public.chat_peer_identity(_other uuid)
 RETURNS TABLE(full_name text, phone text, photo text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
 SELECT CASE WHEN p.hide_name AND NOT public.has_role(auth.uid(),'admin') THEN '' ELSE coalesce(p.full_name,'') END,
   CASE WHEN p.hide_phone AND NOT public.has_role(auth.uid(),'admin') THEN '' ELSE coalesce(p.phone,'') END,
   CASE WHEN (p.hide_photo AND NOT public.has_role(auth.uid(),'admin')) OR NOT (p.public_photo ~ '^https://') THEN '' ELSE coalesce(p.public_photo,'') END
 FROM public.profiles p
 WHERE p.id=_other AND auth.uid() IS NOT NULL AND auth.uid()<>_other
   AND (public.has_role(auth.uid(),'admin') OR public.incoming_bell_reply_allowed(_other,NULL)
        OR EXISTS(SELECT 1 FROM public.post_chat_pairs pair WHERE pair.owner_id=auth.uid() AND pair.member_id=_other)
        OR EXISTS(SELECT 1 FROM public.vehicle_bell_demands d JOIN public.posts po ON po.id=d.post_id WHERE po.user_id=auth.uid() AND d.user_id=_other)) $function$;

CREATE OR REPLACE FUNCTION public.delete_post_everywhere(_post uuid)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE removed integer;
BEGIN
 IF auth.uid() IS NULL OR NOT public.account_allowed(auth.uid()) THEN RAISE EXCEPTION 'ACCOUNT_REQUIRED'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.posts WHERE id=_post AND (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'))) THEN RAISE EXCEPTION 'OWNER_OR_ADMIN_ONLY'; END IF;
 DELETE FROM public.post_sharing_evidence WHERE post_id=_post;
 DELETE FROM public.free_work_interests WHERE source='post' AND entry_id=_post::text;
 DELETE FROM public.post_bell_interests WHERE post_id=_post;
 DELETE FROM public.vehicle_demand_chat_pairs WHERE demand_id IN (SELECT id FROM public.vehicle_bell_demands WHERE post_id=_post);
 DELETE FROM public.vehicle_bell_demands WHERE post_id=_post;
 DELETE FROM public.posts WHERE id=_post;
 GET DIAGNOSTICS removed=ROW_COUNT;
 RETURN removed>0;
END $function$;

REVOKE ALL ON FUNCTION public.admin_activity_feed() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_activity_feed() TO authenticated;
REVOKE ALL ON FUNCTION public.delete_post_everywhere(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_post_everywhere(uuid) TO authenticated;