import { z } from 'zod';
export const MEMBERSHIP_AMOUNT = 499;
export const paymentInput = z.object({ transaction_id: z.string().trim().regex(/^[a-zA-Z0-9-]{6,64}$/, 'సరైన UTR ఇవ్వండి · Enter a valid transaction ID'), membership_type: z.enum(['individual', 'group']), referral_numbers: z.array(z.string().regex(/^\d{10}$/, '10 అంకెల సభ్యుని నంబర్ ఇవ్వండి · 10-digit member number')).max(20) });