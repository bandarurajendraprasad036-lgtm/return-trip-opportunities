import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const owner = '11111111-1111-4111-8111-111111111111';
async function setup() {
 const db = new PGlite();
 await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$ SELECT current_setting('request.jwt.claim.role',true) $$;
 SELECT set_config('request.jwt.claim.sub','${owner}',false),set_config('request.jwt.claim.role','authenticated',false);
 CREATE TABLE profiles(id uuid PRIMARY KEY); INSERT INTO profiles VALUES(auth.uid());
 CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
 CREATE FUNCTION has_paid_bell(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
 CREATE TABLE free_work_entries(id uuid,user_id uuid,section text,area text,category text);
 INSERT INTO free_work_entries VALUES(gen_random_uuid(),auth.uid(),'work-wanted','చిత్తూరు','plumber');
 CREATE TABLE posts(id uuid,user_id uuid,module text,kind text,trip_date date,from_place text,to_place text,vehicle_type text);
 CREATE FUNCTION post_listing_visible(posts) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
 CREATE FUNCTION bell_route_within_radius(uuid,uuid,uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
 CREATE FUNCTION mark_free_work_category_bell(uuid) RETURNS void LANGUAGE plpgsql AS $$ BEGIN RETURN; END $$;
 CREATE FUNCTION free_work_opposite(text) RETURNS text LANGUAGE sql AS $$ SELECT 'work-offered' $$;
 CREATE TABLE targets(id text,area text);
 INSERT INTO targets SELECT 'employer-'||lpad(n::text,3,'0'),'చిత్తూరు' FROM generate_series(1,205) n;
 INSERT INTO targets VALUES('unrelated','తిరుపతి');
 CREATE FUNCTION list_free_work(text,text,text) RETURNS TABLE(id text,source text,area text) LANGUAGE sql AS $$ SELECT id,'entry',area FROM targets $$;
 CREATE TABLE rings(target text PRIMARY KEY,actor uuid);
 CREATE FUNCTION ring_free_work(text,text,text) RETURNS uuid LANGUAGE plpgsql AS $$ BEGIN INSERT INTO rings VALUES($1,auth.uid()); RETURN NULL; END $$;
 CREATE FUNCTION ring_post(uuid) RETURNS uuid LANGUAGE sql AS $$ SELECT NULL::uuid $$;`);
 await db.exec(readFileSync('drizzle/migrations/0103_main_bell_existing_category_fanout.sql','utf8'));
 await db.exec(readFileSync('drizzle/migrations/0105_durable_main_bell_continuation.sql','utf8'));
 return db;
}
it('continues 205 related recipients across bounded batches without duplicates or unrelated area', async () => {
 const db=await setup();
 try {
  expect((await db.query<{n:number}>('SELECT ring_my_main_bell() n')).rows[0]?.n).toBe(100);
  expect((await db.query<{completed_at:Date|null}>('SELECT completed_at FROM main_bell_runs')).rows[0]?.completed_at).toBeNull();
  await db.exec("SELECT set_config('request.jwt.claim.role','service_role',false)");
  expect((await db.query<{n:number}>('SELECT dispatch_main_bell_runs() n')).rows[0]?.n).toBe(100);
  await db.exec("UPDATE main_bell_runs SET available_at=now()");
  expect((await db.query<{n:number}>('SELECT dispatch_main_bell_runs() n')).rows[0]?.n).toBe(5);
  expect((await db.query<{n:number}>('SELECT count(*)::int n FROM rings')).rows[0]?.n).toBe(205);
  expect((await db.query("SELECT * FROM rings WHERE target='unrelated' OR actor<>auth.uid()")).rows).toHaveLength(0);
  expect((await db.query<{completed_at:Date|null}>('SELECT completed_at FROM main_bell_runs')).rows[0]?.completed_at).not.toBeNull();
  expect((await db.query<{n:number}>('SELECT ring_my_main_bell() n')).rows[0]?.n).toBe(0);
  expect((await db.query<{role:string}>('SELECT auth.role() role')).rows[0]?.role).toBe('service_role');
 } finally { await db.close(); }
});
it('does not permit ordinary callers to dispatch for other accounts', async () => {
 const db=await setup();
 try { await expect(db.query('SELECT dispatch_main_bell_runs()')).rejects.toThrow('SERVICE_ONLY'); }
 finally { await db.close(); }
});
it('keeps failed batches durable and rolls back partial actions before retry', async () => {
 const db=await setup();
 try {
  await db.exec(`CREATE OR REPLACE FUNCTION ring_free_work(text,text,text) RETURNS uuid LANGUAGE plpgsql AS $$ BEGIN IF $1='employer-002' THEN RAISE EXCEPTION 'TEMPORARY';END IF;INSERT INTO rings VALUES($1,auth.uid());RETURN NULL;END $$;`);
  expect((await db.query<{n:number}>('SELECT ring_my_main_bell() n')).rows[0]?.n).toBe(0);
  expect((await db.query('SELECT * FROM rings')).rows).toHaveLength(0);
  expect((await db.query('SELECT * FROM main_bell_actions')).rows).toHaveLength(0);
  expect((await db.query('SELECT attempts,last_error,completed_at FROM main_bell_runs')).rows[0]).toEqual({attempts:1,last_error:'BATCH_RETRY',completed_at:null});
  await db.exec(`CREATE OR REPLACE FUNCTION ring_free_work(text,text,text) RETURNS uuid LANGUAGE plpgsql AS $$ BEGIN INSERT INTO rings VALUES($1,auth.uid());RETURN NULL;END $$; UPDATE main_bell_runs SET available_at=now(); SELECT set_config('request.jwt.claim.role','service_role',false);`);
  expect((await db.query<{n:number}>('SELECT dispatch_main_bell_runs() n')).rows[0]?.n).toBe(100);
 } finally { await db.close(); }
});