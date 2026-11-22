CREATE OR REPLACE FUNCTION public.list_vehicle_bell_contacts(_section text, _area text DEFAULT '')
RETURNS TABLE(id uuid, area text, need text, rang_at timestamptz, own boolean, shown boolean, full_name text, phone text, photo text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
WITH a AS (SELECT auth.uid() AS me, coalesce(public.has_role(auth.uid(),'admin'),false) AS admin),
r AS (
 SELECT d.*, pr.full_name AS pname, pr.phone AS pphone, pr.photo_path, pr.public_photo,
  coalesce(pr.hide_name,true) hn, coalesce(pr.hide_phone,true) hp, coalesce(pr.hide_photo,true) hph,
  coalesce(a.me IS NOT NULL AND d.user_id=a.me,false) is_own, a.admin,
  coalesce((a.me IS NOT NULL AND d.user_id=a.me) OR a.admin OR coalesce(pr.public_bell_consent,false),false) vis
 FROM public.vehicle_bell_demands d CROSS JOIN a LEFT JOIN public.profiles pr ON pr.id=d.user_id
 WHERE _section IN ('goods','returns','cars') AND d.category=_section AND public.account_allowed(d.user_id)
  AND (d.post_id IS NULL OR EXISTS(SELECT 1 FROM public.posts p WHERE p.id=d.post_id AND public.post_listing_visible(p)))
  AND (_section<>'goods' OR d.rang_at+interval '1 day'>now())
  AND (trim(coalesce(_area,''))='' OR lower(trim(d.from_place))=lower(trim(_area)))
)
SELECT r.id, r.from_place||' → '||r.to_place, r.vehicle_type, r.rang_at, r.is_own, r.vis,
 CASE WHEN r.vis AND (r.admin OR r.is_own OR NOT r.hn) THEN coalesce(r.pname,'') ELSE '' END,
 CASE WHEN r.vis AND (r.admin OR r.is_own OR NOT r.hp) THEN coalesce(r.pphone,'') ELSE '' END,
 CASE WHEN NOT (r.vis AND (r.admin OR r.is_own OR NOT r.hph)) THEN '' WHEN coalesce(r.photo_path,'')<>'' THEN r.photo_path WHEN r.public_photo ~ '^https://' THEN r.public_photo ELSE '' END
FROM r ORDER BY r.rang_at DESC LIMIT 200 $$;
GRANT EXECUTE ON FUNCTION public.list_vehicle_bell_contacts(text,text) TO anon, authenticated;