/** Point 9: immutable redemption values confirmed by the user. */
export const REDEMPTION_POINTS = 100;
export const MAX_CONSECUTIVE_FREE_MONTHS = 3;
export const SHARING_GROUPS = 10;
export function canRedeemPoints(points: number) { return Number.isInteger(points) && points >= REDEMPTION_POINTS; }
export function freeMonthAllowed(streak: number, completedBreakMonths: number) { return streak < MAX_CONSECUTIVE_FREE_MONTHS || completedBreakMonths >= 1; }
export function rewardError(message: string) {
  if (message.includes('100_POINTS_REQUIRED')) return 'ఉచిత నెల పొందడానికి 100 పాయింట్లు అవసరం. · 100 points required.';
  if (message.includes('ONE_MONTH_BREAK_REQUIRED')) return 'మూడు ఉచిత నెలల తర్వాత ఒక నెల విరామం అవసరం. · One month break required.';
  return 'పూర్తి కాలేదు. మళ్లీ ప్రయత్నించండి. · Please retry.';
}