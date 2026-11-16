import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, expect, it } from 'vitest';
let db: PGlite;
const admin = '11111111-1111-4111-8111-111111111111';
const account = '22222222-2222-4222-8222-222222222222';
let id = '';
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.user',true),'')::uuid $$;
    CREATE TABLE profiles(id uuid,phone text); INSERT INTO profiles VALUES('${account}','9876543210');
    CREATE FUNCTION has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$ SELECT $1='${admin}'::uuid $$;`);
  await db.exec(readFileSync('drizzle/migrations/0094_admin_reviewed_phone_device_entry.sql','utf8'));
}, 30000);
afterAll(async () => { await db.close(); });
it('number-only submission stays pending without linking an existing account', async () => {
  id = (await db.query<{ id: string }>(`SELECT request_phone_entry('9876543210','${'a'.repeat(64)}') AS id`)).rows[0]?.id ?? '';
  expect((await db.query('SELECT phone,status,account_id FROM phone_entry_requests')).rows).toEqual([{ phone: '9876543210', status: 'pending', account_id: null }]);
});
it('second device claiming the same phone cannot obtain an existing account', async () => {
  await db.query(`SELECT request_phone_entry('9876543210','${'b'.repeat(64)}')`);
  expect((await db.query('SELECT account_id FROM phone_entry_requests')).rows).toEqual([{account_id:null},{account_id:null}]);
});
it('ordinary accounts cannot approve entry', async () => {
  await db.exec(`SELECT set_config('test.user','${account}',false)`);
  await expect(db.query(`SELECT review_phone_entry('${id}',true)`)).rejects.toThrow('ADMIN_ONLY');
});
it('admin must explicitly match the checked phone to link a historical account', async () => {
  await db.exec(`SELECT set_config('test.user','${admin}',false)`);
  await expect(db.query(`SELECT review_phone_entry('${id}',true,'${admin}')`)).rejects.toThrow('ACCOUNT_PHONE_MISMATCH');
  await db.query(`SELECT review_phone_entry('${id}',true,'${account}')`);
  expect((await db.query(`SELECT status,account_id FROM phone_entry_requests WHERE id='${id}'`)).rows).toEqual([{ status:'approved',account_id:account }]);
});
it('anonymous callers cannot read submitted phones', async () => {
  await db.exec('SET ROLE anon');
  await expect(db.query('SELECT phone FROM phone_entry_requests')).rejects.toThrow('permission denied');
  await db.exec('RESET ROLE');
});