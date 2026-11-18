import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
it('only an admin can remove individual rows in all seven boards without removing accounts', async () => {
 const db = new PGlite();
 try {
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA auth;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT '11111111-1111-4111-8111-111111111111'::uuid$$;
 CREATE FUNCTION has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$SELECT current_setting('test.admin',true)='yes'$$;
 CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
 CREATE TABLE profiles(id uuid);INSERT INTO profiles VALUES(gen_random_uuid());
 CREATE TABLE free_work_interests(id uuid,section text);
 CREATE TABLE vehicle_bell_demands(id uuid,category text);
 CREATE TABLE vehicle_demand_chat_pairs(demand_id uuid);
 CREATE TABLE post_bell_interests(id uuid,section text);
 CREATE TABLE service_request_pairs(request_id uuid);CREATE TABLE service_requests(id uuid);`);
 await db.exec(readFileSync('drizzle/migrations/0111_admin_remove_anonymous_bell_rows.sql','utf8'));
 const id='22222222-2222-4222-8222-222222222222';
 for (const section of ['work-wanted','work-offered','service-providers','service-wanted']) {
 await db.exec(`INSERT INTO free_work_interests VALUES('${id}','${section}');SELECT set_config('test.admin','no',false)`);
 await expect(db.query(`SELECT admin_remove_bell_row('${id}','interest','${section}')`)).rejects.toThrow('ADMIN_ONLY');
 await db.exec(`SELECT set_config('test.admin','yes',false)`);
 expect((await db.query<{ok:boolean}>(`SELECT admin_remove_bell_row('${id}','interest','${section}') ok`)).rows[0]?.ok).toBe(true);
 }
 for (const section of ['goods','returns','cars']) {
 await db.exec(`INSERT INTO vehicle_bell_demands VALUES('${id}','${section}'); INSERT INTO vehicle_demand_chat_pairs VALUES('${id}');`);
 expect((await db.query<{ok:boolean}>(`SELECT admin_remove_bell_row('${id}','vehicle','${section}') ok`)).rows[0]?.ok).toBe(true);
 }
 expect((await db.query('SELECT * FROM free_work_interests')).rows).toHaveLength(0);
 expect((await db.query('SELECT * FROM vehicle_bell_demands')).rows).toHaveLength(0);
 expect((await db.query('SELECT * FROM profiles')).rows).toHaveLength(1);
 } finally { await db.close(); }
});