ALTER TABLE public.profiles ADD COLUMN is_prime boolean NOT NULL DEFAULT false;
ALTER TABLE public.posts ADD COLUMN show_contact boolean NOT NULL DEFAULT false;
ALTER TABLE public.posts ADD COLUMN category text;

CREATE OR REPLACE FUNCTION public.guard_prime() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF new.is_prime IS DISTINCT FROM old.is_prime AND auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    new.is_prime := old.is_prime;
  END IF;
  RETURN new;
END; $$;
CREATE TRIGGER profiles_guard_prime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.guard_prime();

CREATE OR REPLACE FUNCTION public.guard_show_contact() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF new.show_contact AND NOT coalesce((SELECT is_prime FROM public.profiles WHERE id = new.user_id), false) THEN
    new.show_contact := false;
  END IF;
  RETURN new;
END; $$;
CREATE TRIGGER posts_guard_contact BEFORE INSERT OR UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.guard_show_contact();

CREATE OR REPLACE FUNCTION public.can_notify(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce((SELECT is_prime FROM public.profiles WHERE id = _uid), false)
    OR (SELECT count(*) FROM public.notifications WHERE user_id = _uid AND created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata') < 3
$$;

CREATE OR REPLACE FUNCTION public.match_post() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare m record; opp text;
begin
  opp := case new.kind when 'seeker' then 'employer' when 'employer' then 'seeker' when 'owner' then 'business' else 'owner' end;
  for m in
    select * from public.posts p
    where p.kind = opp and p.status = 'active' and p.user_id <> new.user_id
      and (
        (new.module = 'job' and lower(trim(p.location)) = lower(trim(new.location)))
        or (new.module = 'vehicle' and lower(trim(p.from_place)) = lower(trim(new.from_place))
            and lower(trim(p.to_place)) = lower(trim(new.to_place)) and p.trip_date = new.trip_date)
      )
  loop
    if public.can_notify(new.user_id) then
      insert into public.notifications (user_id, post_id, matched_post_id, message)
      values (new.user_id, new.id, m.id,
        case when new.module='job' then 'మ్యాచ్ దొరికింది! Match found in ' || new.location || ': ' || m.title
        else 'రిటర్న్ మ్యాచ్! Return match ' || new.from_place || ' → ' || new.to_place || ': ' || m.title end);
    end if;
    if public.can_notify(m.user_id) then
      insert into public.notifications (user_id, post_id, matched_post_id, message)
      values (m.user_id, m.id, new.id,
        case when new.module='job' then 'మ్యాచ్ దొరికింది! Match found in ' || new.location || ': ' || new.title
        else 'రిటర్న్ మ్యాచ్! Return match ' || new.from_place || ' → ' || new.to_place || ': ' || new.title end);
    end if;
  end loop;
  return new;
end; $$;

CREATE OR REPLACE FUNCTION public.notify_matches(_post_id uuid) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare j record; m record; n integer := 0;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  select * into j from public.posts where id = _post_id and status = 'active' and module = 'job';
  if not found then return 0; end if;
  for m in
    select distinct on (p.user_id) p.* from public.posts p
    where p.module = 'job' and p.status = 'active' and p.user_id <> j.user_id
      and p.kind = case j.kind when 'seeker' then 'employer' else 'seeker' end
      and lower(trim(p.location)) = lower(trim(j.location))
      and not exists (select 1 from public.notifications x where x.user_id = p.user_id and x.matched_post_id = j.id)
  loop
    exit when n >= 3;
    if public.can_notify(m.user_id) then
      insert into public.notifications (user_id, post_id, matched_post_id, message)
      values (m.user_id, m.id, j.id, '🔔 మీకు సరిపోయే ఉద్యోగం! Matching job in ' || j.location || ': ' || j.title);
      n := n + 1;
    end if;
  end loop;
  return n;
end; $$;
GRANT EXECUTE ON FUNCTION public.notify_matches(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_notify(uuid) TO authenticated;

CREATE TABLE public.app_settings (key text PRIMARY KEY, value text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings readable" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin insert settings" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update settings" ON public.app_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));