import { describe, it, expect } from 'vitest';
import { boardSize, cashPrizePaise, vipShortfall } from '@/lib/referral-vip';
describe('new direct referral rules', () => {
  it('awards exactly twenty percent of a confirmed amount', () => { expect(cashPrizePaise(100000)).toBe(20000); });
  it('grants top one hundred eligibility only', () => { expect(vipShortfall(5, 100, 101, 5)).toBe(0); expect(vipShortfall(5, 101, 101, 5)).toBe(1); });
  it('computes real shortfalls instead of example counts', () => { expect(vipShortfall(7, 110, 110, 10)).toBe(4); });
  it('expands ten to twenty five after fifteen days', () => { expect(boardSize(new Date('2026-11-11'), new Date('2026-11-25'))).toBe(10); expect(boardSize(new Date('2026-11-11'), new Date('2026-11-26'))).toBe(25); });
  it('expands to fifty after another fifteen days', () => { expect(boardSize(new Date('2026-11-11'), new Date('2026-12-11'))).toBe(50); });
});