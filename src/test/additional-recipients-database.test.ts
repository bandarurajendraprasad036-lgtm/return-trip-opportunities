import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, expect, it } from 'vitest';

let db: PGlite;
const admin = '11111111-1111-4111-8111-111111111111';
const owner = '22222222-2222-4222-8222-222222222222';
const recipient = '33333333-3333-4333-8333-333333333333';
const other = '44444444-4444-4444-8444-444444444444';
let recipientId = '';
let paymentId = '';

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;CREATE SCHEMA storage;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.user',true),'')::uuid$$;
    CREATE TABLE auth.users(id uuid PRIMARY KEY,phone text,phone_confirmed_at timestamptz);
    CREATE TABLE profiles(id uuid PRIMARY KEY,phone text);
    INSERT INTO profiles VALUES('${admin}','9000000000'),('${owner}','9000000000'),('${recipient}','9000000001'),('${other}','9000000002');
    INSERT INTO auth.users VALUES('${admin}','+919000000000',now()),('${owner}','+919000000000',now()),('${recipient}','+919000000001',NULL),('${other}','+919000000002',now());
    CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
    CREATE FUNCTION has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$SELECT $1='${admin}'::uuid$$;
    CREATE FUNCTION support_admin_id() RETURNS uuid LANGUAGE sql AS $$SELECT '${admin}'::uuid$$;
    CREATE TABLE messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),sender_id uuid,receiver_id uuid,body text DEFAULT '',image_path text DEFAULT '',is_auto boolean DEFAULT false,needs_admin boolean DEFAULT false);
    CREATE TABLE membership_requests(reference text);CREATE TABLE membership_access(user_id uuid);
    CREATE TABLE prime99_payments(reference text);CREATE TABLE referral_cash_receipts(reference text);
    CREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id text,name text,owner_id text,metadata jsonb);
  `);
  await db.exec(readFileSync('drizzle/migrations/0100_additional_verified_phone_recipients.sql', 'utf8'));
  await db.exec(`SELECT set_config('test.user','${owner}',false);
    INSERT INTO storage.objects(bucket_id,name,owner_id,metadata) VALUES('chat-images','${owner}/additional.png','${owner}','{"mimetype":"image/png","size":1000}');`);
}, 30000);

afterAll(async () => { await db.close(); });

it('requires owner attestation and keeps the same additional number as one recipient', async () => {
  await expect(db.query(`SELECT add_additional_phone_recipient('9000000001',false)`)).rejects.toThrow('VALID_PHONE_AND_CONSENT_REQUIRED');
  const first = await db.query<{ add_additional_phone_recipient: string }>(`SELECT add_additional_phone_recipient('9000000001',true)`);
  recipientId = first.rows[0]?.add_additional_phone_recipient ?? '';
  const second = await db.query<{ add_additional_phone_recipient: string }>(`SELECT add_additional_phone_recipient('9000000001',true)`);
  expect(second.rows[0]?.add_additional_phone_recipient).toBe(recipientId);
  expect((await db.query<{ n: number }>('SELECT count(*)::int n FROM additional_phone_recipients')).rows[0]?.n).toBe(1);
});

it('blocks recipient payment before the recipient verifies by their code-signed account and consents', async () => {
  await expect(db.query(`SELECT submit_additional_recipient_screenshot('${recipientId}','screenshot:${'c'.repeat(64)}','${owner}/additional.png')`)).rejects.toThrow('VERIFIED_RECIPIENT_CONSENT_REQUIRED');
  await db.exec(`SELECT set_config('test.user','${other}',false);`);
  await expect(db.query(`SELECT consent_additional_phone_recipient('${recipientId}')`)).rejects.toThrow('RECIPIENT_REQUEST_NOT_FOUND');
  await db.exec(`SELECT set_config('test.user','${recipient}',false);`);
  await expect(db.query(`SELECT consent_additional_phone_recipient('${recipientId}')`)).rejects.toThrow('VERIFIED_PHONE_REQUIRED');
  await db.exec(`UPDATE auth.users SET phone_confirmed_at=now() WHERE id='${recipient}';`);
  await db.query(`SELECT consent_additional_phone_recipient('${recipientId}')`);
  expect((await db.query<{ verified: boolean }>(`SELECT verified_at IS NOT NULL AND recipient_consent_at IS NOT NULL verified FROM additional_phone_recipients WHERE id='${recipientId}'`)).rows[0]?.verified).toBe(true);
});

it('keeps ₹80 recipient approval separate from ordinary ₹100 membership', async () => {
  await db.exec(`SELECT set_config('test.user','${owner}',false);`);
  const saved = await db.query<{ submit_additional_recipient_screenshot: string }>(`SELECT submit_additional_recipient_screenshot('${recipientId}','screenshot:${'c'.repeat(64)}','${owner}/additional.png')`);
  paymentId = saved.rows[0]?.submit_additional_recipient_screenshot ?? '';
  expect((await db.query<{ amount: number; status: string }>('SELECT amount,status FROM additional_recipient_payments')).rows).toEqual([{ amount: 80, status: 'pending' }]);
  await db.exec(`SELECT set_config('test.user','${other}',false);`);
  await expect(db.query(`SELECT review_additional_recipient_payment('${paymentId}',true)`)).rejects.toThrow('ADMIN_ONLY');
  await db.exec(`SELECT set_config('test.user','${admin}',false);`);
  await db.query(`SELECT review_additional_recipient_payment('${paymentId}',true)`);
  expect((await db.query<{ status: string }>('SELECT status FROM additional_recipient_payments')).rows[0]?.status).toBe('approved');
  expect((await db.query<{ n: number }>('SELECT count(*)::int n FROM membership_access')).rows[0]?.n).toBe(0);
  expect((await db.query<{ n: number }>('SELECT count(*)::int n FROM membership_requests')).rows[0]?.n).toBe(0);
});
