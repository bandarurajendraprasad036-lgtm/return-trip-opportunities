import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, expect, it } from 'vitest';
// A bell on a service ad must reach the ad owner's "people who rang my ad" list.
const owner='11111111-1111-4111-8111-111111111111', member='22222222-2222-4222-8222-222222222222';
const ad='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
let db:PGlite;
beforeAll(async()=>{
 db=new PGlite();
 await db.exec(`CREATE SCHEMA auth; CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.user',true),'')::uuid $$;
 CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
 CREATE TYPE app_role AS ENUM('admin','user'); CREATE FUNCTION has_role(uuid,app_role) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
 CREATE FUNCTION incoming_bell_reply_allowed(uuid,uuid DEFAULT NULL) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
 CREATE TABLE profiles(id uuid,full_name text,phone text,public_photo text);
 CREATE TABLE posts(id uuid,user_id uuid,kind text,service_type text);
 CREATE TABLE free_work_interests(id uuid DEFAULT gen_random_uuid(),entry_id text,source text,user_id uuid,section text,category text,area text);
 CREATE TABLE free_work_entries(id uuid,user_id uuid); CREATE TABLE post_bell_interests(id uuid,user_id uuid,post_id uuid,section text,area text,need text);
 CREATE TABLE vehicle_bell_demands(id uuid,user_id uuid,post_id uuid,from_place text,to_place text,vehicle_type text,category text);
 CREATE TABLE vehicle_demand_chat_pairs(demand_id uuid,member_id uuid,owner_id uuid,board_rang_at timestamptz); CREATE TABLE post_chat_pairs(owner_id uuid,member_id uuid);
 INSERT INTO posts VALUES('${ad}','${owner}','seeker','service');
 INSERT INTO free_work_interests(entry_id,source,user_id,section,category,area) VALUES('${ad}','post','${member}','service-providers','Plumber','Village');`);
 await db.exec(readFileSync('drizzle/migrations/0135_owner_bell_list_sections_chat_peer.sql','utf8'));
 await db.exec(`SELECT set_config('test.user','${owner}',false)`);
},30000);
afterAll(async()=>{await db.close();});
it('bell on a service ad shows under that ad for its owner',async()=>{
 expect((await db.query(`SELECT need FROM my_incoming_bells('service-wanted','${ad}')`)).rows).toEqual([{need:'Plumber'}]);
});
it('the same bell is not repeated under another box',async()=>{
 expect((await db.query(`SELECT * FROM my_incoming_bells('service-providers')`)).rows).toEqual([]);
});
