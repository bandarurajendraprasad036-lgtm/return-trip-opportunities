import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, it, expect } from 'vitest';
let db: PGlite;
const user='22222222-2222-4222-8222-222222222222';
beforeAll(async()=>{
  db=new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT '${user}'::uuid$$;
  CREATE TABLE access(user_id uuid);
  CREATE FUNCTION has_paid_bell(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT EXISTS(SELECT 1 FROM access WHERE user_id=$1)$$;
  CREATE TABLE payment_image_checks(message_id uuid DEFAULT gen_random_uuid(),payer_id uuid,match_status text,created_at timestamptz DEFAULT now());
  CREATE TABLE posts(user_id uuid);`);
  await db.exec(readFileSync('drizzle/migrations/0073_hold_unmatched_payment_posting.sql','utf8'));
},30000);
afterAll(async()=>{await db.close();});
it('a user without payment submission keeps existing free posting',async()=>{
  expect((await db.query<{pending:boolean}>('SELECT my_payment_verification_pending() pending')).rows[0]?.pending).toBe(false);
  await db.exec(`INSERT INTO posts VALUES('${user}')`);
});
it('unmatched screenshot prevents posting at the database',async()=>{
  await db.exec(`INSERT INTO payment_image_checks(payer_id,match_status,created_at) VALUES('${user}','mismatch',now()-interval '1 hour')`);
  expect((await db.query<{pending:boolean}>('SELECT my_payment_verification_pending() pending')).rows[0]?.pending).toBe(true);
  await expect(db.exec(`INSERT INTO posts VALUES('${user}')`)).rejects.toThrow('PAYMENT_VERIFICATION_PENDING');
});
it('a newer matched screenshot releases only the payment hold',async()=>{
  await db.exec(`INSERT INTO payment_image_checks(payer_id,match_status) VALUES('${user}','matched')`);
  expect((await db.query<{pending:boolean}>('SELECT my_payment_verification_pending() pending')).rows[0]?.pending).toBe(false);
  await db.exec(`INSERT INTO posts VALUES('${user}')`);
});
it('an existing paid account keeps access on an unmatched retry',async()=>{
  await db.exec(`INSERT INTO payment_image_checks(payer_id,match_status,created_at) VALUES('${user}','unreadable',now()+interval '1 minute');INSERT INTO access VALUES('${user}')`);
  expect((await db.query<{pending:boolean}>('SELECT my_payment_verification_pending() pending')).rows[0]?.pending).toBe(false);
});