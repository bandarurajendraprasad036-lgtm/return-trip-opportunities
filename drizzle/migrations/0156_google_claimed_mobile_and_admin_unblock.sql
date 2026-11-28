CREATE OR REPLACE FUNCTION public.guard_unique_profile_mobile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE normalized text; confirmed boolean; BEGIN
IF TG_OP='UPDATE' AND NEW.phone IS NOT DISTINCT FROM OLD.phone THEN RETURN NEW; END IF;
normalized:=right(regexp_replace(coalesce(NEW.phone,''),'[^0-9]','','g'),10);
IF normalized='' THEN IF TG_OP='UPDATE' AND coalesce(OLD.phone,'')<>'' THEN RAISE EXCEPTION 'VERIFIED_PHONE_REQUIRED'; END IF; RETURN NEW; END IF;
IF normalized !~ '^[6-9][0-9]{9}$' THEN RAISE EXCEPTION 'VALID_MOBILE_REQUIRED'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended(normalized,0));
IF EXISTS(SELECT 1 FROM public.profiles p WHERE p.id<>NEW.id AND right(regexp_replace(p.phone,'[^0-9]','','g'),10)=normalized) THEN RAISE EXCEPTION 'MOBILE_ALREADY_REGISTERED'; END IF;
SELECT EXISTS(SELECT 1 FROM auth.users u WHERE u.id=NEW.id AND ((u.phone_confirmed_at IS NOT NULL AND right(regexp_replace(u.phone,'[^0-9]','','g'),10)=normalized) OR (TG_OP='INSERT' AND lower(u.email)=normalized||'@phone.returnconnect.app') OR EXISTS(SELECT 1 FROM auth.identities i WHERE i.user_id=u.id AND i.provider='google'))) INTO confirmed;
IF NOT confirmed THEN RAISE EXCEPTION 'VERIFIED_PHONE_REQUIRED'; END IF;
IF TG_OP='UPDATE' AND coalesce(OLD.phone,'')<>'' THEN
 IF EXISTS(SELECT 1 FROM public.profile_phone_changes WHERE user_id=NEW.id) THEN RAISE EXCEPTION 'PHONE_CHANGE_ALREADY_USED'; END IF;
 INSERT INTO public.profile_phone_changes(user_id) VALUES(NEW.id);
END IF;
NEW.phone:=normalized;RETURN NEW;END $$;

CREATE OR REPLACE FUNCTION public.profile_ready_for_actions(_user uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT _user IS NOT NULL AND public.account_allowed(_user) AND (public.has_role(_user,'admin') OR EXISTS(SELECT 1 FROM public.profiles p JOIN public.account_programs a ON a.user_id=p.id JOIN auth.users u ON u.id=p.id WHERE p.id=_user AND length(trim(p.full_name))>0 AND length(trim(p.location))>0 AND p.phone ~ '^[6-9][0-9]{9}$' AND length(trim(a.occupation))>0 AND length(trim(a.category))>0 AND length(trim(a.member_kind))>0 AND ((u.phone_confirmed_at IS NOT NULL AND right(regexp_replace(u.phone,'[^0-9]','','g'),10)=p.phone) OR lower(u.email)=p.phone||'@phone.returnconnect.app' OR EXISTS(SELECT 1 FROM auth.identities i WHERE i.user_id=u.id AND i.provider='google')))); $$;

CREATE FUNCTION public.admin_unblock_account(_user uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') OR NOT public.account_allowed(auth.uid()) THEN RAISE EXCEPTION 'ADMIN_ONLY'; END IF;
IF _user=auth.uid() OR public.has_role(_user,'admin') THEN RAISE EXCEPTION 'ADMIN_PROTECTED'; END IF;
PERFORM 1 FROM public.profiles WHERE id=_user FOR UPDATE;
IF NOT FOUND THEN RAISE EXCEPTION 'ACCOUNT_UNAVAILABLE'; END IF;
DELETE FROM public.account_blocks WHERE user_id=_user;
UPDATE auth.users SET banned_until=NULL WHERE id=_user;
RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.admin_unblock_account(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_unblock_account(uuid) TO authenticated;

CREATE POLICY active_call_account_required ON public.app_calls AS RESTRICTIVE FOR ALL TO authenticated USING(public.account_allowed(auth.uid())) WITH CHECK(public.account_allowed(auth.uid()));
CREATE POLICY active_signal_account_required ON public.app_call_signals AS RESTRICTIVE FOR ALL TO authenticated USING(public.account_allowed(auth.uid())) WITH CHECK(public.account_allowed(auth.uid()));
CREATE TRIGGER active_actor_guard BEFORE INSERT OR UPDATE OR DELETE ON public.app_calls FOR EACH ROW EXECUTE FUNCTION public.require_active_actor();
CREATE TRIGGER active_actor_guard BEFORE INSERT OR UPDATE OR DELETE ON public.app_call_signals FOR EACH ROW EXECUTE FUNCTION public.require_active_actor();