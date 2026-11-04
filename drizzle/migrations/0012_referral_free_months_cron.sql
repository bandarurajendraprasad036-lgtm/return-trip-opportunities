CREATE EXTENSION IF NOT EXISTS pg_cron;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS free_months integer NOT NULL DEFAULT 0;
CREATE OR REPLACE FUNCTION public.guard_referral_fields() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_setting('app.trusted', true) = '1' OR public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  IF NEW.referral_code IS DISTINCT FROM OLD.referral_code OR NEW.referred_by IS DISTINCT FROM OLD.referred_by
     OR NEW.referred_at IS DISTINCT FROM OLD.referred_at OR NEW.prime_until IS DISTINCT FROM OLD.prime_until
     OR NEW.free_months IS DISTINCT FROM OLD.free_months THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  RETURN NEW;
END $$;
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
      UPDATE public.profiles SET free_months = free_months + 1, prime_until = (greatest(coalesce(prime_until, today), today) + interval '1 month')::date WHERE id = ref.id;
      INSERT INTO public.notifications(user_id, message) VALUES (ref.id, '🎉 ఈ నెల '||cnt||' మందిని చేర్పించారు! మీకు 1 నెల ఉచితం · You earned 1 free month!');
    END IF;
  END IF;
  RETURN true;
END $$;