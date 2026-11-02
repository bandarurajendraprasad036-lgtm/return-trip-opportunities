CREATE OR REPLACE FUNCTION public.public_stats()
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT json_build_object(
    'users', (SELECT count(*) FROM public.profiles),
    'jobs', (SELECT count(*) FROM public.posts WHERE module='job' AND status='active'),
    'rides', (SELECT count(*) FROM public.posts WHERE module='vehicle' AND status='active'),
    'matches', (SELECT count(*) FROM public.notifications)
  )
$$;
GRANT EXECUTE ON FUNCTION public.public_stats() TO anon, authenticated;