import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('main bell rings only existing opposite matching categories and deduplicates repeated taps', async () => {
 const db=new PGlite();
 try {
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT '11111111-1111-4111-8111-111111111111'::uuid $$;
 CREATE TABLE profiles(id uuid PRIMARY KEY);INSERT INTO profiles VALUES(auth.uid());
 CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
 CREATE FUNCTION has_paid_bell(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
 CREATE TABLE free_work_entries(id uuid,user_id uuid,section text,area text,category text);
 INSERT INTO free_work_entries VALUES(gen_random_uuid(),auth.uid(),'work-wanted','చిత్తూరు','plumber');
 CREATE TABLE posts(id uuid,user_id uuid,module text,kind text,trip_date date,from_place text,to_place text,vehicle_type text);
 CREATE FUNCTION post_listing_visible(posts) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
 CREATE FUNCTION bell_route_within_radius(uuid,uuid,uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
 CREATE TABLE category_marks(entry_id uuid);CREATE TABLE rings(target text,section text);
 CREATE FUNCTION mark_free_work_category_bell(uuid) RETURNS void LANGUAGE sql AS $$ INSERT INTO category_marks VALUES($1) $$;
 CREATE FUNCTION free_work_opposite(text) RETURNS text LANGUAGE sql AS $$ SELECT CASE $1 WHEN 'work-wanted' THEN 'work-offered' END $$;
 CREATE FUNCTION list_free_work(text,text,text) RETURNS TABLE(id text,source text,area text) LANGUAGE sql AS $$ SELECT 'matching-employer','entry','చిత్తూరు' WHERE $1='work-offered' AND $2='చిత్తూరు' AND $3='plumber' UNION ALL SELECT 'unrelated-country-post','post','వేరే ప్రాంతం' $$;
 CREATE FUNCTION ring_free_work(text,text,text) RETURNS uuid LANGUAGE plpgsql AS $$ BEGIN INSERT INTO rings VALUES($1,$3);RETURN NULL;END $$;
 CREATE FUNCTION ring_post(uuid) RETURNS uuid LANGUAGE sql AS $$ SELECT NULL::uuid $$;`);
 await db.exec(readFileSync('drizzle/migrations/0103_main_bell_existing_category_fanout.sql','utf8'));
 await db.exec(readFileSync('drizzle/migrations/0104_bounded_exact_area_main_bell.sql','utf8'));
 expect((await db.query<{n:number}>('SELECT ring_my_main_bell() n')).rows[0]?.n).toBe(1);
 expect((await db.query<{n:number}>('SELECT ring_my_main_bell() n')).rows[0]?.n).toBe(0);
 expect((await db.query('SELECT * FROM rings')).rows).toEqual([{target:'matching-employer',section:'work-offered'}]);
 await db.exec(`UPDATE free_work_entries SET area='తిరుపతి';`);
 expect((await db.query<{n:number}>('SELECT ring_my_main_bell() n')).rows[0]?.n).toBe(0);
 } finally {await db.close();}
});