import { z } from 'zod';

export const payerUpiSchema = z.string().trim().max(100).regex(/^[a-zA-Z0-9._-]{2,}@[a-zA-Z][a-zA-Z0-9.-]{1,}$/, 'మీ చెల్లింపు చిరునామా సరిగా ఇవ్వండి').transform(v => v.toLowerCase());
export const paymentReadingSchema = z.object({ utr: z.string(), payer_upi: z.string(), readable: z.boolean(), suspected_edit: z.boolean() });
export type PaymentReading = z.infer<typeof paymentReadingSchema>;
export function paymentImageDecision(utr: string, upi: string, reading: PaymentReading) {
  if (reading.suspected_edit) return 'suspected_edit';
  if (!reading.readable || !/^\d{12}$/.test(reading.utr) || !payerUpiSchema.safeParse(reading.payer_upi).success) return 'unreadable';
  return reading.utr === utr && reading.payer_upi.trim().toLowerCase() === upi.trim().toLowerCase() ? 'matched' : 'mismatch';
}
export function paymentImageFeedback(status: string) {
  if (status === 'suspected_edit') return 'మీ స్క్రీన్ షాట్ ఎడిట్ చేసినట్టు అనిపిస్తుంది, దయచేసి కరెక్ట్ స్క్రీన్ షాట్ ఇవ్వండి';
  if (status === 'unreadable') return 'మీ స్క్రీన్ షాట్ లో వివరాలు స్పష్టంగా కనిపించలేదు, మళ్ళీ ఒకసారి అప్లోడ్ చేయండి';
  return 'మీ UTR నంబర్ టాలీ కాలేదు, మళ్ళీ ఒకసారి అప్లోడ్ చేయండి';
}