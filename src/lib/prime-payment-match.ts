// Pure rules for automatic Prime payment confirmation. Anything uncertain stays pending for the admin.
export const EXPECTED_PAYEE = 'Bandaru Rajendraprasad';

const letters = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[^a-z]/g, '');

export function payeeNameMatches(name: string | null | undefined): boolean {
  if (!name) return false;
  const seen = letters(name);
  return seen.includes('bandaru') && seen.includes('rajendraprasad');
}

export type PaymentReading = { payee_name: string | null; utr: string | null; amount: number | null; success: boolean };

export function paymentAutoConfirms(reading: PaymentReading, reference: string, expectedAmount: number): boolean {
  const utr = (reading.utr ?? '').replace(/\D/g, '');
  return reading.success && payeeNameMatches(reading.payee_name) && utr === reference && reading.amount === expectedAmount;
}
