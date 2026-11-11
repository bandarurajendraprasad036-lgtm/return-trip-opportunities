import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const admin = '11111111-1111-4111-8111-111111111111';
const inviter = '22222222-2222-4222-8222-222222222222';
const joined = '33333333-3333-4333-8333-333333333333';
const unpaid = '44444444-4444-4444-8444-444444444444';
describe('Prime 99 approved rules in PostgreSQL', () => {
  let db: PGlite;
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`CREATE SCHEMA auth; CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.user',true),'')::uuid $$;
      CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
      CREATE FUNCTION has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$SELECT $1='${admin}'::uuid AND $2='admin'$$;
      CREATE TABLE profiles(id uuid PRIMARY KEY);
      CREATE TABLE posts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid);
      CREATE TABLE notifications(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,message text,created_at timestamptz DEFAULT now());
      CREATE TABLE notification_preferences(user_id uuid,enabled boolean,timezone text,daily_limit int,quiet_start time,quiet_end time);
      CREATE TABLE referral_vip_joins(joined_user uuid,referrer_id uuid);
      CREATE TABLE referral_cash_receipts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,reference text UNIQUE,amount_paise bigint,confirmed_by uuid);
      CREATE TABLE referral_cash_rewards(receipt_id uuid PRIMARY KEY REFERENCES referral_cash_receipts(id),user_id uuid,amount_paise bigint,created_at timestamptz DEFAULT now());
      CREATE TABLE referral_invitee_rewards(receipt_id uuid,user_id uuid,amount_paise bigint);
      CREATE TABLE referral_board_consent(user_id uuid,display_name text,region text,published boolean);
      CREATE TABLE referral_vip_campaign(id boolean,started_at timestamptz,event_label text);
      CREATE TABLE service_profiles(user_id uuid,published boolean,photo_path text);
      CREATE FUNCTION referral_vip_ranks() RETURNS TABLE(user_id uuid,joins bigint,rank_no bigint) LANGUAGE sql AS $$ SELECT referrer_id,count(*),row_number() OVER(ORDER BY count(*) DESC,referrer_id) FROM referral_vip_joins GROUP BY referrer_id $$;
      INSERT INTO profiles VALUES('${admin}'),('${inviter}'),('${joined}'),('${unpaid}');
      INSERT INTO referral_vip_joins VALUES('${joined}','${inviter}'),('${unpaid}','${joined}');
      INSERT INTO referral_board_consent VALUES('${inviter}','Consent','TG',true),('${joined}','Private','AP',false),('${unpaid}','Unpaid','TG',false);
      INSERT INTO service_profiles VALUES('${inviter}',true,'${inviter}/photo.jpg');`);
    await db.exec(readFileSync('drizzle/migrations/0047_prime99_paid_alerts_monthly_posts_and_daily_board.sql', 'utf8'));
    await db.exec(`SELECT set_config('test.user','${admin}',false)`);
  }, 30000);
  afterAll(async () => { await db.close(); });
  it('rejects a payment amount other than exactly 99', async () => {
    await expect(db.exec(`INSERT INTO prime99_payments(user_id,reference,amount) VALUES('${inviter}','WRONG-100',100)`)).rejects.toThrow();
  });
  it('pending 99 does not enable notifications', async () => {
    await db.exec(`INSERT INTO prime99_payments(user_id,reference) VALUES('${inviter}','FIRST-99')`);
    expect((await db.query<{ok:boolean}>(`SELECT has_prime99('${inviter}') ok`)).rows[0]?.ok).toBe(false);
    await db.exec(`INSERT INTO notifications(user_id,message) VALUES('${inviter}','unpaid')`);
    expect((await db.query<{n:number}>('SELECT count(*)::int n FROM notifications')).rows[0]?.n).toBe(0);
  });
  it('admin approval starts one calendar month at receipt confirmation', async () => {
    await db.exec("SELECT review_prime99((SELECT id FROM prime99_payments WHERE reference='FIRST-99'),true,'received')");
    const r = await db.query<{ok:boolean,month:boolean}>(`SELECT has_prime99('${inviter}') ok,ends_at=received_at+interval '1 month' AS month FROM prime99_payments WHERE reference='FIRST-99'`);
    expect(r.rows[0]).toEqual({ok:true,month:true});
  });
  it('confirmed 99 awards 19.80 only to eligible inviter and no invitee', async () => {
    await db.exec(`INSERT INTO prime99_payments(user_id,reference) VALUES('${joined}','SECOND-99'); SELECT review_prime99((SELECT id FROM prime99_payments WHERE reference='SECOND-99'),true,'received')`);
    expect((await db.query<{user_id:string,amount_paise:number}>('SELECT user_id,amount_paise::int FROM referral_cash_rewards')).rows).toEqual([{user_id:inviter,amount_paise:1980}]);
    expect((await db.query<{n:number}>('SELECT count(*)::int n FROM referral_invitee_rewards')).rows[0]?.n).toBe(0);
  });
  it('only administrators may approve payment', async () => {
    await db.exec(`SELECT set_config('test.user','${unpaid}',false)`);
    await expect(db.exec("SELECT review_prime99((SELECT id FROM prime99_payments LIMIT 1),true,'')")).rejects.toThrow('ADMIN_ONLY');
    await db.exec(`SELECT set_config('test.user','${admin}',false)`);
  });
  it('keeps unpaid genuine joins in state totals', async () => {
    const result=await db.query<{board:{totals:{TG:number,AP:number}}}>('SELECT public_referral_vip_board() board');
    expect(result.rows[0]?.board.totals).toEqual({TG:1,AP:1});
  });
  it('published service photo needs separate competition consent', async () => {
    const read=async()=> (await db.query<{board:{rows:{photo_path:string}[]}}>('SELECT public_referral_vip_board() board')).rows[0]?.board.rows[0]?.photo_path;
    expect(await read()).toBe('');
    await db.exec(`UPDATE referral_board_consent SET photo_consent=true WHERE user_id='${inviter}'`);
    expect(await read()).toBe(`${inviter}/photo.jpg`);
    await db.exec(`UPDATE service_profiles SET published=false WHERE user_id='${inviter}'`);
    expect(await read()).toBe('');
  });
  it('allows exactly three posts and deletion cannot restore usage', async () => {
    await db.exec(`INSERT INTO posts(user_id) VALUES('${unpaid}'),('${unpaid}'),('${unpaid}')`);
    expect((await db.query<{n:number}>(`SELECT count(*)::int n FROM monthly_post_usage WHERE user_id='${unpaid}'`)).rows[0]?.n).toBe(3);
    await db.exec(`DELETE FROM posts WHERE user_id='${unpaid}'`);
    await expect(db.exec(`INSERT INTO posts(user_id) VALUES('${unpaid}')`)).rejects.toThrow('MONTHLY_THREE_POST_LIMIT');
  });
  it('expired paid eligibility disables notices at the boundary', async () => {
    await db.exec(`UPDATE prime99_payments SET ends_at=now() WHERE user_id='${inviter}'`);
    expect((await db.query<{ok:boolean}>(`SELECT has_prime99('${inviter}') ok`)).rows[0]?.ok).toBe(false);
  });
  it('daily competition notice is at most one per eligible user and day', async () => {
    await db.exec(`SELECT dispatch_daily_referral_board(); SELECT dispatch_daily_referral_board()`);
    expect((await db.query<{n:number}>(`SELECT count(*)::int n FROM daily_referral_board_notices WHERE user_id='${joined}'`)).rows[0]?.n).toBe(1);
    expect((await db.query<{n:number}>(`SELECT count(*)::int n FROM daily_referral_board_notices WHERE user_id='${unpaid}'`)).rows[0]?.n).toBe(0);
  });
});