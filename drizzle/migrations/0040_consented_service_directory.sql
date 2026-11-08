ALTER TABLE public.service_profiles ADD COLUMN IF NOT EXISTS town text NOT NULL DEFAULT '';
ALTER TABLE public.service_profiles ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT '';
COMMENT ON COLUMN public.service_profiles.town IS 'Owner-provided public service town; never copied from private profiles.';
COMMENT ON COLUMN public.service_profiles.category IS 'Owner-provided public service category.';
CREATE OR REPLACE FUNCTION public.save_service_listing(_name text, _service text, _town text, _category text, _published boolean) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 IF length(trim(_service)) = 0 OR length(_service)>100 OR length(trim(_town))=0 OR length(_town)>80 OR length(trim(_category))=0 OR length(_category)>100 OR length(_name)>80 THEN RAISE EXCEPTION 'Invalid service listing'; END IF;
 INSERT INTO public.service_profiles(user_id,display_name,service,town,category,published) VALUES(auth.uid(),trim(_name),trim(_service),trim(_town),trim(_category),_published)
 ON CONFLICT(user_id) DO UPDATE SET service=excluded.service,town=excluded.town,category=excluded.category,published=excluded.published,updated_at=now();
END $$;
REVOKE ALL ON FUNCTION public.save_service_listing(text,text,text,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_service_listing(text,text,text,text,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.public_service_directory() RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('user_id',user_id,'service',service,'town',town,'category',category) ORDER BY updated_at DESC),'[]'::jsonb) FROM public.service_profiles WHERE published AND length(trim(service))>0;
$$;
REVOKE ALL ON FUNCTION public.public_service_directory() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_service_directory() TO anon,authenticated;
CREATE INDEX IF NOT EXISTS service_directory_town_category ON public.service_profiles(lower(town),lower(category)) WHERE published;
