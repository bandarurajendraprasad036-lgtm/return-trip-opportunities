import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, expect, it } from 'vitest';

let db: PGlite;
const owner = '11111111-1111-4111-8111-111111111111';
const paid = '22222222-2222-4222-8222-222222222222';
const unpaid = '33333333-3333-4333-8333-333333333333';
const post = '44444444-4444-4444-8444-444444444444';
const demand = '55555555-5555-4555-8555-555555555555';
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.user',true),'')::uuid $$;
    CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
    CREATE FUNCTION has_paid_bell(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT $1='${paid}'::uuid $$;
    CREATE FUNCTION has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
    CREATE FUNCTION my_profile_access_ready() RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
    CREATE TABLE profiles(id uuid PRIMARY KEY);
    CREATE TABLE posts(id uuid PRIMARY KEY,user_id uuid,module text,goods_type text,capacity_tons numeric,trip_date date,vehicle_name text,description text,vehicle_number text,driver_name text,contact_phone text,public_brand text,public_photo text,show_contact boolean,from_place text,to_place text);
    CREATE FUNCTION post_listing_visible(posts) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
    CREATE TABLE notifications(id uuid DEFAULT gen_random_uuid(),user_id uuid,post_id uuid,message text);
    CREATE TABLE messages(sender_id uuid,receiver_id uuid,post_id uuid,body text);
    CREATE TABLE vehicle_bell_demands(id uuid PRIMARY KEY,user_id uuid,from_place text,to_place text);
    CREATE TABLE vehicle_demand_chat_pairs(demand_id uuid,member_id uuid,owner_id uuid,board_rang_at timestamptz,UNIQUE(demand_id,member_id));
    CREATE FUNCTION open_vehicle_demand_chat(uuid) RETURNS uuid LANGUAGE plpgsql AS $$ DECLARE target uuid; BEGIN SELECT user_id INTO target FROM vehicle_bell_demands WHERE id=$1; INSERT INTO vehicle_demand_chat_pairs(demand_id,member_id,owner_id) VALUES($1,auth.uid(),target) ON CONFLICT DO NOTHING; RETURN target; END $$;
    INSERT INTO profiles VALUES('${owner}'),('${paid}'),('${unpaid}');
    INSERT INTO posts VALUES('${post}','${owner}','vehicle','goods',2,current_date,'Auto','Private Person 9876543210','AP03SECRET','Private Person','9876543210','Private Brand','https://example.com/private-photo.jpg',true,'Hyderabad','Vijayawada');
    INSERT INTO vehicle_bell_demands VALUES('${demand}','${owner}','Hyderabad','Vijayawada');`);
  await db.exec(readFileSync('drizzle/migrations/0101_route_only_vehicle_bells_no_paid_identity.sql', 'utf8'));
}, 30000);
afterAll(async () => { await db.close(); });

it('paid ₹100 access never returns vehicle name identity, phone or photo', async () => {
  await db.exec(`SELECT set_config('test.user','${paid}',false)`);
  const result = (await db.query<{details: Record<string, unknown>}>(`SELECT get_post_details('${post}') details`)).rows[0]?.details;
  expect(result?.['contact_phone']).toBeNull();
  expect(result?.['driver_name']).toBeNull();
  expect(result?.['public_photo']).toBe('');
  expect(result?.['description']).toBeNull();
  expect(result?.['vehicle_number']).toBeNull();
});
it('owner history retains actual private details', async () => {
  await db.exec(`SELECT set_config('test.user','${owner}',false)`);
  expect((await db.query<{details: {contact_phone: string}}>(`SELECT get_post_details('${post}') details`)).rows[0]?.details.contact_phone).toBe('9876543210');
});
it('post-linked vehicle interest is replaced by only actual From/To before storage', async () => {
  await db.exec(`SELECT set_config('app.bell_notice','interest',false); INSERT INTO notifications(user_id,post_id,message) VALUES('${owner}','${post}','Private Person 9876543210');`);
  const result = (await db.query<{message: string;vehicle_bell: boolean}>(`SELECT message,vehicle_bell FROM notifications WHERE post_id='${post}'`)).rows[0];
  expect(result).toEqual({ message: 'Hyderabad → Vijayawada', vehicle_bell: true });
});
it('board bell records one exact-owner route notice before repeat chat, never identity', async () => {
  await db.exec(`SELECT set_config('test.user','${paid}',false)`);
  expect((await db.query<{target: string}>(`SELECT ring_vehicle_board('${demand}') target`)).rows[0]?.target).toBe(owner);
  await db.query(`SELECT ring_vehicle_board('${demand}')`);
  const notices = (await db.query<{user_id: string;message: string;vehicle_bell: boolean}>('SELECT user_id,message,vehicle_bell FROM notifications WHERE post_id IS NULL')).rows;
  expect(notices).toEqual([{ user_id: owner, message: 'Hyderabad → Vijayawada', vehicle_bell: true }]);
});
it('unpaid users cannot use the vehicle bell', async () => {
  await db.exec(`SELECT set_config('test.user','${unpaid}',false)`);
  await expect(db.query(`SELECT ring_vehicle_board('${demand}')`)).rejects.toThrow('PAID_BELL_REQUIRED');
});