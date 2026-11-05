CREATE TABLE public.account_blocks(user_id uuid PRIMARY KEY REFERENCES public.profiles(id),reason text NOT NULL,blocked_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.account_blocks TO authenticated; GRANT ALL ON public.account_blocks TO service_role;
ALTER TABLE public.account_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_account_block ON public.account_blocks FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE FUNCTION public.account_allowed(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT NOT EXISTS(SELECT 1 FROM public.account_blocks WHERE user_id=_uid) $$;
CREATE FUNCTION public.block_confirmed_content(_user uuid,_reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
INSERT INTO public.account_blocks(user_id,reason) VALUES(_user,left(_reason,500)) ON CONFLICT(user_id) DO NOTHING;
UPDATE public.posts SET status='blocked' WHERE user_id=_user;
END $$;
REVOKE ALL ON FUNCTION public.block_confirmed_content(uuid,text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.block_confirmed_content(uuid,text) TO service_role;
CREATE FUNCTION public.reject_confirmed_bad_content() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE text_value text; BEGIN
IF NOT public.account_allowed(NEW.user_id) THEN RETURN NULL; END IF;
text_value:=lower(coalesce(NEW.title,'')||' '||coalesce(NEW.description,'')||' '||coalesce(NEW.skill,'')||' '||coalesce(NEW.location,'')||' '||coalesce(NEW.goods_type,'')||' '||coalesce(NEW.from_place,'')||' '||coalesce(NEW.to_place,''));
IF text_value ~ '(^|[^a-z])(fuck|motherfucker|madarchod|behenchod|lanjakodaka)([^a-z]|$)' OR text_value ~ '(లంజకొడుకు|దేశాన్ని నాశనం చేయండి|భారత్ ముర్దాబాద్)' THEN
PERFORM public.block_confirmed_content(NEW.user_id,'నిషేధిత దూషణ లేదా హింస ప్రోత్సాహక ప్రకటన · Confirmed prohibited content'); RETURN NULL;
END IF; RETURN NEW; END $$;
CREATE TRIGGER a_confirmed_post_guard BEFORE INSERT OR UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.reject_confirmed_bad_content();
CREATE POLICY hide_blocked_owner_posts ON public.posts AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(public.account_allowed(user_id));
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['posts','profiles','messages','notification_preferences','notifications','push_devices','service_profiles','service_photos','service_reviews','service_likes','membership_payments','sharing_claims','app_settings'] LOOP EXECUTE format('CREATE POLICY active_account_required ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING(public.account_allowed(auth.uid())) WITH CHECK(public.account_allowed(auth.uid()))',t); END LOOP; END $$;
CREATE FUNCTION public.require_message_mobile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NOT public.account_allowed(NEW.sender_id) OR NOT public.account_allowed(NEW.receiver_id) THEN RAISE EXCEPTION 'ACCOUNT_BLOCKED'; END IF;
IF NOT NEW.is_auto AND NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=NEW.sender_id AND phone ~ '^[6-9][0-9]{9}$') THEN RAISE EXCEPTION 'MOBILE_REQUIRED'; END IF; RETURN NEW; END $$;
CREATE TRIGGER require_message_mobile BEFORE INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.require_message_mobile();
REVOKE ALL ON FUNCTION public.reject_confirmed_bad_content(),public.require_message_mobile() FROM PUBLIC,anon,authenticated;