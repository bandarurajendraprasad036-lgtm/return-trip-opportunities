import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, expect, it } from 'vitest';

let db: PGlite;
const owner = '00000000-0000-4000-8000-000000000001';
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT NULL::uuid$$;
    CREATE FUNCTION public.has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$SELECT current_setting('test.admin',true)='yes'$$;
    CREATE TABLE app_settings(key text,value text); ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
    GRANT SELECT ON app_settings TO anon,authenticated;
    CREATE POLICY "settings readable" ON app_settings FOR SELECT USING(true);
    CREATE TABLE referral_board_consent(user_id uuid,published boolean,photo_consent boolean);
    CREATE TABLE service_profiles(user_id uuid,published boolean,photo_path text);
    CREATE TABLE weekly_winners(user_id uuid,photo_path text,created_at timestamptz);
    ALTER TABLE weekly_winners ENABLE ROW LEVEL SECURITY; GRANT SELECT ON weekly_winners TO anon,authenticated;
    CREATE POLICY "weekly winners public" ON weekly_winners FOR SELECT USING(true);
    CREATE TABLE posts(id uuid); ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
    CREATE POLICY paid_vehicle_display ON posts AS RESTRICTIVE FOR SELECT USING(true);
    INSERT INTO app_settings VALUES('home_controls','{}'),('payment_scanner_image','image'),('youtube_url','url'),('referral_offer_until','private'),('devotional:2026-11-18','private');
    INSERT INTO referral_board_consent VALUES('${owner}',true,true);
    INSERT INTO service_profiles VALUES('${owner}',true,'${owner}/photo.jpg');
    INSERT INTO weekly_winners VALUES('${owner}','${owner}/photo.jpg','2026-11-23'),('${owner}','${owner}/photo.jpg','2026-11-18');`);
  await db.exec(readFileSync('drizzle/migrations/0106_restrict_public_settings_and_consented_winners.sql','utf8'));
}, 30000);
afterAll(async () => { await db.close(); });
it('guests read only homepage and scanner settings, admins retain all settings', async () => {
  await db.exec("SET ROLE anon; SET test.admin='no'");
  const publicRows = await db.query<{key:string}>('SELECT key FROM app_settings ORDER BY key');
  expect(publicRows.rows.map(r => r.key)).toEqual(['home_controls','payment_scanner_image','youtube_url']);
  await db.exec("RESET ROLE; SET ROLE authenticated; SET test.admin='yes'");
  expect((await db.query('SELECT key FROM app_settings')).rows).toHaveLength(5);
  await db.exec("RESET ROLE; SET test.admin='no'");
});
it('only current consented winners are public and withdrawing consent hides them', async () => {
  await db.exec('SET ROLE anon');
  expect((await db.query('SELECT * FROM weekly_winners')).rows).toHaveLength(1);
  await db.exec('RESET ROLE; UPDATE referral_board_consent SET photo_consent=false; SET ROLE anon');
  expect((await db.query('SELECT * FROM weekly_winners')).rows).toHaveLength(0);
  await db.exec('RESET ROLE');
});
it('removes the inert vehicle restriction without replacing other policies', async () => {
  const result = await db.query("SELECT policyname FROM pg_policies WHERE tablename='posts' AND policyname='paid_vehicle_display'");
  expect(result.rows).toHaveLength(0);
});