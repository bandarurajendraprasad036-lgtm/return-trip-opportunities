import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, expect, it } from 'vitest';

const owner = '11111111-1111-4111-8111-111111111111';
const viewer = '22222222-2222-4222-8222-222222222222';
const a = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const b = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const hidden = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const battle = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const post = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
let db: PGlite;
async function as(id: string) { await db.exec(`RESET ROLE; SELECT set_config('test.user','${id}',false); SET ROLE authenticated;`); }
async function anon() { await db.exec(`RESET ROLE; SELECT set_config('test.user','',false); SET ROLE anon;`); }
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth; CREATE SCHEMA storage;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.user',true),'')::uuid $$;
    CREATE TYPE public.app_role AS ENUM('admin','user');
    CREATE FUNCTION public.has_role(uuid,app_role) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
    CREATE FUNCTION public.account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT $1 IS NOT NULL $$;
    CREATE TABLE public.posts(id uuid PRIMARY KEY,status text,user_id uuid DEFAULT '${owner}'); ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
    CREATE POLICY post_read ON posts FOR SELECT USING(status='active'); GRANT SELECT ON posts TO anon,authenticated;
    CREATE FUNCTION public.post_listing_visible(posts) RETURNS boolean LANGUAGE sql AS $$ SELECT $1.status='active' $$;
    CREATE TABLE storage.objects(bucket_id text,name text,owner_id text); ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql AS $$ SELECT string_to_array($1,'/') $$;
    GRANT USAGE ON SCHEMA auth,storage TO anon,authenticated; GRANT SELECT,INSERT,DELETE ON storage.objects TO anon,authenticated;`);
  await db.exec(readFileSync('drizzle/migrations/0150_reels_battles_comments_likes.sql', 'utf8'));
  await db.exec(readFileSync('drizzle/migrations/0151_social_target_visibility_without_private_post_reads.sql', 'utf8'));
  await db.exec(readFileSync('drizzle/migrations/0152_social_content_guards.sql', 'utf8'));
  // Existing posts intentionally have only column grants; policies must not require SELECT *.
  await db.exec('REVOKE SELECT ON posts FROM anon,authenticated; GRANT SELECT(id,status) ON posts TO anon,authenticated;');
  await db.exec(`INSERT INTO posts(id,status) VALUES('${post}','active');
    INSERT INTO reels(id,user_id,caption,video_path,published) VALUES
    ('${a}','${owner}','First','${owner}/${a}.mp4',true),('${b}','${owner}','Second','${owner}/${b}.mp4',true),('${hidden}','${owner}','Private','${owner}/${hidden}.mp4',false);
    INSERT INTO reels_battle(id,user_id,title,reel_a,reel_b,ends_at) VALUES('${battle}','${owner}','Test','${a}','${b}',now()+interval '1 day');`);
}, 30000);
afterAll(async () => { await db.close(); });

it('guests see only published reels and cannot post', async () => {
  await anon();
  expect((await db.query('SELECT id FROM reels')).rows).toHaveLength(2);
  await expect(db.exec(`INSERT INTO reels(user_id,video_path) VALUES('${viewer}','${viewer}/${a}.mp4')`)).rejects.toThrow();
});
it('a member cannot forge the uploader or remove another member video', async () => {
  await as(viewer);
  await expect(db.exec(`INSERT INTO reels(user_id,video_path) VALUES('${owner}','${owner}/${a}.mp4')`)).rejects.toThrow();
  expect((await db.query(`DELETE FROM reels WHERE id='${a}' RETURNING id`)).rows).toHaveLength(0);
});
it('battle creation requires two different published owner videos', async () => {
  await as(viewer);
  await expect(db.exec(`INSERT INTO reels_battle(title,reel_a,reel_b,ends_at) VALUES('Forged','${a}','${b}',now()+interval '1 day')`)).rejects.toThrow();
  await as(owner);
  await expect(db.exec(`INSERT INTO reels_battle(title,reel_a,reel_b,ends_at) VALUES('Same','${a}','${a}',now()+interval '1 day')`)).rejects.toThrow();
  await expect(db.exec(`INSERT INTO reels_battle(title,reel_a,reel_b,ends_at) VALUES('Private','${a}','${hidden}',now()+interval '1 day')`)).rejects.toThrow();
});
it('one member can vote exactly once and voter identities remain private', async () => {
  await as(viewer);
  await db.exec(`INSERT INTO reel_battle_votes(battle_id,reel_id) VALUES('${battle}','${a}')`);
  await expect(db.exec(`INSERT INTO reel_battle_votes(battle_id,reel_id) VALUES('${battle}','${b}')`)).rejects.toThrow();
  await as(owner);
  expect((await db.query('SELECT * FROM reel_battle_votes')).rows).toHaveLength(0);
  await anon();
  const results = (await db.query<{ reel_id: string; votes: number }>(`SELECT * FROM reel_battle_results('${battle}')`)).rows;
  expect(Number(results.find(row => row.reel_id === a)?.votes)).toBe(1);
  await expect(db.query('SELECT * FROM reel_battle_votes')).rejects.toThrow();
});
it('votes reject an unrelated video and a closed battle', async () => {
  await as(owner);
  await expect(db.exec(`INSERT INTO reel_battle_votes(battle_id,reel_id) VALUES('${battle}','${hidden}')`)).rejects.toThrow();
  await db.exec(`RESET ROLE; UPDATE reels_battle SET ends_at=now()-interval '1 second' WHERE id='${battle}';`);
  await as(owner);
  await expect(db.exec(`INSERT INTO reel_battle_votes(battle_id,reel_id) VALUES('${battle}','${b}')`)).rejects.toThrow();
});
it('comments work for posts and reels but reject private targets and forged authors', async () => {
  await as(viewer);
  await db.exec(`INSERT INTO comments(post_id,body) VALUES('${post}','Post comment'); INSERT INTO comments(reel_id,body) VALUES('${a}','Reel comment');`);
  await expect(db.exec(`INSERT INTO comments(reel_id,body) VALUES('${hidden}','Private')`)).rejects.toThrow();
  await expect(db.exec(`INSERT INTO comments(user_id,reel_id,body) VALUES('${owner}','${a}','Forged')`)).rejects.toThrow();
  await as(owner);
  expect((await db.query(`DELETE FROM comments WHERE user_id='${viewer}' RETURNING id`)).rows).toHaveLength(0);
  await as(viewer);
  expect((await db.query(`DELETE FROM comments WHERE user_id='${viewer}' RETURNING id`)).rows).toHaveLength(2);
});
it('likes are unique, private, counted publicly and removable only by the liker', async () => {
  await as(viewer);
  await db.exec(`INSERT INTO likes(reel_id) VALUES('${a}'); INSERT INTO likes(post_id) VALUES('${post}');`);
  await expect(db.exec(`INSERT INTO likes(reel_id) VALUES('${a}')`)).rejects.toThrow();
  await as(owner);
  expect((await db.query('DELETE FROM likes RETURNING id')).rows).toHaveLength(0);
  await anon();
  expect(Number((await db.query<{ n: number }>(`SELECT social_like_count(NULL,'${a}') AS n`)).rows[0]?.n)).toBe(1);
  await expect(db.query('SELECT * FROM likes')).rejects.toThrow();
  await as(viewer);
  expect((await db.query('DELETE FROM likes RETURNING id')).rows).toHaveLength(2);
});
it('private storage signs published reels only, and uploads require the owner folder', async () => {
  await db.exec(`RESET ROLE; INSERT INTO storage.objects VALUES('reel-videos','${owner}/${a}.mp4','${owner}'),('reel-videos','${owner}/${hidden}.mp4','${owner}');`);
  await anon();
  expect((await db.query('SELECT name FROM storage.objects')).rows).toHaveLength(1);
  await as(viewer);
  await expect(db.exec(`INSERT INTO storage.objects VALUES('reel-videos','${owner}/${b}.mp4','${viewer}')`)).rejects.toThrow();
});
it('authors can remove their comments even after a post stops being public', async () => {
  await as(viewer);
  await db.exec(`INSERT INTO comments(post_id,body) VALUES('${post}','Owner history');`);
  await db.exec(`RESET ROLE; UPDATE posts SET status='archived' WHERE id='${post}';`);
  await anon();
  expect((await db.query('SELECT * FROM comments')).rows).toHaveLength(0);
  await as(viewer);
  expect((await db.query('DELETE FROM comments RETURNING id')).rows).toHaveLength(1);
});
it('the existing bad-word block covers reel captions', async () => {
  await as(owner);
  await expect(db.exec(`INSERT INTO reels(caption,video_path,published) VALUES('fuck','${owner}/${battle}.mp4',true)`)).rejects.toThrow('BAD_CONTENT');
});
it('the existing bad-word block covers public comments', async () => {
  await as(viewer);
  await expect(db.exec(`INSERT INTO comments(reel_id,body) VALUES('${a}','fuck')`)).rejects.toThrow('BAD_CONTENT');
});
it('the existing bad-word block covers battle titles', async () => {
  await as(owner);
  await expect(db.exec(`INSERT INTO reels_battle(title,reel_a,reel_b,ends_at) VALUES('fuck','${a}','${b}',now()+interval '1 day')`)).rejects.toThrow('BAD_CONTENT');
});