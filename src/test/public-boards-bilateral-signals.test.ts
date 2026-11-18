import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
it('guest reads anonymous boards and a genuine bell pair gets two private messages only once', async()=>{
 const db=new PGlite();
 try {
 await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
 CREATE TABLE posts(id uuid,user_id uuid,module text,from_place text,to_place text); CREATE FUNCTION post_listing_visible(posts) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
 CREATE FUNCTION vehicle_bell_route(text,text) RETURNS text LANGUAGE sql AS $$ SELECT $1||' → '||$2 $$;
 CREATE TABLE vehicle_bell_demands(id uuid,user_id uuid,post_id uuid,category text,from_place text,to_place text,vehicle_type text,rang_at timestamptz);
 CREATE TABLE post_bell_interests(id uuid,post_id uuid,user_id uuid,section text,area text,need text,created_at timestamptz);
 CREATE TABLE service_requests(id uuid,user_id uuid,area text,service text,created_at timestamptz);
 CREATE FUNCTION list_free_work(text,text,text) RETURNS void LANGUAGE sql AS $$ SELECT $$;
 CREATE FUNCTION list_free_work_interests(text,text,text) RETURNS void LANGUAGE sql AS $$ SELECT $$;
 CREATE FUNCTION list_service_priority(text,text) RETURNS void LANGUAGE sql AS $$ SELECT $$;
 CREATE TABLE free_work_pairs(member_id uuid,owner_id uuid);
 CREATE TABLE post_chat_pairs(member_id uuid,owner_id uuid,post_id uuid);
 CREATE TABLE vehicle_demand_chat_pairs(member_id uuid,owner_id uuid,demand_id uuid,board_rang_at timestamptz);
 CREATE TABLE messages(sender_id uuid,receiver_id uuid,post_id uuid,body text,is_auto boolean);
 INSERT INTO vehicle_bell_demands VALUES(gen_random_uuid(),gen_random_uuid(),NULL,'goods','Warangal','Warangal','Auto',now());`);
 await db.exec(readFileSync('drizzle/migrations/0107_public_anonymous_boards_bilateral_bell_messages.sql','utf8'));
 await db.exec(readFileSync('drizzle/migrations/0109_safe_shared_bell_pair_trigger.sql','utf8'));
 await db.exec('SET ROLE anon');
 expect((await db.query('SELECT * FROM list_area_bell_board(\'goods\',\'\')')).rows).toHaveLength(1);
 expect(Object.keys((await db.query('SELECT * FROM list_area_bell_board(\'goods\',\'\')')).rows[0]??{})).toEqual(['id','source','area','need']);
 await db.exec(`RESET ROLE;SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
 INSERT INTO free_work_pairs VALUES('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222');`);
 const messages=(await db.query<{sender_id:string,receiver_id:string}>('SELECT * FROM messages')).rows;
 expect(messages).toHaveLength(2);
 expect(messages[0]?.sender_id).toBe(messages[1]?.receiver_id);
 expect(messages[0]?.receiver_id).toBe(messages[1]?.sender_id);
 expect((await db.query<{id:string}>('SELECT auth.uid() id')).rows[0]?.id).toBe('11111111-1111-4111-8111-111111111111');
 await db.exec(`INSERT INTO free_work_pairs VALUES('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222');`);
 expect((await db.query('SELECT * FROM messages')).rows).toHaveLength(2);
 }finally{await db.close();}
});