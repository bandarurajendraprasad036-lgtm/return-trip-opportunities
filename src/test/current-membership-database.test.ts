import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
const admin='11111111-1111-4111-8111-111111111111', owner='22222222-2222-4222-8222-222222222222', joined='33333333-3333-4333-8333-333333333333', other='44444444-4444-4444-8444-444444444444';
describe('current confirmed receipt rules in PostgreSQL', () => {
 let db:PGlite;
 const actor=async(id:string)=>{await db.exec(`SELECT set_config('test.user','${id}',false)`);};
 const contacts=Array.from({length:20},(_,i)=>({town:'Town',service:'Plumber',mobile:String(9000000000+i),consent:true}));
 beforeAll(async()=>{
  db=new PGlite();
  await db.exec(`CREATE SCHEMA auth;CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.user',true),'')::uuid$$;
  CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
  CREATE FUNCTION has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$SELECT $1='${admin}'::uuid AND $2='admin'$$;
  CREATE FUNCTION support_admin_id() RETURNS uuid LANGUAGE sql AS $$SELECT '${admin}'::uuid$$;
  CREATE FUNCTION admin_broadcast(text) RETURNS integer LANGUAGE sql AS $$SELECT 0$$;
  CREATE TABLE profiles(id uuid PRIMARY KEY,bell_activated_at timestamptz);
  CREATE TABLE posts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,module text,kind text,status text DEFAULT 'active',visible_after timestamptz,job_expires_at timestamptz,vehicle_name text,vehicle_number text,driver_name text,contact_phone text,public_photo text,public_brand text);
  CREATE TABLE notifications(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,post_id uuid,message text,created_at timestamptz DEFAULT now());
  CREATE TABLE messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),sender_id uuid,receiver_id uuid,post_id uuid,body text);
  CREATE TABLE post_chat_pairs(post_id uuid,member_id uuid,owner_id uuid,UNIQUE(post_id,member_id));
  CREATE TABLE account_programs(user_id uuid,sharing_active boolean DEFAULT false);
  CREATE TABLE notification_preferences(user_id uuid,enabled boolean,timezone text,daily_limit int,quiet_start time,quiet_end time);
  CREATE TABLE referral_vip_joins(joined_user uuid,referrer_id uuid);
  CREATE TABLE referral_cash_receipts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,reference text UNIQUE,amount_paise bigint,confirmed_by uuid);
  CREATE TABLE referral_cash_rewards(receipt_id uuid PRIMARY KEY REFERENCES referral_cash_receipts(id),user_id uuid,amount_paise bigint,created_at timestamptz DEFAULT now());
  CREATE TABLE referral_invitee_rewards(receipt_id uuid,user_id uuid,amount_paise bigint);
  CREATE TABLE referral_board_consent(user_id uuid,display_name text,region text,published boolean);
  CREATE TABLE referral_vip_campaign(id boolean,started_at timestamptz,event_label text);
  CREATE TABLE service_profiles(user_id uuid PRIMARY KEY,published boolean,photo_path text);
  CREATE FUNCTION referral_vip_ranks() RETURNS TABLE(user_id uuid,joins bigint,rank_no bigint) LANGUAGE sql AS $$SELECT referrer_id,count(*),row_number() OVER(ORDER BY count(*) DESC,referrer_id) FROM referral_vip_joins GROUP BY referrer_id$$;
  INSERT INTO profiles(id) VALUES('${admin}'),('${owner}'),('${joined}'),('${other}'); INSERT INTO referral_vip_joins VALUES('${joined}','${owner}');`);
  for(const name of ['0047_prime99_paid_alerts_monthly_posts_and_daily_board','0048_prime99_renewal_quota_and_daily_fairness','0051_hundred_forty_days_private_contacts_extra_posts']) await db.exec(readFileSync(`drizzle/migrations/${name}.sql`,'utf8'));
  await db.exec(`CREATE TABLE weekly_winners(week_start date,region text,user_id uuid,display_name text,photo_path text,joins bigint,paid bigint,percent numeric,created_at timestamptz DEFAULT now(),UNIQUE(week_start,region));`);
  await db.exec(readFileSync('drizzle/migrations/0052_service_bell_quota_district_and_next_sunday.sql','utf8'));
  await db.exec(readFileSync('drizzle/migrations/0054_monthly_paid_exact_owner_bells_free_private_chat.sql','utf8'));
  await db.exec(`CREATE TRIGGER post_delay BEFORE INSERT OR UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION guard_post_delay();`);
 },30000);
 afterAll(async()=>{await db.close();});
 it('rejects a new 99 and accepts a full 100 pending receipt without access',async()=>{
  await actor(owner);await expect(db.exec(`INSERT INTO prime99_payments(user_id,reference,payable_amount) VALUES('${owner}','OLD-99',99)`)).rejects.toThrow('PAYMENT_PRICE_MISMATCH');
  await db.exec(`INSERT INTO prime99_payments(user_id,reference,payable_amount) VALUES('${owner}','FULL-100',100)`);
  expect((await db.query<{ok:boolean}>(`SELECT has_prime99('${owner}') ok`)).rows[0]?.ok).toBe(false);
 });
 it('only admin confirmation grants one month without a three-day delay',async()=>{
  await expect(db.exec(`SELECT review_prime99((SELECT id FROM prime99_payments WHERE reference='FULL-100'),true,'')`)).rejects.toThrow('ADMIN_ONLY');
  await actor(admin);await db.exec(`SELECT review_prime99((SELECT id FROM prime99_payments WHERE reference='FULL-100'),true,'received')`);
  const r=await db.query<{monthly:boolean,delay:number}>(`SELECT ends_at=received_at+interval '1 month' monthly,extract(epoch FROM alerts_start_at-received_at)/86400 delay FROM prime99_payments WHERE reference='FULL-100'`);
  expect(r.rows[0]?.monthly).toBe(true);expect(Number(r.rows[0]?.delay)).toBe(0);
 });
 it('confirmed 100 enables notices immediately after bell activation',async()=>{
  expect((await db.query<{ok:boolean}>(`SELECT paid_alert_ready('${owner}') ok`)).rows[0]?.ok).toBe(false);
  await db.exec(`UPDATE prime99_payments SET alerts_start_at=now()-interval '1 second' WHERE user_id='${owner}'`);
  expect((await db.query<{ok:boolean}>(`SELECT paid_alert_ready('${owner}') ok`)).rows[0]?.ok).toBe(false);
  await db.exec(`UPDATE profiles SET bell_activated_at=now() WHERE id='${owner}'`);
  expect((await db.query<{ok:boolean}>(`SELECT paid_alert_ready('${owner}') ok`)).rows[0]?.ok).toBe(true);
 });
 it('confirmed full referred 100 credits exactly 20 to inviter only and never twice',async()=>{
  await actor(joined);await db.exec(`INSERT INTO prime99_payments(user_id,reference,payable_amount) VALUES('${joined}','JOIN-100',100)`);await actor(admin);
  await db.exec(`SELECT review_prime99((SELECT id FROM prime99_payments WHERE reference='JOIN-100'),true,'received')`);
  expect((await db.query<{user_id:string,n:number}>('SELECT user_id,amount_paise::int n FROM referral_cash_rewards')).rows).toEqual([{user_id:owner,n:2000}]);
  expect((await db.query<{n:number}>('SELECT count(*)::int n FROM referral_invitee_rewards')).rows[0]?.n).toBe(0);
  await expect(db.exec(`SELECT review_prime99((SELECT id FROM prime99_payments WHERE reference='JOIN-100'),true,'again')`)).rejects.toThrow('NO_PENDING_PAYMENT');
 });
 it('twenty consented numbers change price to 49 only after admin review',async()=>{
  await actor(other); await expect(db.query('SELECT submit_provider_contacts($1::jsonb)',[JSON.stringify(contacts.slice(1))])).rejects.toThrow('MINIMUM_TWENTY_CONTACTS');
  await expect(db.query('SELECT submit_provider_contacts($1::jsonb)',[JSON.stringify(contacts.map(r=>({...r,consent:false})))])).rejects.toThrow('CONTACT_CONSENT_AND_DETAILS_REQUIRED');
  const b=await db.query<{id:string}>('SELECT submit_provider_contacts($1::jsonb) id',[JSON.stringify(contacts)]);const id=b.rows[0]?.id;if(!id)throw new Error('batch missing');
  expect((await db.query<{price:number}>('SELECT my_membership_price() price')).rows[0]?.price).toBe(100);
  await expect(db.query('SELECT review_provider_contacts($1,true,$2)',[id,'reviewed'])).rejects.toThrow('ADMIN_ONLY');
  await actor(admin);await db.query('SELECT review_provider_contacts($1,true,$2)',[id,'reviewed']);await actor(other);
  expect((await db.query<{price:number}>('SELECT my_membership_price() price')).rows[0]?.price).toBe(49);
 });
 it('other accounts cannot read submitted contact phones',async()=>{
  await actor(owner);await db.exec('SET ROLE authenticated');expect((await db.query<{n:number}>('SELECT count(*)::int n FROM provider_contacts')).rows[0]?.n).toBe(0);await db.exec('RESET ROLE');
 });
 it('three free posts survive deletion and one approved 49 extra receipt permits only one extra',async()=>{
  await actor(other);await db.exec(`INSERT INTO posts(user_id) VALUES('${other}'),('${other}'),('${other}');DELETE FROM posts WHERE user_id='${other}'`);
  await expect(db.exec(`INSERT INTO posts(user_id) VALUES('${other}')`)).rejects.toThrow('MONTHLY_THREE_POST_LIMIT');
  await db.exec(`INSERT INTO prime99_payments(user_id,reference,payable_amount,payment_purpose) VALUES('${other}','EXTRA-49',49,'extra_post')`);
  await expect(db.exec(`INSERT INTO posts(user_id) VALUES('${other}')`)).rejects.toThrow('MONTHLY_THREE_POST_LIMIT');await actor(admin);
  await db.exec(`SELECT review_prime99((SELECT id FROM prime99_payments WHERE reference='EXTRA-49'),true,'received');INSERT INTO posts(user_id) VALUES('${other}')`);
  expect((await db.query<{ok:boolean}>(`SELECT has_prime99('${other}') ok`)).rows[0]?.ok).toBe(false);
  await expect(db.exec(`INSERT INTO posts(user_id) VALUES('${other}')`)).rejects.toThrow('MONTHLY_THREE_POST_LIMIT');
 });
 it('all free posts wait five hours, without a seeker exception',async()=>{
  const r=await db.query<{delay:number}>(`SELECT extract(epoch FROM visible_after-used_at)/3600 delay FROM posts JOIN monthly_post_usage ON post_id=posts.id WHERE posts.user_id='${other}'`);expect(Number(r.rows[0]?.delay)).toBe(5);
 });
 it('new service publication shares the same three-post quota',async()=>{
  await actor(other);
  await expect(db.exec(`INSERT INTO service_profiles(user_id,published) VALUES('${other}',true)`)).rejects.toThrow('MONTHLY_THREE_POST_LIMIT');
  await actor(owner);await db.exec(`INSERT INTO service_profiles(user_id,published) VALUES('${owner}',true);INSERT INTO posts(user_id) VALUES('${owner}'),('${owner}')`);
  await expect(db.exec(`INSERT INTO posts(user_id) VALUES('${owner}')`)).rejects.toThrow('MONTHLY_THREE_POST_LIMIT');
 });
 it('only paid members can ring an actual published service',async()=>{
  await actor(other);await expect(db.exec(`SELECT ring_service('${owner}')`)).rejects.toThrow('PAID_BELL_REQUIRED');
  await actor(joined);await db.exec(`SELECT ring_service('${owner}')`);
  expect((await db.query<{ok:boolean}>(`SELECT can_post_chat(NULL,'${owner}') ok`)).rows[0]?.ok).toBe(true);
  expect((await db.query<{n:number}>('SELECT count(*)::int n FROM service_chat_pairs')).rows[0]?.n).toBe(1);
 });
 it('every selected listing notifies only its exact owner, never other areas or vehicles',async()=>{
  await db.exec(`INSERT INTO notification_preferences(user_id,enabled,timezone,daily_limit) VALUES('${owner}',true,'Asia/Kolkata',5);DELETE FROM notifications;UPDATE posts SET id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',module='vehicle',kind='return' WHERE id=(SELECT id FROM posts WHERE user_id='${owner}' LIMIT 1);INSERT INTO posts(id,user_id,module,kind) VALUES('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','${admin}','vehicle','local');`);
  await actor(joined);
  expect((await db.query<{owner:string}>(`SELECT ring_post('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') owner`)).rows[0]?.owner).toBe(owner);
  expect((await db.query<{user_id:string,post_id:string}>('SELECT user_id,post_id FROM notifications')).rows).toEqual([{user_id:owner,post_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'}]);
  expect((await db.query<{n:number}>(`SELECT notify_nearby_vehicles('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') n`)).rows[0]?.n).toBe(0);
 });
 it('pending or discounted receipts cannot operate a bell',async()=>{
  await actor(other);await expect(db.exec(`SELECT ring_post('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')`)).rejects.toThrow('PAID_BELL_REQUIRED');
  await db.exec(`INSERT INTO prime99_payments(user_id,reference,payable_amount) VALUES('${other}','DISCOUNT-49',49)`);await actor(admin);await db.exec(`SELECT review_prime99((SELECT id FROM prime99_payments WHERE reference='DISCOUNT-49'),true,'received')`);
  await actor(other);expect((await db.query<{ok:boolean}>(`SELECT has_paid_bell('${other}') ok`)).rows[0]?.ok).toBe(false);
 });
 it('established conversations stay free after payment expiry without granting unrelated access',async()=>{
  await db.exec(`UPDATE prime99_payments SET ends_at=now()-interval '1 second' WHERE user_id='${joined}'`);await actor(joined);
  expect((await db.query<{ok:boolean}>(`SELECT can_post_chat('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','${owner}') ok`)).rows[0]?.ok).toBe(true);
  expect((await db.query<{ok:boolean}>(`SELECT can_post_chat('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','${admin}') ok`)).rows[0]?.ok).toBe(false);
  await expect(db.exec(`SELECT ring_post('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')`)).rejects.toThrow('PAID_BELL_REQUIRED');
 });
});