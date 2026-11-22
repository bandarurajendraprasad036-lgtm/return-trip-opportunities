CREATE OR REPLACE FUNCTION public.list_free_work_interest_contacts(_section text, _area text DEFAULT '', _category text DEFAULT '')
RETURNS TABLE(id uuid, source text, category text, area text, rang_at timestamptz, other_id uuid, own boolean, shown boolean, full_name text, phone text, photo text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
WITH a AS (SELECT auth.uid() AS me, coalesce(public.has_role(auth.uid(),'admin'),false) AS admin),
r AS (
 SELECT i.*, pr.full_name AS pname, pr.phone AS pphone, pr.photo_path, pr.public_photo, pr.hide_name, pr.hide_phone, pr.hide_photo,
   (i.user_id = a.me) AS is_own, a.admin,
   (i.user_id = a.me OR a.admin OR coalesce(pr.public_bell_consent,false)) AS visible
 FROM public.free_work_interests i CROSS JOIN a LEFT JOIN public.profiles pr ON pr.id = i.user_id
 WHERE i.section=_section AND i.created_at+interval '30 days'>now() AND public.account_allowed(i.user_id)
   AND (_area='' OR lower(trim(i.area))=lower(trim(_area)))
   AND (_category='' OR public.free_work_category(i.category)=public.free_work_category(_category))
)
SELECT r.id, 'interest'::text, r.category, r.area, r.created_at, r.user_id, coalesce(r.is_own,false), r.visible,
 CASE WHEN NOT r.visible OR (r.hide_name AND NOT r.admin AND NOT r.is_own) THEN '' ELSE coalesce(r.pname,'') END,
 CASE WHEN NOT r.visible OR (r.hide_phone AND NOT r.admin AND NOT r.is_own) THEN '' ELSE coalesce(r.pphone,'') END,
 CASE WHEN NOT r.visible OR (r.hide_photo AND NOT r.admin AND NOT r.is_own) THEN '' WHEN coalesce(r.photo_path,'')<>'' THEN r.photo_path WHEN r.public_photo ~ '^https://' THEN r.public_photo ELSE '' END
FROM r ORDER BY r.created_at DESC LIMIT 200
$$;
GRANT EXECUTE ON FUNCTION public.list_free_work_interest_contacts(text,text,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.public_bell_photo_allowed(_path text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS(SELECT 1 FROM public.profiles pr WHERE pr.photo_path=_path AND pr.public_bell_consent AND NOT pr.hide_photo AND public.account_allowed(pr.id) AND (
 EXISTS(SELECT 1 FROM public.free_work_interests i WHERE i.user_id=pr.id AND i.created_at+interval '30 days'>now())
 OR EXISTS(SELECT 1 FROM public.posts po WHERE public.post_listing_visible(po) AND (EXISTS(SELECT 1 FROM public.post_bell_interests i WHERE i.post_id=po.id AND i.user_id=pr.id) OR EXISTS(SELECT 1 FROM public.vehicle_bell_demands d WHERE d.post_id=po.id AND d.user_id=pr.id))))) $$;