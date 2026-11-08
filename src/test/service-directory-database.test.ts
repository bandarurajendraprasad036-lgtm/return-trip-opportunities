import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, expect, it } from 'vitest';
let db: PGlite;
const owner = '11111111-1111-4111-8111-111111111111';
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE SCHEMA auth; CREATE ROLE anon; CREATE ROLE authenticated;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.user',true),'')::uuid$$;
    CREATE TABLE service_profiles(user_id uuid PRIMARY KEY,display_name text DEFAULT '',service text DEFAULT '',bio text DEFAULT '',photo_path text DEFAULT '',published boolean DEFAULT false,updated_at timestamptz DEFAULT now());
    GRANT SELECT,INSERT,UPDATE ON service_profiles TO authenticated; GRANT SELECT ON service_profiles TO anon;
    ALTER TABLE service_profiles ENABLE ROW LEVEL SECURITY;
    CREATE POLICY read_service ON service_profiles FOR SELECT USING(published OR user_id=auth.uid());
    CREATE POLICY write_service ON service_profiles FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());`);
  await db.exec(readFileSync('drizzle/migrations/0040_consented_service_directory.sql','utf8'));
},20000);
afterAll(async () => { await db.close(); });
it('only owner-consented listings become public, without identity fields', async () => {
  await db.exec(`SET ROLE authenticated; SELECT set_config('test.user','${owner}',false);`);
  await db.query("SELECT save_service_listing('','Electrician','Guntur','Electrician',false)");
  await db.exec("RESET ROLE; SET ROLE anon; SELECT set_config('test.user','',false);");
  expect((await db.query<{rows: unknown[]}>('SELECT public_service_directory() rows')).rows[0]?.rows).toEqual([]);
  await db.exec(`RESET ROLE; SET ROLE authenticated; SELECT set_config('test.user','${owner}',false);`);
  await db.query("SELECT save_service_listing('','Electrician','Guntur','Electrician',true)");
  await db.exec("RESET ROLE; SET ROLE anon; SELECT set_config('test.user','',false);");
  expect((await db.query<{rows: unknown[]}>('SELECT public_service_directory() rows')).rows[0]?.rows).toEqual([{user_id:owner,service:'Electrician',town:'Guntur',category:'Electrician'}]);
});
it('another account cannot edit the existing owner listing', async () => {
  await db.exec("RESET ROLE; SET ROLE authenticated; SELECT set_config('test.user','22222222-2222-4222-8222-222222222222',false);");
  expect((await db.query(`UPDATE service_profiles SET town='Mumbai' WHERE user_id='${owner}' RETURNING user_id`)).rows).toEqual([]);
});
it('signed-out users cannot publish', async () => {
  await db.exec("RESET ROLE; SET ROLE anon; SELECT set_config('test.user','',false);");
  await expect(db.query("SELECT save_service_listing('','Driver','Guntur','Driver',true)")).rejects.toThrow();
});