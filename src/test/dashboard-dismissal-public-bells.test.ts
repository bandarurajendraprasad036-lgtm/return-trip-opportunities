import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, expect, it } from 'vitest';

const owner = '11111111-1111-4111-8111-111111111111';
const ringer = '22222222-2222-4222-8222-222222222222';
const outsider = '33333333-3333-4333-8333-333333333333';
const post = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const bell = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const message = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
let db: PGlite;
async function asUser(id: string) { await db.exec(`RESET ROLE; SELECT set_config('test.user','${id}',false); SET ROLE authenticated;`); }
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth; CREATE SCHEMA storage;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.user',true),'')::uuid $$;
    CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
    CREATE FUNCTION has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$ SELECT coalesce(current_setting('test.admin',true)='yes',false) $$;
    CREATE TABLE profiles(id uuid PRIMARY KEY,full_name text,phone text,photo_path text,public_photo text,hide_name boolean DEFAULT false,hide_phone boolean DEFAULT false,hide_photo boolean DEFAULT false);
    CREATE TABLE posts(id uuid,user_id uuid,status text,service_type text,kind text);
    CREATE FUNCTION post_listing_visible(posts) RETURNS boolean LANGUAGE sql AS $$ SELECT $1.status='active' $$;
    CREATE TABLE messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),sender_id uuid,receiver_id uuid,body text,post_id uuid);
    GRANT SELECT,INSERT ON messages TO authenticated;
    ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    CREATE POLICY participant ON messages FOR SELECT TO authenticated USING(auth.uid() IN(sender_id,receiver_id));
    CREATE TABLE free_work_interests(id uuid,source text,entry_id text,user_id uuid,section text,area text,category text);
    CREATE TABLE free_work_entries(id uuid,user_id uuid);
    CREATE TABLE post_bell_interests(id uuid,post_id uuid,user_id uuid,section text,area text,need text);
    CREATE TABLE vehicle_bell_demands(id uuid,post_id uuid,user_id uuid,category text,from_place text,to_place text,vehicle_type text);
    CREATE TABLE vehicle_demand_chat_pairs(demand_id uuid,owner_id uuid,member_id uuid,board_rang_at timestamptz);
    CREATE TABLE storage.objects(bucket_id text,name text); ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    CREATE FUNCTION my_incoming_bells(_section text,_post uuid DEFAULT NULL) RETURNS TABLE(id uuid,source text,post_id uuid,area text,need text) LANGUAGE sql AS $$ SELECT NULL::uuid,''::text,NULL::uuid,''::text,''::text WHERE false $$;
    INSERT INTO profiles VALUES('${owner}','Owner','9876543210','','',false,false,false),('${ringer}','Ringer','9876543211','${ringer}/photo.jpg','',false,false,false),('${outsider}','Other','9876543212','','',false,false,false);
    INSERT INTO posts VALUES('${post}','${owner}','active','','employer');
    INSERT INTO post_bell_interests VALUES('${bell}','${post}','${ringer}','work-offered','Village','Plumber');
    INSERT INTO messages VALUES('${message}','${ringer}','${owner}','Hello',NULL);
    GRANT USAGE ON SCHEMA auth TO authenticated,anon;`);
  await db.exec(readFileSync('drizzle/migrations/0140_consented_post_bells_and_private_dismissal.sql','utf8'));
  await db.exec(readFileSync('drizzle/migrations/0141_dismissed_bells_owner_read_filter.sql','utf8'));
  await db.exec(`CREATE FUNCTION my_incoming_bell_contacts(_section text) RETURNS TABLE(id uuid,source text) LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$ SELECT b.id,b.source FROM my_incoming_bells(_section) b $$;`);
  await db.exec(`ALTER TABLE free_work_interests ADD COLUMN created_at timestamptz;
    ALTER TABLE post_bell_interests ADD COLUMN created_at timestamptz;
    ALTER TABLE vehicle_bell_demands ADD COLUMN rang_at timestamptz;
    UPDATE post_bell_interests SET created_at='2026-11-21T20:00:00Z' WHERE id='${bell}';`);
  await db.exec(readFileSync('drizzle/migrations/0142_visible_bell_actual_times.sql','utf8'));
}, 30000);
afterAll(async () => { await db.close(); });

it('public bell identities require explicit ringer consent', async () => {
  await asUser(outsider);
  expect((await db.query('SELECT * FROM list_post_bell_contacts($1)', [post])).rows).toEqual([]);
  expect((await db.query('SELECT * FROM incoming_bell_times($1,$2)', ['work-offered', post])).rows).toEqual([]);
  await db.exec(`RESET ROLE; UPDATE profiles SET public_bell_consent=true WHERE id='${ringer}';`);
  await asUser(outsider);
  expect((await db.query('SELECT full_name,phone,can_delete FROM list_post_bell_contacts($1)',[post])).rows).toEqual([{full_name:'Ringer',phone:'9876543211',can_delete:false}]);
  expect((await db.query('SELECT rang_at::text FROM incoming_bell_times($1,$2)', ['work-offered',post])).rows).toEqual([{rang_at:'2026-11-21 20:00:00+00'}]);
});
it('guests can see consented contacts but cannot see hidden or expired post records', async () => {
  await db.exec("RESET ROLE; SELECT set_config('test.user','',false); SET ROLE anon;");
  expect((await db.query('SELECT full_name FROM list_post_bell_contacts($1)',[post])).rows).toEqual([{full_name:'Ringer'}]);
  await db.exec(`RESET ROLE; UPDATE posts SET status='expired' WHERE id='${post}'; SET ROLE anon;`);
  expect((await db.query('SELECT * FROM list_post_bell_contacts($1)',[post])).rows).toEqual([]);
  await db.exec(`RESET ROLE; UPDATE posts SET status='active' WHERE id='${post}';`);
});
it('hide choices apply publicly but never hide identity from admin', async () => {
  await db.exec(`RESET ROLE; UPDATE profiles SET hide_name=true,hide_phone=true,hide_photo=true WHERE id='${ringer}';`);
  await asUser(outsider);
  expect((await db.query('SELECT full_name,phone,photo FROM list_post_bell_contacts($1)',[post])).rows).toEqual([{full_name:'',phone:'',photo:''}]);
  await db.exec("SELECT set_config('test.admin','yes',false)");
  expect((await db.query<{full_name:string}>('SELECT full_name FROM list_post_bell_contacts($1)',[post])).rows[0]?.full_name).toBe('Ringer');
  await db.exec("SELECT set_config('test.admin','no',false)");
});
it('private photos cannot be signed after photo hiding or consent withdrawal', async () => {
  expect((await db.query<{ok:boolean}>('SELECT public_bell_photo_allowed($1) ok',[`${ringer}/photo.jpg`])).rows[0]?.ok).toBe(false);
  await db.exec(`RESET ROLE; UPDATE profiles SET hide_name=false,hide_phone=false,hide_photo=false WHERE id='${ringer}';`);
  expect((await db.query<{ok:boolean}>('SELECT public_bell_photo_allowed($1) ok',[`${ringer}/photo.jpg`])).rows[0]?.ok).toBe(true);
  await db.exec(`UPDATE profiles SET public_bell_consent=false WHERE id='${ringer}';`);
  expect((await db.query<{ok:boolean}>('SELECT public_bell_photo_allowed($1) ok',[`${ringer}/photo.jpg`])).rows[0]?.ok).toBe(false);
});
it('only owner/admin may dismiss incoming bells and dismissal persists without deleting source', async () => {
  await asUser(outsider);
  await expect(db.query('SELECT dismiss_incoming_bell($1,$2,$3,$4)',[bell,'post','work-offered',post])).rejects.toThrow('BELL_UNAVAILABLE');
  await asUser(owner);
  await db.query('SELECT dismiss_incoming_bell($1,$2,$3,$4)',[bell,'post','work-offered',post]);
  await asUser(owner);
  expect((await db.query('SELECT * FROM my_incoming_bells($1)', ['work-offered'])).rows).toEqual([]);
  expect((await db.query('SELECT * FROM list_post_bell_contacts($1)', [post])).rows).toEqual([]);
  expect((await db.query('SELECT * FROM incoming_bell_times($1,$2)', ['work-offered',post])).rows).toEqual([]);
  await db.exec('RESET ROLE');
  expect((await db.query<{n:number}>('SELECT count(*)::int n FROM post_bell_interests')).rows[0]?.n).toBe(1);
});
it('a participant can delete one received message without deleting the other participant copy', async () => {
  await asUser(outsider);
  expect((await db.query<{n:number}>('SELECT dismiss_chat_items(_message:=$1) n',[message])).rows[0]?.n).toBe(0);
  await asUser(owner);
  expect((await db.query<{n:number}>('SELECT dismiss_chat_items(_message:=$1) n',[message])).rows[0]?.n).toBe(1);
  await asUser(owner);
  expect((await db.query('SELECT * FROM messages')).rows).toEqual([]);
  await asUser(ringer);
  expect((await db.query<{id:string}>('SELECT id FROM messages')).rows).toEqual([{id:message}]);
});
it('delete all targets only the selected conversation and does not hide new messages', async () => {
  await db.exec(`RESET ROLE; INSERT INTO messages(sender_id,receiver_id,body) VALUES('${owner}','${ringer}','Second'),('${owner}','${outsider}','Separate');`);
  await asUser(owner);
  expect((await db.query<{n:number}>('SELECT dismiss_chat_items(_other:=$1,_all:=true) n',[ringer])).rows[0]?.n).toBe(1);
  expect((await db.query('SELECT body FROM messages')).rows).toEqual([{body:'Separate'}]);
  await db.exec(`RESET ROLE; INSERT INTO messages(sender_id,receiver_id,body) VALUES('${ringer}','${owner}','New');`);
  await asUser(owner);
  expect((await db.query('SELECT body FROM messages ORDER BY body')).rows).toEqual([{body:'New'},{body:'Separate'}]);
});
it('work, service and vehicle rows use their own stored times, not current time', async () => {
  const free = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const vehicle = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
  await db.exec(`RESET ROLE; UPDATE profiles SET public_bell_consent=true WHERE id='${ringer}';
    INSERT INTO free_work_interests(id,entry_id,source,user_id,section,area,category,created_at) VALUES('${free}','${post}','post','${ringer}','service-providers','Village','Electrician','2026-11-20T01:00:00Z');
    INSERT INTO vehicle_bell_demands VALUES('${vehicle}','${post}','${ringer}','returns','A','B','Lorry','2026-11-19T02:00:00Z');
    INSERT INTO vehicle_demand_chat_pairs VALUES('${vehicle}','${owner}','${ringer}','2026-11-18T03:00:00Z');`);
  await asUser(outsider);
  expect((await db.query('SELECT source,rang_at::text FROM incoming_bell_times($1,$2) ORDER BY source',['returns',post])).rows).toEqual([
    {source:'free',rang_at:'2026-11-20 01:00:00+00'}, {source:'post',rang_at:'2026-11-21 20:00:00+00'}, {source:'vehicle',rang_at:'2026-11-19 02:00:00+00'}
  ]);
  await asUser(owner);
  expect((await db.query('SELECT source,rang_at::text FROM incoming_bell_times($1) ORDER BY source',['returns'])).rows).toEqual([
    {source:'board',rang_at:'2026-11-18 03:00:00+00'}, {source:'vehicle',rang_at:'2026-11-19 02:00:00+00'}
  ]);
  await asUser(outsider);
  expect((await db.query('SELECT * FROM incoming_bell_times($1)', ['returns'])).rows).toEqual([]);
});