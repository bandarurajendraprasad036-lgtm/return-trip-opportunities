DROP POLICY membership_screenshot_owner_insert ON storage.objects;
CREATE POLICY membership_screenshot_owner_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
 bucket_id='chat-images' AND (storage.foldername(name))[1]=auth.uid()::text AND public.account_allowed(auth.uid())
 AND lower(name) ~ '\.(jpe?g|png|webp)$'
);