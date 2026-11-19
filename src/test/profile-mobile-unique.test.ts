import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, expect, it } from 'vitest';
let db: PGlite;
const owner='11111111-1111-4111-8111-111111111111', other='22222222-2222-4222-8222-222222222222';
beforeAll(async()=>{
 db=new PGlite();await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT '${owner}'::uuid$$;
 CREATE FUNCTION has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$SELECT false$$;
 CREATE TABLE auth.users(id uuid,phone text,phone_confirmed_at timestamptz,email text);
 CREATE TABLE profiles(id uuid PRIMARY KEY,phone text);
 INSERT INTO auth.users VALUES('${owner}','+919111111111',now(),null),('${other}','+919222222222',now(),null);
 INSERT INTO profiles VALUES('${owner}','9111111111'),('${other}','9222222222');`);
 await db.exec(readFileSync('drizzle/migrations/0126_unique_profile_mobile_and_single_verified_change.sql','utf8'));
},30000);
afterAll(async()=>{await db.close();});
it('rejects another profile with the same number',async()=>{
 await expect(db.exec(`INSERT INTO profiles VALUES('33333333-3333-4333-8333-333333333333','9111111111')`)).rejects.toThrow('MOBILE_ALREADY_REGISTERED');
});
it('requires verified ownership of the new number',async()=>{
 await expect(db.exec(`UPDATE profiles SET phone='9333333333' WHERE id='${owner}'`)).rejects.toThrow('VERIFIED_PHONE_REQUIRED');
});
it('allows exactly one confirmed number change',async()=>{
 await db.exec(`UPDATE auth.users SET phone='+919333333333' WHERE id='${owner}';UPDATE profiles SET phone='9333333333' WHERE id='${owner}';`);
 expect((await db.query<{phone:string}>(`SELECT phone FROM profiles WHERE id='${owner}'`)).rows[0]?.phone).toBe('9333333333');
 await db.exec(`UPDATE auth.users SET phone='+919444444444' WHERE id='${owner}'`);
 await expect(db.exec(`UPDATE profiles SET phone='9444444444' WHERE id='${owner}'`)).rejects.toThrow('PHONE_CHANGE_ALREADY_USED');
});