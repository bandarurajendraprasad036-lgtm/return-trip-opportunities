import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, expect, it } from 'vitest';
let db: PGlite;
const owner='11111111-1111-4111-8111-111111111111', member='22222222-2222-4222-8222-222222222222', unpaid='33333333-3333-4333-8333-333333333333';
beforeAll(async () => {
 db=new PGlite();
 await db.exec(`CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.user',true),'')::uuid$$;
 CREATE TABLE profiles(id uuid PRIMARY KEY,bell_activated_at timestamptz);
 CREATE TABLE prime99_payments(id uuid PRIMARY KEY,user_id uuid,status text,payment_purpose text,payable_amount int,ends_at timestamptz);
 CREATE FUNCTION has_paid_bell(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT EXISTS(SELECT 1 FROM prime99_payments WHERE user_id=$1 AND status='approved' AND payable_amount=100 AND ends_at>now())$$;
 CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
 CREATE FUNCTION support_admin_id() RETURNS uuid LANGUAGE sql AS $$SELECT '${owner}'::uuid$$;
 CREATE FUNCTION has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$SELECT false$$;
 CREATE TABLE posts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,module text DEFAULT 'job',kind text,status text DEFAULT 'active',service_type text DEFAULT '',skill text,location text,area_scope text DEFAULT 'local',visible_after timestamptz,job_expires_at timestamptz,visibility_notified_at timestamptz,created_at timestamptz DEFAULT now());
 CREATE TABLE notifications(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,post_id uuid,matched_post_id uuid,message text,created_at timestamptz DEFAULT now());
 CREATE TABLE notification_preferences(user_id uuid,enabled boolean,timezone text,daily_limit int,quiet_start time,quiet_end time);
 CREATE TABLE messages(sender_id uuid,receiver_id uuid,post_id uuid,body text);
 CREATE TABLE post_chat_pairs(post_id uuid,member_id uuid,owner_id uuid,UNIQUE(post_id,member_id));
 CREATE TABLE service_profiles(user_id uuid,published boolean);CREATE TABLE service_chat_pairs(member_id uuid,owner_id uuid,UNIQUE(member_id,owner_id));
 CREATE TABLE push_deliveries(id uuid,status text,attempts int,updated_at timestamptz,available_at timestamptz,user_id uuid);
 INSERT INTO profiles VALUES('${owner}',NULL),('${member}',NULL),('${unpaid}',NULL);
 INSERT INTO prime99_payments VALUES(gen_random_uuid(),'${owner}','approved','membership',100,now()+interval '1 month'),(gen_random_uuid(),'${member}','approved','membership',100,now()+interval '1 month');`);
 for(const name of ['0055_paid_work_service_matches_daytime_queue','0056_queue_selected_owner_bell_notices']) await db.exec(readFileSync(`drizzle/migrations/${name}.sql`,'utf8'));
 await db.exec(`CREATE TRIGGER a_notice BEFORE INSERT ON notifications FOR EACH ROW EXECUTE FUNCTION guard_prime99_notice();CREATE TRIGGER b_match BEFORE INSERT ON notifications FOR EACH ROW EXECUTE FUNCTION guard_new_match_notifications();CREATE TRIGGER auto_match AFTER INSERT ON posts FOR EACH ROW EXECUTE FUNCTION match_post();`);
},30000);
afterAll(async()=>{await db.close();});
it('opens at 09:00, closes at 20:00, and postpones evening notices to next 09:00',async()=>{
 const r=await db.query<{before:boolean,start:boolean,end:boolean,next:string}>(`SELECT notice_window_open('2026-11-12T08:59:59+05:30') before,notice_window_open('2026-11-12T09:00:00+05:30') start,notice_window_open('2026-11-12T20:00:00+05:30') "end",next_notice_open('2026-11-12T20:00:00+05:30')::text next`);
 expect(r.rows[0]?.before).toBe(false);expect(r.rows[0]?.start).toBe(true);expect(r.rows[0]?.end).toBe(false);expect(new Date(r.rows[0]?.next ?? '').toISOString()).toBe('2026-11-13T03:30:00.000Z');
});
it('matches Mancherial driver offers only to paid same-area drivers, without a bell',async()=>{
 await db.exec(`INSERT INTO posts(user_id,kind,skill,location,visible_after) VALUES('${member}','seeker','డ్రైవర్','మంచిర్యాల',now()),('${unpaid}','seeker','డ్రైవర్','మంచిర్యాల',now());INSERT INTO posts(user_id,kind,skill,location,visible_after) VALUES('${owner}','employer','Driver','మంచిర్యాల',now());`);
 const r=await db.query<{user_id:string}>(`SELECT user_id FROM notifications UNION ALL SELECT user_id FROM deferred_listing_notices`);
 expect(r.rows.map(row=>row.user_id)).toEqual([member]);
});
it('never matches another area or another occupation; any-area accepts only the same occupation',async()=>{
 const base=`jsonb_populate_record(NULL::posts,'{"module":"job","user_id":"${owner}","kind":"employer","status":"active","service_type":"","skill":"Driver","location":"మంచిర్యాల","area_scope":"local"}')`;
 const candidate=(location:string,skill:string,scope='local')=>`jsonb_populate_record(NULL::posts,'{"module":"job","user_id":"${member}","kind":"seeker","status":"active","service_type":"","skill":"${skill}","location":"${location}","area_scope":"${scope}"}')`;
 expect((await db.query<{ok:boolean}>(`SELECT work_posts_match(${base},${candidate('హైదరాబాద్','Driver')}) ok`)).rows[0]?.ok).toBe(false);
 expect((await db.query<{ok:boolean}>(`SELECT work_posts_match(${base},${candidate('మంచిర్యాల','Plumber')}) ok`)).rows[0]?.ok).toBe(false);
 expect((await db.query<{ok:boolean}>(`SELECT work_posts_match(${base},${candidate('ఏ ప్రాంతమైనా','డ్రైవర్','country')}) ok`)).rows[0]?.ok).toBe(true);
});
it('matches plumber service demands with service offers but never with job-only entries',async()=>{
 const a=`jsonb_populate_record(NULL::posts,'{"module":"job","user_id":"${owner}","kind":"employer","status":"active","service_type":"service","skill":"Plumber","location":"మంచిర్యాల","area_scope":"local"}')`;
 const b=(type:string)=>`jsonb_populate_record(NULL::posts,'{"module":"job","user_id":"${member}","kind":"seeker","status":"active","service_type":"${type}","skill":"ప్లంబర్","location":"మంచిర్యాల","area_scope":"local"}')`;
 expect((await db.query<{ok:boolean}>(`SELECT work_posts_match(${a},${b('service')}) ok`)).rows[0]?.ok).toBe(true);
 expect((await db.query<{ok:boolean}>(`SELECT work_posts_match(${a},${b('')}) ok`)).rows[0]?.ok).toBe(false);
});
it('queues a selected vehicle bell only for its exact paid owner during the night',async()=>{
 await db.exec(`CREATE OR REPLACE FUNCTION notice_window_open(_at timestamptz DEFAULT now(),_zone text DEFAULT 'Asia/Kolkata') RETURNS boolean LANGUAGE sql AS $$SELECT false$$;
 SELECT set_config('test.user','${member}',false);DELETE FROM notifications;DELETE FROM deferred_listing_notices;UPDATE posts SET visibility_notified_at=now();
 INSERT INTO posts(id,user_id,module,kind,skill,location,visible_after) VALUES('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','${owner}','vehicle','owner','','మంచిర్యాల',now());`);
 expect((await db.query<{owner:string}>(`SELECT ring_post('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') owner`)).rows[0]?.owner).toBe(owner);
 expect((await db.query<{n:number}>(`SELECT count(*)::int n FROM notifications`)).rows[0]?.n).toBe(0);
 expect((await db.query<{user_id:string,post_id:string}>(`SELECT user_id,post_id FROM deferred_listing_notices`)).rows).toEqual([{user_id:owner,post_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'}]);
 await db.exec(`UPDATE deferred_listing_notices SET available_at=now();CREATE OR REPLACE FUNCTION notice_window_open(_at timestamptz DEFAULT now(),_zone text DEFAULT 'Asia/Kolkata') RETURNS boolean LANGUAGE sql AS $$SELECT true$$;SELECT dispatch_visible_post_matches();`);
 expect((await db.query<{user_id:string}>(`SELECT user_id FROM notifications`)).rows).toEqual([{user_id:owner}]);
});
it('preserves paid-only private chat while admin evidence submission stays accessible',async()=>{
 await db.exec(`INSERT INTO post_chat_pairs VALUES('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','${member}','${unpaid}');SELECT set_config('test.user','${member}',false);`);
 expect((await db.query<{ok:boolean}>(`SELECT can_post_chat('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','${unpaid}') ok`)).rows[0]?.ok).toBe(true);
 await db.exec(`UPDATE prime99_payments SET ends_at=now()-interval '1 second' WHERE user_id='${member}'`);
 expect((await db.query<{ok:boolean}>(`SELECT can_post_chat('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','${unpaid}') ok`)).rows[0]?.ok).toBe(false);
 expect((await db.query<{ok:boolean}>(`SELECT can_post_chat(NULL,'${owner}') ok`)).rows[0]?.ok).toBe(true);
});
it('keeps unpaid posts hidden for five hours, then releases pending posts only after full ₹100 approval',async()=>{
 await db.exec(`CREATE TRIGGER delay_posts BEFORE INSERT OR UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION guard_post_delay();
 INSERT INTO posts(id,user_id,kind,skill,location) VALUES('cccccccc-cccc-4ccc-8ccc-cccccccccccc','${unpaid}','seeker','Driver','హైదరాబాద్');`);
 expect((await db.query<{hours:number}>(`SELECT round(extract(epoch FROM (visible_after-created_at))/3600)::int hours FROM posts WHERE id='cccccccc-cccc-4ccc-8ccc-cccccccccccc'`)).rows[0]?.hours).toBe(5);
 await db.exec(`INSERT INTO prime99_payments VALUES('dddddddd-dddd-4ddd-8ddd-dddddddddddd','${unpaid}','pending','membership',49,now()+interval '1 month');UPDATE prime99_payments SET status='approved' WHERE id='dddddddd-dddd-4ddd-8ddd-dddddddddddd';`);
 expect((await db.query<{hidden:boolean}>(`SELECT visible_after>now() hidden FROM posts WHERE id='cccccccc-cccc-4ccc-8ccc-cccccccccccc'`)).rows[0]?.hidden).toBe(true);
 await db.exec(`INSERT INTO prime99_payments VALUES('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','${unpaid}','pending','membership',100,now()+interval '1 month');UPDATE prime99_payments SET status='approved' WHERE id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';`);
 expect((await db.query<{visible:boolean}>(`SELECT visible_after<=now() visible FROM posts WHERE id='cccccccc-cccc-4ccc-8ccc-cccccccccccc'`)).rows[0]?.visible).toBe(true);
});