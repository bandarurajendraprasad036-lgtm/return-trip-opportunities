import { expect, it } from 'vitest';
import { screenNoticeAllowed } from '@/lib/screen-notice-rules';

it('paid chat and bell access cannot bypass a rejected 20% radius notice', () => {
  expect(screenNoticeAllowed(true, false, true)).toBe(false);
});
it('an eligible stored notice remains available without a separate paid flag', () => {
  expect(screenNoticeAllowed(true, true, false)).toBe(true);
});