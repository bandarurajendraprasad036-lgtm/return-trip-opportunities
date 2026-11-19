ALTER TABLE public.membership_requests ALTER COLUMN vehicle_plan_months SET DEFAULT 3;
ALTER TABLE public.prime99_payments ADD COLUMN IF NOT EXISTS plan_months integer NOT NULL DEFAULT 1;
ALTER TABLE public.prime99_payments ALTER COLUMN plan_months SET DEFAULT 3;
CREATE OR REPLACE FUNCTION public.mark_new_vehicle_plan() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF NEW.amount<>100 THEN RAISE EXCEPTION 'RETIRED_PAYMENT_PLAN'; END IF; NEW.vehicle_plan_months:=3; RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.my_membership_price() RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT 100; $$;
CREATE OR REPLACE FUNCTION public.enforce_only_current_subscription() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF TG_TABLE_NAME IN ('membership_payments','additional_recipient_payments') THEN RAISE EXCEPTION 'RETIRED_PAYMENT_PLAN'; END IF;
 IF NEW.payable_amount<>100 OR NEW.payment_purpose<>'membership' THEN RAISE EXCEPTION 'RETIRED_PAYMENT_PLAN'; END IF;
 NEW.plan_months:=3; RETURN NEW;
END $$;
CREATE TRIGGER current_subscription_only BEFORE INSERT ON public.prime99_payments FOR EACH ROW EXECUTE FUNCTION public.enforce_only_current_subscription();
CREATE TRIGGER retire_legacy_membership_purchase BEFORE INSERT ON public.membership_payments FOR EACH ROW EXECUTE FUNCTION public.enforce_only_current_subscription();
CREATE TRIGGER retire_additional_recipient_purchase BEFORE INSERT ON public.additional_recipient_payments FOR EACH ROW EXECUTE FUNCTION public.enforce_only_current_subscription();
DO $migration$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.register_membership_evidence(uuid,uuid,integer,text,uuid)'::regprocedure) INTO definition;
 definition:=replace(definition,'_amount NOT IN(49,80,100)','_amount<>100');
 definition:=replace(definition,'_amount NOT IN (49,80,100)','_amount<>100');
 definition:=replace(definition,'IF _payer<>_user THEN','IF _payer<>_user THEN RAISE EXCEPTION ''OWN_SUBSCRIPTION_REQUIRED''; END IF; IF _payer<>_user THEN');
 EXECUTE definition;
 SELECT pg_get_functiondef('public.submit_membership_screenshot(integer,uuid,text,text)'::regprocedure) INTO definition;
 definition:=replace(definition,'_amount NOT IN(49,80,100)','_amount<>100');
 definition:=replace(definition,'_amount NOT IN (49,80,100)','_amount<>100');
 EXECUTE definition;
 SELECT pg_get_functiondef('public.review_prime99(uuid,boolean,text)'::regprocedure) INTO definition;
 definition:=replace(definition,$old$THEN now()+interval '1 month' ELSE NULL END$old$,$new$THEN now()+make_interval(months=>p.plan_months) ELSE NULL END$new$);
 EXECUTE definition;
END $migration$;
CREATE OR REPLACE FUNCTION public.review_membership_evidence(_id uuid,_approve boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.membership_requests;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'ADMIN_ONLY'; END IF;
 SELECT * INTO r FROM public.membership_requests WHERE id=_id FOR UPDATE;
 IF r.id IS NULL OR r.status<>'pending' THEN RAISE EXCEPTION 'REVIEW_REQUIRED'; END IF;
 UPDATE public.membership_requests SET status=CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,reviewed_at=now(),reviewed_by=auth.uid() WHERE id=_id;
 UPDATE public.membership_access SET feature_scope=CASE WHEN r.amount=49 THEN 'work' ELSE 'all' END,source=CASE WHEN _approve THEN 'confirmed' ELSE source END,starts_at=CASE WHEN _approve THEN now() ELSE starts_at END,ends_at=CASE WHEN _approve THEN now()+make_interval(months=>r.vehicle_plan_months) ELSE ends_at END,revoked_at=CASE WHEN _approve THEN NULL ELSE now() END,granted_by=auth.uid() WHERE request_id=_id;
 IF _approve AND r.payer_id=r.user_id THEN PERFORM public.confirm_referral_cash(r.user_id,r.reference,r.amount::bigint*100); END IF;
 INSERT INTO public.messages(sender_id,receiver_id,body,is_auto) VALUES(auth.uid(),r.user_id,CASE WHEN _approve THEN 'మీ చెల్లింపును నిర్వాహకులు ఆమోదించారు. మీ చందా '||r.vehicle_plan_months||' నెలలు. గంట, సంభాషణ ఉపయోగించవచ్చు. పేరు, ఫోటో, నంబరు దాచబడతాయి.' ELSE 'మీ చెల్లింపు నిర్ధారణ కాలేదు. నిర్వాహకులతో మాట్లాడండి.' END,true);
END $$;
REVOKE ALL ON FUNCTION public.enforce_only_current_subscription() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_only_current_subscription() TO service_role;
COMMENT ON TABLE public.membership_payments IS 'Historical receipts retained; new purchases use membership_requests at 100 for three calendar months.';
COMMENT ON TABLE public.additional_recipient_payments IS 'Historical receipts retained; new additional-recipient purchases retired.';