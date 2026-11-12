import { describe, expect, it } from 'vitest';
import { MEMBERSHIP_AMOUNT, MEMBERSHIP_DAYS, ALERT_DELAY_DAYS, EXTRA_POST_AMOUNT, DISCOUNT_AMOUNT, FREE_POSTS, validProviderContacts, competitionDisplayOpen, publicationRemaining } from '@/lib/current-membership';
describe('November twelve confirmed rules', () => {
  it('charges the full 100', () => expect(MEMBERSHIP_AMOUNT).toBe(100));
  it('lasts forty days', () => expect(MEMBERSHIP_DAYS).toBe(40));
  it('waits three days for alerts', () => expect(ALERT_DELAY_DAYS).toBe(3));
  it('charges 49 for each additional post', () => expect(EXTRA_POST_AMOUNT).toBe(49));
  it('uses the verified 49 discount', () => expect(DISCOUNT_AMOUNT).toBe(49));
  it('keeps three free posts', () => expect(FREE_POSTS).toBe(3));
  const contacts = Array.from({ length: 20 }, (_, i) => ({ town: 'Town', service: 'Plumber', mobile: String(9000000000 + i), consent: true }));
  it('requires at least twenty genuine consented distinct contacts', () => { expect(validProviderContacts(contacts)).toBe(true); expect(validProviderContacts(contacts.slice(1))).toBe(false); expect(validProviderContacts(contacts.map((r, i) => i === 0 ? { ...r, consent: false } : r))).toBe(false); expect(validProviderContacts(contacts.map(r => ({ ...r, mobile: '9000000000' })))).toBe(false); });
  it('starts next Sunday rather than this Sunday', () => { expect(competitionDisplayOpen(Date.parse('2026-11-15T23:00:00+05:30'))).toBe(false); expect(competitionDisplayOpen(Date.parse('2026-11-22T22:59:59+05:30'))).toBe(false); expect(competitionDisplayOpen(Date.parse('2026-11-22T23:00:00+05:30'))).toBe(true); });
  it('counts the five-hour delay down to zero', () => { expect(publicationRemaining('2026-11-12T05:00:00Z', Date.parse('2026-11-12T00:00:00Z'))).toBe(18000); expect(publicationRemaining('2026-11-12T05:00:00Z', Date.parse('2026-11-12T05:00:00Z'))).toBe(0); });
});