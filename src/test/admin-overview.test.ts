import { expect, it } from 'vitest';
import { summarizeAdminPayments, type AdminPayment } from '@/lib/admin-overview';
const people = [{ id: 'a', full_name: 'A', phone: '', location: '' }, { id: 'b', full_name: 'B', phone: '', location: '' }];
const now = new Date('2026-11-15T07:45:00Z');
const payment = (status: string, amount = 100): AdminPayment => ({ user_id: 'a', reference: 'receipt', amount, status, reviewed_at: now.toISOString(), submitted_at: now.toISOString(), source: 'evidence' });
it('₹100 paid list excludes pending and rejected evidence', () => {
  expect(summarizeAdminPayments(people, [payment('pending'), payment('rejected')], [], now).paid100).toBe(0);
  expect(summarizeAdminPayments(people, [payment('approved')], [], now).paid100).toBe(1);
  expect(summarizeAdminPayments(people, [payment('approved', 99)], [], now).paid100).toBe(0);
});
it('confirmed revenue excludes unapproved payments and counts a shared receipt once', () => {
  expect(summarizeAdminPayments(people, [payment('approved'), { ...payment('approved'), source: 'prime' }, payment('pending', 500)], [], now).revenue).toBe(100);
});
it('expired or revoked access never becomes current paid membership', () => {
  const access = { user_id: 'a', starts_at: '2026-10-01', ends_at: '2026-11-01', revoked_at: null };
  expect(summarizeAdminPayments(people, [payment('approved')], [access], now).members[0]?.active).toBe(false);
  expect(summarizeAdminPayments(people, [], [{ ...access, ends_at: '2026-12-01', revoked_at: now.toISOString() }], now).active).toBe(0);
  expect(summarizeAdminPayments(people, [], [{ ...access, ends_at: '2026-12-01' }], now).active).toBe(1);
});