import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const u = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const ramesh = u(1), suresh = u(2);
describe('weekly winner 70% rule', () => {
  let db: PGlite;
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`CREATE SCHEMA auth; CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULL::uuid $$;
      CREATE TABLE profiles(id uuid PRIMARY KEY, full_name text DEFAULT '', phone text DEFAULT '', referral_code text, referred_by uuid, referred_at timestamptz);
      CREATE TABLE posts(id uuid PRIMARY KEY, user_id uuid, module text, kind text, status text, contact_phone text);
      CREATE TABLE app_settings(key text PRIMARY KEY, value text, updated_at timestamptz DEFAULT now());
      CREATE TABLE notifications(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, post_id uuid, message text, created_at timestamptz DEFAULT now());
      CREATE TABLE referral_vip_joins(joined_user uuid, referrer_id uuid, joined_at timestamptz DEFAULT now());
      CREATE TABLE prime99_payments(user_id uuid, status text);
      CREATE TABLE referral_board_consent(user_id uuid, display_name text, region text, published boolean, photo_consent boolean);
      CREATE TABLE service_profiles(user_id uuid, published boolean, photo_path text);
      CREATE TABLE vehicle_post_points(post_id uuid, from_lat float8, from_lng float8);
      CREATE FUNCTION apply_referral(text) RETURNS boolean LANGUAGE sql AS $$SELECT false$$;`);
    const ids: string[] = [ramesh, suresh];
    for (let i = 10; i < 40; i++) ids.push(u(i));
    await db.exec(`INSERT INTO profiles(id) VALUES ${ids.map(i => `('${i}')`).join(',')};`);
    // Ramesh: 10 joins, 8 paid (80%). Suresh: 20 joins, 5 paid (25%).
    const joins: string[] = []; const paid: string[] = [];
    for (let i = 0; i < 10; i++) { joins.push(`('${u(10 + i)}','${ramesh}')`); if (i < 8) paid.push(`('${u(10 + i)}','approved')`); }
    for (let i = 0; i < 20; i++) { joins.push(`('${u(20 + i)}','${suresh}')`); if (i < 5) paid.push(`('${u(20 + i)}','approved')`); }
    await db.exec(`INSERT INTO referral_vip_joins(joined_user,referrer_id) VALUES ${joins.join(',')}; INSERT INTO prime99_payments VALUES ${paid.join(',')};
      INSERT INTO referral_board_consent VALUES('${ramesh}','Ramesh','TG',true,true),('${suresh}','Suresh','TG',true,true);
      INSERT INTO service_profiles VALUES('${ramesh}',true,'${ramesh}/p.jpg'),('${suresh}',true,'${suresh}/p.jpg');`);
    await db.exec(readFileSync('drizzle/migrations/0049_vehicle_details_ok_joins_weekly_winners_nearby_km.sql', 'utf8'));
  }, 30000);
  afterAll(async () => { await db.close(); });
  it('marks 80% paid eligible and 25% paid not eligible', async () => {
    const r = await db.query<{ user_id: string; eligible: boolean; percent: string }>('SELECT user_id, eligible, percent FROM referral_payment_stats() ORDER BY joins');
    expect(r.rows.find(x => x.user_id === ramesh)?.eligible).toBe(true);
    expect(Number(r.rows.find(x => x.user_id === ramesh)?.percent)).toBe(80);
    expect(r.rows.find(x => x.user_id === suresh)?.eligible).toBe(false);
  });
  it('selects Ramesh as Telangana winner despite fewer joins', async () => {
    await db.query('SELECT select_weekly_winners()');
    const r = await db.query<{ user_id: string }>("SELECT user_id FROM weekly_winners WHERE region='TG'");
    expect(r.rows[0]?.user_id).toBe(ramesh);
  });
  it('starts the nearby distance at 7 km', async () => {
    const r = await db.query<{ value: string }>("SELECT value FROM app_settings WHERE key='nearby_vehicle_km'");
    expect(r.rows[0]?.value).toBe('7');
  });
});
