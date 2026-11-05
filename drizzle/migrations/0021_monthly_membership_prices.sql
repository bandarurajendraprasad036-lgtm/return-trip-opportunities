ALTER TABLE public.membership_payments DROP CONSTRAINT membership_amount;
ALTER TABLE public.membership_payments ALTER COLUMN amount SET DEFAULT 699;
ALTER TABLE public.membership_payments ADD CONSTRAINT membership_amount CHECK (amount IN (499,699,1999));

CREATE OR REPLACE FUNCTION public.validate_membership_plan() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.membership_type='individual' THEN
    IF NEW.amount<>699 OR cardinality(NEW.referral_numbers)<>0 THEN RAISE EXCEPTION 'INVALID_INDIVIDUAL_PLAN'; END IF;
  ELSIF NEW.membership_type='group' THEN
    IF NEW.amount<>1999 OR cardinality(NEW.referral_numbers)<>3 OR EXISTS(SELECT 1 FROM unnest(NEW.referral_numbers) n WHERE n IS NULL OR n !~ '^[6-9][0-9]{9}$') OR (SELECT count(DISTINCT n) FROM unnest(NEW.referral_numbers) n)<>3 THEN RAISE EXCEPTION 'INVALID_FOUR_PERSON_PLAN'; END IF;
  ELSE RAISE EXCEPTION 'INVALID_MEMBERSHIP_PLAN';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER validate_membership_plan BEFORE INSERT ON public.membership_payments FOR EACH ROW EXECUTE FUNCTION public.validate_membership_plan();

CREATE OR REPLACE FUNCTION public.review_membership(_id uuid, _approve boolean, _note text DEFAULT '') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.membership_payments; recipients uuid[]; member_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  SELECT * INTO p FROM public.membership_payments WHERE id=_id FOR UPDATE;
  IF NOT FOUND OR p.status<>'pending' THEN RAISE EXCEPTION 'No pending payment'; END IF;
  recipients:=ARRAY[p.user_id];
  IF _approve THEN
    IF p.membership_type='group' THEN
      IF p.amount<>1999 OR cardinality(p.referral_numbers)<>3 THEN RAISE EXCEPTION 'INVALID_FOUR_PERSON_PLAN'; END IF;
      SELECT array_agg(id ORDER BY id) INTO recipients FROM public.profiles WHERE id=p.user_id OR phone=ANY(p.referral_numbers);
      IF coalesce(cardinality(recipients),0)<>4 OR (SELECT count(DISTINCT phone) FROM public.profiles WHERE id=ANY(recipients) AND phone=ANY(p.referral_numbers))<>3 THEN RAISE EXCEPTION 'FOUR_DISTINCT_REGISTERED_MEMBERS_REQUIRED'; END IF;
    ELSIF p.membership_type<>'individual' OR p.amount NOT IN (499,699) THEN RAISE EXCEPTION 'INVALID_INDIVIDUAL_PLAN'; END IF;
    PERFORM id FROM public.profiles WHERE id=ANY(recipients) ORDER BY id FOR UPDATE;
    IF (SELECT count(*) FROM public.profiles WHERE id=ANY(recipients))<>cardinality(recipients) THEN RAISE EXCEPTION 'MEMBER_NOT_FOUND'; END IF;
    PERFORM set_config('app.trusted','1',true);
    UPDATE public.profiles SET is_prime=true, prime_until=(greatest(coalesce(prime_until,current_date),current_date)+interval '1 month')::date WHERE id=ANY(recipients);
    FOREACH member_id IN ARRAY recipients LOOP
      INSERT INTO public.notifications(user_id,message) VALUES(member_id, CASE WHEN p.membership_type='group' THEN 'నలుగురి ₹1,999 చెల్లింపు ఆమోదించబడింది; మీ సభ్యత్వానికి ఒక నెల జోడించాం · Group payment approved; one membership month added.' ELSE 'మీ ₹'||p.amount||' చెల్లింపు ఆమోదించబడింది; సభ్యత్వానికి ఒక నెల జోడించాం · Payment approved; one membership month added.' END);
    END LOOP;
  ELSE
    INSERT INTO public.notifications(user_id,message) VALUES(p.user_id,'మీ చెల్లింపు ఆమోదించబడలేదు · Payment not approved. '||left(coalesce(_note,''),200));
  END IF;
  UPDATE public.membership_payments SET status=CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,admin_note=left(coalesce(_note,''),500),reviewed_at=now() WHERE id=_id;
END $$;
REVOKE ALL ON FUNCTION public.review_membership(uuid,boolean,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_membership(uuid,boolean,text) TO authenticated;
GRANT ALL ON public.membership_payments TO service_role;
COMMENT ON FUNCTION public.validate_membership_plan() IS 'New submissions use monthly individual 699 or four-person 1999; legacy 499 records are preserved.';