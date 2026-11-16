import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
it('250 km route permits 50 km endpoints, rejects 51 km and missing coordinates', async () => {
 const db = new PGlite();
 try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
   CREATE TABLE vehicle_post_points(post_id uuid,from_lat float8,from_lng float8,to_lat float8,to_lng float8);
   CREATE TABLE vehicle_bell_demands(id uuid,user_id uuid,post_id uuid,from_place text,to_place text);
   CREATE TABLE vehicle_route_points(route_id uuid,user_id uuid,from_lat float8,from_lng float8,to_lat float8,to_lng float8);
   CREATE TABLE vehicle_route_preferences(id uuid,user_id uuid,enabled boolean,from_place text,to_place text);
   CREATE FUNCTION straight_line_km(float8,float8,float8,float8) RETURNS float8 LANGUAGE sql AS $$ SELECT abs($3-$1) $$;
   INSERT INTO vehicle_post_points VALUES('11111111-1111-4111-8111-111111111111',0,0,250,0);
   INSERT INTO vehicle_route_points VALUES('22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333',50,0,300,0);
   INSERT INTO vehicle_route_preferences VALUES('22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333',true,'From','To');`);
  const sql=readFileSync('drizzle/migrations/0102_vehicle_phone_bell_radius_gate.sql','utf8');
  const helper=sql.slice(sql.indexOf('CREATE FUNCTION public.bell_route_within_radius'),sql.indexOf('CREATE OR REPLACE FUNCTION public.route_only_vehicle_notice'));
  await db.exec(helper);
  const allowed=async()=> (await db.query<{allowed:boolean}>(`SELECT bell_route_within_radius('11111111-1111-4111-8111-111111111111',NULL,'33333333-3333-4333-8333-333333333333') allowed`)).rows[0]?.allowed;
  expect(await allowed()).toBe(true);
  await db.exec('UPDATE vehicle_route_points SET from_lat=51');
  expect(await allowed()).toBe(false);
  await db.exec('DELETE FROM vehicle_post_points');
  expect(await allowed()).toBe(false);
 } finally { await db.close(); }
});