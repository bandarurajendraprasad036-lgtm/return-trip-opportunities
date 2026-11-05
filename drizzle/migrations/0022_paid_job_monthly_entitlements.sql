CREATE TABLE public.job_post_entitlements(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id), payment_id uuid NOT NULL REFERENCES public.membership_payments(id), starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL, UNIQUE(user_id,payment_id));
GRANT SELECT ON public.job_post_entitlements TO authenticated; GRANT ALL ON public.job_post_entitlements TO service_role;
ALTER TABLE public.job_post_entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_job_entitlements ON public.job_post_entitlements FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TABLE public.job_post_uses(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), entitlement_id uuid NOT NULL REFERENCES public.job_post_entitlements(id), user_id uuid NOT NULL REFERENCES public.profiles(id), post_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.job_post_uses TO authenticated; GRANT ALL ON public.job_post_uses TO service_role;
ALTER TABLE public.job_post_uses ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_job_uses ON public.job_post_uses FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
ALTER TABLE public.posts ADD COLUMN job_expires_at timestamptz;
CREATE FUNCTION public.allocate_paid_job_entitlements() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NEW.status='approved' AND OLD.status='pending' AND NEW.amount=699 AND NEW.membership_type='individual' THEN
INSERT INTO public.job_post_entitlements(user_id,payment_id,starts_at,ends_at) SELECT id,NEW.id,(prime_until-interval '1 month') AT TIME ZONE 'Asia/Kolkata',prime_until::timestamp AT TIME ZONE 'Asia/Kolkata' FROM public.profiles WHERE id=NEW.user_id;
END IF; RETURN NEW; END $$;
CREATE TRIGGER allocate_paid_jobs AFTER UPDATE ON public.membership_payments FOR EACH ROW EXECUTE FUNCTION public.allocate_paid_job_entitlements();
CREATE FUNCTION public.enforce_paid_job_quota() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE entitlement public.job_post_entitlements; BEGIN
IF TG_OP='UPDATE' THEN
IF NEW.job_expires_at IS DISTINCT FROM OLD.job_expires_at OR NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.module IS DISTINCT FROM OLD.module OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN RAISE EXCEPTION 'POST_IDENTITY_PROTECTED'; END IF;
RETURN NEW; END IF;
NEW.job_expires_at:=NULL;
IF NEW.module<>'job' THEN RETURN NEW; END IF;
PERFORM 1 FROM public.profiles WHERE id=NEW.user_id FOR UPDATE;
SELECT * INTO entitlement FROM public.job_post_entitlements WHERE user_id=NEW.user_id AND starts_at<=now() AND ends_at>now() ORDER BY starts_at LIMIT 1 FOR UPDATE;
IF FOUND THEN
IF (SELECT count(*) FROM public.job_post_uses WHERE entitlement_id=entitlement.id)>=3 THEN RAISE EXCEPTION 'THREE_MONTHLY_JOBS_USED'; END IF;
NEW.job_expires_at:=now()+interval '1 month';
INSERT INTO public.job_post_uses(entitlement_id,user_id,post_id) VALUES(entitlement.id,NEW.user_id,NEW.id);
END IF; RETURN NEW; END $$;
CREATE TRIGGER enforce_paid_jobs BEFORE INSERT OR UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.enforce_paid_job_quota();
CREATE POLICY unexpired_job_visibility ON public.posts AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(job_expires_at IS NULL OR job_expires_at>now() OR user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
REVOKE ALL ON FUNCTION public.enforce_paid_job_quota() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.allocate_paid_job_entitlements() FROM PUBLIC,anon,authenticated;
COMMENT ON TABLE public.job_post_uses IS 'Append-only paid posting usage; deleting a post does not refund the three-per-membership-month allowance. Existing payment records remain unchanged. Expiry is derived when read, without recurring jobs.';