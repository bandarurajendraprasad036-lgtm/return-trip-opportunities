ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by uuid;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS prime_until date;
UPDATE public.profiles SET referral_code = upper(substr(replace(id::text,'-',''),1,8)) WHERE referral_code IS NULL;
ALTER TABLE public.profiles ALTER COLUMN referral_code SET DEFAULT upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_key ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS profiles_referred_by_idx ON public.profiles(referred_by, referred_at);

-- Offer window end (hidden from users); 6 months from launch
INSERT INTO public.app_settings(key, value) VALUES ('referral_offer_until', (current_date + interval '6 months')::date::text)
ON CONFLICT (key) DO NOTHING;

-- Only trusted functions/admins may change referral/prime fields
CREATE OR REPLACE FUNCTION public.guard_referral_fields() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_setting('app.trusted', true) = '1' OR public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  IF NEW.referral_code IS DISTINCT FROM OLD.referral_code OR NEW.referred_by IS DISTINCT FROM OLD.referred_by
     OR NEW.referred_at IS DISTINCT FROM OLD.referred_at OR NEW.prime_until IS DISTINCT FROM OLD.prime_until THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS profiles_guard_referral ON public.profiles;
CREATE TRIGGER profiles_guard_referral BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.guard_referral_fields();

CREATE OR REPLACE FUNCTION public.referral_target(_d date) RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT 3 * extract(day from (date_trunc('month', _d) + interval '1 month - 1 day'))::int
$$;

-- New user applies a referral code (once, within 2 days of signup). Rewards referrer.
CREATE OR REPLACE FUNCTION public.apply_referral(_code text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me public.profiles; ref public.profiles; today date := (now() AT TIME ZONE 'Asia/Kolkata')::date; cnt int; tgt int; until date;
BEGIN
  SELECT * INTO me FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  IF NOT FOUND OR me.referred_by IS NOT NULL OR me.created_at < now() - interval '2 days' THEN RETURN false; END IF;
  SELECT * INTO ref FROM public.profiles WHERE referral_code = upper(trim(_code));
  IF NOT FOUND OR ref.id = me.id THEN RETURN false; END IF;
  PERFORM set_config('app.trusted','1',true);
  UPDATE public.profiles SET referred_by = ref.id, referred_at = now() WHERE id = me.id;
  SELECT nullif(value,'')::date INTO until FROM public.app_settings WHERE key='referral_offer_until';
  IF ref.is_prime AND (until IS NULL OR today <= until) THEN
    SELECT count(*) INTO cnt FROM public.profiles WHERE referred_by = ref.id
      AND date_trunc('month', referred_at AT TIME ZONE 'Asia/Kolkata') = date_trunc('month', now() AT TIME ZONE 'Asia/Kolkata');
    tgt := public.referral_target(today);
    IF cnt > 0 AND cnt % tgt = 0 THEN
      UPDATE public.profiles SET prime_until = (greatest(coalesce(prime_until, today), today) + interval '1 month')::date WHERE id = ref.id;
      INSERT INTO public.notifications(user_id, message) VALUES (ref.id, '🎉 ఈ నెల '||cnt||' మందిని చేర్పించారు! మీకు 1 నెల ఉచితం · You earned 1 free month!');
    END IF;
  END IF;
  RETURN true;
END $$;
GRANT EXECUTE ON FUNCTION public.apply_referral(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.my_referral_stats() RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT json_build_object(
    'month_count', (SELECT count(*) FROM public.profiles WHERE referred_by = auth.uid() AND date_trunc('month', referred_at AT TIME ZONE 'Asia/Kolkata') = date_trunc('month', now() AT TIME ZONE 'Asia/Kolkata')),
    'today_count', (SELECT count(*) FROM public.profiles WHERE referred_by = auth.uid() AND (referred_at AT TIME ZONE 'Asia/Kolkata')::date = (now() AT TIME ZONE 'Asia/Kolkata')::date),
    'target', public.referral_target((now() AT TIME ZONE 'Asia/Kolkata')::date),
    'offer_active', coalesce((SELECT (now() AT TIME ZONE 'Asia/Kolkata')::date <= nullif(value,'')::date FROM public.app_settings WHERE key='referral_offer_until'), true)
  )
$$;
GRANT EXECUTE ON FUNCTION public.my_referral_stats() TO authenticated;

CREATE OR REPLACE FUNCTION public.review_membership(_id uuid, _approve boolean, _note text DEFAULT ''::text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$ DECLARE p public.membership_payments; BEGIN IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin only'; END IF; SELECT * INTO p FROM public.membership_payments WHERE id=_id FOR UPDATE; IF NOT FOUND OR p.status<>'pending' THEN RAISE EXCEPTION 'No pending payment'; END IF; IF p.membership_type='group' AND _approve THEN RAISE EXCEPTION 'Group price and duration require confirmation'; END IF; UPDATE public.membership_payments SET status=CASE WHEN _approve THEN 'approved' ELSE 'rejected' END, admin_note=left(_note,500), reviewed_at=now() WHERE id=_id;
IF _approve THEN
  PERFORM set_config('app.trusted','1',true);
  UPDATE public.profiles SET is_prime=true, prime_until=(greatest(coalesce(prime_until,current_date),current_date)+interval '1 month')::date WHERE id=p.user_id;
  INSERT INTO public.notifications(user_id, message) VALUES (p.user_id, '✅ మీ ₹499 చెల్లింపు ఆమోదించబడింది! మీ రిఫరల్ కోడ్‌తో రోజుకు 3 మందిని చేర్పించండి, వచ్చే నెల ఉచితం పొందండి · Payment approved! Refer 3 people a day, get next month free.');
ELSE
  INSERT INTO public.notifications(user_id, message) VALUES (p.user_id, '❌ మీ చెల్లింపు ఆమోదించబడలేదు · Payment not approved. '||left(_note,200));
END IF; END $function$;