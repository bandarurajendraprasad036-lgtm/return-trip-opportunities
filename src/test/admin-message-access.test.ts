import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const first = '11111111-1111-4111-8111-111111111111';
const second = '22222222-2222-4222-8222-222222222222';
const other = '33333333-3333-4333-8333-333333333333';

describe('two phone accounts and admin chat access', () => {
  let db: PGlite;
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`CREATE SCHEMA auth;
      CREATE TYPE public.app_role AS ENUM('admin','user');
      CREATE ROLE anon; CREATE ROLE authenticated;
      CREATE TABLE auth.users(id uuid primary key,raw_user_meta_data jsonb,phone text);
      CREATE TABLE public.profiles(id uuid primary key,full_name text not null default '',phone text not null default '',location text not null default '');
      CREATE TABLE public.user_roles(id uuid primary key default gen_random_uuid(),user_id uuid not null,role public.app_role not null,unique(user_id,role));
      CREATE TABLE public.messages(id uuid primary key,sender_id uuid not null,receiver_id uuid not null,body text not null default '');
      CREATE TABLE public.account_blocks(user_id uuid primary key);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.user',true),'')::uuid$$;
      CREATE FUNCTION public.account_allowed(_uid uuid) RETURNS boolean LANGUAGE sql AS $$SELECT NOT EXISTS(SELECT 1 FROM public.account_blocks WHERE user_id=_uid)$$;
      CREATE FUNCTION public.has_role(_uid uuid,_role public.app_role) RETURNS boolean LANGUAGE sql AS $$SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_uid AND role=_role)$$;
      GRANT USAGE ON SCHEMA auth TO anon,authenticated;
      GRANT SELECT ON public.messages,public.profiles TO authenticated;
      CREATE POLICY participants_read ON public.messages FOR SELECT TO authenticated USING(auth.uid()=sender_id OR auth.uid()=receiver_id);
      CREATE POLICY profiles_owner_admin ON public.profiles FOR SELECT TO authenticated USING(id=auth.uid() OR public.has_role(auth.uid(),'admin'));
      ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`);
    await db.exec(readFileSync('drizzle/migrations/0042_admin_messages_phone_accounts_and_bell_activation.sql', 'utf8'));
    await db.exec(`CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      INSERT INTO auth.users(id,raw_user_meta_data,phone) VALUES
        ('${first}','{"full_name":"మొదటి"}','+91 98765 43210'),
        ('${second}','{"full_name":"రెండవ"}','+91 98765 43211');
      INSERT INTO public.messages VALUES
        ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','${first}','${second}','మొదటి సందేశం'),
        ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','${second}','${first}','రెండవ సందేశం'),
        ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','${other}','${first}','ఇతర సందేశం');`);
  });
  afterAll(async () => { await db.close(); });

  it('creates separate profiles for two distinct phone numbers without an already-exists failure', async () => {
    const result = await db.query<{ id: string; phone: string }>('SELECT id,phone FROM public.profiles ORDER BY id');
    expect(result.rows).toEqual([{ id: first, phone: '9876543210' }, { id: second, phone: '9876543211' }]);
  });
  it('lets the second account read only its own chats and private profile', async () => {
    await db.exec(`SET ROLE authenticated; SELECT set_config('test.user','${second}',false);`);
    expect((await db.query<{ count: number }>('SELECT count(*)::int AS count FROM public.messages')).rows[0]?.count).toBe(2);
    expect((await db.query<{ id: string }>('SELECT id FROM public.profiles')).rows).toEqual([{ id: second }]);
  });
  it('lets the admin read every chat and every private profile', async () => {
    await db.exec(`SET ROLE authenticated; SELECT set_config('test.user','${first}',false);`);
    expect((await db.query<{ count: number }>('SELECT count(*)::int AS count FROM public.messages')).rows[0]?.count).toBe(3);
    expect((await db.query<{ count: number }>('SELECT count(*)::int AS count FROM public.profiles')).rows[0]?.count).toBe(2);
  });
});
