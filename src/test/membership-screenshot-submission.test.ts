import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, expect, it } from 'vitest';

let db: PGlite;
const admin = '11111111-1111-4111-8111-111111111111';
const owner = '22222222-2222-4222-8222-222222222222';
const other = '33333333-3333-4333-8333-333333333333';
const proof = `screenshot:${'b'.repeat(64)}`;
let requestId = '';

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;CREATE SCHEMA storage;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.user',true),'')::uuid$$;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$SELECT current_setting('test.role',true)$$;
    CREATE TABLE profiles(id uuid PRIMARY KEY);INSERT INTO profiles VALUES('${admin}'),('${owner}'),('${other}');
    CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
    CREATE FUNCTION has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$SELECT $1='${admin}'::uuid$$;
    CREATE FUNCTION support_admin_id() RETURNS uuid LANGUAGE sql AS $$SELECT '${admin}'::uuid$$;
    CREATE FUNCTION can_post_chat(uuid,uuid) RETURNS boolean LANGUAGE sql AS $$SELECT false$$;
    CREATE TABLE messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),sender_id uuid,receiver_id uuid,post_id uuid,body text DEFAULT '',image_path text DEFAULT '',is_auto boolean DEFAULT false,needs_admin boolean DEFAULT false);
    CREATE TABLE membership_requests(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),payer_id uuid,user_id uuid,amount integer,reference text UNIQUE,message_id uuid,status text DEFAULT 'pending',submitted_at timestamptz DEFAULT now(),reviewed_at timestamptz,reviewed_by uuid,note text DEFAULT '');
    CREATE TABLE membership_access(user_id uuid,request_id uuid,source text,revoked_at timestamptz,starts_at timestamptz DEFAULT now(),ends_at timestamptz DEFAULT now()+interval '1 month',granted_by uuid);
    CREATE TABLE provider_contact_batches(user_id uuid,status text);CREATE TABLE referral_vip_joins(joined_user uuid,referrer_id uuid);
    CREATE TABLE prime99_payments(reference text);CREATE TABLE referral_cash_receipts(reference text);
    CREATE FUNCTION confirm_referral_cash(uuid,text,bigint) RETURNS uuid LANGUAGE plpgsql AS $$BEGIN INSERT INTO referral_cash_receipts VALUES($2);RETURN gen_random_uuid();END$$;
    CREATE TABLE free_work_notice_queue(user_id uuid,source text,entry_id text,notification_id uuid);
    CREATE TABLE free_work_interests(user_id uuid,entry_id text,section text,category text,area text);
    CREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id text,name text,owner_id text,metadata jsonb);
    CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql AS $$SELECT string_to_array($1,'/')$$;
  `);
  await db.exec(readFileSync('drizzle/migrations/0076_auto_confirm_matched_prime_payment.sql', 'utf8'));
  await db.exec(readFileSync('drizzle/migrations/0088_screenshot_only_membership_evidence.sql', 'utf8'));
  await db.exec(readFileSync('drizzle/migrations/0087_admin_approval_message_and_bell_notice_details.sql', 'utf8'));
  await db.exec(readFileSync('drizzle/migrations/0092_atomic_admin_reviewed_membership_screenshot.sql', 'utf8'));
  await db.exec(readFileSync('drizzle/migrations/0093_allow_owner_membership_image_upload.sql', 'utf8'));
  await db.exec('CREATE TRIGGER paid_chat_message_guard BEFORE INSERT ON messages FOR EACH ROW EXECUTE FUNCTION enforce_paid_chat_message();');
}, 30000);

afterAll(async () => { await db.close(); });

it('rejects another account image path without creating a payment request', async () => {
  await db.exec(`SELECT set_config('test.user','${other}',false);SELECT set_config('test.role','authenticated',false);
    INSERT INTO storage.objects(bucket_id,name,owner_id,metadata) VALUES('chat-images','${owner}/proof.png','${owner}','{"mimetype":"image/png","size":1000}');`);
  await expect(db.query(`SELECT submit_membership_screenshot(100,NULL,'${proof}','${owner}/proof.png')`)).rejects.toThrow('IMAGE_REQUIRED');
  expect((await db.query<{ n: number }>('SELECT count(*)::int n FROM membership_requests')).rows[0]?.n).toBe(0);
});

it('atomically sends the owned screenshot to admin with access still revoked', async () => {
  await db.exec(`SELECT set_config('test.user','${owner}',false);`);
  const result = await db.query<{ submit_membership_screenshot: string }>(`SELECT submit_membership_screenshot(100,NULL,'${proof}','${owner}/proof.png')`);
  requestId = result.rows[0]?.submit_membership_screenshot ?? '';
  expect(requestId).not.toBe('');
  expect((await db.query<{ status: string; amount: number }>('SELECT status,amount FROM membership_requests')).rows).toEqual([{ status: 'pending', amount: 100 }]);
  expect((await db.query<{ held: boolean }>('SELECT revoked_at IS NOT NULL held FROM membership_access')).rows).toEqual([{ held: true }]);
  expect((await db.query<{ n: number }>(`SELECT count(*)::int n FROM messages WHERE receiver_id='${admin}' AND image_path='${owner}/proof.png' AND needs_admin`)).rows[0]?.n).toBe(1);
});

it('ordinary users cannot approve and historical approval retains one month', async () => {
  await db.exec(`SELECT set_config('test.user','${other}',false);`);
  await expect(db.query(`SELECT review_membership_evidence('${requestId}',true)`)).rejects.toThrow('ADMIN_ONLY');
  await db.exec(`SELECT set_config('test.user','${admin}',false);SELECT set_config('test.role','authenticated',false);`);
  await db.query(`SELECT review_membership_evidence('${requestId}',true)`);
  expect((await db.query<{ active: boolean }>(`SELECT source='confirmed' AND revoked_at IS NULL AND ends_at=starts_at+interval '1 month' active FROM membership_access WHERE request_id='${requestId}'`)).rows).toEqual([{ active: true }]);
  expect((await db.query<{ n: number }>(`SELECT count(*)::int n FROM messages WHERE receiver_id='${owner}' AND body='మీరు అమౌంట్ కట్టారని భావిస్తున్నాము. 24 గంటల్లో మీ సబ్స్క్రైబర్ యాక్టివేషన్ అవుతుంది.'`)).rows[0]?.n).toBe(1);
});

it('new ₹100 requests unlock exactly three calendar months only after admin approval', async () => {
  await db.exec(readFileSync('drizzle/migrations/0095_prospective_three_month_vehicle_subscription.sql', 'utf8'));
  const historical = await db.query<{ months: number }>(`SELECT vehicle_plan_months months FROM membership_requests WHERE id='${requestId}'`);
  expect(historical.rows).toEqual([{ months: 1 }]);
  const inserted = await db.query<{ id: string }>(`INSERT INTO membership_requests(payer_id,user_id,amount,reference,message_id) VALUES('${owner}','${owner}',100,'new-plan',gen_random_uuid()) RETURNING id`);
  const id = inserted.rows[0]?.id;
  if (!id) throw new Error('request missing');
  await db.exec(`INSERT INTO membership_access(user_id,request_id,source,revoked_at) VALUES('${owner}','${id}','provisional',now());SELECT set_config('test.user','${other}',false);`);
  await expect(db.query(`SELECT review_membership_evidence('${id}',true)`)).rejects.toThrow('ADMIN_ONLY');
  expect((await db.query<{ held: boolean }>(`SELECT revoked_at IS NOT NULL held FROM membership_access WHERE request_id='${id}'`)).rows).toEqual([{ held: true }]);
  await db.exec(`SELECT set_config('test.user','${admin}',false);SELECT set_config('app.membership_evidence','1',false);`);
  await db.query(`SELECT review_membership_evidence('${id}',true)`);
  expect((await db.query<{ active: boolean }>(`SELECT revoked_at IS NULL AND ends_at=starts_at+interval '3 months' active FROM membership_access WHERE request_id='${id}'`)).rows).toEqual([{ active: true }]);
});
