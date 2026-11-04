import { describe, expect, it } from 'vitest';
import { canRedeemPoints, freeMonthAllowed, SHARING_GROUPS } from '@/lib/reward-rules';
describe('Point 9 rewards', () => {
  it('requires 100 points for one month', () => { expect(canRedeemPoints(99)).toBe(false); expect(canRedeemPoints(100)).toBe(true); });
  it('limits consecutive free months to three', () => { expect(freeMonthAllowed(2,0)).toBe(true); expect(freeMonthAllowed(3,0)).toBe(false); });
  it('allows another free month after one month break', () => { expect(freeMonthAllowed(3,1)).toBe(true); });
  it('requires evidence for ten groups', () => { expect(SHARING_GROUPS).toBe(10); });
});