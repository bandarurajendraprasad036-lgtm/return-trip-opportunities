ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS vehicle_name text NOT NULL DEFAULT '';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS vehicle_number text NOT NULL DEFAULT '';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS driver_name text NOT NULL DEFAULT '';

-- Owner-requested public vehicle contact card (vehicle owner posts only).
CREATE OR REPLACE FUNCTION public.vehicle_public_details(_post uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT jsonb_build_object('vehicle_name',p.vehicle_name,'vehicle_number',p.vehicle_number,'driver_name',p.driver_name,'mobile',coalesce(nullif(p.contact_phone,''),'')) FROM public.posts p WHERE p.id=_post AND p.module='vehicle' AND p.kind='owner' AND p.status='active' $$;
GRANT EXECUTE ON FUNCTION public.vehicle_public_details(uuid) TO anon, authenticated;

-- Join counts only after code + own mobile + OK.
CREATE OR REPLACE FUNCTION public.confirm_referral_join(_code text,_phone text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE me public.profiles; ref public.profiles; ph text:=regexp_replace(coalesce(_phone,''),'\D','','g'); BEGIN
 IF auth.uid() IS NULL OR NOT public.account_allowed(auth.uid()) THEN RETURN false; END IF;
 IF length(ph)=12 AND left(ph,2)='91' THEN ph:=right(ph,10); END IF;
 IF ph !~ '^[6-9][0-9]{9}$' THEN RAISE EXCEPTION 'INVALID_MOBILE'; END IF;
 PERFORM pg_advisory_xact_lock(781105);
 SELECT * INTO me FROM public.profiles WHERE id=auth.uid() FOR UPDATE;
 IF me.id IS NULL OR EXISTS(SELECT 1 FROM public.referral_vip_joins WHERE joined_user=me.id) THEN RETURN false; END IF;
 IF coalesce(me.phone,'')<>'' AND right(regexp_replace(me.phone,'\D','','g'),10)<>ph THEN RAISE EXCEPTION 'MOBILE_MISMATCH'; END IF;
 SELECT * INTO ref FROM public.profiles WHERE referral_code=upper(trim(_code));
 IF ref.id IS NULL OR ref.id=me.id OR NOT public.account_allowed(ref.id) THEN RETURN false; END IF;
 IF EXISTS(WITH RECURSIVE ancestors(id) AS (SELECT ref.id UNION SELECT j.referrer_id FROM public.referral_vip_joins j JOIN ancestors a ON j.joined_user=a.id) SELECT 1 FROM ancestors WHERE id=me.id) THEN RETURN false; END IF;
 INSERT INTO public.referral_vip_campaign(id) VALUES(true) ON CONFLICT DO NOTHING;
 INSERT INTO public.referral_vip_joins(joined_user,referrer_id) VALUES(me.id,ref.id);
 PERFORM set_config('app.trusted','1',true);
 UPDATE public.profiles SET referred_by=ref.id,referred_at=now(),phone=CASE WHEN coalesce(phone,'')='' THEN ph ELSE phone END WHERE id=me.id;
 PERFORM set_config('app.trusted','',true);
 PERFORM public.ensure_my_referral_code(); PERFORM public.refresh_referral_vip_notices(); RETURN true; END $$;
REVOKE EXECUTE ON FUNCTION public.confirm_referral_join(text,text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.confirm_referral_join(text,text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_referral(text) FROM anon, authenticated, public;

-- Per-referrer stats over a window: OK joins, paid joins, percent, eligibility (>=70%).
CREATE OR REPLACE FUNCTION public.referral_payment_stats(_from timestamptz DEFAULT '-infinity', _to timestamptz DEFAULT 'infinity') RETURNS TABLE(user_id uuid, joins bigint, paid bigint, percent numeric, eligible boolean) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT j.referrer_id, count(*), count(*) FILTER (WHERE EXISTS(SELECT 1 FROM public.prime99_payments pp WHERE pp.user_id=j.joined_user AND pp.status='approved')),
   round(100.0*count(*) FILTER (WHERE EXISTS(SELECT 1 FROM public.prime99_payments pp WHERE pp.user_id=j.joined_user AND pp.status='approved'))/count(*),1),
   100*count(*) FILTER (WHERE EXISTS(SELECT 1 FROM public.prime99_payments pp WHERE pp.user_id=j.joined_user AND pp.status='approved')) >= 70*count(*)
  FROM public.referral_vip_joins j WHERE j.joined_at>=_from AND j.joined_at<_to GROUP BY j.referrer_id $$;
REVOKE EXECUTE ON FUNCTION public.referral_payment_stats(timestamptz,timestamptz) FROM anon, authenticated, public;

CREATE OR REPLACE FUNCTION public.admin_referral_eligibility() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'ADMIN_ONLY'; END IF;
 RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('user_id',s.user_id,'name',coalesce(nullif(p.full_name,''),'—'),'region',coalesce(c.region,''),'joins',s.joins,'paid',s.paid,'percent',s.percent,'eligible',s.eligible) ORDER BY s.joins DESC) FROM public.referral_payment_stats() s JOIN public.profiles p ON p.id=s.user_id LEFT JOIN public.referral_board_consent c ON c.user_id=s.user_id),'[]'::jsonb); END $$;
GRANT EXECUTE ON FUNCTION public.admin_referral_eligibility() TO authenticated;

CREATE TABLE public.weekly_winners(
  week_start date NOT NULL, region text NOT NULL CHECK(region IN('TG','AP')), user_id uuid NOT NULL REFERENCES public.profiles(id),
  display_name text NOT NULL, photo_path text NOT NULL, joins integer NOT NULL, paid integer NOT NULL, percent numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(week_start,region));
GRANT SELECT ON public.weekly_winners TO anon, authenticated;
GRANT ALL ON public.weekly_winners TO service_role;
ALTER TABLE public.weekly_winners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "weekly winners public" ON public.weekly_winners FOR SELECT TO anon, authenticated USING (true);

-- Sunday-night selection for the IST week Monday..Sunday; photo + published consent required.
CREATE OR REPLACE FUNCTION public.select_weekly_winners() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE wk date:=date_trunc('week',(now() AT TIME ZONE 'Asia/Kolkata'))::date; s timestamptz; e timestamptz; n integer:=0; r record; BEGIN
 s:=(wk::timestamp AT TIME ZONE 'Asia/Kolkata'); e:=s+interval '7 days';
 FOR r IN SELECT DISTINCT ON (c.region) c.region, st.user_id, st.joins, st.paid, st.percent, c.display_name, sp.photo_path
   FROM public.referral_payment_stats(s,e) st JOIN public.referral_board_consent c ON c.user_id=st.user_id
   JOIN public.service_profiles sp ON sp.user_id=st.user_id
   WHERE st.eligible AND c.region IN('TG','AP') AND c.published AND c.photo_consent AND sp.published AND sp.photo_path LIKE st.user_id::text||'/%' AND c.display_name<>''
   ORDER BY c.region, st.joins DESC, st.paid DESC LOOP
   INSERT INTO public.weekly_winners(week_start,region,user_id,display_name,photo_path,joins,paid,percent) VALUES(wk,r.region,r.user_id,r.display_name,r.photo_path,r.joins,r.paid,r.percent) ON CONFLICT DO NOTHING;
   IF FOUND THEN n:=n+1; INSERT INTO public.notifications(user_id,message) VALUES(r.user_id,'🏆 అభినందనలు! మీరు ఈ వారం '||CASE WHEN r.region='TG' THEN 'తెలంగాణ' ELSE 'ఆంధ్ర' END||' విజేత. మీ పోస్టర్ చూడండి.'); END IF;
 END LOOP; RETURN n; END $$;
REVOKE EXECUTE ON FUNCTION public.select_weekly_winners() FROM anon, authenticated, public;

-- Signed-poster photo path check helper for server signing.
CREATE OR REPLACE FUNCTION public.weekly_winner_photo_ok(_path text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.weekly_winners WHERE photo_path=_path) $$;
GRANT EXECUTE ON FUNCTION public.weekly_winner_photo_ok(text) TO anon, authenticated;

-- Admin-editable nearby distance (km), default 7.
INSERT INTO public.app_settings(key,value) VALUES('nearby_vehicle_km','7') ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.notify_nearby_vehicles(_post uuid) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE km numeric; pt public.vehicle_post_points; n integer:=0; r record; BEGIN
 IF auth.uid() IS NULL OR NOT public.account_allowed(auth.uid()) THEN RETURN 0; END IF;
 SELECT least(greatest(coalesce(nullif(value,'')::numeric,7),0.5),50) INTO km FROM public.app_settings WHERE key='nearby_vehicle_km'; km:=coalesce(km,7);
 SELECT * INTO pt FROM public.vehicle_post_points WHERE post_id=_post; IF pt.post_id IS NULL THEN RETURN 0; END IF;
 FOR r IN SELECT DISTINCT ON (p.user_id) p.user_id, public.straight_line_km(pt.from_lat,pt.from_lng,q.from_lat,q.from_lng) d
   FROM public.vehicle_post_points q JOIN public.posts p ON p.id=q.post_id
   WHERE p.status='active' AND p.module='vehicle' AND p.kind='owner' AND p.id<>_post AND p.user_id<>auth.uid()
     AND public.straight_line_km(pt.from_lat,pt.from_lng,q.from_lat,q.from_lng)<=km LIMIT 30 LOOP
   IF public.can_notify(r.user_id) AND NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=r.user_id AND post_id=_post AND created_at>now()-interval '1 day') THEN
     INSERT INTO public.notifications(user_id,post_id,message) VALUES(r.user_id,_post,'🔔 మీ దగ్గర (సుమారు '||round(r.d::numeric,1)||' కి.మీ సరళ రేఖ) వాహనం కోసం ఒకరు అడుగుతున్నారు. ఇది బుకింగ్ కాదు.'); n:=n+1; END IF;
 END LOOP; RETURN n; END $$;
GRANT EXECUTE ON FUNCTION public.notify_nearby_vehicles(uuid) TO authenticated;