REVOKE ALL ON public.discovery_categories FROM PUBLIC,anon,authenticated;
GRANT SELECT(id,section,name,created_at) ON public.discovery_categories TO anon,authenticated;
REVOKE ALL ON FUNCTION public.add_discovery_category(text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.add_discovery_category(text,text,uuid) TO service_role;