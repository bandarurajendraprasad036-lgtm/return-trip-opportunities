import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

describe('bell-only database permissions',()=>{
  it('suppresses automatic notices, restricts owner dispatch to exact routes, and opens only private bell pairs',async()=>{
    const db=new PGlite();
    await db.exec(`CREATE SCHEMA auth; CREATE TABLE public.profiles(id uuid primary key);
      CREATE TABLE public.posts(id uuid primary key,user_id uuid,module text,kind text,status text,visible_after timestamptz,job_expires_at timestamptz,from_place text,to_place text,trip_date date,vehicle_type text,skill text,created_at timestamptz default now());
      CREATE TABLE public.notifications(id uuid default gen_random_uuid(),user_id uuid,post_id uuid,matched_post_id uuid,message text,created_at timestamptz default now());
      CREATE TABLE public.messages(id uuid default gen_random_uuid(),sender_id uuid,receiver_id uuid,post_id uuid,body text);
      CREATE TABLE public.post_chat_pairs(post_id uuid,member_id uuid,owner_id uuid,primary key(post_id,member_id));
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.user',true),'')::uuid$$;
      CREATE FUNCTION public.account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
      CREATE FUNCTION public.can_notify(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
      CREATE FUNCTION public.post_alert_eligible(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
      CREATE FUNCTION public.support_admin_id() RETURNS uuid LANGUAGE sql AS $$SELECT '44444444-4444-4444-8444-444444444444'::uuid$$;
      CREATE FUNCTION public.posts_match_area(a public.posts,b public.posts) RETURNS boolean LANGUAGE sql AS $$SELECT a.user_id<>b.user_id AND a.module=b.module AND a.kind<>b.kind AND a.from_place=b.from_place AND a.to_place=b.to_place AND a.trip_date=b.trip_date$$;`);
    const migration=readFileSync('drizzle/migrations/0034_bell_only_notices_private_chat.sql','utf8');
    for(const name of ['guard_new_match_notifications','notify_matches','ring_post','can_post_chat']){
      const start=migration.indexOf(`CREATE OR REPLACE FUNCTION public.${name}(`);
      const end=migration.indexOf('$$;',migration.indexOf('AS $$',start))+3;
      await db.exec(migration.slice(start,end));
    }
    await db.exec(`CREATE TRIGGER notices_guard BEFORE INSERT ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.guard_new_match_notifications();
      INSERT INTO public.profiles VALUES ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222'),('33333333-3333-4333-8333-333333333333');
      INSERT INTO public.posts(id,user_id,module,kind,status,from_place,to_place,trip_date) VALUES
      ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','vehicle','owner','active','Hyderabad','Vijayawada','2026-11-06'),
      ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','vehicle','business','active','Hyderabad','Vijayawada','2026-11-06'),
      ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','33333333-3333-4333-8333-333333333333','vehicle','business','active','Delhi','Vijayawada','2026-11-06');
      INSERT INTO public.notifications(user_id,post_id,message) VALUES('22222222-2222-4222-8222-222222222222','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','automatic');`);
    expect((await db.query('SELECT * FROM public.notifications')).rows).toHaveLength(0);
    await db.exec(`SELECT set_config('test.user','11111111-1111-4111-8111-111111111111',false);`);
    expect((await db.query<{n:number}>(`SELECT public.notify_matches('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') AS n`)).rows[0]?.n).toBe(1);
    expect((await db.query<{user_id:string}>('SELECT user_id FROM public.notifications')).rows.map(r=>r.user_id)).toEqual(['22222222-2222-4222-8222-222222222222']);
    await db.exec(`SELECT set_config('test.user','22222222-2222-4222-8222-222222222222',false);`);
    await expect(db.query(`SELECT public.notify_matches('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')`)).rejects.toThrow('OWN_VISIBLE_POST_REQUIRED');
    expect((await db.query<{allowed:boolean}>(`SELECT public.can_post_chat('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111') AS allowed`)).rows[0]?.allowed).toBe(false);
    await db.query(`SELECT public.ring_post('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')`);
    expect((await db.query<{allowed:boolean}>(`SELECT public.can_post_chat('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111') AS allowed`)).rows[0]?.allowed).toBe(true);
    await db.exec(`SELECT set_config('test.user','33333333-3333-4333-8333-333333333333',false);`);
    expect((await db.query<{allowed:boolean}>(`SELECT public.can_post_chat('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222') AS allowed`)).rows[0]?.allowed).toBe(false);
    await db.close();
  },20000);
});