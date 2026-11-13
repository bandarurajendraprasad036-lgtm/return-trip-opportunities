CREATE OR REPLACE FUNCTION public.register_membership_evidence(_payer uuid,_user uuid,_amount integer,_reference text,_message uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.membership_requests; rid uuid;
BEGIN
 IF NOT public.account_allowed(_payer) OR NOT public.account_allowed(_user) THEN RAISE EXCEPTION 'ACCOUNT_REQUIRED'; END IF;
 IF _reference !~ '^[0-9]{12}$' OR _amount NOT IN(80,100) THEN RAISE EXCEPTION 'INVALID_PAYMENT_EVIDENCE'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.messages m WHERE m.id=_message AND m.sender_id=_payer AND public.has_role(m.receiver_id,'admin') AND m.image_path LIKE _payer::text||'/%') THEN RAISE EXCEPTION 'IMAGE_REQUIRED'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('membership-reference:'||_reference,0));
 PERFORM 1 FROM public.profiles WHERE id=_user FOR UPDATE;
 SELECT * INTO r FROM public.membership_requests WHERE reference=_reference FOR UPDATE;
 IF r.id IS NOT NULL THEN
  IF r.payer_id<>_payer OR r.user_id<>_user THEN RAISE EXCEPTION 'REFERENCE_ALREADY_USED'; END IF;
  IF r.status='rejected' THEN
   UPDATE public.membership_requests SET status='pending',message_id=_message,submitted_at=now(),reviewed_at=NULL,reviewed_by=NULL,note='' WHERE id=r.id;
  ELSIF r.status='pending' THEN
   UPDATE public.membership_requests SET message_id=_message WHERE id=r.id;
  END IF;
  RETURN r.id;
 END IF;
 IF _payer<>_user THEN
  IF _amount<>80 OR NOT EXISTS(SELECT 1 FROM public.referral_vip_joins WHERE joined_user=_user AND referrer_id=_payer) OR EXISTS(SELECT 1 FROM public.membership_requests WHERE user_id=_user AND payer_id<>user_id AND status<>'rejected') THEN RAISE EXCEPTION 'REFERRAL_REQUIRED'; END IF;
 ELSIF _amount=80 AND NOT EXISTS(SELECT 1 FROM public.provider_contact_batches WHERE user_id=_payer AND status='approved') THEN RAISE EXCEPTION 'CONTACT_APPROVAL_REQUIRED'; END IF;
 IF EXISTS(SELECT 1 FROM public.prime99_payments WHERE reference=_reference) OR EXISTS(SELECT 1 FROM public.referral_cash_receipts WHERE reference=_reference) THEN RAISE EXCEPTION 'REFERENCE_ALREADY_USED'; END IF;
 IF EXISTS(SELECT 1 FROM public.membership_requests WHERE user_id=_user AND status='pending') THEN RAISE EXCEPTION 'REVIEW_PENDING'; END IF;
 INSERT INTO public.membership_requests(payer_id,user_id,amount,reference,message_id) VALUES(_payer,_user,_amount,_reference,_message) RETURNING id INTO rid;
 INSERT INTO public.membership_access(user_id,request_id,source) VALUES(_user,rid,'provisional');
 INSERT INTO public.messages(sender_id,receiver_id,body,is_auto) VALUES(public.support_admin_id(),_user,'అడ్మిన్ వెరిఫికేషన్ కోసం వెయిటింగ్',true);
 INSERT INTO public.messages(sender_id,receiver_id,body,needs_admin,is_auto) VALUES(_payer,public.support_admin_id(),'UTR నంబర్, స్క్రీన్ షాట్ చూడండి',true,true);
 RETURN rid;
END $$;
REVOKE ALL ON FUNCTION public.register_membership_evidence(uuid,uuid,integer,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.register_membership_evidence(uuid,uuid,integer,text,uuid) TO service_role;