import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
it('requires verified phone on the same existing account, not a claimed profile phone', async () => {
  const db = new PGlite();
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT '11111111-1111-4111-8111-111111111111'::uuid $$;
      CREATE FUNCTION has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
      CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
      CREATE TABLE profiles(id uuid,full_name text,location text,phone text);
      CREATE TABLE account_programs(user_id uuid,occupation text,category text,member_kind text);
      CREATE TABLE auth.users(id uuid,phone text,phone_confirmed_at timestamptz);
      INSERT INTO profiles VALUES(auth.uid(),'Person','Village','9876543210');
      INSERT INTO account_programs VALUES(auth.uid(),'Driver','Auto','owner');
      INSERT INTO auth.users VALUES(auth.uid(),'+919876543210',NULL);`);
    const sql = readFileSync('drizzle/migrations/0096_verified_existing_profile_access.sql','utf8').split('CREATE OR REPLACE FUNCTION public.get_post_details')[0];
    if (!sql) throw new Error('profile rule missing');
    await db.exec(sql);
    const ready = async () => (await db.query<{ ready: boolean }>('SELECT my_profile_access_ready() ready')).rows[0]?.ready;
    expect(await ready()).toBe(false);
    await db.exec('UPDATE auth.users SET phone_confirmed_at=now()');
    expect(await ready()).toBe(true);
    await db.exec("UPDATE auth.users SET phone='+919876543211'");
    expect(await ready()).toBe(false);
    await db.exec("UPDATE auth.users SET phone='+919876543210'; UPDATE account_programs SET category=''");
    expect(await ready()).toBe(false);
  } finally { await db.close(); }
});