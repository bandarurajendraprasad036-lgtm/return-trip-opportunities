// Decoded from the receiving artwork supplied by the owner; not a payment receipt.
export function paymentDestination(amount: number) {
  const query = new URLSearchParams({ pa: '7036036036-3@ybl', pn: 'BANDARU RAJENDRAPRASAD', am: String(amount), cu: 'INR', tn: 'Gayatri One' });
  return `upi://pay?${query.toString()}`;
}