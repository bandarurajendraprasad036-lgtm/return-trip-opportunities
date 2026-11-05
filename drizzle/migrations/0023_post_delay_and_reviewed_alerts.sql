ALTER TABLE public.posts ADD COLUMN visible_after timestamptz;
CREATE TABLE public.post_sharing_evidence(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES public.profiles(id),post_id uuid NOT NULL REFERENCES public.posts(id),purpose text NOT NULL CHECK(purpose IN('early_publication','notifications')),paths text[] NOT NULL,status text NOT NULL DEFAULT 'pending' CHECK(status IN('pending','approved','rejected')),created_at timestamptz NOT NULL DEFAULT now(),reviewed_at timestamptz);
GRANT SELECT ON public.post_sharing_evidence TO authenticated; GRANT ALL ON public.post_sharing_evidence TO service_role;
ALTER TABLE public.post_sharing_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_post_evidence ON public.post_sharing_evidence FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE FUNCTION public.post_alert_eligible(_user uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id=_user AND is_prime AND prime_until>(now() AT TIME ZONE 'Asia/Kolkata')::date) OR EXISTS(SELECT 1 FROM public.post_sharing_evidence WHERE user_id=_user AND purpose='notifications' AND status='approved') $$;
CREATE POLICY delayed_publication_visibility ON public.posts AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(visible_after IS NULL OR visible_after<=now() OR user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE FUNCTION public.guard_post_delay() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF TG_OP='INSERT' THEN NEW.visible_after:=CASE WHEN EXISTS(SELECT 1 FROM public.job_post_entitlements WHERE user_id=NEW.user_id AND starts_at<=now() AND ends_at>now()) THEN now() ELSE now()+interval '5 hours' END;
ELSIF NEW.visible_after IS DISTINCT FROM OLD.visible_after AND current_setting('app.post_review',true) IS DISTINCT FROM '1' THEN RAISE EXCEPTION 'POST_REVIEW_REQUIRED'; END IF; RETURN NEW; END $$;
CREATE TRIGGER guard_post_delay BEFORE INSERT OR UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.guard_post_delay();
CREATE FUNCTION public.submit_post_evidence(_post uuid,_purpose text,_paths text[]) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE result uuid; path text; admin_id uuid; mobile text; expected integer; BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
SELECT phone INTO mobile FROM public.profiles WHERE id=auth.uid(); IF mobile IS NULL OR mobile !~ '^[6-9][0-9]{9}$' THEN RAISE EXCEPTION 'MOBILE_REQUIRED'; END IF;
IF NOT EXISTS(SELECT 1 FROM public.posts WHERE id=_post AND user_id=auth.uid()) THEN RAISE EXCEPTION 'OWN_POST_REQUIRED'; END IF;
expected:=CASE _purpose WHEN 'early_publication' THEN 11 WHEN 'notifications' THEN 10 ELSE 0 END;
IF expected=0 OR cardinality(_paths)<>expected OR (SELECT count(DISTINCT p) FROM unnest(_paths)p)<>expected THEN RAISE EXCEPTION 'STATUS_AND_SHARING_IMAGES_REQUIRED'; END IF;
FOREACH path IN ARRAY _paths LOOP IF path NOT LIKE auth.uid()::text||'/%' OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='sharing-evidence' AND name=path) OR EXISTS(SELECT 1 FROM public.post_sharing_evidence WHERE path=ANY(paths)) THEN RAISE EXCEPTION 'INVALID_EVIDENCE'; END IF; END LOOP;
admin_id:=public.support_admin_id(); IF admin_id IS NULL THEN RAISE EXCEPTION 'ADMIN_UNAVAILABLE'; END IF;
INSERT INTO public.post_sharing_evidence(user_id,post_id,purpose,paths) VALUES(auth.uid(),_post,_purpose,_paths) RETURNING id INTO result;
INSERT INTO public.messages(sender_id,receiver_id,post_id,body,needs_admin) VALUES(auth.uid(),admin_id,_post,'పంచుకున్న ఆధారాలు పరిశీలించండి · Review sharing evidence: '||result::text,true);
RETURN result; END $$;
CREATE FUNCTION public.review_post_evidence(_id uuid,_approve boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE claim public.post_sharing_evidence; BEGIN
IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'ADMIN_ONLY'; END IF;
SELECT * INTO claim FROM public.post_sharing_evidence WHERE id=_id FOR UPDATE; IF NOT FOUND OR claim.status<>'pending' THEN RAISE EXCEPTION 'NO_PENDING_CLAIM'; END IF;
UPDATE public.post_sharing_evidence SET status=CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,reviewed_at=now() WHERE id=_id;
IF _approve THEN PERFORM set_config('app.post_review','1',true); UPDATE public.posts SET visible_after=now() WHERE id=claim.post_id; END IF; END $$;
REVOKE ALL ON FUNCTION public.submit_post_evidence(uuid,text,text[]),public.review_post_evidence(uuid,boolean) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.submit_post_evidence(uuid,text,text[]),public.review_post_evidence(uuid,boolean) TO authenticated;
CREATE FUNCTION public.guard_new_match_notifications() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NEW.post_id IS NOT NULL AND (NOT public.post_alert_eligible(NEW.user_id) OR EXISTS(SELECT 1 FROM public.posts WHERE id IN(NEW.post_id,NEW.matched_post_id) AND (visible_after>now() OR job_expires_at<=now()))) THEN RETURN NULL; END IF; RETURN NEW; END $$;
CREATE TRIGGER guard_new_match_notifications BEFORE INSERT ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.guard_new_match_notifications();
CREATE POLICY protect_post_evidence_deletion ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated USING(bucket_id<>'sharing-evidence' OR NOT EXISTS(SELECT 1 FROM public.post_sharing_evidence WHERE name=ANY(paths)));
REVOKE ALL ON FUNCTION public.guard_post_delay(),public.guard_new_match_notifications() FROM PUBLIC,anon,authenticated;