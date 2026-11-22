import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, beforeEach, it, expect } from 'vitest';

const caller = '11111111-1111-4111-8111-111111111111';
const callee = '22222222-2222-4222-8222-222222222222';
const stranger = '33333333-3333-4333-8333-333333333333';
let db: PGlite;
const actor = (id: string) => db.exec(`SELECT set_config('test.user','${id}',false)`);
async function begin(video = false) {
  await actor(caller);
  const result = await db.query<{ id: string }>(`SELECT begin_app_call('${callee}',${video}) id`);
  const id = result.rows[0]?.id;
  if (!id) throw new Error('Missing call');
  return id;
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE SCHEMA auth; CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.user',true),'')::uuid $$;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$ SELECT coalesce(nullif(current_setting('test.role',true),''),'authenticated') $$;
    CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
    CREATE FUNCTION has_paid_bell(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
    CREATE FUNCTION can_post_chat(uuid,uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
    CREATE FUNCTION has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
    CREATE TABLE messages(id uuid DEFAULT gen_random_uuid(),sender_id uuid,receiver_id uuid,chat_phone text DEFAULT '',image_path text DEFAULT '',body text,post_id uuid,needs_admin boolean DEFAULT false,is_auto boolean DEFAULT false,created_at timestamptz DEFAULT now());
    CREATE TABLE notifications(id uuid DEFAULT gen_random_uuid(),user_id uuid,message text,post_id uuid,matched_post_id uuid,vehicle_bell boolean DEFAULT false,created_at timestamptz DEFAULT now());
    GRANT SELECT,INSERT ON messages TO authenticated;
    ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    CREATE POLICY private_read ON messages FOR SELECT TO authenticated USING(auth.uid() IN(sender_id,receiver_id));
    CREATE POLICY own_insert ON messages FOR INSERT TO authenticated WITH CHECK(sender_id=auth.uid());
    INSERT INTO messages(sender_id,receiver_id,body) VALUES('${caller}','${callee}','existing conversation');`);
  await db.exec(readFileSync('drizzle/migrations/0133_paid_pair_private_app_calls.sql', 'utf8'));
  await db.exec(readFileSync('drizzle/migrations/0148_private_call_chat_events.sql', 'utf8'));
  await db.exec('CREATE TRIGGER paid_guard BEFORE INSERT ON messages FOR EACH ROW EXECUTE FUNCTION enforce_paid_chat_message()');
}, 30000);
beforeEach(async () => {
  await db.exec(`RESET ROLE; DELETE FROM app_calls; DELETE FROM messages WHERE app_call_id IS NOT NULL; DELETE FROM notifications; SELECT set_config('test.role','authenticated',false),set_config('app.call_event','',false)`);
});
afterAll(async () => { await db.close(); });

it.each([false, true])('unanswered video=%s saves exactly one missed event and notice', async video => {
  const id = await begin(video);
  await db.exec(`SELECT send_app_call_signal('${id}','end'); SELECT send_app_call_signal('${id}','end')`);
  const events = await db.query<{ call_event: string; app_call_id: string }>('SELECT call_event,app_call_id FROM messages WHERE app_call_id IS NOT NULL');
  expect(events.rows).toEqual([{ call_event: 'missed', app_call_id: id }]);
  expect((await db.query<{ n: number }>(`SELECT count(*)::int n FROM notifications WHERE app_call_id='${id}' AND call_event='missed' AND user_id='${callee}'`)).rows[0]?.n).toBe(1);
});
it('answer records an answered event once and cut records ended, never missed', async () => {
  const id = await begin(true);
  await actor(callee);
  await db.exec(`SELECT send_app_call_signal('${id}','answer','{"sdp":{}}'); SELECT send_app_call_signal('${id}','answer','{"sdp":{}}'); SELECT send_app_call_signal('${id}','end')`);
  expect((await db.query<{ call_event: string }>(`SELECT call_event FROM messages WHERE app_call_id='${id}' ORDER BY created_at`)).rows.map(row => row.call_event)).toEqual(['answered', 'ended']);
  expect((await db.query<{ n: number }>(`SELECT count(*)::int n FROM notifications WHERE app_call_id='${id}' AND user_id='${caller}'`)).rows[0]?.n).toBe(2);
});
it('declining an unanswered call records missed and the actual participant who cut it', async () => {
  const id = await begin();
  await actor(callee);
  await db.exec(`SELECT send_app_call_signal('${id}','end')`);
  expect((await db.query<{ ended_by: string; call_event: string }>(`SELECT c.ended_by,m.call_event FROM app_calls c JOIN messages m ON m.app_call_id=c.id WHERE c.id='${id}'`)).rows[0]).toEqual({ ended_by: callee, call_event: 'missed' });
});
it('chat timestamp is the stored answer or end timestamp, not when the chat opens', async () => {
  const id = await begin();
  await actor(callee);
  await db.exec(`SELECT send_app_call_signal('${id}','answer'); SELECT send_app_call_signal('${id}','end')`);
  const result = await db.query<{ matched: boolean }>(`SELECT bool_and(m.created_at=CASE m.call_event WHEN 'answered' THEN c.accepted_at ELSE c.ended_at END) matched FROM messages m JOIN app_calls c ON c.id=m.app_call_id WHERE c.id='${id}'`);
  expect(result.rows[0]?.matched).toBe(true);
});
it('closed-phone timeout saves missed at the original sixty-second deadline and does not duplicate', async () => {
  const id = await begin();
  await db.exec(`UPDATE app_calls SET created_at='2026-11-22T05:00:00Z' WHERE id='${id}'; SELECT expire_app_calls(); SELECT expire_app_calls()`);
  expect((await db.query<{ at: string; call_event: string }>(`SELECT to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD HH24:MI:SS') at,call_event FROM messages WHERE app_call_id='${id}'`)).rows).toEqual([{ at: '2026-11-22 05:01:00', call_event: 'missed' }]);
});
it('one-minute recovery does not end a call already answered', async () => {
  const id = await begin();
  await actor(callee);
  await db.exec(`SELECT send_app_call_signal('${id}','answer'); UPDATE app_calls SET created_at=now()-interval '90 seconds' WHERE id='${id}'; SELECT expire_app_calls()`);
  expect((await db.query<{ ended_at: string | null }>(`SELECT ended_at FROM app_calls WHERE id='${id}'`)).rows[0]?.ended_at).toBeNull();
});
it('stranger cannot end or expire someone else’s call or read its chat events', async () => {
  const id = await begin();
  await actor(stranger);
  await expect(db.exec(`SELECT send_app_call_signal('${id}','end')`)).rejects.toThrow('CALL_PARTICIPANT_REQUIRED');
  await db.exec(`UPDATE app_calls SET created_at=now()-interval '90 seconds' WHERE id='${id}'`);
  expect((await db.query<{ n: number }>('SELECT expire_app_calls() n')).rows[0]?.n).toBe(0);
  await actor(caller);
  await db.exec(`SELECT send_app_call_signal('${id}','end')`);
  await actor(stranger);
  await db.exec('GRANT USAGE ON SCHEMA auth TO authenticated; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated; SET ROLE authenticated');
  expect((await db.query<{ n: number }>('SELECT count(*)::int n FROM messages')).rows[0]?.n).toBe(0);
});
it('ordinary participant cannot forge a missed-call message or call notice', async () => {
  const id = await begin();
  await expect(db.exec(`INSERT INTO messages(sender_id,receiver_id,body,is_auto,app_call_id,call_event) VALUES('${caller}','${callee}','fake',true,'${id}','missed')`)).rejects.toThrow('CALL_EVENT_REQUIRED');
  await expect(db.exec(`INSERT INTO notifications(user_id,message,app_call_id,call_event) VALUES('${callee}','fake','${id}','missed')`)).rejects.toThrow('CALL_EVENT_REQUIRED');
});