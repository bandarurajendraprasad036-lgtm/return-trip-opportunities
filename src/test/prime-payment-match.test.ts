import { describe, expect, it } from 'vitest';
import { payeeNameMatches, paymentAutoConfirms } from '@/lib/prime-payment-match';

const ok = { payee_name: 'BANDARU RAJENDRAPRASAD', utr: '123456789012', amount: 100, success: true };

describe('automatic Prime payment confirmation', () => {
  it('confirms only when payee is Bandaru Rajendraprasad', () => {
    expect(payeeNameMatches('Bandaru Rajendra Prasad')).toBe(true);
    expect(payeeNameMatches('Ramesh Kumar')).toBe(false);
    expect(paymentAutoConfirms({ ...ok, payee_name: 'Ramesh Kumar' }, '123456789012', 100)).toBe(false);
  });
  it('confirms when name, UTR and ₹100 all match', () => {
    expect(paymentAutoConfirms(ok, '123456789012', 100)).toBe(true);
  });
  it('keeps pending when name or number is not shown (never rejects)', () => {
    expect(paymentAutoConfirms({ ...ok, payee_name: null }, '123456789012', 100)).toBe(false);
    expect(paymentAutoConfirms({ ...ok, utr: null }, '123456789012', 100)).toBe(false);
    expect(paymentAutoConfirms({ ...ok, utr: '999999999999' }, '123456789012', 100)).toBe(false);
  });
});
