CREATE OR REPLACE FUNCTION public.incoming_bell_times(_section text, _post uuid DEFAULT NULL) RETURNS TABLE(id uuid,source text,rang_at timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
WITH allowed AS (
 SELECT b.id,b.source FROM public.list_post_bell_contacts(_post) b WHERE _post IS NOT NULL
 UNION ALL SELECT b.id,b.source FROM public.my_incoming_bell_contacts(_section) b WHERE _post IS NULL AND auth.uid() IS NOT NULL
)
SELECT a.id,a.source,CASE a.source
 WHEN 'free' THEN (SELECT i.created_at FROM public.free_work_interests i WHERE i.id=a.id)
 WHEN 'post' THEN (SELECT i.created_at FROM public.post_bell_interests i WHERE i.id=a.id)
 WHEN 'vehicle' THEN (SELECT d.rang_at FROM public.vehicle_bell_demands d WHERE d.id=a.id)
 WHEN 'board' THEN (SELECT p.board_rang_at FROM public.vehicle_demand_chat_pairs p WHERE p.demand_id=a.id AND p.owner_id=auth.uid() AND p.board_rang_at IS NOT NULL ORDER BY p.board_rang_at DESC LIMIT 1)
 ELSE NULL END
FROM allowed a;
$$;
REVOKE ALL ON FUNCTION public.incoming_bell_times(text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.incoming_bell_times(text,uuid) TO anon,authenticated,service_role;