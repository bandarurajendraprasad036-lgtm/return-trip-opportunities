CREATE TABLE public.additional_phone_recipients (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 phone text NOT NULL CHECK (phone ~ '^[6-9][0-9]{9}$'),
 owner_consent boolean NOT NULL DEFAULT false,
 recipient_consent_at timestamptz,
 verified_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 removed_at timestamptz,
 UNIQUE(owner_id,phone),
 CHECK (verified_at IS NULL OR recipient_consent_at IS NOT NULL)
);
GRANT SELECT ON public.additional_phone_recipients TO authenticated;
GRANT ALL ON public.additional_phone_recipients TO service_role;
ALTER TABLE public.additional_phone_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY additional_phone_recipients_owner_admin_read ON public.additional_phone_recipients FOR SELECT TO authenticated USING(owner_id=auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.additional_recipient_payments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 recipient_id uuid NOT NULL REFERENCES public.additional_phone_recipients(id),
 payer_id uuid NOT NULL REFERENCES public.profiles(id),
 amount integer NOT NULL DEFAULT 80 CHECK(amount=80),
 reference text NOT NULL UNIQUE,
 message_id uuid NOT NULL REFERENCES public.messages(id),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN('pending','approved','rejected')),
 submitted_at timestamptz NOT NULL DEFAULT now(),
 reviewed_at timestamptz,
 reviewed_by uuid
);
GRANT SELECT ON public.additional_recipient_payments TO authenticated;
GRANT ALL ON public.additional_recipient_payments TO service_role;
ALTER TABLE public.additional_recipient_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY additional_recipient_payments_owner_admin_read ON public.additional_recipient_payments FOR SELECT TO authenticated USING(payer_id=auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE FUNCTION public.add_additional_phone_recipient(_phone text,_consent boolean) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE rid uuid; own_phone text;
BEGIN
 IF auth.uid() IS NULL OR NOT public.account_allowed(auth.uid()) THEN RAISE EXCEPTION 'ACCOUNT_REQUIRED'; END IF;
 IF NOT _consent OR trim(_phone) !~ '^[6-9][0-9]{9}$' THEN RAISE EXCEPTION 'VALID_PHONE_AND_CONSENT_REQUIRED'; END IF;
 SELECT phone INTO own_phone FROM public.profiles WHERE id=auth.uid();
 IF own_phone=trim(_phone) THEN RAISE EXCEPTION 'OWN_NUMBER_NOT_ADDITIONAL'; END IF;
 PERFORM 1 FROM public.profiles WHERE id=auth.uid() FOR UPDATE;
 INSERT INTO public.additional_phone_recipients(owner_id,phone,owner_consent) VALUES(auth.uid(),trim(_phone),true)
 ON CONFLICT(owner_id,phone) DO UPDATE SET owner_consent=true,removed_at=NULL RETURNING id INTO rid;
 RETURN rid;
END $$;
REVOKE ALL ON FUNCTION public.add_additional_phone_recipient(text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.add_additional_phone_recipient(text,boolean) TO authenticated;

CREATE FUNCTION public.my_additional_phone_recipients() RETURNS TABLE(id uuid,phone text,verified_at timestamptz,recipient_consent_at timestamptz,created_at timestamptz,payment_status text,approved_at timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT r.id,r.phone,r.verified_at,r.recipient_consent_at,r.created_at,coalesce(p.status,'not_paid'),CASE WHEN p.status='approved' THEN p.reviewed_at END
 FROM public.additional_phone_recipients r
 LEFT JOIN LATERAL(SELECT a.status,a.reviewed_at FROM public.additional_recipient_payments a WHERE a.recipient_id=r.id ORDER BY a.submitted_at DESC LIMIT 1) p ON true
 WHERE r.owner_id=auth.uid() AND r.removed_at IS NULL ORDER BY r.created_at
$$;
REVOKE ALL ON FUNCTION public.my_additional_phone_recipients() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.my_additional_phone_recipients() TO authenticated;

CREATE FUNCTION public.my_additional_recipient_requests() RETURNS TABLE(id uuid,owner_id uuid,phone text,created_at timestamptz) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE auth_phone text; confirmed timestamptz; local_phone text;
BEGIN
 IF auth.uid() IS NULL THEN RETURN; END IF;
 SELECT u.phone,u.phone_confirmed_at INTO auth_phone,confirmed FROM auth.users u WHERE u.id=auth.uid();
 IF confirmed IS NULL OR auth_phone IS NULL THEN RETURN; END IF;
 local_phone:=regexp_replace(auth_phone,'^\+91','');
 RETURN QUERY SELECT r.id,r.owner_id,r.phone,r.created_at FROM public.additional_phone_recipients r WHERE r.phone=local_phone AND r.owner_consent AND r.verified_at IS NULL AND r.removed_at IS NULL ORDER BY r.created_at;
END $$;
REVOKE ALL ON FUNCTION public.my_additional_recipient_requests() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.my_additional_recipient_requests() TO authenticated;

CREATE FUNCTION public.consent_additional_phone_recipient(_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE auth_phone text; confirmed timestamptz; local_phone text;
BEGIN
 IF auth.uid() IS NULL OR NOT public.account_allowed(auth.uid()) THEN RAISE EXCEPTION 'ACCOUNT_REQUIRED'; END IF;
 SELECT u.phone,u.phone_confirmed_at INTO auth_phone,confirmed FROM auth.users u WHERE u.id=auth.uid();
 IF confirmed IS NULL OR auth_phone IS NULL THEN RAISE EXCEPTION 'VERIFIED_PHONE_REQUIRED'; END IF;
 local_phone:=regexp_replace(auth_phone,'^\+91','');
 UPDATE public.additional_phone_recipients r SET recipient_consent_at=now(),verified_at=now()
 WHERE r.id=_id AND r.phone=local_phone AND r.owner_consent AND r.verified_at IS NULL AND r.removed_at IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'RECIPIENT_REQUEST_NOT_FOUND'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.consent_additional_phone_recipient(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.consent_additional_phone_recipient(uuid) TO authenticated;

CREATE FUNCTION public.submit_additional_recipient_screenshot(_recipient uuid,_reference text,_path text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE payer uuid:=auth.uid(); admin_id uuid:=public.support_admin_id(); mid uuid; pid uuid; target public.additional_phone_recipients;
BEGIN
 IF payer IS NULL OR admin_id IS NULL OR NOT public.account_allowed(payer) THEN RAISE EXCEPTION 'ACCOUNT_REQUIRED'; END IF;
 SELECT * INTO target FROM public.additional_phone_recipients WHERE id=_recipient AND owner_id=payer AND removed_at IS NULL FOR UPDATE;
 IF target.id IS NULL OR target.verified_at IS NULL OR target.recipient_consent_at IS NULL THEN RAISE EXCEPTION 'VERIFIED_RECIPIENT_CONSENT_REQUIRED'; END IF;
 IF _reference IS NULL OR _reference !~ '^screenshot:[0-9a-f]{64}$' THEN RAISE EXCEPTION 'INVALID_PAYMENT_EVIDENCE'; END IF;
 IF _path IS NULL OR _path NOT LIKE payer::text||'/%' OR NOT EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='chat-images' AND o.name=_path AND o.owner_id=payer::text AND o.metadata->>'mimetype' IN('image/jpeg','image/png','image/webp') AND (o.metadata->>'size')::numeric>0 AND (o.metadata->>'size')::numeric<=5242880) THEN RAISE EXCEPTION 'IMAGE_REQUIRED'; END IF;
 SELECT a.id INTO pid FROM public.additional_recipient_payments a WHERE a.reference=_reference;
 IF pid IS NOT NULL THEN
  IF EXISTS(SELECT 1 FROM public.additional_recipient_payments a WHERE a.id=pid AND a.recipient_id=_recipient AND a.payer_id=payer) THEN RETURN pid; END IF;
  RAISE EXCEPTION 'REFERENCE_ALREADY_USED';
 END IF;
 IF EXISTS(SELECT 1 FROM public.membership_requests m WHERE m.reference=_reference) OR EXISTS(SELECT 1 FROM public.prime99_payments p WHERE p.reference=_reference) OR EXISTS(SELECT 1 FROM public.referral_cash_receipts c WHERE c.reference=_reference) THEN RAISE EXCEPTION 'REFERENCE_ALREADY_USED'; END IF;
 IF EXISTS(SELECT 1 FROM public.additional_recipient_payments a WHERE a.recipient_id=_recipient AND a.status='pending') THEN RAISE EXCEPTION 'REVIEW_PENDING'; END IF;
 PERFORM set_config('app.membership_evidence','1',true);
 INSERT INTO public.messages(sender_id,receiver_id,body,image_path,needs_admin,is_auto) VALUES(payer,admin_id,'అదనపు నంబరుకు ₹80 చెల్లింపు స్క్రీన్ షాట్ చూడండి',_path,true,true) RETURNING id INTO mid;
 INSERT INTO public.additional_recipient_payments(recipient_id,payer_id,amount,reference,message_id) VALUES(_recipient,payer,80,_reference,mid) RETURNING id INTO pid;
 RETURN pid;
END $$;
REVOKE ALL ON FUNCTION public.submit_additional_recipient_screenshot(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_additional_recipient_screenshot(uuid,text,text) TO authenticated;

CREATE FUNCTION public.review_additional_recipient_payment(_id uuid,_approve boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.additional_recipient_payments;
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'ADMIN_ONLY'; END IF;
 SELECT * INTO p FROM public.additional_recipient_payments WHERE id=_id FOR UPDATE;
 IF p.id IS NULL OR p.status<>'pending' THEN RAISE EXCEPTION 'REVIEW_REQUIRED'; END IF;
 UPDATE public.additional_recipient_payments SET status=CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,reviewed_at=now(),reviewed_by=auth.uid() WHERE id=_id;
 INSERT INTO public.messages(sender_id,receiver_id,body,is_auto) VALUES(auth.uid(),p.payer_id,CASE WHEN _approve THEN 'అదనపు నంబరు ₹80 చెల్లింపును నిర్వాహకులు ఆమోదించారు.' ELSE 'అదనపు నంబరు చెల్లింపు నిర్ధారణ కాలేదు. నిర్వాహకులతో చాట్ చేయండి.' END,true);
END $$;
REVOKE ALL ON FUNCTION public.review_additional_recipient_payment(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_additional_recipient_payment(uuid,boolean) TO authenticated;
COMMENT ON TABLE public.additional_phone_recipients IS 'Private additional phones; owner attestation plus recipient code-verified account consent are required before payment eligibility.';
COMMENT ON TABLE public.additional_recipient_payments IS 'Separate ₹80 additional-recipient receipts; approval never creates or extends ordinary ₹100 membership access.';