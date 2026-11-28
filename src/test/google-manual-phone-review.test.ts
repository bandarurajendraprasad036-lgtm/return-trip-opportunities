import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, it, expect } from 'vitest';

const admin='11111111-1111-4111-8111-111111111111';
const member='22222222-2222-4222-8222-222222222222';
const other='33333333-3333-4333-8333-333333333333';
let db: PGlite;
beforeAll(async()=>{
  db=new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.user',true),'')::uuid$$;
  CREATE FUNCTION has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$SELECT $1='${admin}'::uuid$$;
  CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,phone text,phone_confirmed_at timestamptz,banned_until timestamptz);
  CREATE TABLE auth.identities(user_id uuid,provider text);
  CREATE TABLE profiles(id uuid PRIMARY KEY,phone text,full_name text,location text);
  CREATE TABLE account_programs(user_id uuid,occupation text,category text,member_kind text);
  CREATE TABLE profile_phone_changes(user_id uuid PRIMARY KEY);
  CREATE TABLE account_blocks(user_id uuid PRIMARY KEY);
  CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT NOT EXISTS(SELECT 1 FROM account_blocks WHERE user_id=$1)$$;
  CREATE FUNCTION require_active_actor() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN IF auth.uid() IS NOT NULL AND NOT account_allowed(auth.uid()) THEN RAISE EXCEPTION 'ACCOUNT_BLOCKED'; END IF; IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW; END$$;
  CREATE TABLE app_calls(id uuid PRIMARY KEY); CREATE TABLE app_call_signals(id uuid PRIMARY KEY);
  INSERT INTO auth.users(id,email) VALUES('${admin}','admin@example.test'),('${member}','member@example.test'),('${other}','other@example.test');
  INSERT INTO auth.identities VALUES('${member}','google'),('${other}','email');
  INSERT INTO profiles VALUES('${admin}',NULL,'Admin','Village'),('${member}',NULL,'Member','Village'),('${other}',NULL,'Other','Village');
  INSERT INTO account_programs VALUES('${member}','Electrician','Electrician','service');`);
  await db.exec(readFileSync('drizzle/migrations/0156_google_claimed_mobile_and_admin_unblock.sql','utf8'));
  await db.exec('CREATE TRIGGER mobile_guard BEFORE UPDATE OF phone ON profiles FOR EACH ROW EXECUTE FUNCTION guard_unique_profile_mobile()');
});
afterAll(async()=>{await db.close();});
const actor=(id:string)=>db.exec(`SELECT set_config('test.user','${id}',false)`);
it('Google member saves ten digits without OTP or prior approval, without verifying Auth phone',async()=>{
  await actor(member);
  await db.exec(`UPDATE profiles SET phone='9876543210' WHERE id='${member}'`);
  expect((await db.query<{phone:string}>(`SELECT phone FROM profiles WHERE id='${member}'`)).rows[0]?.phone).toBe('9876543210');
  expect((await db.query<{phone:string|null}>(`SELECT phone FROM auth.users WHERE id='${member}'`)).rows[0]?.phone).toBeNull();
  expect((await db.query<{ready:boolean}>(`SELECT profile_ready_for_actions('${member}') ready`)).rows[0]?.ready).toBe(true);
});
it('does not permit invalid numbers, duplicate phone takeover or unverified non-Google phone writes',async()=>{
  await expect(db.exec(`UPDATE profiles SET phone='1234' WHERE id='${member}'`)).rejects.toThrow('VALID_MOBILE_REQUIRED');
  await expect(db.exec(`UPDATE profiles SET phone='9876543210' WHERE id='${other}'`)).rejects.toThrow('MOBILE_ALREADY_REGISTERED');
  await expect(db.exec(`UPDATE profiles SET phone='9876543211' WHERE id='${other}'`)).rejects.toThrow('VERIFIED_PHONE_REQUIRED');
});
it('blocked member cannot use actions or write call/signalling even through privileged handlers',async()=>{
  await actor(member);
  await db.exec(`INSERT INTO account_blocks VALUES('${member}'); UPDATE auth.users SET banned_until=now()+interval '100 years' WHERE id='${member}'`);
  expect((await db.query<{ready:boolean}>(`SELECT profile_ready_for_actions('${member}') ready`)).rows[0]?.ready).toBe(false);
  await expect(db.exec('INSERT INTO app_calls VALUES(gen_random_uuid())')).rejects.toThrow('ACCOUNT_BLOCKED');
  await expect(db.exec('INSERT INTO app_call_signals VALUES(gen_random_uuid())')).rejects.toThrow('ACCOUNT_BLOCKED');
});
it('ordinary member cannot unblock; administrator restores access and clears existing login ban',async()=>{
  await actor(member);
  await expect(db.query(`SELECT admin_unblock_account('${member}')`)).rejects.toThrow('ADMIN_ONLY');
  await actor(admin);
  expect((await db.query<{ok:boolean}>(`SELECT admin_unblock_account('${member}') ok`)).rows[0]?.ok).toBe(true);
  expect((await db.query<{ready:boolean}>(`SELECT profile_ready_for_actions('${member}') ready`)).rows[0]?.ready).toBe(true);
  expect((await db.query<{banned_until:string|null}>(`SELECT banned_until FROM auth.users WHERE id='${member}'`)).rows[0]?.banned_until).toBeNull();
});
it('admin recovery remains protected from unblock actions against administrator accounts',async()=>{
  await actor(admin);
  await expect(db.query(`SELECT admin_unblock_account('${admin}')`)).rejects.toThrow('ADMIN_PROTECTED');
});