export const ADDITIONAL_RECIPIENT_AMOUNT = 80;

export function additionalRecipientTotal(count: number) {
  if (!Number.isInteger(count) || count < 0) throw new Error('INVALID_RECIPIENT_COUNT');
  return count * ADDITIONAL_RECIPIENT_AMOUNT;
}
