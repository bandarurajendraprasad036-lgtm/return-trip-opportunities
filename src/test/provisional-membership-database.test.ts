import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, it, expect } from 'vitest';
let db:PGlite;
const admin='11111111-1111-4111-8111-111111111111', member='22222222-2222-4222-8222-222222222222', other='33333333-3333-4333-8333-333333333333';
beforeAll(async()=>{
 db=new PGlite();await db.exec(`CREATE ROLE authenticated;CREATE ROLE service_role;CREATE ROLE anon;CREATE SCHEMA auth;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.user',true),'')::uuid$$;
 CREATE TABLE profiles(id uuid PRIMARY KEY);INSERT INTO profiles VALUES('${admin}'),('${member}'),('${other}');
 CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
 CREATE FUNCTION has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$SELECT $1='${admin}'::uuid$$;
 CREATE FUNCTION support_admin_id() RETURNS uuid LANGUAGE sql AS $$SELECT '${admin}'::uuid$$;
 CREATE FUNCTION paid_alert_ready(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT false$$;
 CREATE TABLE messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),sender_id uuid,receiver_id uuid,body text DEFAULT '',image_path text DEFAULT '',is_auto boolean DEFAULT false,needs_admin boolean DEFAULT false);
 CREATE TABLE prime99_payments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,payment_purpose text,status text,payable_amount int,received_at timestamptz,ends_at timestamptz,used_post_id uuid,reference text,review_note text DEFAULT '');
 CREATE TABLE provider_contact_batches(user_id uuid,status text);
 CREATE TABLE referral_vip_joins(joined_user uuid,referrer_id uuid);
 CREATE TABLE referral_cash_receipts(reference text);
 CREATE FUNCTION confirm_referral_cash(uuid,text,bigint) RETURNS uuid LANGUAGE plpgsql AS $$BEGIN INSERT INTO referral_cash_receipts VALUES($2);RETURN gen_random_uuid();END$$;
 CREATE TABLE monthly_post_periods(user_id uuid PRIMARY KEY,starts_at timestamptz,ends_at timestamptz);
 CREATE TABLE monthly_post_usage(post_id uuid PRIMARY KEY,user_id uuid,used_at timestamptz DEFAULT now());
 CREATE TABLE vehicle_route_preferences(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,from_place text,to_place text,enabled boolean DEFAULT true);
 `);await db.exec(readFileSync('drizzle/migrations/0058_provisional_membership_review_and_route_details.sql','utf8'));await db.exec(readFileSync('drizzle/migrations/0070_idempotent_membership_evidence_retry.sql','utf8'));
},30000);
afterAll(async()=>{await db.close();});
it('requires a participant-owned image and rejects UTR alone',async()=>{
 await db.exec(`INSERT INTO messages(id,sender_id,receiver_id) VALUES('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','${member}','${admin}');`);
 await expect(db.query(`SELECT register_membership_evidence('${member}','${member}',100,'412345678901','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')`)).rejects.toThrow('IMAGE_REQUIRED');
 expect((await db.query<{n:number}>(`SELECT count(*)::int n FROM membership_access`)).rows[0]?.n).toBe(0);
});
it('UTR plus photo grants provisional access, never a confirmed receipt or cash award',async()=>{
 await db.exec(`UPDATE messages SET image_path='${member}/image.png' WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';`);
 await db.query(`SELECT register_membership_evidence('${member}','${member}',100,'412345678901','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')`);
 expect((await db.query<{source:string}>(`SELECT source FROM membership_access`)).rows).toEqual([{source:'provisional'}]);
 expect((await db.query<{ok:boolean}>(`SELECT has_paid_bell('${member}') ok`)).rows[0]?.ok).toBe(true);
 expect((await db.query<{n:number}>(`SELECT count(*)::int n FROM referral_cash_receipts`)).rows[0]?.n).toBe(0);
});
it('duplicate UTR cannot create another access grant or be reused by another account',async()=>{
 await db.query(`SELECT register_membership_evidence('${member}','${member}',100,'412345678901','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')`);
 expect((await db.query<{n:number}>(`SELECT count(*)::int n FROM membership_access`)).rows[0]?.n).toBe(1);
 await db.exec(`INSERT INTO messages(id,sender_id,receiver_id,image_path) VALUES('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','${other}','${admin}','${other}/proof.png');`);
 await expect(db.query(`SELECT register_membership_evidence('${other}','${other}',100,'412345678901','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')`)).rejects.toThrow('REFERENCE_ALREADY_USED');
});
it('ordinary accounts cannot approve, reject or grant Prime',async()=>{
 await db.exec(`SELECT set_config('test.user','${member}',false)`);
 await expect(db.query(`SELECT review_membership_evidence((SELECT id FROM membership_requests LIMIT 1),true)`)).rejects.toThrow('ADMIN_ONLY');
 await expect(db.query(`SELECT admin_membership_access('${other}',true)`)).rejects.toThrow('ADMIN_ONLY');
});
it('admin rejection revokes provisional access without modifying payment history',async()=>{
 await db.exec(`SELECT set_config('test.user','${admin}',false)`);await db.query(`SELECT review_membership_evidence((SELECT id FROM membership_requests LIMIT 1),false)`);
 expect((await db.query<{ok:boolean}>(`SELECT has_paid_bell('${member}') ok`)).rows[0]?.ok).toBe(false);
 expect((await db.query<{n:number}>(`SELECT count(*)::int n FROM referral_cash_receipts`)).rows[0]?.n).toBe(0);
});
it('reviewed twenty-contact discount is 80, not the 49 extra post price',async()=>{
 await db.exec(`SELECT set_config('test.user','${other}',false)`);expect((await db.query<{p:number}>(`SELECT my_membership_price() p`)).rows[0]?.p).toBe(100);
 await expect(db.query(`SELECT register_membership_evidence('${other}','${other}',80,'412345678902','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')`)).rejects.toThrow('CONTACT_APPROVAL_REQUIRED');
 await db.exec(`INSERT INTO provider_contact_batches VALUES('${other}','approved')`);expect((await db.query<{p:number}>(`SELECT my_membership_price() p`)).rows[0]?.p).toBe(80);
 await db.query(`SELECT register_membership_evidence('${other}','${other}',80,'412345678902','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')`);
});
it('Prime posts are unlimited but a free fourth post needs a 49 credit',async()=>{
 for(let i=0;i<5;i++)await db.query(`SELECT consume_post_slot('${other}',gen_random_uuid())`);
 expect((await db.query<{n:number}>(`SELECT count(*)::int n FROM monthly_post_usage WHERE user_id='${other}'`)).rows[0]?.n).toBe(5);
 for(let i=0;i<3;i++)await db.query(`SELECT consume_post_slot('${member}',gen_random_uuid())`);
 await expect(db.query(`SELECT consume_post_slot('${member}',gen_random_uuid())`)).rejects.toThrow('MONTHLY_THREE_POST_LIMIT');
 await db.exec(`INSERT INTO prime99_payments(user_id,payment_purpose,status,payable_amount,received_at) VALUES('${member}','extra_post','approved',49,now());`);await db.query(`SELECT consume_post_slot('${member}',gen_random_uuid())`);
 expect((await db.query<{n:number}>(`SELECT count(*)::int n FROM prime99_payments WHERE used_post_id IS NOT NULL`)).rows[0]?.n).toBe(1);
});
it('routes store the actual vehicle and tonnes, allow multiple routes, and reject invalid tonnes',async()=>{
 await db.exec(`SELECT set_config('test.user','${member}',false)`);await db.query(`SELECT save_detailed_vehicle_route('మంచిర్యాల','హైదరాబాద్','Mini Truck',3)`);await db.query(`SELECT save_detailed_vehicle_route('మంచిర్యాల','విజయవాడ','Truck',5)`);
 expect((await db.query<{vehicle_type:string;capacity_tons:number}>(`SELECT vehicle_type,capacity_tons FROM vehicle_route_preferences ORDER BY capacity_tons`)).rows).toEqual([{vehicle_type:'Mini Truck',capacity_tons:3},{vehicle_type:'Truck',capacity_tons:5}]);
 await expect(db.query(`SELECT save_detailed_vehicle_route('A','B','Truck',4)`)).rejects.toThrow('ROUTE_DETAILS_REQUIRED');
});
it('same rejected UTR reopens review with latest screenshot but does not restore revoked Prime',async()=>{
 await db.exec(`INSERT INTO messages(id,sender_id,receiver_id,image_path) VALUES('cccccccc-cccc-4ccc-8ccc-cccccccccccc','${member}','${admin}','${member}/corrected.png');`);
 await db.query(`SELECT register_membership_evidence('${member}','${member}',100,'412345678901','cccccccc-cccc-4ccc-8ccc-cccccccccccc')`);
 expect((await db.query<{status:string;message_id:string}>(`SELECT status,message_id FROM membership_requests WHERE reference='412345678901'`)).rows[0]).toEqual({status:'pending',message_id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc'});
 expect((await db.query<{ok:boolean}>(`SELECT has_paid_bell('${member}') ok`)).rows[0]?.ok).toBe(false);
 expect((await db.query<{n:number}>(`SELECT count(*)::int n FROM membership_access WHERE user_id='${member}'`)).rows[0]?.n).toBe(1);
});
it('same pending sponsored UTR is retryable even after the referral request exists',async()=>{
 await db.exec(`INSERT INTO referral_vip_joins VALUES('${admin}','${other}');`);
 await db.query(`SELECT register_membership_evidence('${other}','${admin}',80,'412345678903','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')`);
 await db.query(`SELECT register_membership_evidence('${other}','${admin}',80,'412345678903','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')`);
 expect((await db.query<{n:number}>(`SELECT count(*)::int n FROM membership_access WHERE user_id='${admin}'`)).rows[0]?.n).toBe(1);
});
it('admin approval activates one month and approved UTR retries never extend it or repeat cash',async()=>{
 await db.exec(`SELECT set_config('test.user','${admin}',false)`);
 await db.query(`SELECT review_membership_evidence((SELECT id FROM membership_requests WHERE reference='412345678901'),true)`);
 const before=(await db.query<{ends_at:Date}>(`SELECT ends_at FROM membership_access WHERE user_id='${member}'`)).rows[0]?.ends_at;
 expect((await db.query<{ok:boolean}>(`SELECT has_paid_bell('${member}') ok`)).rows[0]?.ok).toBe(true);
 expect((await db.query<{ok:boolean}>(`SELECT ends_at=starts_at+interval '1 month' ok FROM membership_access WHERE user_id='${member}'`)).rows[0]?.ok).toBe(true);
 await db.query(`SELECT register_membership_evidence('${member}','${member}',100,'412345678901','cccccccc-cccc-4ccc-8ccc-cccccccccccc')`);
 expect((await db.query<{status:string}>(`SELECT status FROM membership_requests WHERE reference='412345678901'`)).rows[0]?.status).toBe('approved');
 expect((await db.query<{ends_at:Date}>(`SELECT ends_at FROM membership_access WHERE user_id='${member}'`)).rows[0]?.ends_at).toEqual(before);
 expect((await db.query<{n:number}>(`SELECT count(*)::int n FROM referral_cash_receipts WHERE reference='412345678901'`)).rows[0]?.n).toBe(1);
});