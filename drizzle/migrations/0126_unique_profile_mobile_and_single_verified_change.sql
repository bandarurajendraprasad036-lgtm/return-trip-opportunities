CREATE TABLE public.profile_phone_changes (user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE, changed_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.profile_phone_changes TO authenticated;
GRANT ALL ON public.profile_phone_changes TO service_role;
ALTER TABLE public.profile_phone_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY profile_phone_changes_owner_read ON public.profile_phone_changes FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE FUNCTION public.guard_unique_profile_mobile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE normalized text; confirmed boolean; BEGIN
IF TG_OP='UPDATE' AND NEW.phone IS NOT DISTINCT FROM OLD.phone THEN RETURN NEW; END IF;
normalized:=right(regexp_replace(coalesce(NEW.phone,''),'[^0-9]','','g'),10);
IF normalized='' THEN IF TG_OP='UPDATE' AND coalesce(OLD.phone,'')<>'' THEN RAISE EXCEPTION 'VERIFIED_PHONE_REQUIRED'; END IF; RETURN NEW; END IF;
IF normalized !~ '^[6-9][0-9]{9}$' THEN RAISE EXCEPTION 'VALID_MOBILE_REQUIRED'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended(normalized,0));
IF EXISTS(SELECT 1 FROM public.profiles p WHERE p.id<>NEW.id AND right(regexp_replace(p.phone,'[^0-9]','','g'),10)=normalized) THEN RAISE EXCEPTION 'MOBILE_ALREADY_REGISTERED'; END IF;
SELECT EXISTS(SELECT 1 FROM auth.users u WHERE u.id=NEW.id AND ((u.phone_confirmed_at IS NOT NULL AND right(regexp_replace(u.phone,'[^0-9]','','g'),10)=normalized) OR (TG_OP='INSERT' AND lower(u.email)=normalized||'@phone.returnconnect.app'))) INTO confirmed;
IF NOT confirmed THEN RAISE EXCEPTION 'VERIFIED_PHONE_REQUIRED'; END IF;
IF TG_OP='UPDATE' AND coalesce(OLD.phone,'')<>'' THEN
 IF EXISTS(SELECT 1 FROM public.profile_phone_changes WHERE user_id=NEW.id) THEN RAISE EXCEPTION 'PHONE_CHANGE_ALREADY_USED'; END IF;
 INSERT INTO public.profile_phone_changes(user_id) VALUES(NEW.id);
END IF;
NEW.phone:=normalized;RETURN NEW;END $$;
CREATE TRIGGER unique_verified_profile_mobile BEFORE INSERT OR UPDATE OF phone ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.guard_unique_profile_mobile();
CREATE FUNCTION public.my_phone_change_available() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT auth.uid() IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.profile_phone_changes WHERE user_id=auth.uid()) $$;
REVOKE ALL ON FUNCTION public.my_phone_change_available() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.my_phone_change_available() TO authenticated;