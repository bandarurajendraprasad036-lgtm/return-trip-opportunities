ALTER TABLE public.app_calls ADD COLUMN accepted_at timestamptz, ADD COLUMN ended_by uuid;
ALTER TABLE public.messages ADD COLUMN app_call_id uuid, ADD COLUMN call_event text;
ALTER TABLE public.notifications ADD COLUMN app_call_id uuid, ADD COLUMN call_event text;
CREATE UNIQUE INDEX message_call_event_once ON public.messages(app_call_id,call_event) WHERE app_call_id IS NOT NULL;
CREATE UNIQUE INDEX notice_call_event_once ON public.notifications(app_call_id,call_event,user_id) WHERE app_call_id IS NOT NULL;
CREATE INDEX unanswered_call_deadline ON public.app_calls(created_at) WHERE ended_at IS NULL;

CREATE FUNCTION public.app_call_event_text(_video boolean,_event text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path=public AS $$ SELECT CASE _event WHEN 'missed' THEN CASE WHEN _video THEN 'వీడియో కాల్ మిస్ అయింది' ELSE 'డయల్ మిస్ అయింది' END WHEN 'answered' THEN CASE WHEN _video THEN 'వీడియో కాల్ ఎత్తారు' ELSE 'కాల్ ఎత్తారు' END WHEN 'ended' THEN CASE WHEN _video THEN 'వీడియో కాల్ ముగిసింది' ELSE 'కాల్ ముగిసింది' END ELSE NULL END $$;
REVOKE ALL ON FUNCTION public.app_call_event_text(boolean,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.app_call_event_text(boolean,text) TO service_role;

CREATE FUNCTION public.guard_private_call_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.app_calls; expected text;
BEGIN
 IF NEW.app_call_id IS NULL AND NEW.call_event IS NULL THEN RETURN NEW; END IF;
 SELECT * INTO c FROM public.app_calls WHERE id=NEW.app_call_id;
 IF c.id IS NULL OR current_setting('app.call_event',true) IS DISTINCT FROM c.id::text OR NEW.call_event IS NULL OR NEW.call_event NOT IN ('missed','answered','ended') OR (NEW.call_event='answered' AND c.accepted_at IS NULL) OR (NEW.call_event='missed' AND (c.accepted_at IS NOT NULL OR c.ended_at IS NULL)) OR (NEW.call_event='ended' AND (c.accepted_at IS NULL OR c.ended_at IS NULL)) THEN RAISE EXCEPTION 'CALL_EVENT_REQUIRED'; END IF;
 expected:=public.app_call_event_text(c.video,NEW.call_event);
 IF NEW.call_event='missed' AND c.ended_by=c.callee_id THEN expected:=expected||' · కాల్ కట్ చేశారు'; END IF;
 IF TG_TABLE_NAME='messages' THEN
  IF NEW.sender_id<>c.caller_id OR NEW.receiver_id<>c.callee_id OR NOT NEW.is_auto OR NEW.post_id IS NOT NULL OR NEW.needs_admin OR coalesce(NEW.image_path,'')<>'' OR coalesce(NEW.chat_phone,'')<>'' OR NEW.body IS DISTINCT FROM expected THEN RAISE EXCEPTION 'CALL_EVENT_REQUIRED'; END IF;
 ELSE
  IF NEW.user_id NOT IN(c.caller_id,c.callee_id) OR NEW.post_id IS NOT NULL OR NEW.matched_post_id IS NOT NULL OR NEW.vehicle_bell OR NEW.message IS DISTINCT FROM expected THEN RAISE EXCEPTION 'CALL_EVENT_REQUIRED'; END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_private_call_event() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER a0_private_call_message BEFORE INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.guard_private_call_event();
CREATE TRIGGER a0_private_call_notice BEFORE INSERT ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.guard_private_call_event();

CREATE OR REPLACE FUNCTION public.enforce_paid_chat_message() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.app_call_id IS NOT NULL AND NEW.is_auto AND current_setting('app.call_event',true)=NEW.app_call_id::text AND EXISTS(SELECT 1 FROM public.app_calls c WHERE c.id=NEW.app_call_id AND c.caller_id=NEW.sender_id AND c.callee_id=NEW.receiver_id) THEN RETURN NEW; END IF;
 IF auth.role()='service_role' AND (public.has_role(NEW.sender_id,'admin') OR public.has_role(NEW.receiver_id,'admin')) THEN RETURN NEW; END IF;
 IF current_setting('app.membership_evidence',true)='1' AND NEW.post_id IS NULL AND NEW.is_auto AND (public.has_role(NEW.sender_id,'admin') OR (NEW.sender_id=auth.uid() AND public.has_role(NEW.receiver_id,'admin') AND (NEW.image_path='' OR NEW.image_path LIKE NEW.sender_id::text||'/%'))) THEN RETURN NEW; END IF;
 IF NOT public.can_post_chat(NEW.post_id,NEW.receiver_id) AND NOT public.has_role(NEW.sender_id,'admin') THEN RAISE EXCEPTION 'PAID_CHAT_OR_PRIVATE_PAIR_REQUIRED'; END IF;
 RETURN NEW;
END $$;

CREATE FUNCTION public.record_private_call_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE event_kind text; event_time timestamptz; text_body text; recipient uuid; old_marker text:=coalesce(current_setting('app.call_event',true),'');
BEGIN
 IF OLD.ended_at IS NOT NULL THEN RETURN NEW; END IF;
 IF NEW.ended_at IS NOT NULL THEN event_kind:=CASE WHEN NEW.accepted_at IS NULL THEN 'missed' ELSE 'ended' END; event_time:=NEW.ended_at;
 ELSIF OLD.accepted_at IS NULL AND NEW.accepted_at IS NOT NULL THEN event_kind:='answered'; event_time:=NEW.accepted_at;
 ELSE RETURN NEW; END IF;
 IF NOT public.account_allowed(NEW.caller_id) OR NOT public.account_allowed(NEW.callee_id) THEN RETURN NEW; END IF;
 text_body:=public.app_call_event_text(NEW.video,event_kind);
 IF event_kind='missed' AND NEW.ended_by=NEW.callee_id THEN text_body:=text_body||' · కాల్ కట్ చేశారు'; END IF;
 PERFORM set_config('app.call_event',NEW.id::text,true);
 INSERT INTO public.messages(sender_id,receiver_id,body,is_auto,created_at,app_call_id,call_event) VALUES(NEW.caller_id,NEW.callee_id,text_body,true,event_time,NEW.id,event_kind) ON CONFLICT DO NOTHING;
 recipient:=CASE WHEN event_kind='answered' OR NEW.ended_by=NEW.callee_id THEN NEW.caller_id ELSE NEW.callee_id END;
 INSERT INTO public.notifications(user_id,message,created_at,app_call_id,call_event) VALUES(recipient,text_body,event_time,NEW.id,event_kind) ON CONFLICT DO NOTHING;
 PERFORM set_config('app.call_event',old_marker,true);
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.record_private_call_event() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER private_call_chat_event AFTER UPDATE ON public.app_calls FOR EACH ROW EXECUTE FUNCTION public.record_private_call_event();

CREATE FUNCTION public.expire_app_calls() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.app_calls; n integer:=0;
BEGIN
 IF auth.uid() IS NULL AND auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'CALL_PARTICIPANT_REQUIRED'; END IF;
 FOR c IN SELECT * FROM public.app_calls WHERE ended_at IS NULL AND (auth.role()='service_role' OR auth.uid() IN(caller_id,callee_id)) AND created_at<=now()-CASE WHEN accepted_at IS NULL THEN interval '60 seconds' ELSE interval '2 hours' END ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 100 LOOP
  UPDATE public.app_calls SET ended_at=c.created_at+CASE WHEN c.accepted_at IS NULL THEN interval '60 seconds' ELSE interval '2 hours' END WHERE id=c.id;
  INSERT INTO public.app_call_signals(call_id,sender_id,receiver_id,kind) VALUES(c.id,c.caller_id,c.callee_id,'end'),(c.id,c.callee_id,c.caller_id,'end');
  n:=n+1;
 END LOOP;
 RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.expire_app_calls() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.expire_app_calls() TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.send_app_call_signal(_call uuid,_kind text,_payload jsonb DEFAULT '{}'::jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.app_calls; target uuid;
BEGIN
 SELECT * INTO c FROM public.app_calls WHERE id=_call FOR UPDATE;
 IF c.id IS NULL OR auth.uid() IS NULL OR auth.uid() NOT IN(c.caller_id,c.callee_id) THEN RAISE EXCEPTION 'CALL_PARTICIPANT_REQUIRED'; END IF;
 target:=CASE WHEN auth.uid()=c.caller_id THEN c.callee_id ELSE c.caller_id END;
 IF _kind NOT IN('offer','answer','ice','end') OR octet_length(_payload::text)>65536 THEN RAISE EXCEPTION 'INVALID_SIGNAL'; END IF;
 IF _kind<>'end' AND (c.ended_at IS NOT NULL OR c.created_at<now()-interval '2 hours' OR NOT public.can_call_member(target)) THEN RAISE EXCEPTION 'BOTH_PAID_REQUIRED'; END IF;
 IF (_kind='offer' AND auth.uid()<>c.caller_id) OR (_kind='answer' AND auth.uid()<>c.callee_id) THEN RAISE EXCEPTION 'INVALID_SIGNAL_SENDER'; END IF;
 IF _kind='answer' THEN
  IF c.accepted_at IS NOT NULL THEN RETURN; END IF;
  IF c.created_at<=now()-interval '60 seconds' THEN RAISE EXCEPTION 'CALL_TIMED_OUT'; END IF;
  UPDATE public.app_calls SET accepted_at=now() WHERE id=c.id;
 ELSIF _kind='end' THEN
  IF c.ended_at IS NOT NULL THEN RETURN; END IF;
  UPDATE public.app_calls SET ended_at=now(),ended_by=auth.uid() WHERE id=c.id;
 END IF;
 INSERT INTO public.app_call_signals(call_id,sender_id,receiver_id,kind,payload) VALUES(c.id,auth.uid(),target,_kind,coalesce(_payload,'{}'::jsonb));
END $$;