import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, expect, it } from 'vitest';
let db: PGlite;
const caller='11111111-1111-4111-8111-111111111111', target='22222222-2222-4222-8222-222222222222', post='33333333-3333-4333-8333-333333333333';
function fn(file: string, name: string) {
 const sql=readFileSync(file,'utf8');const start=sql.indexOf(`CREATE FUNCTION public.${name}(`)>=0?sql.indexOf(`CREATE FUNCTION public.${name}(`):sql.indexOf(`CREATE OR REPLACE FUNCTION public.${name}(`);
 const end=sql.indexOf('$$;',sql.indexOf('AS $$',start))+3;
 if(start<0 || end<3)throw new Error(name);return sql.slice(start,end);
}
beforeAll(async()=>{
 db=new PGlite();
 await db.exec(`CREATE SCHEMA auth;CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT '${caller}'::uuid $$;
 CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$ SELECT 'authenticated' $$;
 CREATE TABLE profiles(id uuid PRIMARY KEY,full_name text,location text,phone text);
 CREATE TABLE account_programs(user_id uuid,occupation text,category text,member_kind text);
 CREATE TABLE auth.users(id uuid,phone text,phone_confirmed_at timestamptz);
 INSERT INTO profiles VALUES('${caller}','Name','Area','9000000000'),('${target}','Other','Area','9000000001');
 INSERT INTO account_programs VALUES('${caller}','Business','goods','business');
 INSERT INTO auth.users VALUES('${caller}','+919000000000',now());
 CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
 CREATE FUNCTION has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
 CREATE TABLE membership_access(user_id uuid,feature_scope text,revoked_at timestamptz,starts_at timestamptz,ends_at timestamptz);
 CREATE TABLE prime99_payments(user_id uuid,payment_purpose text,payable_amount int,status text,received_at timestamptz,ends_at timestamptz);
 CREATE TABLE directed_bell_usage(sender_id uuid,recipient_id uuid,rings int DEFAULT 0,last_rang_at timestamptz,PRIMARY KEY(sender_id,recipient_id));
 CREATE TABLE posts(id uuid,vehicle_type text);
 CREATE TABLE vehicle_post_points(post_id uuid,from_lat float8,from_lng float8,to_lat float8,to_lng float8);
 CREATE TABLE vehicle_bell_demands(id uuid,user_id uuid,post_id uuid,from_place text,to_place text,vehicle_type text);
 CREATE TABLE vehicle_route_points(route_id uuid,user_id uuid,from_lat float8,from_lng float8,to_lat float8,to_lng float8);
 CREATE TABLE vehicle_route_preferences(id uuid,user_id uuid,enabled boolean,from_place text,to_place text,vehicle_type text);
 CREATE FUNCTION straight_line_km(float8,float8,float8,float8) RETURNS float8 LANGUAGE sql IMMUTABLE AS $$ SELECT abs($3-$1) $$;
 INSERT INTO posts VALUES('${post}','Auto');INSERT INTO vehicle_post_points VALUES('${post}',0,0,1000,0);
 INSERT INTO vehicle_route_preferences VALUES('${target}','${caller}',true,'A','B','Auto');
 INSERT INTO vehicle_route_points VALUES('${target}','${caller}',200,0,1200,0);`);
 for(const name of ['profile_ready_for_actions','has_paid_bell','has_work_membership','consume_directed_bell'])await db.exec(fn('drizzle/migrations/0113_scoped_monthly_and_directed_bell_limits.sql',name));
 for(const name of ['route_endpoints_match','bell_route_within_radius'])await db.exec(fn('drizzle/migrations/0114_strict_typed_reciprocal_saved_route_alerts.sql',name));
});
afterAll(async()=>{await db.close();});
it('permits exactly three directed free rings and rejects the fourth',async()=>{
 for(let i=0;i<3;i++)await db.query(`SELECT consume_directed_bell('${target}',false)`);
 expect((await db.query<{rings:number}>('SELECT rings FROM directed_bell_usage')).rows[0]?.rings).toBe(3);
 await expect(db.query(`SELECT consume_directed_bell('${target}',false)`)).rejects.toThrow('BELL_LIMIT_REACHED');
});
it('49 monthly access enables work but never vehicle membership',async()=>{
 await db.exec(`INSERT INTO membership_access VALUES('${caller}','work',NULL,now(),now()+interval '1 month')`);
 expect((await db.query<{work:boolean,vehicle:boolean}>(`SELECT has_work_membership('${caller}') work,has_paid_bell('${caller}') vehicle`)).rows[0]).toEqual({work:true,vehicle:false});
 await expect(db.query(`SELECT consume_directed_bell('${target}',true)`)).rejects.toThrow('SERVICE_PLAN_ONLY');
 await db.query(`SELECT consume_directed_bell('${target}',false)`);
});
it('100 monthly access enables vehicles and expires automatically',async()=>{
 await db.exec(`UPDATE membership_access SET feature_scope='all'`);
 expect((await db.query<{allowed:boolean}>(`SELECT has_paid_bell('${caller}') allowed`)).rows[0]?.allowed).toBe(true);
 await db.query(`SELECT consume_directed_bell('${target}',true)`);
 await db.exec(`UPDATE membership_access SET ends_at=now()-interval '1 second'`);
 expect((await db.query<{allowed:boolean}>(`SELECT has_paid_bell('${caller}') allowed`)).rows[0]?.allowed).toBe(false);
});
it('requires completed owner verified profile before bell consumption',async()=>{
 await db.exec('UPDATE auth.users SET phone_confirmed_at=NULL');
 await expect(db.query(`SELECT consume_directed_bell('${target}',false)`)).rejects.toThrow('PROFILE_REQUIRED');
 await db.exec('UPDATE auth.users SET phone_confirmed_at=now()');
});
it('1000 route permits 200 at both ends and reverse, rejects 201 and wrong type',async()=>{
 const allowed=async()=> (await db.query<{allowed:boolean}>(`SELECT bell_route_within_radius('${post}',NULL,'${caller}') allowed`)).rows[0]?.allowed;
 expect(await allowed()).toBe(true);
 await db.exec('UPDATE vehicle_route_points SET from_lat=201');expect(await allowed()).toBe(false);
 await db.exec('UPDATE vehicle_route_points SET from_lat=1200,to_lat=200');expect(await allowed()).toBe(true);
 await db.exec("UPDATE vehicle_route_preferences SET vehicle_type='Lorry'");expect(await allowed()).toBe(false);
 await db.exec("UPDATE vehicle_route_preferences SET vehicle_type='Auto',enabled=false");expect(await allowed()).toBe(false);
});
it('100 route permits only 20 at both endpoints, rejects 21',async()=>{
 expect((await db.query<{allowed:boolean}>('SELECT route_endpoints_match(0,0,100,0,20,0,120,0) allowed')).rows[0]?.allowed).toBe(true);
 expect((await db.query<{allowed:boolean}>('SELECT route_endpoints_match(0,0,100,0,21,0,120,0) allowed')).rows[0]?.allowed).toBe(false);
});