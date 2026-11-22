CREATE OR REPLACE FUNCTION public.sync_show_choice_bell_consent() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NOT coalesce(NEW.hide_name,true) OR NOT coalesce(NEW.hide_phone,true) OR NOT coalesce(NEW.hide_photo,true))
     AND (TG_OP='INSERT' OR NEW.hide_name IS DISTINCT FROM OLD.hide_name OR NEW.hide_phone IS DISTINCT FROM OLD.hide_phone OR NEW.hide_photo IS DISTINCT FROM OLD.hide_photo) THEN
    NEW.public_bell_consent := true;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS sync_show_choice_bell_consent ON public.profiles;
CREATE TRIGGER sync_show_choice_bell_consent BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.sync_show_choice_bell_consent();
UPDATE public.profiles SET public_bell_consent = true
 WHERE coalesce(public_bell_consent,false) = false
   AND (hide_name = false OR hide_phone = false OR hide_photo = false);