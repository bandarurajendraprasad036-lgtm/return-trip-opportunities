CREATE OR REPLACE FUNCTION public.auto_confirm_membership_evidence(_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.membership_requests; receipt uuid; ref uuid; prize bigint; admin_id uuid;
BEGIN
 SELECT * INTO r FROM public.membership_requests WHERE id=_id FOR UPDATE;
 IF r.id IS NULL OR r.status<>'pending' THEN RETURN; END IF;
 admin_id:=public.support_admin_id();
 UPDATE public.membership_requests SET status='approved',reviewed_at=now(),note='automatic: payee name and UTR matched' WHERE id=_id;
 UPDATE public.membership_access SET source='confirmed',starts_at=now(),ends_at=now()+interval '1 month',revoked_at=NULL WHERE request_id=_id;
 IF NOT EXISTS(SELECT 1 FROM public.membership_access WHERE request_id=_id) THEN
  INSERT INTO public.membership_access(user_id,request_id,source) VALUES(r.user_id,_id,'confirmed');
 END IF;
 IF r.payer_id=r.user_id AND admin_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.referral_cash_receipts WHERE reference=r.reference) THEN
  INSERT INTO public.referral_cash_receipts(user_id,reference,amount_paise,confirmed_by) VALUES(r.user_id,r.reference,r.amount::bigint*100,admin_id) RETURNING id INTO receipt;
  SELECT referrer_id INTO ref FROM public.referral_vip_joins WHERE joined_user=r.user_id;
  IF ref IS NOT NULL AND public.has_prime99(ref) THEN prize:=(r.amount::bigint*100*20)/100;
   IF prize>0 THEN INSERT INTO public.referral_cash_rewards(receipt_id,user_id,amount_paise) VALUES(receipt,ref,prize); END IF;
  END IF;
 END IF;
 IF admin_id IS NOT NULL THEN
  INSERT INTO public.messages(sender_id,receiver_id,body,is_auto) VALUES(admin_id,r.user_id,'మీ చెల్లింపు అందింది. మీ ప్రైమ్ ఆన్ అయింది - గంట, చాట్ తెరుచుకున్నాయి. ధన్యవాదాలు!',true);
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.auto_confirm_membership_evidence(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.auto_confirm_membership_evidence(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.hold_membership_evidence_for_admin(_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 UPDATE public.membership_requests SET note='automatic check unclear: admin must verify' WHERE id=_id AND status='pending';
 UPDATE public.membership_access SET revoked_at=now() WHERE request_id=_id AND source='provisional' AND revoked_at IS NULL
  AND EXISTS(SELECT 1 FROM public.membership_requests WHERE id=_id AND status='pending');
END $$;
REVOKE ALL ON FUNCTION public.hold_membership_evidence_for_admin(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.hold_membership_evidence_for_admin(uuid) TO service_role;