create type public.app_role as enum ('admin','user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  location text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles readable by signed in" on public.profiles for select to authenticated using (true);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, location)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), coalesce(new.raw_user_meta_data->>'phone',''), coalesce(new.raw_user_meta_data->>'location',''));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  module text not null check (module in ('job','vehicle')),
  kind text not null check (kind in ('seeker','employer','owner','business')),
  title text not null default '',
  location text,
  skill text,
  salary text,
  from_place text,
  to_place text,
  trip_date date,
  vehicle_type text,
  goods_type text,
  description text,
  contact_phone text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.posts to authenticated;
grant all on public.posts to service_role;
alter table public.posts enable row level security;
create policy "posts readable" on public.posts for select to authenticated using (true);
create policy "own posts insert" on public.posts for insert to authenticated with check (auth.uid() = user_id);
create policy "own or admin update" on public.posts for update to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "own or admin delete" on public.posts for delete to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  post_id uuid references public.posts(id) on delete cascade,
  matched_post_id uuid references public.posts(id) on delete cascade,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "own notifications" on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy "own notifications update" on public.notifications for update to authenticated using (auth.uid() = user_id);
create policy "own notifications delete" on public.notifications for delete to authenticated using (auth.uid() = user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null,
  receiver_id uuid not null,
  post_id uuid references public.posts(id) on delete set null,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
grant select, insert on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "participants read" on public.messages for select to authenticated using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "send as self" on public.messages for insert to authenticated with check (auth.uid() = sender_id);

create or replace function public.match_post()
returns trigger language plpgsql security definer set search_path = public as $$
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
    insert into public.notifications (user_id, post_id, matched_post_id, message)
    values (new.user_id, new.id, m.id,
      case when new.module='job' then 'మ్యాచ్ దొరికింది! Match found in ' || new.location || ': ' || m.title
      else 'రిటర్న్ మ్యాచ్! Return match ' || new.from_place || ' → ' || new.to_place || ': ' || m.title end);
    insert into public.notifications (user_id, post_id, matched_post_id, message)
    values (m.user_id, m.id, new.id,
      case when new.module='job' then 'మ్యాచ్ దొరికింది! Match found in ' || new.location || ': ' || new.title
      else 'రిటర్న్ మ్యాచ్! Return match ' || new.from_place || ' → ' || new.to_place || ': ' || new.title end);
  end loop;
  return new;
end; $$;
create trigger posts_match after insert on public.posts for each row execute function public.match_post();

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;