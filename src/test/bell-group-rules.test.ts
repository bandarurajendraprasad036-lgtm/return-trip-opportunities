import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, it, expect } from 'vitest';
let db: PGlite;
const owner = '11111111-1111-4111-8111-111111111111';
let group: string;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE SCHEMA auth; CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.user',true),'')::uuid $$;
  CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
  CREATE TABLE profiles(id uuid PRIMARY KEY); CREATE TABLE posts(id uuid,user_id uuid);
  CREATE TABLE free_work_entries(id uuid,user_id uuid); CREATE TABLE service_profiles(user_id uuid,published boolean);
  CREATE TABLE free_work_interests(id uuid,source text,entry_id text,section text,user_id uuid);
  CREATE TABLE post_bell_interests(post_id uuid,section text,user_id uuid);
  CREATE TABLE vehicle_bell_demands(post_id uuid,category text,user_id uuid);
  INSERT INTO profiles SELECT ('11111111-1111-4111-8111-'||lpad(n::text,12,'0'))::uuid FROM generate_series(1,7) n;
  INSERT INTO profiles VALUES('${owner}'); SELECT set_config('test.user','${owner}',false);`);
  await db.exec(readFileSync('drizzle/migrations/0128_dashboard_private_five_person_groups.sql','utf8'));
  await db.exec(readFileSync('drizzle/migrations/0129_disable_group_booking_information_only.sql','utf8'));
  const result = await db.query<{id:string}>(`SELECT add_bell_group_member('${owner}','11111111-1111-4111-8111-000000000001','post:test','work-wanted') id`);
  group = String(result.rows[0]?.id);
},30000);
afterAll(async () => { await db.close(); });
it('caps each group at five including the owner', async () => {
  for (let n=2;n<=6;n++) await db.query(`SELECT add_bell_group_member($1,$2,'post:test','work-wanted')`,[owner,`11111111-1111-4111-8111-${String(n).padStart(12,'0')}`]);
  const counts = await db.query<{n:number}>(`SELECT count(*)::int n FROM bell_group_members GROUP BY group_id ORDER BY n DESC`);
  expect(counts.rows.map(r=>r.n)).toEqual([5,3]);
  expect((await db.query<{n:number}>(`SELECT count(*)::int n FROM bell_group_members WHERE group_id=$1 AND user_id=$2`,[group,owner])).rows[0]?.n).toBe(1);
});
it('sets exactly three days and closes reads/writes after expiry',async()=>{
  expect((await db.query<{days:number}>(`SELECT (extract(epoch FROM expires_at-created_at)/86400)::float8 days FROM bell_groups WHERE id=$1`,[group])).rows[0]?.days).toBe(3);
  await db.query(`UPDATE bell_groups SET expires_at=now()-interval '1 second' WHERE id=$1`,[group]);
  expect((await db.query<{ok:boolean}>(`SELECT in_bell_group($1) ok`,[group])).rows[0]?.ok).toBe(false);
  await expect(db.query(`SELECT send_bell_group_message($1,'నమస్కారం')`,[group])).rejects.toThrow('GROUP_CLOSED');
  await db.query(`UPDATE bell_groups SET expires_at=now()+interval '3 days' WHERE id=$1`,[group]);
});
it('blocks ten-digit phone messages including spaced Telugu digits',async()=>{
  for(const body of ['9876543210','౯౮౭ ౬౫౪ ౩౨౧౦','nine eight seven six five four three two one zero']) await expect(db.query(`SELECT send_bell_group_message($1,$2)`,[group,body])).rejects.toThrow('PHONE_SHARING_BLOCKED');
  expect((await db.query(`SELECT send_bell_group_message($1,'సమాచారం కావాలి')`,[group])).rows).toHaveLength(1);
});
it('never permits booking creation or confirmation',async()=>{
  await expect(db.query(`SELECT request_bell_group_booking($1)`,[group])).rejects.toThrow('INFORMATION_ONLY_NO_BOOKING');
  await expect(db.query(`SELECT review_bell_group_booking($1,true)`,[group])).rejects.toThrow('INFORMATION_ONLY_NO_BOOKING');
  expect((await db.query<{n:number}>(`SELECT count(*)::int n FROM bell_group_bookings`)).rows[0]?.n).toBe(0);
});
it('denies nonmembers access and removes expired messages',async()=>{
  await db.exec(`SELECT set_config('test.user','11111111-1111-4111-8111-000000000007',false)`);
  expect((await db.query(`SELECT * FROM my_bell_groups()`)).rows).toEqual([]);
  await expect(db.query(`SELECT send_bell_group_message($1,'అనుమతి లేదు')`,[group])).rejects.toThrow('GROUP_CLOSED');
  await db.query(`UPDATE bell_groups SET expires_at=now()-interval '1 second' WHERE id=$1`,[group]);
  await db.exec(`SELECT cleanup_expired_bell_groups()`);
  expect((await db.query<{n:number}>(`SELECT count(*)::int n FROM bell_group_messages WHERE group_id=$1`,[group])).rows[0]?.n).toBe(0);
});