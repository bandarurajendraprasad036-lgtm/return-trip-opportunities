import { z } from 'zod';
export const MEMBERSHIP_AMOUNT = 699;
export const GROUP_MEMBERSHIP_AMOUNT = 1999;
export const MEMBERSHIP_MONTHS = 1;
export const membershipAmount = (type: 'individual' | 'group') => type === 'group' ? GROUP_MEMBERSHIP_AMOUNT : MEMBERSHIP_AMOUNT;
export const paymentInput = z.object({ transaction_id: z.string().trim().regex(/^[a-zA-Z0-9-]{6,64}$/, 'సరైన UTR ఇవ్వండి · Enter a valid transaction ID'), membership_type: z.enum(['individual', 'group']), referral_numbers: z.array(z.string().regex(/^[6-9]\d{9}$/, 'సరైన 10 అంకెల సభ్యుని నంబర్ ఇవ్వండి · Valid member mobile')).max(3) }).superRefine((value, ctx) => {
  const valid = value.membership_type === 'individual' ? value.referral_numbers.length === 0 : value.referral_numbers.length === 3 && new Set(value.referral_numbers).size === 3;
  if (!valid) ctx.addIssue({ code: 'custom', path: ['referral_numbers'], message: 'మీతో పాటు మరో ముగ్గురి వేర్వేరు నంబర్లు ఇవ్వండి · Enter three distinct additional members' });
});