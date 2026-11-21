ALTER TABLE public.admin_activity_notices ADD COLUMN IF NOT EXISTS section text NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION public.notice_admin_activity()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE actor uuid; label text; pid uuid; info text := ''; sec text := ''; cat text := '';
BEGIN
 IF TG_TABLE_NAME='messages' THEN
  actor:=NEW.sender_id; label:='కొత్త సందేశం నమోదైంది'; pid:=NEW.post_id;
 ELSIF TG_TABLE_NAME='posts' THEN
  actor:=NEW.user_id; label:='కొత్త ప్రకటన నమోదైంది'; pid:=NEW.id;
  info := CASE WHEN NEW.module='job' THEN concat_ws(' · ', nullif(coalesce(NEW.skill,NEW.title),''), nullif(NEW.location,'')) ELSE concat_ws(' → ', nullif(NEW.from_place,''), nullif(NEW.to_place,'')) END;
 ELSIF TG_TABLE_NAME='free_work_interests' THEN
  actor:=NEW.user_id; label:='ప్రకటనకు గంట నమోదైంది'; sec:=coalesce(NEW.section,''); cat:=coalesce(NEW.category,'');
  IF NEW.source='post' AND NEW.entry_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN pid:=NEW.entry_id::uuid; END IF;
  info := concat_ws(' · ', nullif(NEW.category,''), nullif(NEW.area,''));
 ELSIF TG_TABLE_NAME='vehicle_bell_demands' THEN
  actor:=NEW.user_id; label:='ప్రకటనకు గంట నమోదైంది'; pid:=NEW.post_id; sec:=coalesce(NEW.category,'');
  info := concat_ws(' · ', nullif(concat_ws(' → ', nullif(NEW.from_place,''), nullif(NEW.to_place,'')),''), nullif(NEW.vehicle_type,''));
 ELSE
  actor:=NEW.user_id; label:='ప్రకటనకు గంట నమోదైంది'; pid:=NEW.post_id; sec:=coalesce(NEW.section,'');
  info := concat_ws(' · ', nullif(NEW.need,''), nullif(NEW.area,''));
 END IF;
 INSERT INTO public.admin_activity_notices(user_id,message,actor_id,post_id,detail,section,category)
 SELECT user_id,label,actor,pid,coalesce(info,''),sec,cat FROM public.user_roles WHERE role='admin' AND user_id<>actor;
 RETURN NEW;
END $function$;

UPDATE public.admin_activity_notices n SET section=f.section, category=f.category
FROM public.free_work_interests f
WHERE n.message='ప్రకటనకు గంట నమోదైంది' AND n.actor_id=f.user_id AND abs(extract(epoch FROM (f.created_at-n.created_at)))<2;
UPDATE public.admin_activity_notices n SET section=d.category
FROM public.vehicle_bell_demands d
WHERE n.message='ప్రకటనకు గంట నమోదైంది' AND n.actor_id=d.user_id AND abs(extract(epoch FROM (d.rang_at-n.created_at)))<2;

DROP FUNCTION IF EXISTS public.admin_activity_feed();
CREATE FUNCTION public.admin_activity_feed()
 RETURNS TABLE(id uuid, message text, is_read boolean, created_at timestamptz, post_id uuid, detail text, section text, category text, post_label text, post_exists boolean, actor_id uuid, full_name text, phone text, photo text, hidden boolean)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
 SELECT n.id, n.message, n.is_read, n.created_at, n.post_id, n.detail, n.section, n.category,
  CASE WHEN po.id IS NULL THEN '' WHEN po.module='job' THEN concat_ws(' · ', nullif(coalesce(po.skill,po.title),''), nullif(po.location,'')) ELSE concat_ws(' → ', nullif(po.from_place,''), nullif(po.to_place,'')) END,
  po.id IS NOT NULL, n.actor_id, coalesce(p.full_name,''), coalesce(p.phone,''),
  CASE WHEN p.public_photo ~ '^https://' THEN p.public_photo ELSE '' END,
  coalesce(p.hide_photo OR p.hide_name OR p.hide_phone,false)
 FROM public.admin_activity_notices n
 LEFT JOIN public.posts po ON po.id=n.post_id
 LEFT JOIN public.profiles p ON p.id=n.actor_id
 WHERE auth.uid() IS NOT NULL AND n.user_id=auth.uid() AND public.has_role(auth.uid(),'admin')
 ORDER BY n.created_at DESC LIMIT 200 $function$;
REVOKE ALL ON FUNCTION public.admin_activity_feed() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_activity_feed() TO authenticated;