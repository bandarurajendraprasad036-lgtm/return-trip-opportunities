CREATE OR REPLACE FUNCTION public.enforce_paid_chat_message() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.role()='service_role' AND (public.has_role(NEW.sender_id,'admin') OR public.has_role(NEW.receiver_id,'admin')) THEN RETURN NEW; END IF;
 IF current_setting('app.membership_evidence',true)='1' AND NEW.post_id IS NULL AND NEW.is_auto AND (
   public.has_role(NEW.sender_id,'admin') OR (
     NEW.sender_id=auth.uid() AND public.has_role(NEW.receiver_id,'admin') AND
     (NEW.image_path='' OR NEW.image_path LIKE NEW.sender_id::text||'/%')
   )
 ) THEN RETURN NEW; END IF;
 IF NOT public.can_post_chat(NEW.post_id,NEW.receiver_id) AND NOT public.has_role(NEW.sender_id,'admin') THEN RAISE EXCEPTION 'PAID_CHAT_OR_PRIVATE_PAIR_REQUIRED'; END IF;
 RETURN NEW;
END $$;

CREATE POLICY membership_screenshot_owner_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
 bucket_id='chat-images' AND (storage.foldername(name))[1]=auth.uid()::text AND public.account_allowed(auth.uid())
 AND metadata->>'mimetype' IN ('image/jpeg','image/png','image/webp')
 AND (metadata->>'size')::numeric>0 AND (metadata->>'size')::numeric<=5242880
);

CREATE POLICY membership_screenshot_unattached_owner_delete ON storage.objects FOR DELETE TO authenticated
USING (
 bucket_id='chat-images' AND (storage.foldername(name))[1]=auth.uid()::text
 AND NOT EXISTS(SELECT 1 FROM public.messages m WHERE m.image_path=objects.name)
);

CREATE OR REPLACE FUNCTION public.submit_membership_screenshot(_amount integer,_beneficiary uuid,_reference text,_path text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE payer uuid:=auth.uid(); target uuid:=COALESCE(_beneficiary,auth.uid()); admin_id uuid:=public.support_admin_id(); mid uuid; rid uuid;
BEGIN
 IF payer IS NULL OR admin_id IS NULL OR NOT public.account_allowed(payer) OR NOT public.account_allowed(target) THEN RAISE EXCEPTION 'ACCOUNT_REQUIRED'; END IF;
 IF _amount NOT IN(80,100) OR _reference IS NULL OR _reference !~ '^screenshot:[0-9a-f]{64}$' THEN RAISE EXCEPTION 'INVALID_PAYMENT_EVIDENCE'; END IF;
 IF _path IS NULL OR _path NOT LIKE payer::text||'/%' OR NOT EXISTS(
   SELECT 1 FROM storage.objects o WHERE o.bucket_id='chat-images' AND o.name=_path AND o.owner_id=payer::text
   AND o.metadata->>'mimetype' IN ('image/jpeg','image/png','image/webp')
   AND (o.metadata->>'size')::numeric>0 AND (o.metadata->>'size')::numeric<=5242880
 ) THEN RAISE EXCEPTION 'IMAGE_REQUIRED'; END IF;
 PERFORM set_config('app.membership_evidence','1',true);
 INSERT INTO public.messages(sender_id,receiver_id,body,image_path,needs_admin,is_auto)
 VALUES(payer,admin_id,'కొత్త పేమెంట్ వచ్చింది. ₹'||_amount||' స్క్రీన్ షాట్ చూడండి',_path,true,true) RETURNING id INTO mid;
 rid:=public.register_membership_evidence(payer,target,_amount,_reference,mid);
 PERFORM public.hold_membership_evidence_for_admin(rid);
 RETURN rid;
END $$;
REVOKE ALL ON FUNCTION public.submit_membership_screenshot(integer,uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_membership_screenshot(integer,uuid,text,text) TO authenticated;
COMMENT ON FUNCTION public.submit_membership_screenshot(integer,uuid,text,text) IS 'Private screenshot upload registration and revoked pending access are atomic; only an administrator can approve membership.';