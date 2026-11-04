CREATE OR REPLACE FUNCTION public.send_referral_reminders() RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE today date := (now() AT TIME ZONE 'Asia/Kolkata')::date; until date; tgt int; n int := 0; r record;
BEGIN
  SELECT nullif(value,'')::date INTO until FROM public.app_settings WHERE key='referral_offer_until';
  IF until IS NOT NULL AND today > until THEN RETURN 0; END IF;
  tgt := public.referral_target(today);
  FOR r IN
    SELECT p.id, (SELECT count(*) FROM public.profiles c WHERE c.referred_by = p.id
             AND date_trunc('month', c.referred_at AT TIME ZONE 'Asia/Kolkata') = date_trunc('month', now() AT TIME ZONE 'Asia/Kolkata')) AS cnt
    FROM public.profiles p WHERE p.is_prime
  LOOP
    IF r.cnt % tgt <> 0 OR r.cnt = 0 THEN
      INSERT INTO public.notifications(user_id, message) VALUES (r.id,
        '🙏 శుభోదయం! ఇంకొక్క '||(tgt - r.cnt % tgt)||' మందిని మీ రిఫరల్ కోడ్‌తో చేర్పిస్తే ఈ నెల పూర్తవుతుంది, వచ్చే నెల ఉచితం! ఈరోజు 3 మందిని చేర్పించండి · Just '||(tgt - r.cnt % tgt)||' more to get next month free!');
      n := n + 1;
    END IF;
  END LOOP;
  RETURN n;
END $$;
REVOKE EXECUTE ON FUNCTION public.send_referral_reminders() FROM PUBLIC, anon, authenticated;