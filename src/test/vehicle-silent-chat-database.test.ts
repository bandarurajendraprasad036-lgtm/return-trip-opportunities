import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, expect, it } from 'vitest';
let db: PGlite;
const owner='11111111-1111-4111-8111-111111111111', paid='22222222-2222-4222-8222-222222222222', unpaid='33333333-3333-4333-8333-333333333333', post='44444444-4444-4444-8444-444444444444';
beforeAll(async()=>{
  db=new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.user',true),'')::uuid $$;
  CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
  CREATE FUNCTION has_paid_bell(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT $1='${paid}'::uuid $$;
  CREATE TABLE posts(id uuid PRIMARY KEY,user_id uuid,module text,status text,visible_after timestamptz,job_expires_at timestamptz,description text,goods_type text,capacity_tons numeric,trip_date date,show_contact boolean,contact_phone text);
  CREATE POLICY paid_vehicle_display ON posts FOR SELECT USING(false);
  CREATE TABLE post_chat_pairs(post_id uuid,member_id uuid,owner_id uuid,UNIQUE(post_id,member_id,owner_id));
  CREATE TABLE notifications(id uuid); CREATE TABLE messages(id uuid); CREATE TABLE vehicle_bell_demands(id uuid);
  INSERT INTO posts VALUES('${post}','${owner}','vehicle','active',NULL,NULL,'',NULL,2,NULL,true,'9876543210');`);
  await db.exec(readFileSync('drizzle/migrations/0075_free_anonymous_vehicle_lists_silent_paid_chat.sql','utf8'));
},30000);
afterAll(async()=>{await db.close();});
it('permits listing policy without a paid subscription',async()=>{expect((await db.query<{qual:string}>(`SELECT qual FROM pg_policies WHERE policyname='paid_vehicle_display'`)).rows[0]?.qual).toBe('true');});
it('paid chat creates only one participant pair and no bell, message or notification',async()=>{
  await db.exec(`SELECT set_config('test.user','${paid}',false)`);
  expect((await db.query<{id:string}>(`SELECT open_vehicle_chat('${post}') id`)).rows[0]?.id).toBe(owner);
  await db.query(`SELECT open_vehicle_chat('${post}')`);
  expect((await db.query('SELECT * FROM post_chat_pairs')).rows).toHaveLength(1);
  for(const table of ['notifications','messages','vehicle_bell_demands'])expect((await db.query(`SELECT * FROM ${table}`)).rows).toHaveLength(0);
});
it('unpaid chat and contact reads stay denied',async()=>{
  await db.exec(`SELECT set_config('test.user','${unpaid}',false)`);
  await expect(db.query(`SELECT open_vehicle_chat('${post}')`)).rejects.toThrow('PAID_BELL_REQUIRED');
  await expect(db.query(`SELECT get_post_details('${post}')`)).rejects.toThrow('PAID_BELL_REQUIRED');
});
it('paid contact reveals only owner-consented post mobile, never profile identity',async()=>{
  await db.exec(`SELECT set_config('test.user','${paid}',false)`);
  const result=(await db.query<{details:Record<string,unknown>}>(`SELECT get_post_details('${post}') details`)).rows[0]?.details;
  expect(result?.['contact_phone']).toBe('9876543210');expect(result).not.toHaveProperty('user_id');
  await db.exec(`UPDATE posts SET show_contact=false WHERE id='${post}'`);
  expect((await db.query<{details:{contact_phone:null}}>(`SELECT get_post_details('${post}') details`)).rows[0]?.details.contact_phone).toBeNull();
});