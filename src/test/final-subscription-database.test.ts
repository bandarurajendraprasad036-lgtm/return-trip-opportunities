import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, it, expect } from 'vitest';
let db: PGlite;
const caller = '11111111-1111-4111-8111-111111111111';
const target = '22222222-2222-4222-8222-222222222222';
const migration = readFileSync('drizzle/migrations/0122_final_subscription_bells_chat_and_post_limits.sql', 'utf8');
function fn(name: string) {
  const start = migration.indexOf(`CREATE OR REPLACE FUNCTION public.${name}(`);
  const end = migration.indexOf('$$;', migration.indexOf('AS $$', start)) + 3;
  if (start < 0 || end < 3) throw new Error(name);
  return migration.slice(start, end);
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT '${caller}'::uuid $$;
  CREATE TABLE profiles(id uuid PRIMARY KEY); INSERT INTO profiles VALUES('${caller}');
  CREATE TABLE account_programs(user_id uuid, member_kind text); INSERT INTO account_programs VALUES('${caller}','seeker');
  CREATE TABLE receipts(paid boolean); INSERT INTO receipts VALUES(false);
  CREATE FUNCTION has_paid_bell(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT paid FROM receipts $$;
  CREATE TABLE monthly_post_usage(post_id uuid PRIMARY KEY,user_id uuid,used_at timestamptz DEFAULT now());
  CREATE TABLE free_work_pairs(member_id uuid,owner_id uuid); INSERT INTO free_work_pairs VALUES('${caller}','${target}');
  CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;`);
  for (const name of ['subscription_post_limit','consume_post_slot','my_post_quota99','free_work_chat']) await db.exec(fn(name));
  await db.exec('CREATE TABLE posts(id uuid,user_id uuid,created_at timestamptz DEFAULT now()); CREATE TABLE free_work_entries(id uuid,user_id uuid,created_at timestamptz DEFAULT now());');
  await db.exec(readFileSync('drizzle/migrations/0124_include_preserved_post_history_in_subscription_quota.sql','utf8').replace(/REVOKE ALL[^;]+; GRANT EXECUTE[^;]+;/g,''));
});
afterAll(async () => { await db.close(); });
async function slot(n: number) { return db.query(`SELECT consume_post_slot('${caller}','${String(n).padStart(8,'0')}-3333-4333-8333-333333333333')`); }
it('unpaid one lifetime post; removal or month rollover cannot give another', async () => {
  await slot(1);
  await db.exec("UPDATE monthly_post_usage SET used_at=now()-interval '2 months'");
  await expect(slot(2)).rejects.toThrow('FREE_ONE_POST_LIMIT');
});
it('unpaid existing private pair does not authorize ordinary chat', async () => {
  expect((await db.query<{ ok: boolean }>(`SELECT free_work_chat('${target}') ok`)).rows[0]?.ok).toBe(false);
});
it('paid normal/trader can create five this month, sixth denied', async () => {
  await db.exec("UPDATE receipts SET paid=true; UPDATE account_programs SET member_kind='business'");
  for (let n=2;n<=6;n++) await slot(n);
  await expect(slot(7)).rejects.toThrow('MONTHLY_POST_LIMIT_5');
});
it('paid vehicle owner can create ten, eleventh denied', async () => {
  await db.exec("UPDATE account_programs SET member_kind='owner'");
  for (let n=7;n<=11;n++) await slot(n);
  await expect(slot(12)).rejects.toThrow('MONTHLY_POST_LIMIT_10');
});
it('paid pair authorizes chat, expired payment immediately removes it', async () => {
  expect((await db.query<{ ok: boolean }>(`SELECT free_work_chat('${target}') ok`)).rows[0]?.ok).toBe(true);
  await db.exec('UPDATE receipts SET paid=false');
  expect((await db.query<{ ok: boolean }>(`SELECT free_work_chat('${target}') ok`)).rows[0]?.ok).toBe(false);
});
it('a new paid calendar month resets monthly allowance', async () => {
  await db.exec("UPDATE receipts SET paid=true; UPDATE monthly_post_usage SET used_at=date_trunc('month',now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata'-interval '1 second'");
  await slot(12);
  const row=await db.query<{q:{used:number,limit:number}}>('SELECT my_post_quota99() q');
  expect(row.rows[0]?.q).toMatchObject({used:1,limit:10});
});
it('historical posts absent from the usage ledger still exhaust the unpaid allowance', async () => {
  await db.exec(`DELETE FROM monthly_post_usage; UPDATE receipts SET paid=false; INSERT INTO posts VALUES('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','${caller}',now()-interval '4 months')`);
  await expect(slot(13)).rejects.toThrow('FREE_ONE_POST_LIMIT');
});
it('an inserted first free row is counted once by the after-insert quota check', async () => {
  const id='00000014-3333-4333-8333-333333333333';
  await db.exec(`DELETE FROM posts; INSERT INTO posts VALUES('${id}','${caller}',now())`);
  await slot(14);
  expect((await db.query<{used:number}>('SELECT count(*)::integer used FROM monthly_post_usage')).rows[0]?.used).toBe(1);
});