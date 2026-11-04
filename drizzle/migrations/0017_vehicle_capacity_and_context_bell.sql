ALTER TABLE public.posts ADD COLUMN capacity_tons numeric;
ALTER TABLE public.posts ADD CONSTRAINT posts_capacity_tons_valid CHECK (capacity_tons IS NULL OR (capacity_tons > 0 AND capacity_tons <= 100));
CREATE OR REPLACE FUNCTION public.ring_post(_post_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.posts; caller uuid := auth.uid();
BEGIN
 IF caller IS NULL THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
 SELECT * INTO p FROM public.posts WHERE id = _post_id AND status = 'active';
 IF NOT FOUND OR p.user_id = caller THEN RAISE EXCEPTION 'POST_UNAVAILABLE'; END IF;
 IF NOT public.can_notify(p.user_id) THEN RAISE EXCEPTION 'DAILY_ALERT_LIMIT'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.notifications WHERE user_id=p.user_id AND post_id=p.id AND matched_post_id IS NULL AND created_at > now()-interval '5 minutes' AND message LIKE '%సమాచారం కోరారు%') THEN
 INSERT INTO public.notifications(user_id,post_id,message) VALUES(p.user_id,p.id,'మీ ప్రకటనపై సమాచారం కోరారు · Someone is interested in your post');
 INSERT INTO public.messages(sender_id,receiver_id,post_id,body) VALUES(caller,p.user_id,p.id,'మీ ప్రకటనపై సమాచారం కావాలి · Interested in your post');
 END IF;
 RETURN p.user_id;
END $$;
REVOKE ALL ON FUNCTION public.ring_post(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ring_post(uuid) TO authenticated;
