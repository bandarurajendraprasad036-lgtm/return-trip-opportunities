import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, expect, it } from 'vitest';
let db: PGlite;
const owner='11111111-1111-4111-8111-111111111111';
const other='22222222-2222-4222-8222-222222222222';
const id='33333333-3333-4333-8333-333333333333';
beforeAll(async()=>{
 db=new PGlite(); await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA auth;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.user',true),'')::uuid$$;
 CREATE FUNCTION has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$SELECT coalesce(current_setting('test.admin',true),'no')='yes'$$;
 CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
 CREATE TABLE free_work_interests(id uuid,section text,user_id uuid,entry_id text,source text);
 CREATE TABLE vehicle_bell_demands(id uuid,category text,user_id uuid);CREATE TABLE vehicle_demand_chat_pairs(demand_id uuid);
 CREATE TABLE post_bell_interests(id uuid,section text,user_id uuid);
 CREATE TABLE discovery_categories(id uuid,section text,created_by uuid);
 CREATE TABLE free_work_entries(id uuid,section text,user_id uuid);CREATE TABLE free_work_notice_queue(subscription_id uuid);
 CREATE TABLE posts(id uuid,user_id uuid,module text);
 CREATE TABLE service_requests(id uuid);CREATE TABLE service_request_pairs(request_id uuid);`);
 for(const file of ['0111_admin_remove_anonymous_bell_rows','0112_owner_remove_shared_additions']) await db.exec(readFileSync(`drizzle/migrations/${file}.sql`,'utf8'));
});
afterAll(async()=>await db.close());
const actor=async(user:string,admin=false)=>db.exec(`SELECT set_config('test.user','${user}',false);SELECT set_config('test.admin','${admin?'yes':'no'}',false);`);
it('owner can remove their own addition across every existing category',async()=>{
 await actor(owner);
 for(const section of ['work-wanted','work-offered','service-providers','service-wanted','goods','returns','cars']){
  await db.exec(`INSERT INTO discovery_categories VALUES('${id}','${section}','${owner}')`);
  expect((await db.query<{ok:boolean}>(`SELECT remove_my_addition('${id}','category','${section}') ok`)).rows[0]?.ok).toBe(true);
 }
 expect((await db.query('SELECT * FROM discovery_categories')).rows).toHaveLength(0);
});
it('another user cannot remove an addition or learn its creator',async()=>{
 await db.exec(`INSERT INTO discovery_categories VALUES('${id}','cars','${owner}')`);await actor(other);
 expect((await db.query('SELECT * FROM my_manageable_additions()')).rows).toHaveLength(0);
 await expect(db.query(`SELECT remove_my_addition('${id}','category','cars')`)).rejects.toThrow('OWNER_ONLY');
 expect((await db.query('SELECT * FROM discovery_categories')).rows).toHaveLength(1);
});
it('admin removes another user addition from the durable shared records',async()=>{
 await actor(other,true);
 expect((await db.query<{ok:boolean}>(`SELECT remove_my_addition('${id}','category','cars') ok`)).rows[0]?.ok).toBe(true);
 expect((await db.query('SELECT * FROM discovery_categories')).rows).toHaveLength(0);
});
it('owner can remove their vehicle bell without removing a different vehicle',async()=>{
 await actor(owner);
 await db.exec(`INSERT INTO vehicle_bell_demands VALUES('${id}','cars','${owner}');INSERT INTO vehicle_bell_demands VALUES(gen_random_uuid(),'goods','${other}');`);
 expect((await db.query<{ok:boolean}>(`SELECT remove_my_addition('${id}','vehicle','cars') ok`)).rows[0]?.ok).toBe(true);
 expect((await db.query('SELECT * FROM vehicle_bell_demands')).rows).toHaveLength(1);
});