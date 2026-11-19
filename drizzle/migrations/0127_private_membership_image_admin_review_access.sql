CREATE POLICY membership_review_images_admin_select ON storage.objects FOR SELECT TO authenticated USING(bucket_id='chat-images' AND public.has_role(auth.uid(),'admin') AND EXISTS(SELECT 1 FROM public.messages m JOIN public.membership_requests r ON r.message_id=m.id WHERE m.image_path=objects.name AND m.sender_id=r.payer_id));
CREATE FUNCTION public.check_my_new_mobile(_phone text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
IF _phone !~ '^[6-9][0-9]{9}$' THEN RAISE EXCEPTION 'VALID_MOBILE_REQUIRED'; END IF;
IF NOT public.my_phone_change_available() THEN RAISE EXCEPTION 'PHONE_CHANGE_ALREADY_USED'; END IF;
IF EXISTS(SELECT 1 FROM public.profiles p WHERE p.id<>auth.uid() AND right(regexp_replace(p.phone,'[^0-9]','','g'),10)=_phone) THEN RAISE EXCEPTION 'MOBILE_ALREADY_REGISTERED'; END IF;RETURN true;END $$;
REVOKE ALL ON FUNCTION public.check_my_new_mobile(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.check_my_new_mobile(text) TO authenticated;