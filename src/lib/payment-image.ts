import { z } from 'zod';

export const payerUpiSchema = z.string().trim().max(100).regex(/^[a-zA-Z0-9._-]{2,}@[a-zA-Z][a-zA-Z0-9.-]{1,}$/, 'మీ చెల్లింపు చిరునామా సరిగా ఇవ్వండి').transform(v => v.toLowerCase());
export const paymentReadingSchema = z.object({ utr: z.string(), payer_upi: z.string(), readable: z.boolean(), suspected_edit: z.boolean() });
export type PaymentReading = z.infer<typeof paymentReadingSchema>;
export function resolvePaymentPayer(entered: string | null, reading: PaymentReading) {
  const result = payerUpiSchema.safeParse(entered || reading.payer_upi);
  return result.success ? result.data : null;
}
export function paymentImageDecision(utr: string, upi: string, reading: PaymentReading) {
  if (reading.suspected_edit) return 'suspected_edit';
  if (!reading.readable || !/^\d{12}$/.test(reading.utr) || !payerUpiSchema.safeParse(reading.payer_upi).success) return 'unreadable';
  return reading.utr === utr && reading.payer_upi.trim().toLowerCase() === upi.trim().toLowerCase() ? 'matched' : 'mismatch';
}
export function paymentImageFeedback(status: string) {
  return status === 'matched' ? '' : 'చెల్లింపు పరిశీలనలో ఉంది';
}