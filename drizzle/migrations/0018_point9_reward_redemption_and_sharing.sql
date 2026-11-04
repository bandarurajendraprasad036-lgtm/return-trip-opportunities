CREATE TABLE public.reward_wallets (user_id uuid PRIMARY KEY REFERENCES public.profiles(id), points integer NOT NULL DEFAULT 0 CHECK(points>=0));
GRANT SELECT ON public.reward_wallets TO authenticated; GRANT ALL ON public.reward_wallets TO service_role;
ALTER TABLE public.reward_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY reward_wallet_read ON public.reward_wallets FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TABLE public.free_membership_months (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id), source text NOT NULL CHECK(source IN ('points','sharing')), starts_on date NOT NULL, ends_on date NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), CHECK(ends_on>starts_on));
GRANT SELECT ON public.free_membership_months TO authenticated; GRANT ALL ON public.free_membership_months TO service_role;
ALTER TABLE public.free_membership_months ENABLE ROW LEVEL SECURITY;
CREATE POLICY free_month_read ON public.free_membership_months FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TABLE public.sharing_claims (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id), evidence_paths text[] NOT NULL, status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')), admin_note text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), reviewed_at timestamptz, CHECK(cardinality(evidence_paths)=10));
GRANT SELECT,INSERT ON public.sharing_claims TO authenticated; GRANT ALL ON public.sharing_claims TO service_role;
ALTER TABLE public.sharing_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY sharing_claim_read ON public.sharing_claims FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY sharing_claim_insert ON public.sharing_claims FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid() AND status='pending' AND admin_note='' AND reviewed_at IS NULL);
CREATE UNIQUE INDEX one_pending_sharing_claim ON public.sharing_claims(user_id) WHERE status='pending';
CREATE FUNCTION public.validate_sharing_claim() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE p text; BEGIN
 PERFORM 1 FROM public.profiles WHERE id=NEW.user_id FOR UPDATE;
 IF (SELECT count(DISTINCT x) FROM unnest(NEW.evidence_paths) x)<>10 THEN RAISE EXCEPTION 'TEN_DISTINCT_IMAGES_REQUIRED'; END IF;
 IF EXISTS(SELECT 1 FROM public.sharing_claims WHERE user_id=NEW.user_id AND status<>'rejected' AND evidence_paths && NEW.evidence_paths) THEN RAISE EXCEPTION 'EVIDENCE_ALREADY_USED'; END IF;
 FOREACH p IN ARRAY NEW.evidence_paths LOOP
  IF p NOT LIKE NEW.user_id::text||'/%' OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='sharing-evidence' AND name=p) THEN RAISE EXCEPTION 'INVALID_EVIDENCE'; END IF;
 END LOOP; RETURN NEW; END $$;
CREATE TRIGGER sharing_claim_validate BEFORE INSERT ON public.sharing_claims FOR EACH ROW EXECUTE FUNCTION public.validate_sharing_claim();
CREATE POLICY sharing_evidence_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='sharing-evidence' AND (storage.foldername(name))[1]=auth.uid()::text AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp'));
CREATE POLICY sharing_evidence_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='sharing-evidence' AND ((storage.foldername(name))[1]=auth.uid()::text OR public.has_role(auth.uid(),'admin')));
CREATE POLICY sharing_evidence_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id='sharing-evidence' AND (storage.foldername(name))[1]=auth.uid()::text AND NOT EXISTS(SELECT 1 FROM public.sharing_claims WHERE name=ANY(evidence_paths)));
CREATE FUNCTION public.grant_free_membership_month(_user uuid,_source text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.profiles; today date := (now() AT TIME ZONE 'Asia/Kolkata')::date; start_day date; end_day date; last_start date; last_end date; streak integer:=0; reward uuid;
BEGIN
 SELECT * INTO p FROM public.profiles WHERE id=_user FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'PROFILE_REQUIRED'; END IF;
 start_day:=greatest(coalesce(p.prime_until,today),today);
 SELECT starts_on,ends_on INTO last_start,last_end FROM public.free_membership_months WHERE user_id=_user ORDER BY ends_on DESC LIMIT 1;
 IF last_end IS NOT NULL AND start_day=last_end THEN
  streak:=1;
  LOOP
   SELECT starts_on INTO last_start FROM public.free_membership_months WHERE user_id=_user AND ends_on=last_start ORDER BY starts_on DESC LIMIT 1;
   EXIT WHEN last_start IS NULL; streak:=streak+1; EXIT WHEN streak>=3;
  END LOOP;
  IF streak>=3 THEN RAISE EXCEPTION 'ONE_MONTH_BREAK_REQUIRED'; END IF;
 END IF;
 IF last_end IS NOT NULL AND start_day>last_end AND start_day<(last_end+interval '1 month')::date THEN RAISE EXCEPTION 'ONE_MONTH_BREAK_REQUIRED'; END IF;
 end_day:=(start_day+interval '1 month')::date;
 INSERT INTO public.free_membership_months(user_id,source,starts_on,ends_on) VALUES(_user,_source,start_day,end_day) RETURNING id INTO reward;
 PERFORM set_config('app.trusted','1',true);
 UPDATE public.profiles SET is_prime=true,prime_until=end_day,free_months=free_months+1 WHERE id=_user;
 INSERT INTO public.notifications(user_id,message) VALUES(_user,'ఒక నెల ఉచిత సభ్యత్వం ఆమోదించబడింది · One free membership month approved');
 RETURN reward;
END $$;
REVOKE ALL ON FUNCTION public.grant_free_membership_month(uuid,text) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.redeem_reward_points() RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE balance integer; reward uuid; BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
 PERFORM 1 FROM public.profiles WHERE id=auth.uid() FOR UPDATE;
 SELECT points INTO balance FROM public.reward_wallets WHERE user_id=auth.uid() FOR UPDATE;
 IF coalesce(balance,0)<100 THEN RAISE EXCEPTION '100_POINTS_REQUIRED'; END IF;
 reward:=public.grant_free_membership_month(auth.uid(),'points');
 UPDATE public.reward_wallets SET points=points-100 WHERE user_id=auth.uid(); RETURN reward;
END $$;
REVOKE ALL ON FUNCTION public.redeem_reward_points() FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.redeem_reward_points() TO authenticated;
CREATE FUNCTION public.review_sharing_claim(_id uuid,_approve boolean,_note text DEFAULT '') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE c public.sharing_claims; BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'ADMIN_ONLY'; END IF;
 SELECT * INTO c FROM public.sharing_claims WHERE id=_id FOR UPDATE;
 IF NOT FOUND OR c.status<>'pending' THEN RAISE EXCEPTION 'NO_PENDING_CLAIM'; END IF;
 IF _approve THEN PERFORM public.grant_free_membership_month(c.user_id,'sharing'); END IF;
 UPDATE public.sharing_claims SET status=CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,admin_note=left(_note,500),reviewed_at=now() WHERE id=_id;
END $$;
REVOKE ALL ON FUNCTION public.review_sharing_claim(uuid,boolean,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.review_sharing_claim(uuid,boolean,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.guard_prime() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF current_setting('app.trusted',true)='1' THEN RETURN NEW; END IF;
 IF new.is_prime IS DISTINCT FROM old.is_prime AND auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(),'admin') THEN new.is_prime:=old.is_prime; END IF;
 RETURN NEW; END $$;
COMMENT ON FUNCTION public.redeem_reward_points() IS 'Point 9: 100 points per month; three consecutive free months require one calendar month break. Referral earning rate awaits confirmation; wallets have no user write access.';