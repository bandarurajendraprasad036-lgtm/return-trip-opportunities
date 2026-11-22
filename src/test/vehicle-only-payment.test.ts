import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, beforeEach, expect, it } from 'vitest';

let db: PGlite;
const member = '11111111-1111-4111-8111-111111111111';
const owner = '22222222-2222-4222-8222-222222222222';
const vehicle = '33333333-3333-4333-8333-333333333333';
const job = '44444444-4444-4444-8444-444444444444';
const sql = readFileSync('drizzle/migrations/0143_vehicle_only_payment_free_work_and_immediate_posts.sql', 'utf8');
const quotaSql = readFileSync('drizzle/migrations/0144_vehicle_quota_scope_and_admin_contact_exemption.sql', 'utf8');
const photoSql = readFileSync('drizzle/migrations/0145_private_vehicle_post_photos.sql', 'utf8');
function fn(name: string, source = sql) {
  const start = source.indexOf(`CREATE OR REPLACE FUNCTION public.${name}(`);
  const end = source.indexOf('$$;', source.indexOf('AS $$', start));
  if (start < 0 || end < start) throw new Error(`Missing function ${name}`);
  return source.slice(start, end + 3);
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE SCHEMA auth;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT '${member}'::uuid $$;
  CREATE TABLE access_state(paid boolean,admin boolean,ready boolean); INSERT INTO access_state VALUES(false,false,true);
  CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
  CREATE FUNCTION has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$ SELECT admin FROM access_state $$;
  CREATE FUNCTION has_paid_bell(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT paid FROM access_state $$;
  CREATE FUNCTION profile_ready_for_actions(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT ready FROM access_state $$;
  CREATE FUNCTION my_profile_access_ready() RETURNS boolean LANGUAGE sql AS $$ SELECT ready FROM access_state $$;
  CREATE FUNCTION support_admin_id() RETURNS uuid LANGUAGE sql AS $$ SELECT NULL::uuid $$;
  CREATE FUNCTION incoming_bell_reply_allowed(uuid,uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
  CREATE TABLE profiles(id uuid PRIMARY KEY); INSERT INTO profiles VALUES('${member}');
  CREATE TABLE posts(id uuid,user_id uuid,module text,status text DEFAULT 'active',visible_after timestamptz,created_at timestamptz DEFAULT now(),description text,goods_type text,capacity_tons numeric,trip_date date,vehicle_name text,vehicle_number text,driver_name text,contact_phone text,show_contact boolean,public_brand text,public_photo text,vehicle_photo_path text DEFAULT '');
  CREATE FUNCTION post_listing_visible(posts) RETURNS boolean LANGUAGE sql AS $$ SELECT ($1).status='active' $$;
  CREATE TABLE directed_bell_usage(sender_id uuid,recipient_id uuid,rings integer DEFAULT 0,last_rang_at timestamptz, UNIQUE(sender_id,recipient_id));
  CREATE TABLE free_work_pairs(member_id uuid,owner_id uuid);
  CREATE TABLE post_chat_pairs(post_id uuid,member_id uuid,owner_id uuid);
  CREATE TABLE service_request_pairs(member_id uuid,owner_id uuid);
  CREATE TABLE service_chat_pairs(member_id uuid,owner_id uuid);
  CREATE TABLE bell_board_chat_pairs(interest_id uuid,member_id uuid,owner_id uuid);
  CREATE TABLE service_requests(id uuid);
  CREATE TABLE post_bell_interests(id uuid,post_id uuid);
  CREATE TABLE vehicle_demand_chat_pairs(member_id uuid,owner_id uuid);
  CREATE TABLE monthly_post_usage(post_id uuid,user_id uuid,used_at timestamptz DEFAULT now(),module_scope text DEFAULT 'vehicle');
  CREATE TABLE free_work_entries(id uuid,user_id uuid);`);
  for (const name of ['vehicle_contact_access','work_access_internal','free_work_chat','consume_directed_bell','can_post_chat','get_post_details','guard_post_delay']) await db.exec(fn(name));
  await db.exec(fn('subscription_posts_used',quotaSql));
  await db.exec(fn('get_post_details').replace("'description',p.description", "'description',CASE WHEN p.module<>'vehicle' OR contact THEN p.description ELSE NULL END").replace("'created_at',p.created_at", "'created_at',p.created_at,'vehicle_photo_path',CASE WHEN contact THEN p.vehicle_photo_path ELSE '' END"));
  await db.exec(fn('vehicle_post_photo_allowed',photoSql));
  await db.exec(`CREATE TRIGGER immediate_post BEFORE INSERT ON posts FOR EACH ROW EXECUTE FUNCTION guard_post_delay();
  INSERT INTO posts(id,user_id,module,contact_phone,show_contact,public_photo,trip_date) VALUES('${vehicle}','${owner}','vehicle','9876543210',true,'https://example.test/consented.jpg','2026-11-22'),('${job}','${owner}','job','9876543210',true,'','2026-11-22');
  INSERT INTO free_work_pairs VALUES('${member}','${owner}');
  INSERT INTO post_chat_pairs VALUES('${vehicle}','${member}','${owner}'),('${job}','${member}','${owner}');`);
});
beforeEach(async () => { await db.exec('UPDATE access_state SET paid=false,admin=false,ready=true'); });
afterAll(async () => { await db.close(); });
async function value(query: string) { return (await db.query<{ok:boolean}>(query)).rows[0]?.ok; }
it('work and service access is free without a ₹100 receipt',async () => {
  expect(await value(`SELECT work_access_internal('${member}') ok`)).toBe(true);
  expect(await value(`SELECT free_work_chat('${owner}') ok`)).toBe(true);
  expect(await value(`SELECT can_post_chat('${job}','${owner}') ok`)).toBe(true);
  for (let n=0;n<4;n++) { await db.exec(`UPDATE directed_bell_usage SET last_rang_at=NULL; SELECT consume_directed_bell('${owner}',false);`); }
  expect((await db.query<{rings:number}>('SELECT rings FROM directed_bell_usage')).rows[0]?.rings).toBe(4);
});
it('unapproved vehicle bell, chat and owner number stay locked',async () => {
  await expect(db.query(`SELECT consume_directed_bell('${owner}',true)`)).rejects.toThrow('SUBSCRIPTION_REQUIRED');
  expect(await value(`SELECT can_post_chat('${vehicle}','${owner}') ok`)).toBe(false);
  expect((await db.query<{details:{contact_phone:null}}>(`SELECT get_post_details('${vehicle}') details`)).rows[0]?.details.contact_phone).toBeNull();
});
it('approved ₹100 vehicle access reveals only the consented owner number',async () => {
  await db.exec('UPDATE access_state SET paid=true');
  expect(await value(`SELECT can_post_chat('${vehicle}','${owner}') ok`)).toBe(true);
  expect((await db.query<{details:{contact_phone:string}}>(`SELECT get_post_details('${vehicle}') details`)).rows[0]?.details.contact_phone).toBe('9876543210');
  await db.exec(`UPDATE posts SET show_contact=false WHERE id='${vehicle}'`);
  expect((await db.query<{details:{contact_phone:null}}>(`SELECT get_post_details('${vehicle}') details`)).rows[0]?.details.contact_phone).toBeNull();
  await db.exec(`UPDATE posts SET show_contact=true WHERE id='${vehicle}'`);
});
it('administrator vehicle actions require no receipt',async () => {
  await db.exec('UPDATE access_state SET admin=true');
  await db.query(`SELECT consume_directed_bell('${owner}',true)`);
  expect(await value(`SELECT vehicle_contact_access('${member}') ok`)).toBe(true);
  expect(await value(`SELECT can_post_chat('${vehicle}','${owner}') ok`)).toBe(true);
});
it('new vehicle and work posts become visible immediately with actual stored timestamps',async () => {
  expect(await value('SELECT bool_and(visible_after<=now() AND created_at IS NOT NULL) ok FROM posts')).toBe(true);
});
it('free work posts do not consume the vehicle posting allowance',async () => {
  await db.exec(`INSERT INTO monthly_post_usage(post_id,user_id,module_scope) VALUES('${job}','${member}','work'),('${vehicle}','${member}','vehicle')`);
  expect((await db.query<{used:number}>(`SELECT subscription_posts_used('${member}','-infinity')::integer used`)).rows[0]?.used).toBe(1);
});
it('a private vehicle ad photo requires approved access and owner consent for another member',async () => {
  const path = `${owner}/test.jpg`;
  await db.exec(`UPDATE posts SET vehicle_photo_path='${path}' WHERE id='${vehicle}'`);
  expect(await value(`SELECT vehicle_post_photo_allowed('${path}') ok`)).toBe(false);
  await db.exec('UPDATE access_state SET paid=true');
  expect(await value(`SELECT vehicle_post_photo_allowed('${path}') ok`)).toBe(true);
  expect((await db.query<{details:{vehicle_photo_path:string}}>(`SELECT get_post_details('${vehicle}') details`)).rows[0]?.details.vehicle_photo_path).toBe(path);
  await db.exec(`UPDATE posts SET show_contact=false WHERE id='${vehicle}'`);
  expect(await value(`SELECT vehicle_post_photo_allowed('${path}') ok`)).toBe(false);
  expect((await db.query<{details:{vehicle_photo_path:string}}>(`SELECT get_post_details('${vehicle}') details`)).rows[0]?.details.vehicle_photo_path).toBe('');
  await db.exec(`UPDATE posts SET show_contact=true WHERE id='${vehicle}'`);
});