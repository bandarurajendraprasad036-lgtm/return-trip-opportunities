ALTER TABLE public.post_sharing_evidence ADD COLUMN admin_note text NOT NULL DEFAULT '';
ALTER TABLE public.post_sharing_evidence ADD COLUMN expires_at timestamptz NOT NULL DEFAULT (now()+interval '24 hours');
ALTER TABLE public.post_sharing_evidence ADD COLUMN content_hashes text[] NOT NULL DEFAULT '{}';
CREATE TABLE public.evidence_content_registry(hash text PRIMARY KEY,user_id uuid NOT NULL REFERENCES public.profiles(id),created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.evidence_content_registry TO service_role;
ALTER TABLE public.evidence_content_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_only_recent_evidence_images ON storage.objects AS RESTRICTIVE FOR SELECT TO authenticated USING(bucket_id<>'sharing-evidence' OR (public.has_role(auth.uid(),'admin') AND created_at>now()-interval '24 hours'));
CREATE FUNCTION public.record_evidence_hashes(_claim uuid,_hashes text[]) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE c public.post_sharing_evidence; h text; BEGIN
SELECT * INTO c FROM public.post_sharing_evidence WHERE id=_claim FOR UPDATE; IF NOT FOUND OR c.content_hashes<>'{}' OR cardinality(_hashes)<>cardinality(c.paths) THEN RAISE EXCEPTION 'INVALID_HASHES'; END IF;
FOREACH h IN ARRAY _hashes LOOP IF h !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'INVALID_HASH'; END IF; INSERT INTO public.evidence_content_registry(hash,user_id) VALUES(h,c.user_id); END LOOP;
UPDATE public.post_sharing_evidence SET content_hashes=_hashes WHERE id=_claim; END $$;
REVOKE ALL ON FUNCTION public.record_evidence_hashes(uuid,text[]) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.record_evidence_hashes(uuid,text[]) TO service_role;
CREATE FUNCTION public.review_post_evidence_with_reason(_id uuid,_approve boolean,_note text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE c public.post_sharing_evidence; BEGIN
IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'ADMIN_ONLY'; END IF;
SELECT * INTO c FROM public.post_sharing_evidence WHERE id=_id FOR UPDATE; IF NOT FOUND OR c.status<>'pending' OR c.expires_at<=now() THEN RAISE EXCEPTION 'NO_PENDING_CLAIM_OR_EXPIRED'; END IF;
IF NOT _approve AND length(trim(_note))<2 THEN RAISE EXCEPTION 'REJECTION_REASON_REQUIRED'; END IF;
IF _approve AND cardinality(c.content_hashes)<>cardinality(c.paths) THEN RAISE EXCEPTION 'EVIDENCE_CHECK_REQUIRED'; END IF;
PERFORM public.review_post_evidence(_id,_approve);
UPDATE public.post_sharing_evidence SET admin_note=left(trim(_note),500) WHERE id=_id;
INSERT INTO public.notifications(user_id,message) VALUES(c.user_id,CASE WHEN _approve THEN 'మీ పంచుకున్న ఆధారాలు ఆమోదించారు · Sharing approved. ' ELSE 'మీ పంచుకున్న ఆధారాలు తిరస్కరించారు · Sharing rejected. ' END||left(trim(_note),500));
END $$;
REVOKE ALL ON FUNCTION public.review_post_evidence(uuid,boolean) FROM authenticated;
REVOKE ALL ON FUNCTION public.review_post_evidence_with_reason(uuid,boolean,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.review_post_evidence_with_reason(uuid,boolean,text) TO authenticated;