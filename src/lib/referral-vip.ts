export const REFERRAL_CASH_PERCENT = 20;
export const VIP_PLACES = 100;
export function cashPrizePaise(receivedPaise: number) {
  if (!Number.isSafeInteger(receivedPaise) || receivedPaise <= 0) throw new Error('INVALID_AMOUNT');
  return Math.floor(receivedPaise * REFERRAL_CASH_PERCENT / 100);
}
export function boardSize(start: Date, now: Date) {
  const days = (now.getTime() - start.getTime()) / 86400000;
  return days < 15 ? 10 : days < 30 ? 25 : 50;
}
export function vipShortfall(count: number, rank: number | null, rankedUsers: number, cutoff: number) {
  if (rank !== null && rank <= VIP_PLACES) return 0;
  return rankedUsers < VIP_PLACES ? 1 : Math.max(1, cutoff - count + 1);
}
export type ReferralVip = { count: number; rank: number | null; needed: number; vip: boolean; reward_paise: number; code: string; invited_by: string | null };