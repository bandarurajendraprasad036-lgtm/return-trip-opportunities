ALTER TABLE public.prime99_payments ADD COLUMN payable_amount integer NOT NULL DEFAULT 100;
ALTER TABLE public.prime99_payments ADD COLUMN payment_purpose text NOT NULL DEFAULT 'membership';
ALTER TABLE public.prime99_payments ADD COLUMN alerts_start_at timestamptz;
ALTER TABLE public.prime99_payments ADD COLUMN used_post_id uuid;
ALTER TABLE public.prime99_payments ADD CONSTRAINT prime_payment_purpose CHECK(payment_purpose IN ('membership','extra_post'));
ALTER TABLE public.prime99_payments ADD CONSTRAINT prime_payable_amount CHECK((payment_purpose='membership' AND payable_amount IN(49,99,100)) OR (payment_purpose='extra_post' AND payable_amount=49));
COMMENT ON COLUMN public.prime99_payments.amount IS 'DEPRECATED: retained historical ₹99 column; new submissions use payable_amount.';
UPDATE public.prime99_payments SET payable_amount=amount,alerts_start_at=received_at;
CREATE TABLE public.provider_contact_batches(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES public.profiles(id),status text NOT NULL DEFAULT 'pending' CHECK(status IN('pending','approved','rejected')),created_at timestamptz NOT NULL DEFAULT now(),reviewed_at timestamptz,reviewed_by uuid,review_note text NOT NULL DEFAULT '');
GRANT SELECT ON public.provider_contact_batches TO authenticated; GRANT ALL ON public.provider_contact_batches TO service_role;
ALTER TABLE public.provider_contact_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY provider_batches_read ON public.provider_contact_batches FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TABLE public.provider_contacts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),batch_id uuid NOT NULL REFERENCES public.provider_contact_batches(id),user_id uuid NOT NULL REFERENCES public.profiles(id),town text NOT NULL,service text NOT NULL,mobile text NOT NULL CHECK(mobile ~ '^[6-9][0-9]{9}$'),consent_confirmed boolean NOT NULL CHECK(consent_confirmed),UNIQUE(batch_id,mobile));
GRANT SELECT ON public.provider_contacts TO authenticated; GRANT ALL ON public.provider_contacts TO service_role;
ALTER TABLE public.provider_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY provider_contacts_read ON public.provider_contacts FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE FUNCTION public.submit_provider_contacts(_rows jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE batch uuid; r jsonb; n integer; BEGIN
 IF auth.uid() IS NULL OR NOT public.account_allowed(auth.uid()) THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
 IF jsonb_typeof(_rows)<>'array' THEN RAISE EXCEPTION 'INVALID_CONTACTS'; END IF;
 n:=jsonb_array_length(_rows); IF n<20 OR n>500 THEN RAISE EXCEPTION 'MINIMUM_TWENTY_CONTACTS'; END IF;
 INSERT INTO public.provider_contact_batches(user_id) VALUES(auth.uid()) RETURNING id INTO batch;
 FOR r IN SELECT value FROM jsonb_array_elements(_rows) LOOP
 IF length(trim(coalesce(r->>'town','')))<2 OR length(r->>'town')>80 OR length(trim(coalesce(r->>'service','')))<2 OR length(r->>'service')>100 OR coalesce((r->>'consent')::boolean,false)=false THEN RAISE EXCEPTION 'CONTACT_CONSENT_AND_DETAILS_REQUIRED'; END IF;
 INSERT INTO public.provider_contacts(batch_id,user_id,town,service,mobile,consent_confirmed) VALUES(batch,auth.uid(),trim(r->>'town'),trim(r->>'service'),r->>'mobile',true);
 END LOOP; RETURN batch; END $$;
REVOKE ALL ON FUNCTION public.submit_provider_contacts(jsonb) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.submit_provider_contacts(jsonb) TO authenticated;
CREATE FUNCTION public.review_provider_contacts(_id uuid,_approve boolean,_note text DEFAULT '') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'ADMIN_ONLY'; END IF;
 IF _approve AND (SELECT count(*) FROM public.provider_contacts WHERE batch_id=_id AND consent_confirmed)<20 THEN RAISE EXCEPTION 'MINIMUM_TWENTY_CONTACTS'; END IF;
 UPDATE public.provider_contact_batches SET status=CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,reviewed_at=now(),reviewed_by=auth.uid(),review_note=left(coalesce(_note,''),500) WHERE id=_id AND status='pending'; IF NOT FOUND THEN RAISE EXCEPTION 'NO_PENDING_BATCH'; END IF; END $$;
REVOKE ALL ON FUNCTION public.review_provider_contacts(uuid,boolean,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.review_provider_contacts(uuid,boolean,text) TO authenticated;
CREATE FUNCTION public.my_membership_price() RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT CASE WHEN EXISTS(SELECT 1 FROM public.provider_contact_batches WHERE user_id=auth.uid() AND status='approved') THEN 49 ELSE 100 END $$;
REVOKE ALL ON FUNCTION public.my_membership_price() FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.my_membership_price() TO authenticated;
CREATE FUNCTION public.validate_current_payment() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF NEW.payment_purpose='membership' AND NEW.payable_amount<>public.my_membership_price() THEN RAISE EXCEPTION 'PAYMENT_PRICE_MISMATCH'; END IF;
 IF NEW.received_at IS NOT NULL OR NEW.ends_at IS NOT NULL OR NEW.alerts_start_at IS NOT NULL OR NEW.used_post_id IS NOT NULL OR NEW.status<>'pending' OR NEW.reviewed_by IS NOT NULL OR NEW.review_note<>'' THEN RAISE EXCEPTION 'PAYMENT_REVIEW_REQUIRED'; END IF; RETURN NEW; END $$;
CREATE TRIGGER validate_current_payment BEFORE INSERT ON public.prime99_payments FOR EACH ROW EXECUTE FUNCTION public.validate_current_payment();
CREATE OR REPLACE FUNCTION public.has_prime99(_user uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.account_allowed(_user) AND EXISTS(SELECT 1 FROM public.prime99_payments WHERE user_id=_user AND payment_purpose='membership' AND status='approved' AND received_at<=now() AND ends_at>now()) $$;
CREATE FUNCTION public.paid_alert_ready(_user uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.has_prime99(_user) AND EXISTS(SELECT 1 FROM public.profiles WHERE id=_user AND bell_activated_at IS NOT NULL) AND EXISTS(SELECT 1 FROM public.prime99_payments WHERE user_id=_user AND payment_purpose='membership' AND status='approved' AND coalesce(alerts_start_at,received_at)<=now() AND ends_at>now()) $$;
REVOKE ALL ON FUNCTION public.paid_alert_ready(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.paid_alert_ready(uuid) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.my_prime99() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT jsonb_build_object('active',public.has_prime99(auth.uid()),'alerts_ready',public.paid_alert_ready(auth.uid()),'ends_at',(SELECT max(ends_at) FROM public.prime99_payments WHERE user_id=auth.uid() AND payment_purpose='membership' AND status='approved'),'alerts_start_at',(SELECT min(alerts_start_at) FROM public.prime99_payments WHERE user_id=auth.uid() AND payment_purpose='membership' AND status='approved' AND ends_at>now()),'amount',100) $$;
CREATE OR REPLACE FUNCTION public.can_notify(_uid uuid) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ DECLARE pref public.notification_preferences; zone text; local_now timestamp; used integer; cap integer; BEGIN IF _uid IS NULL OR NOT public.paid_alert_ready(_uid) THEN RETURN false; END IF; SELECT * INTO pref FROM public.notification_preferences WHERE user_id=_uid; zone:=coalesce(pref.timezone,'Asia/Kolkata'); local_now:=now() AT TIME ZONE zone; IF pref.enabled=false THEN RETURN false; END IF; IF pref.quiet_start IS NOT NULL AND ((pref.quiet_start<pref.quiet_end AND local_now::time>=pref.quiet_start AND local_now::time<pref.quiet_end) OR (pref.quiet_start>pref.quiet_end AND (local_now::time>=pref.quiet_start OR local_now::time<pref.quiet_end))) THEN RETURN false; END IF; cap:=least(coalesce(pref.daily_limit,5),5); SELECT count(*) INTO used FROM public.notifications WHERE user_id=_uid AND created_at>=date_trunc('day',local_now) AT TIME ZONE zone; RETURN used<cap; END $$;
ALTER POLICY prime99_notifications_read ON public.notifications USING(public.paid_alert_ready(auth.uid()));
CREATE OR REPLACE FUNCTION public.review_prime99(_id uuid,_approve boolean,_note text DEFAULT '') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE p public.prime99_payments; BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'ADMIN_ONLY'; END IF;
 SELECT * INTO p FROM public.prime99_payments WHERE id=_id FOR UPDATE; IF p.id IS NULL OR p.status<>'pending' THEN RAISE EXCEPTION 'NO_PENDING_PAYMENT'; END IF;
 PERFORM 1 FROM public.profiles WHERE id=p.user_id FOR UPDATE;
 UPDATE public.prime99_payments SET status=CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,received_at=CASE WHEN _approve THEN now() ELSE NULL END,ends_at=CASE WHEN _approve AND p.payment_purpose='membership' THEN now()+interval '40 days' ELSE NULL END,alerts_start_at=CASE WHEN _approve AND p.payment_purpose='membership' THEN now()+interval '3 days' ELSE NULL END,reviewed_by=auth.uid(),review_note=left(coalesce(_note,''),500) WHERE id=_id;
 IF _approve AND p.payment_purpose='membership' THEN
 INSERT INTO public.monthly_post_periods(user_id,starts_at,ends_at) VALUES(p.user_id,now(),now()+interval '1 month') ON CONFLICT(user_id) DO UPDATE SET starts_at=excluded.starts_at,ends_at=excluded.ends_at WHERE monthly_post_periods.ends_at<=now();
 PERFORM public.confirm_referral_cash(p.user_id,p.reference,p.payable_amount::bigint*100);
 END IF; END $$;
CREATE OR REPLACE FUNCTION public.guard_monthly_three_posts() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE anchor public.monthly_post_periods; used integer; credit uuid; BEGIN
 PERFORM 1 FROM public.profiles WHERE id=NEW.user_id FOR UPDATE;
 SELECT * INTO anchor FROM public.monthly_post_periods WHERE user_id=NEW.user_id;
 IF anchor.user_id IS NULL OR anchor.ends_at<=now() THEN INSERT INTO public.monthly_post_periods(user_id,starts_at,ends_at) VALUES(NEW.user_id,now(),now()+interval '1 month') ON CONFLICT(user_id) DO UPDATE SET starts_at=excluded.starts_at,ends_at=excluded.ends_at RETURNING * INTO anchor; END IF;
 SELECT count(*) INTO used FROM public.monthly_post_usage WHERE user_id=NEW.user_id AND used_at>=anchor.starts_at AND used_at<anchor.ends_at;
 IF used>=3 THEN SELECT id INTO credit FROM public.prime99_payments WHERE user_id=NEW.user_id AND payment_purpose='extra_post' AND payable_amount=49 AND status='approved' AND used_post_id IS NULL ORDER BY received_at,id LIMIT 1 FOR UPDATE; IF credit IS NULL THEN RAISE EXCEPTION 'MONTHLY_THREE_POST_LIMIT'; END IF; UPDATE public.prime99_payments SET used_post_id=NEW.id WHERE id=credit; END IF;
 INSERT INTO public.monthly_post_usage(post_id,user_id) VALUES(NEW.id,NEW.user_id); RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.guard_post_delay() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN IF TG_OP='INSERT' THEN NEW.visible_after:=CASE WHEN public.has_prime99(NEW.user_id) OR EXISTS(SELECT 1 FROM public.account_programs WHERE user_id=NEW.user_id AND sharing_active) THEN now() ELSE now()+interval '5 hours' END; ELSIF NEW.visible_after IS DISTINCT FROM OLD.visible_after AND coalesce(current_setting('app.post_review',true),'')<>'1' THEN RAISE EXCEPTION 'POST_DELAY_PROTECTED'; END IF; RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.vehicle_public_details(_post uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT jsonb_build_object('vehicle_name',vehicle_name) FROM public.posts WHERE id=_post AND module='vehicle' AND status='active' AND (visible_after IS NULL OR visible_after<=now()) AND public.account_allowed(user_id) $$;
REVOKE SELECT(vehicle_number,driver_name,contact_phone,public_photo,public_brand) ON public.posts FROM anon,authenticated;
CREATE OR REPLACE FUNCTION public.can_post_chat(_post uuid DEFAULT NULL,_other uuid DEFAULT NULL) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT auth.uid() IS NOT NULL AND auth.uid()<>_other AND public.account_allowed(auth.uid()) AND public.account_allowed(_other) AND CASE WHEN _post IS NULL THEN _other=public.support_admin_id() OR public.has_role(auth.uid(),'admin') OR (public.has_prime99(auth.uid()) AND EXISTS(SELECT 1 FROM public.messages WHERE post_id IS NULL AND ((sender_id=auth.uid() AND receiver_id=_other) OR (receiver_id=auth.uid() AND sender_id=_other)))) ELSE public.has_prime99(auth.uid()) AND EXISTS(SELECT 1 FROM public.post_chat_pairs WHERE post_id=_post AND ((member_id=auth.uid() AND owner_id=_other) OR (owner_id=auth.uid() AND member_id=_other))) END $$;
CREATE OR REPLACE FUNCTION public.ring_post(_post_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE p public.posts; caller uuid:=auth.uid(); BEGIN
 IF caller IS NULL OR NOT public.account_allowed(caller) THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
 IF NOT public.has_prime99(caller) THEN RAISE EXCEPTION 'PAID_CHAT_REQUIRED'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.account_programs WHERE user_id=caller) THEN RAISE EXCEPTION 'PROFILE_REQUIRED'; END IF;
 SELECT * INTO p FROM public.posts WHERE id=_post_id AND status='active' AND (visible_after IS NULL OR visible_after<=now()) AND (job_expires_at IS NULL OR job_expires_at>now()) AND public.account_allowed(user_id);
 IF p.id IS NULL OR p.user_id=caller THEN RAISE EXCEPTION 'POST_UNAVAILABLE'; END IF;
 UPDATE public.profiles SET bell_activated_at=coalesce(bell_activated_at,now()) WHERE id=caller;
 INSERT INTO public.post_chat_pairs(post_id,member_id,owner_id) VALUES(p.id,caller,p.user_id) ON CONFLICT DO NOTHING;
 PERFORM set_config('app.bell_notice','interest',true);
 PERFORM 1 FROM public.profiles WHERE id=p.user_id FOR UPDATE;
 IF public.can_notify(p.user_id) THEN INSERT INTO public.notifications(user_id,post_id,message) VALUES(p.user_id,p.id,'మీ ప్రకటనపై సమాచారం కోరారు · Someone rang your post bell'); END IF;
 IF NOT EXISTS(SELECT 1 FROM public.messages WHERE post_id=p.id AND sender_id=caller AND receiver_id=p.user_id) THEN INSERT INTO public.messages(sender_id,receiver_id,post_id,body) VALUES(caller,p.user_id,p.id,'హాయ్ · Hi'); END IF;
 PERFORM set_config('app.bell_notice','',true); RETURN p.user_id; END $$;
CREATE OR REPLACE FUNCTION public.dispatch_daily_referral_board() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE person record; notice uuid; today date:=(now() AT TIME ZONE 'Asia/Kolkata')::date; n integer:=0; BEGIN
 FOR person IN SELECT p.id,r.joins,r.rank_no FROM public.profiles p JOIN public.referral_vip_ranks() r ON r.user_id=p.id WHERE public.can_notify(p.id) AND NOT EXISTS(SELECT 1 FROM public.daily_referral_board_notices d WHERE d.user_id=p.id AND d.day>today-3) ORDER BY p.id LIMIT 200 LOOP
 PERFORM 1 FROM public.profiles WHERE id=person.id FOR UPDATE;
 IF public.can_notify(person.id) AND NOT EXISTS(SELECT 1 FROM public.daily_referral_board_notices d WHERE d.user_id=person.id AND d.day>today-3) THEN
 INSERT INTO public.daily_referral_board_notices(user_id,day) VALUES(person.id,today) ON CONFLICT DO NOTHING;
 IF FOUND THEN notice:=NULL; INSERT INTO public.notifications(user_id,message) VALUES(person.id,'మీ ద్వారా '||person.joins||' నిజమైన చేరికలు. మీ ప్రస్తుత స్థానం: '||person.rank_no||'. '||CASE WHEN person.rank_no=1 THEN 'మీరు మొదటి స్థానంలో ఉన్నారు; ఇదే విధంగా కొనసాగించండి.' ELSE 'మీ స్థానాన్ని మీ పేజీలో చూడండి.' END) RETURNING id INTO notice;
 IF notice IS NOT NULL THEN UPDATE public.daily_referral_board_notices SET notification_id=notice WHERE user_id=person.id AND day=today; n:=n+1; END IF; END IF; END IF; END LOOP; RETURN n; END $$;
CREATE FUNCTION public.admin_video_notice(_url text,_message text) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'ADMIN_ONLY'; END IF; IF _url !~ '^https://[^[:space:]]+$' OR length(_url)>500 OR length(trim(_message))<1 OR length(_message)>1000 THEN RAISE EXCEPTION 'INVALID_VIDEO_NOTICE'; END IF; RETURN public.admin_broadcast(trim(_message)||' '||_url); END $$;
REVOKE ALL ON FUNCTION public.admin_video_notice(text,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.admin_video_notice(text,text) TO authenticated;