import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, beforeEach, afterAll, expect, it } from 'vitest';

const member = '11111111-1111-4111-8111-111111111111';
const owner = '22222222-2222-4222-8222-222222222222';
const job = '33333333-3333-4333-8333-333333333333';
const vehicle = '44444444-4444-4444-8444-444444444444';
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE SCHEMA auth; CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT '${member}'::uuid $$;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$ SELECT 'authenticated' $$;
    CREATE TABLE state(paid boolean,admin boolean); INSERT INTO state VALUES(false,false);
    CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
    CREATE FUNCTION has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$ SELECT admin FROM state $$;
    CREATE FUNCTION profile_ready_for_actions(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
    CREATE FUNCTION vehicle_contact_access(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT paid OR admin FROM state $$;
    CREATE FUNCTION support_admin_id() RETURNS uuid LANGUAGE sql AS $$ SELECT NULL::uuid $$;
    CREATE FUNCTION incoming_bell_reply_allowed(uuid,uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
    CREATE TABLE posts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,module text,title text,description text,skill text,location text,goods_type text,from_place text,to_place text,service_type text,public_brand text);
    CREATE FUNCTION post_listing_visible(posts) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
    CREATE TABLE directed_bell_usage(sender_id uuid,recipient_id uuid,rings integer DEFAULT 0, UNIQUE(sender_id,recipient_id));
    CREATE TABLE free_work_pairs(member_id uuid,owner_id uuid);
    CREATE FUNCTION free_work_chat(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT EXISTS(SELECT 1 FROM free_work_pairs WHERE member_id=auth.uid() AND owner_id=$1) $$;
    CREATE TABLE post_chat_pairs(post_id uuid,member_id uuid,owner_id uuid);
    CREATE TABLE post_bell_interests(id uuid,post_id uuid,user_id uuid);
    CREATE TABLE vehicle_demand_chat_pairs(member_id uuid,owner_id uuid,board_rang_at timestamptz);
    CREATE TABLE service_request_pairs(member_id uuid,owner_id uuid);
    CREATE TABLE service_chat_pairs(member_id uuid,owner_id uuid);
    CREATE TABLE bell_board_chat_pairs(interest_id uuid,member_id uuid,owner_id uuid);
    CREATE TABLE service_requests(id uuid);
    CREATE TABLE free_work_notice_queue(user_id uuid,notification_id uuid);
    CREATE FUNCTION paid_alert_ready(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
    CREATE FUNCTION has_paid_bell(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT paid FROM state $$;
    CREATE FUNCTION bell_route_within_radius(uuid,uuid,uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
    CREATE TABLE messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),sender_id uuid,receiver_id uuid,body text,is_auto boolean DEFAULT false,app_call_id uuid);
    CREATE TABLE notifications(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,message text,post_id uuid,matched_post_id uuid,vehicle_bell boolean DEFAULT false,bell_demand uuid,bell_actor uuid,is_read boolean DEFAULT false);
    CREATE FUNCTION consume_directed_bell(_target uuid,_vehicle boolean) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF _vehicle AND NOT vehicle_contact_access(auth.uid()) THEN RAISE EXCEPTION 'SUBSCRIPTION_REQUIRED'; END IF; INSERT INTO directed_bell_usage VALUES(auth.uid(),_target,1) ON CONFLICT(sender_id,recipient_id) DO UPDATE SET rings=directed_bell_usage.rings+1; END $$;
    CREATE FUNCTION ring_post(_post uuid) RETURNS uuid LANGUAGE plpgsql AS $$ DECLARE p posts; BEGIN SELECT * INTO p FROM posts WHERE id=_post; PERFORM consume_directed_bell(p.user_id,p.module='vehicle'); INSERT INTO post_chat_pairs VALUES(p.id,auth.uid(),p.user_id); RETURN p.user_id; END $$;
    INSERT INTO posts(id,user_id,module) VALUES('${job}','${owner}','job'),('${vehicle}','${owner}','vehicle');`);
  await db.exec(readFileSync('drizzle/migrations/0157_explicit_chat_bells_and_reliable_post_checks.sql','utf8'));
  await db.exec(readFileSync('drizzle/migrations/0158_private_incoming_chat_push_notices.sql','utf8'));
  await db.exec('CREATE TRIGGER words BEFORE INSERT ON posts FOR EACH ROW EXECUTE FUNCTION guard_bad_words();');
});
beforeEach(async () => {
  await db.exec(`DELETE FROM messages; DELETE FROM notifications; DELETE FROM directed_bell_usage; DELETE FROM post_chat_pairs; DELETE FROM free_work_pairs; DELETE FROM vehicle_demand_chat_pairs; UPDATE state SET paid=false,admin=false;`);
});
afterAll(async () => { await db.close(); });
async function allowed(post: string | null = null) {
  return (await db.query<{ok:boolean}>(`SELECT can_post_chat(${post ? `'${post}'` : 'NULL'},'${owner}') ok`)).rows[0]?.ok;
}
it('an opened work pair cannot type until its explicit bell, then free chat unlocks', async () => {
  await db.exec(`INSERT INTO free_work_pairs VALUES('${member}','${owner}')`);
  expect(await allowed()).toBe(false);
  await db.query(`SELECT ring_chat('${owner}')`);
  expect(await allowed()).toBe(true);
});
it('an opened vehicle pair stays locked before ringing even with payment', async () => {
  await db.exec(`UPDATE state SET paid=true; INSERT INTO vehicle_demand_chat_pairs VALUES('${member}','${owner}',NULL)`);
  expect(await allowed()).toBe(false);
  await db.query(`SELECT ring_chat('${owner}')`);
  expect(await allowed()).toBe(true);
});
it('an unpaid vehicle cannot unlock via the chat bell', async () => {
  await db.exec(`INSERT INTO vehicle_demand_chat_pairs VALUES('${member}','${owner}',NULL)`);
  await expect(db.query(`SELECT ring_chat('${owner}')`)).rejects.toThrow('SUBSCRIPTION_REQUIRED');
  expect(await allowed()).toBe(false);
});
it('a job listing bell unlocks its exact private post chat free', async () => {
  expect(await allowed(job)).toBe(false);
  await db.query(`SELECT ring_chat('${owner}','${job}')`);
  expect(await allowed(job)).toBe(true);
});
it('a stranger without a valid pair cannot use the chat bell', async () => {
  await expect(db.query(`SELECT ring_chat('${owner}')`)).rejects.toThrow('CHAT_PAIR_REQUIRED');
});
it('a new private message saves one generic recipient notice with no message body', async () => {
  await db.exec(`INSERT INTO messages(sender_id,receiver_id,body) VALUES('${member}','${owner}','private example text')`);
  const notices = (await db.query<{user_id:string;message:string;chat_message_id:string}>('SELECT user_id,message,chat_message_id FROM notifications')).rows;
  expect(notices).toHaveLength(1);
  expect(notices[0]?.user_id).toBe(owner);
  expect(notices[0]?.message).not.toContain('private example text');
  expect(notices[0]?.chat_message_id).toBeTruthy();
});
it('automatic greetings and call events do not duplicate ordinary chat notices', async () => {
  await db.exec(`INSERT INTO messages(sender_id,receiver_id,body,is_auto) VALUES('${member}','${owner}','greeting',true)`);
  expect((await db.query('SELECT * FROM notifications')).rows).toHaveLength(0);
});
it('clients cannot forge a chat-linked notice', async () => {
  await expect(db.query(`INSERT INTO notifications(user_id,message,chat_message_id) VALUES('${owner}','fake','${job}')`)).rejects.toThrow('CHAT_NOTICE_PROTECTED');
});
it('valid work, goods and vehicle words pass database checks without AI', async () => {
  for (const text of ['Electrician in Chennur','Rice bags Chittoor','Scunthorpe transport']) {
    expect((await db.query<{blocked:boolean}>('SELECT post_text_prohibited($1) blocked',[text])).rows[0]?.blocked).toBe(false);
  }
  await db.exec(`INSERT INTO posts(title) VALUES('Electrician in Chennur'),('Rice bags Chittoor'),('Scunthorpe transport')`);
});
it('database checks still reject confirmed abusive post words', async () => {
  await expect(db.query(`INSERT INTO posts(title) VALUES('driver asshole')`)).rejects.toThrow('BAD_CONTENT');
});