import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, expect, it } from 'vitest';

const ringer = '22222222-2222-4222-8222-222222222222';
const viewer = '33333333-3333-4333-8333-333333333333';
let db: PGlite;
async function as(id: string, admin = false) { await db.exec(`RESET ROLE; SELECT set_config('test.user','${id}',false); SELECT set_config('test.admin','${admin ? 'yes' : 'no'}',false); SET ROLE authenticated;`); }
async function anon() { await db.exec(`RESET ROLE; SELECT set_config('test.user','',false); SELECT set_config('test.admin','no',false); SET ROLE anon;`); }
const list = async () => (await db.query<{ full_name: string; phone: string; shown: boolean; own: boolean; category: string; rang_at: string }>(`SELECT * FROM list_free_work_interest_contacts('work-wanted')`)).rows;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.user',true),'')::uuid $$;
    CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
    CREATE TYPE app_role AS ENUM('admin','user');
    CREATE FUNCTION has_role(uuid,app_role) RETURNS boolean LANGUAGE sql AS $$ SELECT coalesce(current_setting('test.admin',true)='yes',false) $$;
    CREATE FUNCTION free_work_category(v text) RETURNS text LANGUAGE sql AS $$ SELECT lower(trim(v)) $$;
    CREATE TABLE profiles(id uuid PRIMARY KEY,full_name text,phone text,photo_path text,public_photo text,hide_name boolean DEFAULT false,hide_phone boolean DEFAULT false,hide_photo boolean DEFAULT false,public_bell_consent boolean DEFAULT false);
    CREATE TABLE posts(id uuid); CREATE FUNCTION post_listing_visible(posts) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
    CREATE TABLE post_bell_interests(id uuid,post_id uuid,user_id uuid); CREATE TABLE vehicle_bell_demands(id uuid,post_id uuid,user_id uuid,category text,from_place text,to_place text,vehicle_type text,rang_at timestamptz DEFAULT now());
    CREATE TABLE free_work_interests(id uuid,entry_id text,source text,user_id uuid,section text,category text,area text,created_at timestamptz DEFAULT now());
    INSERT INTO profiles VALUES('${ringer}','Ringer','9876543211','','',false,false,false,false),('${viewer}','Viewer','9876543212','','',false,false,false,false);
    INSERT INTO free_work_interests VALUES(gen_random_uuid(),'','interest','${ringer}','work-wanted','ఎలక్ట్రీషియన్','Village',now());
    GRANT USAGE ON SCHEMA auth TO authenticated,anon;`);
  await db.exec(readFileSync('drizzle/migrations/0146_consented_free_work_bell_contacts.sql', 'utf8'));
  await db.exec(readFileSync('drizzle/migrations/0147_fix_free_work_bell_contact_visibility.sql', 'utf8'));
  await db.exec(readFileSync('drizzle/migrations/0154_bell_hide_applies_to_own_rows.sql', 'utf8'));
}, 30000);
afterAll(async () => { await db.close(); });

it('the ringer sees their own unhidden name, mobile, need and time', async () => {
  await as(ringer);
  const [row] = await list();
  expect(row).toMatchObject({ own: true, shown: true, full_name: 'Ringer', phone: '9876543211', category: 'ఎలక్ట్రీషియన్' });
  expect(row?.rang_at).toBeTruthy();
});

it('others and signed-out visitors see no identity without the ringer consent', async () => {
  await as(viewer);
  expect((await list())[0]).toMatchObject({ shown: false, full_name: '', phone: '' });
  await anon();
  expect((await list())[0]).toMatchObject({ shown: false, full_name: '', phone: '' });
});

it('after consent everyone sees the details, but a hidden phone stays hidden', async () => {
  await db.exec(`RESET ROLE; UPDATE profiles SET public_bell_consent=true, hide_phone=true WHERE id='${ringer}';`);
  await anon();
  expect((await list())[0]).toMatchObject({ shown: true, full_name: 'Ringer', phone: '' });
  await as(viewer, true);
  expect((await list())[0]).toMatchObject({ phone: '9876543211' });
  await as(ringer);
  expect((await list())[0]).toMatchObject({ own: true, full_name: 'Ringer', phone: '' });
});

it('vehicle bell list: hidden mobile is hidden from the ringer and others, shown after show; admin always sees', async () => {
  await db.exec(`RESET ROLE; INSERT INTO vehicle_bell_demands(id,user_id,category,from_place,to_place,vehicle_type) VALUES (gen_random_uuid(),'${ringer}','returns','A','B','DCM');
    UPDATE profiles SET public_bell_consent=true, hide_phone=true, hide_name=false WHERE id='${ringer}';`);
  const v = async () => (await db.query<{ phone: string; full_name: string; shown: boolean }>(`SELECT * FROM list_vehicle_bell_contacts('returns')`)).rows[0];
  await as(ringer); expect(await v()).toMatchObject({ phone: '', full_name: 'Ringer' });
  await as(viewer); expect(await v()).toMatchObject({ phone: '', full_name: 'Ringer' });
  await as(viewer, true); expect(await v()).toMatchObject({ phone: '9876543211' });
  await db.exec(`RESET ROLE; UPDATE profiles SET hide_phone=false WHERE id='${ringer}';`);
  await as(viewer); expect(await v()).toMatchObject({ phone: '9876543211', shown: true });
  await db.exec(`RESET ROLE; UPDATE profiles SET hide_phone=true, hide_name=true, hide_photo=true WHERE id='${ringer}';`);
  await as(viewer); expect(await v()).toMatchObject({ phone: '', full_name: '', shown: false });
});
