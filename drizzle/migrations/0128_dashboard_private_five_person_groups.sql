CREATE TABLE public.bell_groups(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),owner_id uuid NOT NULL REFERENCES public.profiles(id),entry_key text NOT NULL,section text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),expires_at timestamptz NOT NULL DEFAULT now()+interval '3 days');
GRANT SELECT ON public.bell_groups TO authenticated; GRANT ALL ON public.bell_groups TO service_role;
ALTER TABLE public.bell_groups ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.bell_group_members(group_id uuid NOT NULL REFERENCES public.bell_groups(id) ON DELETE CASCADE,user_id uuid NOT NULL REFERENCES public.profiles(id),joined_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(group_id,user_id));
GRANT SELECT ON public.bell_group_members TO authenticated; GRANT ALL ON public.bell_group_members TO service_role;
ALTER TABLE public.bell_group_members ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.bell_group_messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),group_id uuid NOT NULL REFERENCES public.bell_groups(id) ON DELETE CASCADE,sender_id uuid NOT NULL REFERENCES public.profiles(id),body text NOT NULL CHECK(length(trim(body)) BETWEEN 1 AND 1000),created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.bell_group_messages TO authenticated; GRANT ALL ON public.bell_group_messages TO service_role;
ALTER TABLE public.bell_group_messages ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.bell_group_bookings(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),group_id uuid NOT NULL REFERENCES public.bell_groups(id),requester_id uuid NOT NULL REFERENCES public.profiles(id),status text NOT NULL DEFAULT 'requested' CHECK(status IN('requested','confirmed','declined','cancelled')),created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(group_id,requester_id));
GRANT SELECT ON public.bell_group_bookings TO authenticated; GRANT ALL ON public.bell_group_bookings TO service_role;
ALTER TABLE public.bell_group_bookings ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.in_bell_group(_group uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT auth.uid() IS NOT NULL AND public.account_allowed(auth.uid()) AND EXISTS(SELECT 1 FROM public.bell_group_members m JOIN public.bell_groups g ON g.id=m.group_id WHERE g.id=_group AND m.user_id=auth.uid() AND g.expires_at>now()); $$;
REVOKE ALL ON FUNCTION public.in_bell_group(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.in_bell_group(uuid) TO authenticated,service_role;
CREATE POLICY group_member_read ON public.bell_groups FOR SELECT TO authenticated USING(public.in_bell_group(id));
CREATE POLICY group_members_own_read ON public.bell_group_members FOR SELECT TO authenticated USING(user_id=auth.uid() AND public.in_bell_group(group_id));
CREATE POLICY group_messages_read ON public.bell_group_messages FOR SELECT TO authenticated USING(public.in_bell_group(group_id));
CREATE POLICY group_booking_private_read ON public.bell_group_bookings FOR SELECT TO authenticated USING(public.in_bell_group(group_id) AND (requester_id=auth.uid() OR EXISTS(SELECT 1 FROM public.bell_groups g WHERE g.id=group_id AND g.owner_id=auth.uid())));
CREATE FUNCTION public.group_phone_text(_body text) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path=public AS $$ SELECT regexp_replace(translate(lower(_body),'౦౧౨౩౪౫౬౭౮౯०१२३४५६७८९','01234567890123456789'),'[^0-9]','','g') ~ '[0-9]{10}' OR lower(_body) ~ '(tel:|wa.me|whatsapp.com|zero|one|two|three|four|five|six|seven|eight|nine|సున్నా|ఒకటి|రెండు|మూడు|నాలుగు|ఐదు|ఆరు|ఏడు|ఎనిమిది|తొమ్మిది)([[:space:],.-]+(zero|one|two|three|four|five|six|seven|eight|nine|సున్నా|ఒకటి|రెండు|మూడు|నాలుగు|ఐదు|ఆరు|ఏడు|ఎనిమిది|తొమ్మిది)){5,}'; $$;
CREATE FUNCTION public.add_bell_group_member(_owner uuid,_member uuid,_key text,_section text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE gid uuid; BEGIN
 IF _owner IS NULL OR _member IS NULL OR _owner=_member OR NOT public.account_allowed(_owner) OR NOT public.account_allowed(_member) THEN RETURN NULL; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(_owner::text||_key,0));
 SELECT g.id INTO gid FROM public.bell_groups g JOIN public.bell_group_members m ON m.group_id=g.id WHERE g.owner_id=_owner AND g.entry_key=_key AND g.expires_at>now() AND m.user_id=_member LIMIT 1; IF gid IS NOT NULL THEN RETURN gid; END IF;
 SELECT g.id INTO gid FROM public.bell_groups g WHERE g.owner_id=_owner AND g.entry_key=_key AND g.expires_at>now() AND (SELECT count(*) FROM public.bell_group_members m WHERE m.group_id=g.id)<5 ORDER BY g.created_at LIMIT 1 FOR UPDATE;
 IF gid IS NULL THEN INSERT INTO public.bell_groups(owner_id,entry_key,section) VALUES(_owner,_key,_section) RETURNING id INTO gid; INSERT INTO public.bell_group_members VALUES(gid,_owner,now()); END IF;
 INSERT INTO public.bell_group_members VALUES(gid,_member,now()) ON CONFLICT DO NOTHING; RETURN gid;
END $$;
REVOKE ALL ON FUNCTION public.add_bell_group_member(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.add_bell_group_member(uuid,uuid,text,text) TO service_role;
CREATE FUNCTION public.capture_bell_group() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE owner_uuid uuid;key_text text;sec text; BEGIN
 IF TG_TABLE_NAME='free_work_interests' THEN key_text:=NEW.source||':'||NEW.entry_id;sec:=NEW.section;
 IF NEW.source='post' THEN SELECT user_id INTO owner_uuid FROM public.posts WHERE id::text=NEW.entry_id;
 ELSIF NEW.source='entry' THEN SELECT user_id INTO owner_uuid FROM public.free_work_entries WHERE id::text=NEW.entry_id;
 ELSIF NEW.source='provider' THEN SELECT user_id INTO owner_uuid FROM public.service_profiles WHERE user_id::text=NEW.entry_id AND published;
 ELSIF NEW.source='interest' THEN SELECT user_id INTO owner_uuid FROM public.free_work_interests WHERE id::text=NEW.entry_id; END IF;
 ELSIF TG_TABLE_NAME='post_bell_interests' THEN SELECT user_id INTO owner_uuid FROM public.posts WHERE id=NEW.post_id;key_text:='post:'||NEW.post_id::text;sec:=NEW.section;
 ELSE SELECT user_id INTO owner_uuid FROM public.posts WHERE id=NEW.post_id;key_text:='post:'||NEW.post_id::text;sec:=NEW.category; END IF;
 PERFORM public.add_bell_group_member(owner_uuid,NEW.user_id,key_text,sec); RETURN NEW; END $$;
CREATE TRIGGER free_bell_group AFTER INSERT ON public.free_work_interests FOR EACH ROW EXECUTE FUNCTION public.capture_bell_group();
CREATE TRIGGER post_bell_group AFTER INSERT ON public.post_bell_interests FOR EACH ROW EXECUTE FUNCTION public.capture_bell_group();
CREATE TRIGGER vehicle_bell_group AFTER INSERT ON public.vehicle_bell_demands FOR EACH ROW EXECUTE FUNCTION public.capture_bell_group();
CREATE FUNCTION public.my_bell_groups() RETURNS TABLE(id uuid,section text,expires_at timestamptz,members bigint,is_owner boolean) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT g.id,g.section,g.expires_at,(SELECT count(*) FROM public.bell_group_members m WHERE m.group_id=g.id),g.owner_id=auth.uid() FROM public.bell_groups g WHERE public.in_bell_group(g.id) ORDER BY g.created_at DESC; $$;
REVOKE ALL ON FUNCTION public.my_bell_groups() FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.my_bell_groups() TO authenticated,service_role;
CREATE FUNCTION public.send_bell_group_message(_group uuid,_body text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE mid uuid; BEGIN
 IF NOT public.in_bell_group(_group) THEN RAISE EXCEPTION 'GROUP_CLOSED'; END IF;
 IF length(trim(_body)) NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'MESSAGE_REQUIRED'; END IF;
 IF public.group_phone_text(_body) THEN RAISE EXCEPTION 'PHONE_SHARING_BLOCKED'; END IF;
 INSERT INTO public.bell_group_messages(group_id,sender_id,body) VALUES(_group,auth.uid(),trim(_body)) RETURNING id INTO mid;RETURN mid;END $$;
REVOKE ALL ON FUNCTION public.send_bell_group_message(uuid,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.send_bell_group_message(uuid,text) TO authenticated,service_role;
CREATE FUNCTION public.request_bell_group_booking(_group uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE bid uuid; BEGIN
 IF NOT public.in_bell_group(_group) OR EXISTS(SELECT 1 FROM public.bell_groups WHERE id=_group AND owner_id=auth.uid()) THEN RAISE EXCEPTION 'BOOKING_UNAVAILABLE'; END IF;
 INSERT INTO public.bell_group_bookings(group_id,requester_id) VALUES(_group,auth.uid()) ON CONFLICT(group_id,requester_id) DO UPDATE SET group_id=EXCLUDED.group_id RETURNING id INTO bid;RETURN bid;END $$;
REVOKE ALL ON FUNCTION public.request_bell_group_booking(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.request_bell_group_booking(uuid) TO authenticated,service_role;
CREATE FUNCTION public.review_bell_group_booking(_booking uuid,_accept boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 UPDATE public.bell_group_bookings b SET status=CASE WHEN _accept THEN 'confirmed' ELSE 'declined' END WHERE b.id=_booking AND b.status='requested' AND public.in_bell_group(b.group_id) AND EXISTS(SELECT 1 FROM public.bell_groups g WHERE g.id=b.group_id AND g.owner_id=auth.uid()); IF NOT FOUND THEN RAISE EXCEPTION 'BOOKING_UNAVAILABLE'; END IF; END $$;
REVOKE ALL ON FUNCTION public.review_bell_group_booking(uuid,boolean) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.review_bell_group_booking(uuid,boolean) TO authenticated,service_role;