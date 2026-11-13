import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { categoryInput, categoryNames, CATEGORY_SECTIONS } from '@/lib/discovery-categories';
let db: PGlite;
const user = '11111111-1111-4111-8111-111111111111';
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;`);
  for (const file of ['0068_shared_moderated_discovery_categories', '0069_restrict_shared_category_column_access']) await db.exec(readFileSync(`drizzle/migrations/${file}.sql`, 'utf8'));
}, 30000);
afterAll(async () => { await db.close(); });
it('supports all seven requested sections and trims category names', () => {
  for (const section of CATEGORY_SECTIONS) expect(categoryInput.parse({ section, name: ' వెల్డింగ్ ' })).toEqual({ section, name: 'వెల్డింగ్' });
  expect(CATEGORY_SECTIONS).toHaveLength(7);
  expect(categoryInput.safeParse({ section: 'goods', name: 'a' }).success).toBe(false);
  expect(categoryInput.safeParse({ section: 'goods', name: 'a'.repeat(41) }).success).toBe(false);
});
it('keeps categories permanent, public and section-specific without creator identity', async () => {
  await db.query(`SELECT add_discovery_category('goods','వెల్డింగ్','${user}')`);
  await db.exec('SET ROLE anon');
  expect((await db.query(`SELECT name FROM discovery_categories WHERE section='goods'`)).rows).toEqual([{ name: 'వెల్డింగ్' }]);
  expect((await db.query(`SELECT name FROM discovery_categories WHERE section='cars'`)).rows).toEqual([]);
  await expect(db.query('SELECT created_by FROM discovery_categories')).rejects.toThrow('permission denied');
  await db.exec('RESET ROLE');
});
it('reuses a category for another user without duplicating it', async () => {
  const a = await db.query(`SELECT add_discovery_category('work-wanted',' Welding ','${user}') id`);
  const b = await db.query(`SELECT add_discovery_category('work-wanted','welding','22222222-2222-4222-8222-222222222222') id`);
  expect(a.rows).toEqual(b.rows);
  expect(categoryNames(['Welding'], [{ name: ' welding ' }, { name: 'Driver' }])).toEqual(['Welding', 'Driver']);
});
it('blocks abusive and explicit terror-promotion categories', async () => {
  await expect(db.query(`SELECT add_discovery_category('cars','asshole','${user}')`)).rejects.toThrow('BAD_CONTENT');
  await expect(db.query(`SELECT add_discovery_category('cars','join isis','${user}')`)).rejects.toThrow('BAD_CONTENT');
  expect((await db.query(`SELECT name FROM discovery_categories WHERE section='cars'`)).rows).toEqual([]);
});
it('prevents unmoderated browser inserts and moderation RPC bypass', async () => {
  await db.exec('SET ROLE authenticated');
  await expect(db.query(`SELECT add_discovery_category('cars','Car','${user}')`)).rejects.toThrow('permission denied');
  await expect(db.query(`INSERT INTO discovery_categories(section,name,created_by) VALUES('cars','Car','${user}')`)).rejects.toThrow('permission denied');
  await db.exec('RESET ROLE');
});