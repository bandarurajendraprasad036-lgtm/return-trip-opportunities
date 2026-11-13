// Current receiving address supplied by the owner; QR codes are not receipts.
export const PAYMENT_UPI = 'bandarurajendraprasad036@oksbi';
export function paymentDestination(amount: number) {
  const query = new URLSearchParams({ pa: PAYMENT_UPI, pn: 'BANDARU RAJENDRAPRASAD', am: String(amount), cu: 'INR', tn: 'Gayatri One' });
  return `upi://pay?${query.toString()}`;
}