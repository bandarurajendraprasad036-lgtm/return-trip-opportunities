import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, expect, it } from 'vitest';
import { vehiclePackagePermissions, validVehiclePackage, VEHICLE_PACKAGE_MONTHS } from '@/lib/vehicle-packages';
let db: PGlite;
const owner='11111111-1111-4111-8111-111111111111', chat='22222222-2222-4222-8222-222222222222', full='33333333-3333-4333-8333-333333333333';
const core=readFileSync('drizzle/migrations/0160_vehicle_chat_and_full_packages.sql','utf8');
const privacy=readFileSync('drizzle/migrations/0161_authoritative_hidden_identity_and_chat_reads.sql','utf8');
function fn(sql:string,name:string) {
 const start=sql.indexOf(`CREATE OR REPLACE FUNCTION public.${name}(`);
 if(start<0)throw new Error(name);
 const body=sql.indexOf('AS $$',start),end=sql.indexOf('$$;',body+5);
 if(body<0||end<0)throw new Error(`Missing function ${name}`);
 return sql.slice(start,end+3);
}
async function as(id:string) { await db.exec(`SELECT set_config('test.user','${id}',false)`); }
beforeAll(async()=>{
 db=new PGlite();await db.exec(`CREATE SCHEMA auth;CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.user',true),'')::uuid$$;
 CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT $1 IS NOT NULL$$;
 CREATE FUNCTION has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$SELECT false$$;
 CREATE TABLE profiles(id uuid,full_name text,phone text,photo_path text,public_photo text,public_bell_consent boolean,hide_name boolean,hide_phone boolean,hide_photo boolean);
 CREATE TABLE membership_requests(id uuid,user_id uuid,amount int,vehicle_plan_months int,status text);
 CREATE TABLE membership_access(user_id uuid,request_id uuid,revoked_at timestamptz,starts_at timestamptz,ends_at timestamptz);
 CREATE TABLE prime99_payments(user_id uuid,payment_purpose text,payable_amount int,plan_months int,status text,received_at timestamptz,ends_at timestamptz);
 CREATE TABLE posts(id uuid,user_id uuid,module text);CREATE FUNCTION post_listing_visible(posts) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
 CREATE FUNCTION free_work_category(text) RETURNS text LANGUAGE sql AS $$SELECT lower($1)$$;
 CREATE TABLE free_work_interests(id uuid,user_id uuid,section text,category text,area text,created_at timestamptz);
 CREATE TABLE vehicle_bell_demands(id uuid,post_id uuid,user_id uuid,category text,from_place text,to_place text,vehicle_type text,rang_at timestamptz);
 CREATE TABLE post_chat_pairs(post_id uuid,member_id uuid,owner_id uuid);CREATE TABLE vehicle_demand_chat_pairs(member_id uuid,owner_id uuid);
 CREATE TABLE bell_board_chat_pairs(interest_id uuid,member_id uuid,owner_id uuid);CREATE TABLE post_bell_interests(id uuid,post_id uuid,user_id uuid);
 CREATE TABLE messages(id uuid,sender_id uuid,receiver_id uuid,post_id uuid,app_call_id uuid,chat_phone text,body text,created_at timestamptz);
 CREATE TABLE dashboard_dismissals(user_id uuid,kind text,item_id uuid);
 CREATE FUNCTION package_previous_can_post_chat(uuid,uuid) RETURNS boolean LANGUAGE sql AS $$SELECT false$$;
 INSERT INTO profiles VALUES('${owner}','Owner','9876543210','${owner}/avatar.jpg','',true,false,false,false);
 INSERT INTO membership_requests VALUES('${chat}','${chat}',100,3,'pending'),('${full}','${full}',349,3,'pending');
 INSERT INTO membership_access VALUES('${chat}','${chat}',NULL,now(),now()+interval '3 months'),('${full}','${full}',NULL,now(),now()+interval '3 months');
 INSERT INTO posts VALUES('${owner}','${owner}','vehicle');INSERT INTO post_chat_pairs VALUES('${owner}','${chat}','${owner}'),('${owner}','${full}','${owner}');
 INSERT INTO messages VALUES(gen_random_uuid(),'${owner}','${chat}','${owner}',NULL,'9876543210','hello',now());
 INSERT INTO free_work_interests VALUES(gen_random_uuid(),'${owner}','work-wanted','electrician','Village',now());
 INSERT INTO vehicle_bell_demands SELECT gen_random_uuid(),NULL,'${owner}',s,'A','B','Van',now() FROM unnest(ARRAY['goods','returns','cars']) s;`);
 for(const name of ['has_paid_vehicle_chat','has_paid_bell','chat_only_viewer','can_post_chat'])await db.exec(fn(core,name));
 await db.exec(fn(privacy,'contact_field_allowed'));
 await db.exec(readFileSync('drizzle/migrations/0154_bell_hide_applies_to_own_rows.sql','utf8'));
 for(const name of ['list_vehicle_bell_contacts','list_free_work_interest_contacts']){
  const source=(await db.query<{def:string}>(`SELECT pg_get_functiondef('${name}(${name==='list_vehicle_bell_contacts'?'text,text':'text,text,text'})'::regprocedure) def`)).rows[0]?.def;
  if(!source)throw new Error('Missing contact function');
  let def=source;for(const field of ['name','phone','photo'])def=def.replaceAll(`coalesce(pr.hide_${field},true)`,`NOT public.contact_field_allowed(${name==='list_vehicle_bell_contacts'?'d':'i'}.user_id,'${field}',${name==='list_vehicle_bell_contacts'?'true':'false'})`);
  await db.exec(def);
 }
 await db.exec(fn(privacy,'list_chat_messages'));
 await db.exec(`GRANT USAGE ON SCHEMA auth TO authenticated;GRANT SELECT(id,sender_id,receiver_id,body,created_at) ON messages TO authenticated;GRANT EXECUTE ON FUNCTION list_chat_messages(uuid,uuid) TO authenticated`);
},30000);
afterAll(async()=>{await db.close()});
it('₹100 and ₹349 both last three months and obsolete ₹80 is rejected',()=>{expect(VEHICLE_PACKAGE_MONTHS).toBe(3);expect(validVehiclePackage(80)).toBe(false);expect(vehiclePackagePermissions(100,true)).toEqual({chat:true,bell:false,identity:false,calls:false});expect(vehiclePackagePermissions(349,true)).toEqual({chat:true,bell:true,identity:true,calls:true});});
it('pending ₹100 and ₹349 evidence does not unlock chat or bell',async()=>{for(const id of [chat,full]){await as(id);expect((await db.query<{chat:boolean;bell:boolean}>(`SELECT has_paid_vehicle_chat(auth.uid()) chat,has_paid_bell(auth.uid()) bell`)).rows[0]).toEqual({chat:false,bell:false});}});
it('approved ₹100 opens a private vehicle chat without a bell, but cannot read any identity',async()=>{await db.exec(`UPDATE membership_requests SET status='approved' WHERE id='${chat}'`);await as(chat);expect((await db.query<{ok:boolean}>(`SELECT can_post_chat('${owner}','${owner}') ok`)).rows[0]?.ok).toBe(true);expect((await db.query<{ok:boolean}>(`SELECT has_paid_bell(auth.uid()) ok`)).rows[0]?.ok).toBe(false);for(const field of ['name','phone','photo'])expect((await db.query<{ok:boolean}>(`SELECT contact_field_allowed('${owner}','${field}',false) ok`)).rows[0]?.ok).toBe(false);});
it('approved ₹349 sees only consented unhidden identity in all three vehicle boards',async()=>{await db.exec(`UPDATE membership_requests SET status='approved' WHERE id='${full}'`);await as(full);for(const section of ['goods','returns','cars'])expect((await db.query(`SELECT full_name,phone,photo FROM list_vehicle_bell_contacts('${section}')`)).rows[0]).toEqual({full_name:'Owner',phone:'9876543210',photo:`${owner}/avatar.jpg`});});
it('hiding each field blocks it in vehicle and work bells while keeping other fields',async()=>{await as(full);for(const [field,column] of [['name','full_name'],['phone','phone'],['photo','photo']] as const){await db.exec(`UPDATE profiles SET hide_name=false,hide_phone=false,hide_photo=false;UPDATE profiles SET hide_${field}=true`);for(const section of ['goods','returns','cars'])expect((await db.query<Record<string,string>>(`SELECT * FROM list_vehicle_bell_contacts('${section}')`)).rows[0]?.[column]).toBe('');expect((await db.query<Record<string,string>>(`SELECT * FROM list_free_work_interest_contacts('work-wanted')`)).rows[0]?.[column]).toBe('');}await db.exec('UPDATE profiles SET hide_name=false,hide_phone=false,hide_photo=false');});
it('₹100 and anonymous visitors cannot bypass hidden identities through a public bell RPC',async()=>{for(const id of [chat,'']){await as(id);for(const section of ['goods','returns','cars'])expect((await db.query(`SELECT full_name,phone,photo FROM list_vehicle_bell_contacts('${section}')`)).rows[0]).toEqual({full_name:'',phone:'',photo:''});}});
it('previously sent chat numbers remain stored but are hidden from ₹100 viewers and raw reads are denied',async()=>{await as(chat);expect((await db.query<{chat_phone:string}>(`SELECT chat_phone FROM list_chat_messages('${owner}')`)).rows[0]?.chat_phone).toBe('');await db.exec('SET ROLE authenticated');await expect(db.query('SELECT chat_phone FROM messages')).rejects.toThrow('permission denied');await db.exec('RESET ROLE');expect((await db.query<{chat_phone:string}>('SELECT chat_phone FROM messages')).rows[0]?.chat_phone).toBe('9876543210');});
it('expired or revoked ₹349 loses bell and identity access',async()=>{await as(full);await db.exec(`UPDATE membership_access SET ends_at=now() WHERE user_id='${full}'`);expect((await db.query<{ok:boolean}>('SELECT has_paid_bell(auth.uid()) ok')).rows[0]?.ok).toBe(false);await db.exec(`UPDATE membership_access SET ends_at=now()+interval '3 months',revoked_at=now() WHERE user_id='${full}'`);expect((await db.query<{ok:boolean}>('SELECT has_paid_vehicle_chat(auth.uid()) ok')).rows[0]?.ok).toBe(false);});
