CREATE OR REPLACE FUNCTION public.guard_show_contact() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF new.show_contact AND NOT coalesce((SELECT is_prime FROM public.profiles WHERE id = new.user_id), false) THEN
    new.show_contact := false;
  END IF;
  IF new.module = 'job' AND NOT new.show_contact THEN
    new.contact_phone := NULL;
  END IF;
  RETURN new;
END; $$;
UPDATE public.posts SET contact_phone = NULL WHERE module = 'job' AND show_contact = false;