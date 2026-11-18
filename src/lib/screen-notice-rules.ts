export function screenNoticeAllowed(noticeHasId: boolean, deliveryAllowed: boolean, paidAlertsReady: boolean) {
  // A stored notice must pass its own radius, consent and receipt checks.
  return noticeHasId ? deliveryAllowed : deliveryAllowed || paidAlertsReady;
}