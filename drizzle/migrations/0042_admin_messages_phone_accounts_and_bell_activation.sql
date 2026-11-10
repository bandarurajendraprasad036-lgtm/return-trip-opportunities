ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bell_activated_at timestamptz;
COMMENT ON COLUMN public.profiles.bell_activated_at IS 'Account-owned timestamp of the first explicit home/listing bell activation; used to suppress repeated profile reminders.';

CREATE POLICY "admin read all messages" ON public.messages
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, location)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    right(regexp_replace(coalesce(new.raw_user_meta_data->>'phone', new.phone, ''), '\D', '', 'g'), 10),
    coalesce(new.raw_user_meta_data->>'location', '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'user');
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'admin');
  END IF;
  RETURN new;
END;
$$;