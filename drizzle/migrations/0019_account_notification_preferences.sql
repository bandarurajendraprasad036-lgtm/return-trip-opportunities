CREATE TABLE public.notification_preferences(user_id uuid PRIMARY KEY REFERENCES public.profiles(id), enabled boolean NOT NULL DEFAULT true, daily_limit integer CHECK(daily_limit BETWEEN 1 AND 1000), timezone text NOT NULL DEFAULT 'Asia/Kolkata', quiet_start time, quiet_end time, CHECK((quiet_start IS NULL)=(quiet_end IS NULL)), CHECK(quiet_start IS NULL OR quiet_start<>quiet_end));
GRANT SELECT,INSERT,UPDATE ON public.notification_preferences TO authenticated; GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_notification_preferences ON public.notification_preferences FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE FUNCTION public.validate_notification_timezone() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_timezone_names WHERE name=NEW.timezone) THEN RAISE EXCEPTION 'INVALID_TIMEZONE'; END IF; RETURN NEW; END $$;
CREATE TRIGGER check_notification_timezone BEFORE INSERT OR UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.validate_notification_timezone();
CREATE OR REPLACE FUNCTION public.can_notify(_uid uuid) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE pref public.notification_preferences; zone text; local_now timestamp; used integer; cap integer; prime boolean;
BEGIN
 SELECT * INTO pref FROM public.notification_preferences WHERE user_id=_uid; zone:=coalesce(pref.timezone,'Asia/Kolkata'); local_now:=now() AT TIME ZONE zone;
 IF pref.enabled=false THEN RETURN false; END IF;
 IF pref.quiet_start IS NOT NULL AND ((pref.quiet_start<pref.quiet_end AND local_now::time>=pref.quiet_start AND local_now::time<pref.quiet_end) OR (pref.quiet_start>pref.quiet_end AND (local_now::time>=pref.quiet_start OR local_now::time<pref.quiet_end))) THEN RETURN false; END IF;
 SELECT is_prime INTO prime FROM public.profiles WHERE id=_uid;
 cap:=CASE WHEN coalesce(prime,false) THEN pref.daily_limit ELSE least(coalesce(pref.daily_limit,3),3) END;
 IF cap IS NULL THEN RETURN true; END IF;
 SELECT count(*) INTO used FROM public.notifications WHERE user_id=_uid AND created_at>=date_trunc('day',local_now) AT TIME ZONE zone;
 RETURN used<cap;
END $$;
CREATE FUNCTION public.my_notification_quota() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE pref public.notification_preferences; zone text; local_now timestamp; used integer; cap integer; prime boolean;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
 SELECT * INTO pref FROM public.notification_preferences WHERE user_id=auth.uid(); zone:=coalesce(pref.timezone,'Asia/Kolkata');local_now:=now() AT TIME ZONE zone;
 SELECT is_prime INTO prime FROM public.profiles WHERE id=auth.uid();cap:=CASE WHEN coalesce(prime,false) THEN pref.daily_limit ELSE least(coalesce(pref.daily_limit,3),3) END;
 SELECT count(*) INTO used FROM public.notifications WHERE user_id=auth.uid() AND created_at>=date_trunc('day',local_now) AT TIME ZONE zone;
 RETURN jsonb_build_object('used',used,'limit',cap,'remaining',CASE WHEN cap IS NULL THEN NULL ELSE greatest(cap-used,0) END,'resets_at',(date_trunc('day',local_now)+interval '1 day') AT TIME ZONE zone,'timezone',zone);
END $$;
REVOKE ALL ON FUNCTION public.my_notification_quota() FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION public.my_notification_quota() TO authenticated;