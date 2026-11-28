CREATE OR REPLACE FUNCTION public.review_membership_evidence(_id uuid, _approve boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r public.membership_requests;
  approved_msg text := 'మీరు గాయత్రివన్ చందాదారులైనందుకు కోటి దండాలు 🙏🙏🙏.. ఈ చందా కేవలం ఒక నెల మాత్రమే. కానీ ఇప్పుడు ఆఫర్ నడుస్తుంది కావున వన్ ప్లస్ టూ అంటే ఒక నెల కడితే మరో రెండు నెలలు ఉచితమని తెలుపుతున్నాము. టోటల్ మీకు మూడు నెలలు మా సబ్స్క్రైబ్ అవుతారు.. అడ్మిన్ ఓకే చేసిన తర్వాత అంటే మీరు పరిశీలనలో ఉన్నారు కాబట్టి మీకు ఈ మూడు రోజుల వరకు వెహికల్స్ బుక్ చేసుకోవచ్చు ఏదైనా చేసుకోవచ్చు కానీ నోటిఫికేషన్లు, గంటలు పని చేయకపోవచ్చు అని తెలుపుతున్నాము. మీ మొబైల్ సపోర్ట్ చేస్తే తక్షణమే నోటిఫికేషన్లు మరియు గంటలు పని చేస్తాయి. లేదా ఈ 3 రోజులలో నోటిఫికేషన్ కోసం ఆగాల్సి ఉంటుంది. అన్యధా భావించవద్దు. 🙏🙏🙏';
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'ADMIN_ONLY'; END IF;
 SELECT * INTO r FROM public.membership_requests WHERE id=_id FOR UPDATE;
 IF r.id IS NULL OR r.status<>'pending' THEN RAISE EXCEPTION 'REVIEW_REQUIRED'; END IF;
 UPDATE public.membership_requests SET status=CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,reviewed_at=now(),reviewed_by=auth.uid() WHERE id=_id;
 UPDATE public.membership_access SET feature_scope=CASE WHEN r.amount=49 THEN 'work' ELSE 'all' END,source=CASE WHEN _approve THEN 'confirmed' ELSE source END,starts_at=CASE WHEN _approve THEN now() ELSE starts_at END,ends_at=CASE WHEN _approve THEN now()+make_interval(months=>r.vehicle_plan_months) ELSE ends_at END,revoked_at=CASE WHEN _approve THEN NULL ELSE now() END,granted_by=auth.uid() WHERE request_id=_id;
 IF _approve AND r.payer_id=r.user_id THEN PERFORM public.confirm_referral_cash(r.user_id,r.reference,r.amount::bigint*100); END IF;
 IF _approve THEN
   INSERT INTO public.notifications(user_id, message) VALUES(r.user_id, approved_msg);
   INSERT INTO public.messages(sender_id, receiver_id, body, is_auto) VALUES(auth.uid(), r.user_id, approved_msg, true);
 ELSE
   INSERT INTO public.messages(sender_id, receiver_id, body, is_auto) VALUES(auth.uid(), r.user_id, 'మీ చెల్లింపు నిర్ధారణ కాలేదు. నిర్వాహకులతో మాట్లాడండి.', true);
 END IF;
END $function$;