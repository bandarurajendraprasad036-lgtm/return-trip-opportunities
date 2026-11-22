import { expect, it } from 'vitest';
import { bellDateTime, postingLimit } from '@/lib/bell-details';

it('shows the actual bell date and time in India including midnight rollover', () => {
  expect(bellDateTime('2026-11-21T20:00:00Z')).toBe('22/11/2026 · 01:30');
});
it('does not invent a time when the bell has no valid timestamp', () => {
  expect(bellDateTime(null)).toBe('');
  expect(bellDateTime('invalid')).toBe('');
});
it.each([['FREE_ONE_POST_LIMIT', 1], ['MONTHLY_POST_LIMIT_5', 5], ['MONTHLY_POST_LIMIT_10', 10]] as const)('identifies the %s sharing action without changing its quota', (message, limit) => {
  expect(postingLimit({ message })).toBe(limit);
});
it('does not offer quota sharing for unrelated failures', () => {
  expect(postingLimit({ message: 'MOBILE_REQUIRED' })).toBeNull();
});