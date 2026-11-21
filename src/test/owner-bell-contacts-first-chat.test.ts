import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, expect, it } from 'vitest';
const owner='11111111-1111-4111-8111-111111111111', member='22222222-2222-4222-8222-222222222222', outsider='33333333-3333-4333-8333-333333333333', admin='44444444-4444-4444-8444-444444444444', fourth='55555555-5555-4555-8555-555555555555';
const job='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
let db:PGlite;
const as=(u:string)=>db.exec(`SELECT set_config('test.user','${u}',false)`);
const ok=async(sql:string)=>(await db.query<{ok:boolean}>(`SELECT ${sql} ok`)).rows[0]?.ok;
beforeAll(async()=>{
 db=new PGlite();
 await db.exec(`CREATE SCHEMA auth; CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.user',true),'')::uuid $$;
 CREATE TABLE paid(user_id uuid);
 CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
 CREATE FUNCTION has_paid_bell(_u uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT EXISTS(SELECT 1 FROM paid WHERE user_id=_u) $$;
 CREATE FUNCTION support_admin_id() RETURNS uuid LANGUAGE sql AS $$ SELECT '${admin}'::uuid $$;
 CREATE TYPE app_role AS ENUM('admin','user');
 CREATE FUNCTION has_role(_u uuid,_r app_role) RETURNS boolean LANGUAGE sql AS $$ SELECT _u='${admin}'::uuid $$;
 CREATE FUNCTION profile_ready_for_actions(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
 CREATE FUNCTION incoming_bell_reply_allowed(_o uuid,_p uuid DEFAULT NULL) RETURNS boolean LANGUAGE sql AS $$ SELECT auth.uid()='${owner}'::uuid AND _o='${member}'::uuid $$;
 CREATE FUNCTION free_work_chat(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
 CREATE TABLE messages(sender_id uuid,receiver_id uuid,post_id uuid,is_auto boolean DEFAULT false);
 CREATE TABLE bell_board_chat_pairs(member_id uuid,owner_id uuid); CREATE TABLE vehicle_demand_chat_pairs(demand_id uuid,member_id uuid,owner_id uuid,board_rang_at timestamptz);
 CREATE TABLE service_request_pairs(member_id uuid,owner_id uuid); CREATE TABLE service_chat_pairs(member_id uuid,owner_id uuid); CREATE TABLE post_chat_pairs(post_id uuid,member_id uuid,owner_id uuid);
 CREATE TABLE free_work_interests(id uuid,user_id uuid); CREATE TABLE post_bell_interests(id uuid,user_id uuid); CREATE TABLE vehicle_bell_demands(id uuid,user_id uuid);
 CREATE TABLE profiles(id uuid,full_name text,phone text,public_photo text);
 INSERT INTO profiles VALUES('${member}','Ramu','9876543210','https://example.com/ramu.jpg');
 INSERT INTO free_work_interests VALUES('${job}','${member}');
 CREATE FUNCTION my_incoming_bells(_section text,_post uuid DEFAULT NULL) RETURNS TABLE(id uuid,source text,post_id uuid,area text,need text) LANGUAGE sql AS $$
  SELECT '${job}'::uuid,'free','${job}'::uuid,'Village','Driver' WHERE auth.uid()='${owner}'::uuid $$;`);
 await db.exec(readFileSync('drizzle/migrations/0134_owner_bell_contacts_first_free_chat.sql','utf8'));
},30000);
afterAll(async()=>{await db.close();});
it('post owner sees the beller name, phone and photo',async()=>{
 await as(owner);
 expect((await db.query(`SELECT full_name,phone,photo,other_id FROM my_incoming_bell_contacts('work-offered')`)).rows).toEqual([{full_name:'Ramu',phone:'9876543210',photo:'https://example.com/ramu.jpg',other_id:member}]);
});
it('anyone other than the post owner sees no beller contacts',async()=>{
 await as(outsider);
 expect((await db.query(`SELECT * FROM my_incoming_bell_contacts('work-offered')`)).rows).toEqual([]);
});
it('unpaid member gets the first chat free',async()=>{
 await as(outsider);
 expect(await ok(`can_post_chat(NULL,'${member}')`)).toBe(true);
});
it('after the first chat, a second person needs the ₹100 subscription',async()=>{
 await as(outsider);
 await db.exec(`INSERT INTO messages VALUES('${outsider}','${member}',NULL,false)`);
 expect(await ok(`can_post_chat(NULL,'${member}')`)).toBe(true);
 expect(await ok(`can_post_chat(NULL,'${fourth}')`)).toBe(false);
});
it('admin help chat never uses up the free chat',async()=>{
 await as(fourth);
 await db.exec(`INSERT INTO messages VALUES('${fourth}','${admin}',NULL,false)`);
 expect(await ok(`can_post_chat(NULL,'${member}')`)).toBe(true);
});
it('paid member is not limited by the free chat rule',async()=>{
 await as(outsider);
 await db.exec(`INSERT INTO paid VALUES('${outsider}'); INSERT INTO bell_board_chat_pairs VALUES('${outsider}','${fourth}')`);
 expect(await ok(`can_post_chat(NULL,'${fourth}')`)).toBe(true);
});
