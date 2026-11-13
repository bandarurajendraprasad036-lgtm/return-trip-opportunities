import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll,afterAll,it,expect } from 'vitest';
let db:PGlite;
const payer='22222222-2222-4222-8222-222222222222',admin='11111111-1111-4111-8111-111111111111',message='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
beforeAll(async()=>{
 db=new PGlite();await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.user',true),'')::uuid$$;
 CREATE FUNCTION has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$SELECT $1='${admin}'::uuid$$;
 CREATE TABLE profiles(id uuid PRIMARY KEY);INSERT INTO profiles VALUES('${payer}'),('${admin}');
 CREATE TABLE messages(id uuid PRIMARY KEY,sender_id uuid,image_path text);
 INSERT INTO messages VALUES('${message}','${payer}','${payer}/proof.png');
 CREATE TABLE membership_requests(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),message_id uuid,payer_id uuid,reference text,status text DEFAULT 'pending',reviewed_at timestamptz,reviewed_by uuid,note text);
 CREATE TABLE membership_access(request_id uuid,revoked_at timestamptz);
 CREATE TABLE account_blocks(user_id uuid PRIMARY KEY,reason text);
 CREATE FUNCTION block_confirmed_content(uuid,text) RETURNS void LANGUAGE sql AS $$INSERT INTO account_blocks VALUES($1,$2) ON CONFLICT DO NOTHING$$;`);
 await db.exec(readFileSync('drizzle/migrations/0071_payment_screenshot_match_gate.sql','utf8'));
},30000);
afterAll(async()=>{await db.close();});
it('missing image comparison cannot create a Prime request',async()=>{
 await expect(db.query(`INSERT INTO membership_requests(message_id,payer_id,reference) VALUES('${message}','${payer}','412345678901')`)).rejects.toThrow('MATCHED_SCREENSHOT_REQUIRED');
});
it('wrong UPI or UTR cannot bypass the database activation gate',async()=>{
 await db.exec(`INSERT INTO payment_image_checks(message_id,payer_id,entered_upi,observed_upi,observed_utr,match_status) VALUES('${message}','${payer}','payer@ybl','other@ybl','412345678901','matched')`);
 await expect(db.query(`INSERT INTO membership_requests(message_id,payer_id,reference) VALUES('${message}','${payer}','412345678901')`)).rejects.toThrow('MATCHED_SCREENSHOT_REQUIRED');
 await db.exec(`UPDATE payment_image_checks SET observed_upi='payer@ybl'`);
 await expect(db.query(`INSERT INTO membership_requests(message_id,payer_id,reference) VALUES('${message}','${payer}','412345678902')`)).rejects.toThrow('MATCHED_SCREENSHOT_REQUIRED');
});
it('suspected editing alone neither grants access nor blocks the account',async()=>{
 await db.exec(`UPDATE payment_image_checks SET match_status='suspected_edit'`);
 await expect(db.query(`INSERT INTO membership_requests(message_id,payer_id,reference) VALUES('${message}','${payer}','412345678901')`)).rejects.toThrow('MATCHED_SCREENSHOT_REQUIRED');
 expect((await db.query<{n:number}>('SELECT count(*)::int n FROM account_blocks')).rows[0]?.n).toBe(0);
});
it('only both matched fields can create a new request',async()=>{
 await db.exec(`UPDATE payment_image_checks SET match_status='matched';INSERT INTO membership_requests(message_id,payer_id,reference) VALUES('${message}','${payer}','412345678901');INSERT INTO membership_access SELECT id,NULL FROM membership_requests`);
 expect((await db.query<{n:number}>('SELECT count(*)::int n FROM membership_requests')).rows[0]?.n).toBe(1);
});
it('ordinary users cannot confirm fraud and block another account',async()=>{
 await db.exec(`SELECT set_config('test.user','${payer}',false)`);
 await expect(db.query(`SELECT confirm_edited_payment_image('${message}')`)).rejects.toThrow('ADMIN_ONLY');
});
it('administrator confirmation blocks the payer and revokes linked access',async()=>{
 await db.exec(`SELECT set_config('test.user','${admin}',false);SELECT confirm_edited_payment_image('${message}')`);
 expect((await db.query<{user_id:string}>('SELECT user_id FROM account_blocks')).rows[0]?.user_id).toBe(payer);
 expect((await db.query<{revoked:boolean}>('SELECT revoked_at IS NOT NULL revoked FROM membership_access')).rows[0]?.revoked).toBe(true);
});
it('private comparison evidence has no anonymous read or client write grant',async()=>{
 expect((await db.query<{read:boolean;write:boolean}>(`SELECT has_table_privilege('anon','payment_image_checks','SELECT') read,has_table_privilege('authenticated','payment_image_checks','INSERT') write`)).rows[0]).toEqual({read:false,write:false});
});