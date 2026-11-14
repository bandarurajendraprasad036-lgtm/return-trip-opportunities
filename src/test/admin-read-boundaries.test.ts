import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, expect, it } from 'vitest';

const admin = '11111111-1111-4111-8111-111111111111';
const owner = '22222222-2222-4222-8222-222222222222';
const visitor = '33333333-3333-4333-8333-333333333333';
let db: PGlite;
const actor = async (id: string) => { await db.exec(`RESET ROLE; SELECT set_config('test.user','${id}',false); SET ROLE authenticated;`); };
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.user',true),'')::uuid $$;
  CREATE FUNCTION has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$ SELECT $1='${admin}'::uuid AND $2='admin' $$;
  CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
  CREATE TABLE posts(id int,user_id uuid,status text,visible_after timestamptz,job_expires_at timestamptz);
  GRANT SELECT ON posts TO anon,authenticated; ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "posts readable" ON posts FOR SELECT TO authenticated USING(true);
  CREATE TABLE referral_vip_campaign(id boolean,event_label text);
  GRANT SELECT ON referral_vip_campaign TO anon,authenticated; ALTER TABLE referral_vip_campaign ENABLE ROW LEVEL SECURITY;
  CREATE POLICY campaign_read ON referral_vip_campaign FOR SELECT TO anon,authenticated USING(true);
  CREATE TABLE referral_board_consent(user_id uuid,display_name text,region text,published boolean,photo_consent boolean);
  CREATE TABLE service_profiles(user_id uuid,published boolean,photo_path text);
  CREATE FUNCTION referral_vip_ranks() RETURNS TABLE(user_id uuid,joins bigint,rank_no bigint) LANGUAGE sql AS $$ SELECT NULL::uuid,0::bigint,0::bigint WHERE false $$;
  INSERT INTO posts VALUES(1,'${owner}','active',NULL,NULL),(2,'${owner}','closed',NULL,NULL),(3,'${owner}','active',now()+interval '1 day',NULL),(4,'${owner}','active',NULL,now()-interval '1 day');
  INSERT INTO referral_vip_campaign VALUES(true,'Private event');`);
  await db.exec(readFileSync('drizzle/migrations/0078_admin_only_unrestricted_posts_and_campaign.sql', 'utf8'));
}, 30000);
afterAll(async () => { await db.close(); });
it('only the verified admin can read all posts; visitor sees only active visible unexpired listings', async () => {
  await actor(visitor);
  expect((await db.query<{id:number}>('SELECT id FROM posts ORDER BY id')).rows.map(r => r.id)).toEqual([1]);
  await actor(admin);
  expect((await db.query('SELECT id FROM posts')).rows).toHaveLength(4);
});
it('owners retain their closed, delayed and expired posts', async () => {
  await actor(owner);
  expect((await db.query('SELECT id FROM posts')).rows).toHaveLength(4);
});
it('campaign records and board details are admin-only', async () => {
  await actor(visitor);
  expect((await db.query('SELECT * FROM referral_vip_campaign')).rows).toHaveLength(0);
  expect((await db.query<{board:{event_label:string,rows:unknown[]}}>('SELECT public_referral_vip_board() board')).rows[0]?.board).toMatchObject({event_label:'',rows:[]});
  await actor(admin);
  expect((await db.query('SELECT * FROM referral_vip_campaign')).rows).toHaveLength(1);
  expect((await db.query<{board:{event_label:string}}>('SELECT public_referral_vip_board() board')).rows[0]?.board.event_label).toBe('Private event');
});
it('guests cannot read campaign records or details', async () => {
  await db.exec("RESET ROLE; SELECT set_config('test.user','',false); SET ROLE anon;");
  await expect(db.query('SELECT * FROM referral_vip_campaign')).rejects.toThrow('permission denied');
  expect((await db.query<{board:{event_label:string}}>('SELECT public_referral_vip_board() board')).rows[0]?.board.event_label).toBe('');
});