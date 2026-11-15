import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, expect, it } from 'vitest';
let db: PGlite;
const owner='22222222-2222-4222-8222-222222222222',other='33333333-3333-4333-8333-333333333333',admin='11111111-1111-4111-8111-111111111111';
const proof=`screenshot:${'a'.repeat(64)}`,message='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
beforeAll(async()=>{db=new PGlite();await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;
CREATE TABLE profiles(id uuid PRIMARY KEY); INSERT INTO profiles VALUES('${owner}'),('${other}');
CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
CREATE FUNCTION has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$SELECT $1='${admin}'::uuid$$;
CREATE FUNCTION support_admin_id() RETURNS uuid LANGUAGE sql AS $$SELECT '${admin}'::uuid$$;
CREATE TABLE messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),sender_id uuid,receiver_id uuid,image_path text,body text,is_auto boolean,needs_admin boolean);
CREATE TABLE membership_requests(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),payer_id uuid,user_id uuid,amount integer,reference text UNIQUE,message_id uuid,status text DEFAULT 'pending',submitted_at timestamptz,reviewed_at timestamptz,reviewed_by uuid,note text);
CREATE TABLE membership_access(user_id uuid,request_id uuid,source text,revoked_at timestamptz);
CREATE TABLE provider_contact_batches(user_id uuid,status text);CREATE TABLE referral_vip_joins(joined_user uuid,referrer_id uuid);
CREATE TABLE prime99_payments(reference text);CREATE TABLE referral_cash_receipts(reference text);
INSERT INTO messages(id,sender_id,receiver_id,image_path) VALUES('${message}','${owner}','${admin}','${owner}/proof.png');`);
await db.exec(readFileSync('drizzle/migrations/0088_screenshot_only_membership_evidence.sql','utf8'));},30000);
afterAll(async()=>{await db.close();});
it('accepts a screenshot identity without any bank transaction number and keeps 100 rupees pending',async()=>{
await db.query(`SELECT register_membership_evidence('${owner}','${owner}',100,'${proof}','${message}')`);
expect((await db.query<{amount:number,status:string}>('SELECT amount,status FROM membership_requests')).rows).toEqual([{amount:100,status:'pending'}]);
expect((await db.query<{held:boolean}>('SELECT revoked_at IS NOT NULL held FROM membership_access')).rows).toEqual([{held:true}]);
});
it('same screenshot retry cannot create a second access grant',async()=>{
await db.query(`SELECT register_membership_evidence('${owner}','${owner}',100,'${proof}','${message}')`);
expect((await db.query<{n:number}>('SELECT count(*)::int n FROM membership_access')).rows[0]?.n).toBe(1);
});
it('cannot reuse another account screenshot',async()=>{
await db.exec(`INSERT INTO messages(id,sender_id,receiver_id,image_path) VALUES('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','${other}','${admin}','${other}/proof.png')`);
await expect(db.query(`SELECT register_membership_evidence('${other}','${other}',100,'${proof}','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')`)).rejects.toThrow('REFERENCE_ALREADY_USED');
});
