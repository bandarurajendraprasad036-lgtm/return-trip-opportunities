import { describe, expect, it } from 'vitest';
import { MEMBERSHIP_AMOUNT, GROUP_MEMBERSHIP_AMOUNT, MEMBERSHIP_MONTHS, membershipAmount, paymentInput } from '@/lib/membership';
describe('Confirmed monthly membership plans', () => {
  it('charges 699 for one person', () => { expect(MEMBERSHIP_AMOUNT).toBe(699); expect(membershipAmount('individual')).toBe(699); });
  it('charges 1999 for four people', () => { expect(GROUP_MEMBERSHIP_AMOUNT).toBe(1999); expect(membershipAmount('group')).toBe(1999); });
  it('covers one month', () => { expect(MEMBERSHIP_MONTHS).toBe(1); });
  it('requires exactly three distinct additional members', () => {
    const parse = (numbers: string[]) => paymentInput.safeParse({ transaction_id: 'UTR123456', membership_type: 'group', referral_numbers: numbers }).success;
    expect(parse(['9876543210','8765432109','7654321098'])).toBe(true);
    expect(parse(['9876543210','8765432109'])).toBe(false);
    expect(parse(['9876543210','9876543210','7654321098'])).toBe(false);
    expect(parse(['9876543210','8765432109','7654321098','6543210987'])).toBe(false);
  });
});