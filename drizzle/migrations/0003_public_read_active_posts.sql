GRANT SELECT ON public.posts TO anon;
CREATE POLICY "guests read active posts" ON public.posts FOR SELECT TO anon USING (status = 'active');