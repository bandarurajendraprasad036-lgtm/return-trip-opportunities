import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, it, expect } from 'vitest';
let db: PGlite;
const user='11111111-1111-4111-8111-111111111111';
beforeAll(async()=>{
  db=new PGlite();
  await db.exec(`CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
  CREATE TABLE prime99_payments(user_id uuid,payment_purpose text,payable_amount int,plan_months int,status text,received_at timestamptz,ends_at timestamptz);
  CREATE TABLE membership_access(user_id uuid,request_id uuid,feature_scope text,revoked_at timestamptz,starts_at timestamptz,ends_at timestamptz);
  CREATE TABLE membership_requests(id uuid,user_id uuid,amount int,vehicle_plan_months int,status text);`);
  await db.exec(readFileSync('drizzle/migrations/0123_receipt_only_subscription_and_remaining_bell_paths.sql','utf8').split('\n')[0] ?? '');
});
afterAll(async()=>{await db.close();});
async function access(){return (await db.query<{ok:boolean}>(`SELECT has_paid_bell('${user}') ok`)).rows[0]?.ok;}
it('an administrator free grant without a receipt never unlocks subscription',async()=>{
  await db.exec(`INSERT INTO membership_access VALUES('${user}',NULL,'all',NULL,now(),now()+interval '3 months')`);
  expect(await access()).toBe(false);
});
it('pending 100 screenshot does not unlock bells/chat',async()=>{
  await db.exec(`INSERT INTO prime99_payments VALUES('${user}','membership',100,3,'pending',now(),now()+interval '3 months')`);
  expect(await access()).toBe(false);
});
it('only approved 100 three month receipt unlocks bells/chat',async()=>{
  await db.exec("UPDATE prime99_payments SET status='approved'");expect(await access()).toBe(true);
  await db.exec('UPDATE prime99_payments SET payable_amount=49');expect(await access()).toBe(false);
  await db.exec('UPDATE prime99_payments SET payable_amount=100,plan_months=1');expect(await access()).toBe(false);
  await db.exec('UPDATE prime99_payments SET plan_months=3');expect(await access()).toBe(true);
});
it('expiry removes bell and chat authorization immediately',async()=>{
  await db.exec("UPDATE prime99_payments SET ends_at=now()-interval '1 second'");expect(await access()).toBe(false);
});