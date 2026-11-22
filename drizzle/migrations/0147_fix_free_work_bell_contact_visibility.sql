CREATE OR REPLACE FUNCTION public.list_free_work_interest_contacts(_section text, _area text DEFAULT '', _category text DEFAULT '')
RETURNS TABLE(id uuid, source text, category text, area text, rang_at timestamptz, other_id uuid, own boolean, shown boolean, full_name text, phone text, photo text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
WITH a AS (SELECT auth.uid() AS me, coalesce(public.has_role(auth.uid(),'admin'),false) AS admin),
r AS (
 SELECT i.*, pr.full_name AS pname, pr.phone AS pphone, pr.photo_path, pr.public_photo,
   coalesce(pr.hide_name,true) AS hide_name, coalesce(pr.hide_phone,true) AS hide_phone, coalesce(pr.hide_photo,true) AS hide_photo,
   coalesce(a.me IS NOT NULL AND i.user_id = a.me, false) AS is_own, a.admin,
   coalesce((a.me IS NOT NULL AND i.user_id = a.me) OR a.admin OR coalesce(pr.public_bell_consent,false), false) AS visible
 FROM public.free_work_interests i CROSS JOIN a LEFT JOIN public.profiles pr ON pr.id = i.user_id
 WHERE i.section=_section AND i.created_at+interval '30 days'>now() AND public.account_allowed(i.user_id)
   AND (_area='' OR lower(trim(i.area))=lower(trim(_area)))
   AND (_category='' OR public.free_work_category(i.category)=public.free_work_category(_category))
)
SELECT r.id, 'interest'::text, r.category, r.area, r.created_at, r.user_id, r.is_own, r.visible,
 CASE WHEN r.visible AND (r.admin OR r.is_own OR NOT r.hide_name) THEN coalesce(r.pname,'') ELSE '' END,
 CASE WHEN r.visible AND (r.admin OR r.is_own OR NOT r.hide_phone) THEN coalesce(r.pphone,'') ELSE '' END,
 CASE WHEN NOT (r.visible AND (r.admin OR r.is_own OR NOT r.hide_photo)) THEN '' WHEN coalesce(r.photo_path,'')<>'' THEN r.photo_path WHEN r.public_photo ~ '^https://' THEN r.public_photo ELSE '' END
FROM r ORDER BY r.created_at DESC LIMIT 200
$$;
GRANT EXECUTE ON FUNCTION public.list_free_work_interest_contacts(text,text,text) TO anon, authenticated;