import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const admin = '11111111-1111-4111-8111-111111111111';
const member = '22222222-2222-4222-8222-222222222222';
const blockedOwner = '33333333-3333-4333-8333-333333333333';

describe('admin post visibility', () => {
  let db: PGlite;
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`CREATE SCHEMA auth;
      CREATE TYPE public.app_role AS ENUM('admin','user');
      CREATE ROLE anon; CREATE ROLE authenticated;
      CREATE TABLE public.posts(id uuid primary key,user_id uuid,status text);
      CREATE TABLE public.account_blocks(user_id uuid primary key);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.user',true),'')::uuid$$;
      CREATE FUNCTION public.account_allowed(_uid uuid) RETURNS boolean LANGUAGE sql AS $$SELECT NOT EXISTS(SELECT 1 FROM public.account_blocks WHERE user_id=_uid)$$;
      CREATE FUNCTION public.has_role(_uid uuid,_role public.app_role) RETURNS boolean LANGUAGE sql AS $$SELECT _uid=auth.uid() AND current_setting('test.role',true)=_role::text$$;
      GRANT USAGE ON SCHEMA auth TO anon,authenticated;
      GRANT SELECT ON public.posts TO anon,authenticated;
      GRANT SELECT ON public.account_blocks TO anon,authenticated;
      CREATE POLICY posts_readable ON public.posts FOR SELECT TO anon,authenticated USING(true);
      CREATE POLICY hide_blocked_owner_posts ON public.posts AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(public.account_allowed(user_id));
      ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
      INSERT INTO public.posts VALUES
        ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','${member}','active'),
        ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','${member}','closed'),
        ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','${blockedOwner}','blocked');
      INSERT INTO public.account_blocks VALUES ('${blockedOwner}');`);
    await db.exec(readFileSync('drizzle/migrations/0041_admin_read_all_posts_including_blocked_owners.sql', 'utf8'));
  });
  afterAll(async () => { await db.close(); });

  it('shows active, closed and blocked-owner posts to an admin', async () => {
    await db.exec(`SET ROLE authenticated; SELECT set_config('test.user','${admin}',false); SELECT set_config('test.role','admin',false);`);
    expect((await db.query<{ count: number }>('SELECT count(*)::int AS count FROM public.posts')).rows[0]?.count).toBe(3);
  });

  it('still hides blocked-owner posts from an ordinary member', async () => {
    await db.exec(`SET ROLE authenticated; SELECT set_config('test.user','${member}',false); SELECT set_config('test.role','user',false);`);
    expect((await db.query<{ count: number }>('SELECT count(*)::int AS count FROM public.posts')).rows[0]?.count).toBe(2);
  });
});
