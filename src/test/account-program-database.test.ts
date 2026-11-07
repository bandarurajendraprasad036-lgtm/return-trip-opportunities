import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';

describe('Final program database rules', () => {
 let db: PGlite;
 const owner='11111111-1111-4111-8111-111111111111';
 const member='22222222-2222-4222-8222-222222222222';
 beforeAll(async () => {
  db=new PGlite();
  await db.exec(`CREATE SCHEMA auth;CREATE SCHEMA storage;CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.user',true),'')::uuid$$;
  CREATE TABLE auth.users(id uuid,email_confirmed_at timestamptz);
  CREATE TABLE profiles(id uuid primary key,full_name text,location text,is_prime boolean default false,prime_until date,referral_code text,referred_by uuid,referred_at timestamptz,created_at timestamptz default now());
  CREATE TABLE reward_wallets(user_id uuid primary key,points integer);
  CREATE TABLE membership_payments(id uuid,status text,amount integer,membership_type text);
  CREATE TABLE job_post_entitlements(user_id uuid,payment_id uuid,starts_at timestamptz,ends_at timestamptz);
  CREATE TABLE posts(id uuid primary key,user_id uuid,module text,kind text,status text,vehicle_type text,skill text,category text,from_place text,to_place text,trip_date date,created_at timestamptz default now(),visible_after timestamptz,job_expires_at timestamptz);
  CREATE TABLE notifications(id uuid primary key default gen_random_uuid(),user_id uuid,post_id uuid,matched_post_id uuid,message text,created_at timestamptz default now());
  CREATE TABLE notification_preferences(user_id uuid,enabled boolean,daily_limit integer,timezone text,quiet_start time,quiet_end time);
  CREATE TABLE post_chat_pairs(post_id uuid,member_id uuid,owner_id uuid,primary key(post_id,member_id));
  CREATE TABLE messages(id uuid default gen_random_uuid(),sender_id uuid,receiver_id uuid,post_id uuid,body text,needs_admin boolean);
  CREATE TABLE storage.objects(bucket_id text,name text);
  CREATE TABLE evidence_content_registry(hash text primary key,user_id uuid);
  CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
  CREATE FUNCTION has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$SELECT false$$;
  CREATE FUNCTION support_admin_id() RETURNS uuid LANGUAGE sql AS $$SELECT NULL::uuid$$;
  CREATE FUNCTION is_goods_post(p posts) RETURNS boolean LANGUAGE sql AS $$SELECT p.module='vehicle' AND p.vehicle_type<>'Car'$$;
  CREATE FUNCTION posts_match_area(a posts,b posts) RETURNS boolean LANGUAGE sql AS $$SELECT a.user_id<>b.user_id AND a.module=b.module AND a.kind<>b.kind AND a.from_place=b.from_place AND a.to_place=b.to_place AND a.trip_date=b.trip_date$$;`);
  await db.exec(readFileSync('drizzle/migrations/0037_account_trial_sharing_referral_program.sql','utf8'));
  await db.exec(`INSERT INTO profiles(id,full_name,location,referral_code) VALUES('${owner}','Owner','Hyderabad','OWN123'),('${member}','Member','Hyderabad','MEM123'); SELECT set_config('test.user','${owner}',false);`);
 },20000);
 afterAll(async()=>{await db.close();});
 it('awards 265 once and preserves first start on edits',async()=>{
  const first=await db.query<{start:string}>("SELECT complete_account_profile('Owner','Hyderabad','Driver','Lorry','owner') AS start");
  await db.query("SELECT complete_account_profile('Owner','Hyderabad','Driver changed','Lorry','owner')");
  expect((await db.query<{points:number}>(`SELECT points FROM reward_wallets WHERE user_id='${owner}'`)).rows[0]?.points).toBe(265);
  expect((await db.query<{start:string}>(`SELECT completed_at AS start FROM account_programs WHERE user_id='${owner}'`)).rows[0]?.start).toEqual(first.rows[0]?.start);
 });
 it('ends goods trial at ten days and allows ongoing sharing after expiration',async()=>{
  expect((await db.query<{ok:boolean}>(`SELECT has_goods_membership('${owner}') ok`)).rows[0]?.ok).toBe(true);
  await db.exec(`UPDATE account_programs SET completed_at=now()-interval '10 days' WHERE user_id='${owner}'`);
  expect((await db.query<{ok:boolean}>(`SELECT has_goods_membership('${owner}') ok`)).rows[0]?.ok).toBe(false);
  await db.exec(`UPDATE account_programs SET sharing_active=true WHERE user_id='${owner}'`);
  expect((await db.query<{ok:boolean}>(`SELECT has_goods_membership('${owner}') ok`)).rows[0]?.ok).toBe(true);
 });
 it('publishes job seekers immediately and nonshared employers after five hours',async()=>{
  await db.exec(`CREATE TRIGGER delay BEFORE INSERT ON posts FOR EACH ROW EXECUTE FUNCTION guard_post_delay(); UPDATE account_programs SET sharing_active=false WHERE user_id='${owner}';
  INSERT INTO posts(id,user_id,module,kind,status) VALUES(gen_random_uuid(),'${owner}','job','seeker','active'),(gen_random_uuid(),'${owner}','job','employer','active');`);
  expect((await db.query<{hours:number}>("SELECT round(extract(epoch from visible_after-created_at)/3600)::integer hours FROM posts WHERE module='job' ORDER BY kind")).rows.map(r=>r.hours)).toEqual([5,0]);
 });
 it('requires exactly six distinct owned screenshots, grants automatic ongoing access',async()=>{
  const paths=Array.from({length:6},(_,i)=>`${owner}/image${i}.png`);
  const hashes=Array.from({length:6},(_,i)=>String(i).padStart(64,'0'));
  for(const name of paths)await db.query('INSERT INTO storage.objects VALUES($1,$2)',['sharing-evidence',name]);
  await expect(db.query('SELECT activate_program_sharing($1,$2,$3)',[owner,paths.slice(0,5),hashes.slice(0,5)])).rejects.toThrow('SIX_DISTINCT_IMAGES_REQUIRED');
  await db.query('SELECT activate_program_sharing($1,$2,$3)',[owner,paths,hashes]);
  expect((await db.query<{active:boolean}>(`SELECT sharing_active active FROM account_programs WHERE user_id='${owner}'`)).rows[0]?.active).toBe(true);
  expect((await db.query<{status:string}>('SELECT status FROM program_evidence')).rows[0]?.status).toBe('received');
  await expect(db.query('SELECT activate_program_sharing($1,$2,$3)',[owner,paths,hashes])).rejects.toThrow();
 });
 it('honors daily five and lower recipient quotas',async()=>{
  await db.exec(`INSERT INTO notifications(user_id,message) SELECT '${member}','quota' FROM generate_series(1,5)`);
  expect((await db.query<{ok:boolean}>(`SELECT can_notify('${member}') ok`)).rows[0]?.ok).toBe(false);
 });
 it('requires explicit consent, deduplicates one per day and stops after four days',async()=>{
  await db.exec(`UPDATE account_programs SET completed_at=now()-interval '11 days',sharing_active=false,reminder_consent=false WHERE user_id='${owner}'`);
  expect((await db.query<{n:number}>('SELECT dispatch_program_requests() n')).rows[0]?.n).toBe(0);
  await db.exec(`UPDATE account_programs SET reminder_consent=true WHERE user_id='${owner}'`);
  expect((await db.query<{n:number}>('SELECT dispatch_program_requests() n')).rows[0]?.n).toBe(1);
  expect((await db.query<{n:number}>('SELECT dispatch_program_requests() n')).rows[0]?.n).toBe(0);
  await db.exec(`UPDATE account_programs SET completed_at=now()-interval '14 days' WHERE user_id='${owner}'`);
  expect((await db.query<{n:number}>('SELECT dispatch_program_requests() n')).rows[0]?.n).toBe(0);
 });
 it('dispatches at most five same-category route users and repeat bells preserve private connection',async()=>{
  await db.exec(`UPDATE account_programs SET completed_at=now(),sharing_active=true WHERE user_id='${owner}';
  SELECT set_config('test.user','${owner}',false);
  INSERT INTO posts(id,user_id,module,kind,status,vehicle_type,category,from_place,to_place,trip_date) VALUES('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','${owner}','vehicle','owner','active','Lorry','Lorry','Hyderabad','Bombay',current_date);`);
  for(let i=0;i<7;i++){
   const id=`00000000-0000-4000-8000-00000000000${i}`;
   await db.exec(`INSERT INTO profiles(id) VALUES('${id}'); INSERT INTO account_programs(user_id,occupation,category,member_kind,sharing_active) VALUES('${id}','Transport','Lorry','business',true); INSERT INTO posts(id,user_id,module,kind,status,vehicle_type,category,from_place,to_place,trip_date) VALUES(gen_random_uuid(),'${id}','vehicle','business','active','${i===6?'Car':'Lorry'}','Lorry','Hyderabad','Bombay',current_date);`);
  }
  expect((await db.query<{n:number}>(`SELECT notify_matches('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') n`)).rows[0]?.n).toBe(5);
  expect((await db.query<{n:number}>(`SELECT count(*)::int n FROM notifications WHERE matched_post_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'`)).rows[0]?.n).toBe(5);
  await db.exec(`SELECT set_config('test.user','00000000-0000-4000-8000-000000000000',false)`);
  const first=await db.query<{owner:string}>(`SELECT ring_post('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') owner`);
  const repeat=await db.query<{owner:string}>(`SELECT ring_post('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') owner`);
  expect(repeat.rows[0]?.owner).toBe(first.rows[0]?.owner);
  expect((await db.query<{n:number}>(`SELECT count(*)::int n FROM post_chat_pairs WHERE member_id='00000000-0000-4000-8000-000000000000' AND post_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'`)).rows[0]?.n).toBe(1);
 });
 it('requires 100 real confirmed joins after day ten and grants only once three months',async()=>{
  await db.exec(`UPDATE account_programs SET completed_at=now()-interval '20 days' WHERE user_id='${owner}';
  INSERT INTO profiles(id,referred_by,referred_at,created_at) SELECT gen_random_uuid(),'${owner}',now(),now() FROM generate_series(1,99);
  INSERT INTO auth.users SELECT id,now() FROM profiles WHERE referred_by='${owner}';`);
  expect((await db.query<{n:number}>(`SELECT process_program_referral('${owner}') n`)).rows[0]?.n).toBe(99);
  expect((await db.query<{until:string|null}>(`SELECT referral_free_until until FROM account_programs WHERE user_id='${owner}'`)).rows[0]?.until).toBeNull();
  await db.exec(`INSERT INTO profiles(id,referred_by,referred_at,created_at) VALUES(gen_random_uuid(),'${owner}',now(),now()); INSERT INTO auth.users SELECT id,now() FROM profiles WHERE referred_by='${owner}' AND id NOT IN(SELECT id FROM auth.users);`);
  await db.query(`SELECT process_program_referral('${owner}')`);
  expect((await db.query<{months:boolean}>(`SELECT referral_free_until=referral_rewarded_at+interval '3 months' months FROM account_programs WHERE user_id='${owner}'`)).rows[0]?.months).toBe(true);
  const first=(await db.query<{until:string}>(`SELECT referral_free_until until FROM account_programs WHERE user_id='${owner}'`)).rows[0]?.until;
  await db.query(`SELECT process_program_referral('${owner}')`);
  expect((await db.query<{until:string}>(`SELECT referral_free_until until FROM account_programs WHERE user_id='${owner}'`)).rows[0]?.until).toEqual(first);
 });
});
