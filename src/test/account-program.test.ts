import { describe, expect, it } from 'vitest';
import { PROFILE_POINTS, SHARE_GROUPS, SHARE_IMAGES, MAX_BELL_RECIPIENTS, REFERRAL_JOINS, REFERRAL_MONTHS, trialActive, reminderDay, referralLink } from '@/lib/account-program';
describe('Final account program rules', () => {
  it('awards 265 profile points', () => expect(PROFILE_POINTS).toBe(265));
  it('requires status plus five groups, six screenshots', () => { expect(SHARE_GROUPS).toBe(5); expect(SHARE_IMAGES).toBe(6); });
  it('limits bell recipients to five', () => expect(MAX_BELL_RECIPIENTS).toBe(5));
  it('grants three months for one hundred genuine referrals', () => { expect(REFERRAL_JOINS).toBe(100); expect(REFERRAL_MONTHS).toBe(3); });
  it('ends trial exactly ten days from first completion', () => {
    const start = '2026-11-07T07:00:00Z';
    expect(trialActive(start, new Date('2026-11-17T06:59:59Z'))).toBe(true);
    expect(trialActive(start, new Date('2026-11-17T07:00:00Z'))).toBe(false);
  });
  it('permits only four local reminder days from day ten', () => {
    const start = '2026-11-07T07:00:00Z';
    expect(reminderDay(start, new Date('2026-11-16T07:00:00Z'))).toBe(false);
    for (const day of [17,18,19,20]) expect(reminderDay(start, new Date(`2026-11-${day}T07:00:00Z`))).toBe(true);
    expect(reminderDay(start, new Date('2026-11-21T07:00:00Z'))).toBe(false);
  });
  it('uses own code on the unchanged Gayatri One address', () => expect(referralLink('OWN123')).toBe('https://gayatrione.com/?ref=OWN123'));
});