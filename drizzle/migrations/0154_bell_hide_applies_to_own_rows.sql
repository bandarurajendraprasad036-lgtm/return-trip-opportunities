CREATE OR REPLACE FUNCTION public.list_vehicle_bell_contacts(_section text, _area text DEFAULT '')
RETURNS TABLE(id uuid, area text, need text, rang_at timestamptz, own boolean, shown boolean, full_name text, phone text, photo text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
WITH a AS (SELECT auth.uid() AS me, coalesce(public.has_role(auth.uid(),'admin'),false) AS admin),
r AS (
 SELECT d.*, pr.full_name AS pname, pr.phone AS pphone, pr.photo_path, pr.public_photo,
  coalesce(a.me IS NOT NULL AND d.user_id=a.me,false) is_own, a.admin,
  coalesce((a.me IS NOT NULL AND d.user_id=a.me) OR a.admin OR coalesce(pr.public_bell_consent,false),false) vis,
  coalesce(pr.hide_name,true) hn, coalesce(pr.hide_phone,true) hp, coalesce(pr.hide_photo,true) hph
 FROM public.vehicle_bell_demands d CROSS JOIN a LEFT JOIN public.profiles pr ON pr.id=d.user_id
 WHERE _section IN ('goods','returns','cars') AND d.category=_section AND public.account_allowed(d.user_id)
  AND (d.post_id IS NULL OR EXISTS(SELECT 1 FROM public.posts p WHERE p.id=d.post_id AND public.post_listing_visible(p)))
  AND (_section<>'goods' OR d.rang_at+interval '1 day'>now())
  AND (trim(coalesce(_area,''))='' OR lower(trim(d.from_place))=lower(trim(_area)))
), s AS (
 SELECT r.*,
  CASE WHEN r.vis AND (r.admin OR NOT r.hn) THEN coalesce(r.pname,'') ELSE '' END n,
  CASE WHEN r.vis AND (r.admin OR NOT r.hp) THEN coalesce(r.pphone,'') ELSE '' END ph,
  CASE WHEN NOT (r.vis AND (r.admin OR NOT r.hph)) THEN '' WHEN coalesce(r.photo_path,'')<>'' THEN r.photo_path WHEN r.public_photo ~ '^https://' THEN r.public_photo ELSE '' END ft
 FROM r)
SELECT s.id, s.from_place||' → '||s.to_place, s.vehicle_type, s.rang_at, s.is_own, (s.n<>'' OR s.ph<>'' OR s.ft<>''), s.n, s.ph, s.ft
FROM s ORDER BY s.rang_at DESC LIMIT 200 $$;
GRANT EXECUTE ON FUNCTION public.list_vehicle_bell_contacts(text,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_free_work_interest_contacts(_section text, _area text DEFAULT '', _category text DEFAULT '')
RETURNS TABLE(id uuid, source text, category text, area text, rang_at timestamptz, other_id uuid, own boolean, shown boolean, full_name text, phone text, photo text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
WITH a AS (SELECT auth.uid() AS me, coalesce(public.has_role(auth.uid(),'admin'),false) AS admin),
r AS (
 SELECT i.*, pr.full_name AS pname, pr.phone AS pphone, pr.photo_path, pr.public_photo,
   coalesce(pr.hide_name,true) AS hn, coalesce(pr.hide_phone,true) AS hp, coalesce(pr.hide_photo,true) AS hph,
   coalesce(a.me IS NOT NULL AND i.user_id = a.me, false) AS is_own, a.admin,
   coalesce((a.me IS NOT NULL AND i.user_id = a.me) OR a.admin OR coalesce(pr.public_bell_consent,false), false) AS vis
 FROM public.free_work_interests i CROSS JOIN a LEFT JOIN public.profiles pr ON pr.id = i.user_id
 WHERE i.section=_section AND i.created_at+interval '30 days'>now() AND public.account_allowed(i.user_id)
   AND (_area='' OR lower(trim(i.area))=lower(trim(_area)))
   AND (_category='' OR public.free_work_category(i.category)=public.free_work_category(_category))
), s AS (
 SELECT r.*,
  CASE WHEN r.vis AND (r.admin OR NOT r.hn) THEN coalesce(r.pname,'') ELSE '' END n,
  CASE WHEN r.vis AND (r.admin OR NOT r.hp) THEN coalesce(r.pphone,'') ELSE '' END ph,
  CASE WHEN NOT (r.vis AND (r.admin OR NOT r.hph)) THEN '' WHEN coalesce(r.photo_path,'')<>'' THEN r.photo_path WHEN r.public_photo ~ '^https://' THEN r.public_photo ELSE '' END ft
 FROM r)
SELECT s.id, 'interest'::text, s.category, s.area, s.created_at, s.user_id, s.is_own, (s.n<>'' OR s.ph<>'' OR s.ft<>''), s.n, s.ph, s.ft
FROM s ORDER BY s.created_at DESC LIMIT 200 $$;
GRANT EXECUTE ON FUNCTION public.list_free_work_interest_contacts(text,text,text) TO anon, authenticated;