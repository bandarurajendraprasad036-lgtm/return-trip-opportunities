import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, expect, it } from 'vitest';
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec('CREATE TABLE membership_requests(amount integer, vehicle_plan_months integer);');
  await db.exec(readFileSync('drizzle/migrations/0164_allow_both_current_screenshot_package_amounts.sql', 'utf8'));
  await db.exec('CREATE TRIGGER mark_new_vehicle_plan BEFORE INSERT ON membership_requests FOR EACH ROW EXECUTE FUNCTION mark_new_vehicle_plan();');
}, 30000);
afterAll(async () => { await db.close(); });
it('new ₹100 screenshot receipts store three months', async () => {
  expect((await db.query('INSERT INTO membership_requests VALUES (100,1) RETURNING amount,vehicle_plan_months')).rows).toEqual([{ amount: 100, vehicle_plan_months: 3 }]);
});
it('new ₹349 screenshot receipts are not rejected by the old ₹100 trigger', async () => {
  expect((await db.query('INSERT INTO membership_requests VALUES (349,1) RETURNING amount,vehicle_plan_months')).rows).toEqual([{ amount: 349, vehicle_plan_months: 3 }]);
});
it('new ₹80 receipts remain retired', async () => {
  await expect(db.query('INSERT INTO membership_requests VALUES (80,3)')).rejects.toThrow('RETIRED_PAYMENT_PLAN');
});