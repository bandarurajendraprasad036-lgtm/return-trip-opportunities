ALTER POLICY hide_blocked_owner_posts ON public.posts
USING (
  public.account_allowed(user_id)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);