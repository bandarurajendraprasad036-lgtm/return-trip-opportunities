import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, expect, it } from 'vitest';
const owner='11111111-1111-4111-8111-111111111111', member='22222222-2222-4222-8222-222222222222', outsider='33333333-3333-4333-8333-333333333333';
const job='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', vehicle='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', service='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
let db:PGlite;
beforeAll(async()=>{
 db=new PGlite();
 await db.exec(`CREATE SCHEMA auth; CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.user',true),'')::uuid $$;
 CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
 CREATE FUNCTION has_paid_bell(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
 CREATE TABLE posts(id uuid,user_id uuid);
 CREATE TABLE free_work_interests(id uuid,entry_id text,source text,user_id uuid,section text,area text,category text);
 CREATE TABLE free_work_entries(id uuid,user_id uuid);
 CREATE TABLE post_bell_interests(id uuid,post_id uuid,user_id uuid,section text,area text,need text);
 CREATE TABLE vehicle_bell_demands(id uuid,post_id uuid,user_id uuid,category text,from_place text,to_place text,vehicle_type text);
 CREATE TABLE vehicle_demand_chat_pairs(demand_id uuid,owner_id uuid,member_id uuid,board_rang_at timestamptz);
 CREATE TABLE post_chat_pairs(post_id uuid,owner_id uuid,member_id uuid);
 CREATE TABLE free_work_pairs(owner_id uuid,member_id uuid);
 CREATE FUNCTION can_post_chat(_post uuid DEFAULT NULL,_other uuid DEFAULT NULL) RETURNS boolean LANGUAGE sql AS $$ SELECT CASE WHEN NOT public.has_paid_bell(auth.uid()) THEN false ELSE true END $$;
 INSERT INTO posts VALUES('${job}','${owner}'),('${vehicle}','${owner}'),('${service}','${owner}');
 INSERT INTO free_work_interests VALUES('${job}','${job}','post','${member}','work-offered','Village','Driver'),('${service}','${service}','post','${member}','service-providers','Village','Plumber');
 INSERT INTO free_work_pairs VALUES('${owner}','${member}');
 INSERT INTO vehicle_bell_demands VALUES('${vehicle}','${vehicle}','${member}','returns','A','B','Lorry');
 INSERT INTO post_chat_pairs VALUES('${vehicle}','${owner}','${member}');
 SELECT set_config('test.user','${owner}',false);`);
 await db.exec(readFileSync('drizzle/migrations/0125_owner_incoming_bell_lists_and_private_replies.sql','utf8'));
},30000);
afterAll(async()=>{await db.close();});
it('unpaid owner immediately sees job bell under the correct post',async()=>{
 expect((await db.query(`SELECT * FROM my_incoming_bells('work-offered','${job}')`)).rows).toEqual([{id:job,source:'free',post_id:job,area:'Village',need:'Driver'}]);
});
it('unpaid owner sees service bell separately',async()=>{
 expect((await db.query(`SELECT need FROM my_incoming_bells('service-providers')`)).rows).toEqual([{need:'Plumber'}]);
});
it('all four work/service sections read only their own post bells',async()=>{
 for(const section of ['work-wanted','work-offered','service-wanted','service-providers']) {
  await db.exec(`INSERT INTO free_work_interests VALUES(gen_random_uuid(),'${job}','post','${member}','${section}','Test village','Test work')`);
  const rows=await db.query<{need:string}>(`SELECT need FROM my_incoming_bells($1,$2) WHERE need='Test work'`,[section,job]);
  expect(rows.rows).toEqual([{need:'Test work'}]);
 }
});
it('unpaid owner sees vehicle bell and can open its exact participant chat',async()=>{
 expect((await db.query(`SELECT * FROM open_incoming_bell_chat('${vehicle}','vehicle','returns')`)).rows).toEqual([{other_id:member,post_id:vehicle}]);
 expect((await db.query<{ok:boolean}>(`SELECT can_post_chat('${vehicle}','${member}') ok`)).rows[0]?.ok).toBe(true);
});
it('unrelated account cannot see or open another owners incoming bells',async()=>{
 await db.exec(`SELECT set_config('test.user','${outsider}',false)`);
 expect((await db.query(`SELECT * FROM my_incoming_bells('returns')`)).rows).toEqual([]);
 await expect(db.query(`SELECT * FROM open_incoming_bell_chat('${vehicle}','vehicle','returns')`)).rejects.toThrow('BELL_UNAVAILABLE');
 expect((await db.query<{ok:boolean}>(`SELECT can_post_chat('${vehicle}','${member}') ok`)).rows[0]?.ok).toBe(false);
 await db.exec(`SELECT set_config('test.user','${owner}',false)`);
});