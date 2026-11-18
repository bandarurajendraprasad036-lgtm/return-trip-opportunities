CREATE TABLE public.password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL CHECK (phone ~ '^[6-9][0-9]{9}$'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  handled_at timestamptz,
  handled_by uuid
);
GRANT SELECT, UPDATE ON public.password_reset_requests TO authenticated;
GRANT ALL ON public.password_reset_requests TO service_role;
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_read_reset_requests ON public.password_reset_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY admin_update_reset_requests ON public.password_reset_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE UNIQUE INDEX password_reset_one_pending ON public.password_reset_requests(phone) WHERE status='pending';

-- Anyone may ask for help; the reply never reveals whether the number has an account.
CREATE OR REPLACE FUNCTION public.request_password_reset(_phone text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE p text := right(regexp_replace(coalesce(_phone,''),'[^0-9]','','g'),10);
BEGIN
  IF p !~ '^[6-9][0-9]{9}$' THEN RAISE EXCEPTION 'INVALID_MOBILE'; END IF;
  IF (SELECT count(*) FROM public.password_reset_requests WHERE created_at > now() - interval '1 hour') > 200 THEN RAISE EXCEPTION 'TRY_LATER'; END IF;
  INSERT INTO public.password_reset_requests(phone) VALUES (p) ON CONFLICT (phone) WHERE status='pending' DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION public.request_password_reset(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_password_reset(text) TO anon, authenticated;

-- Service-only lookup used after the server has verified the caller is an administrator.
CREATE OR REPLACE FUNCTION public.account_id_for_login_phone(_phone text)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT u.id FROM auth.users u WHERE lower(u.email) = right(regexp_replace(coalesce(_phone,''),'[^0-9]','','g'),10) || '@phone.returnconnect.app' LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.account_id_for_login_phone(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.account_id_for_login_phone(text) TO service_role;