export const MEMBERSHIP_AMOUNT = 100;
export const DISCOUNT_AMOUNT = 80;
export const EXTRA_POST_AMOUNT = 49;
export const MEMBERSHIP_MONTHS = 1;
export const ALERT_DELAY_DAYS = 0;
export const FREE_POSTS = 3;
export const MIN_PROVIDER_CONTACTS = 20;
export type ProviderContactInput = { town: string; service: string; mobile: string; consent: boolean };
export function validProviderContacts(rows: ProviderContactInput[]) {
  return rows.length >= MIN_PROVIDER_CONTACTS && rows.length <= 500 && new Set(rows.map(r => r.mobile)).size === rows.length
    && rows.every(r => r.town.trim().length >= 2 && r.town.length <= 80 && r.service.trim().length >= 2 && r.service.length <= 100 && /^[6-9]\d{9}$/.test(r.mobile) && r.consent);
}
export function publicationRemaining(visibleAfter: string, now: number) {
  return Math.max(0, Math.ceil((Date.parse(visibleAfter) - now) / 1000));
}
export function competitionDisplayOpen(now: number) { return now >= Date.parse('2026-11-22T23:00:00+05:30'); }