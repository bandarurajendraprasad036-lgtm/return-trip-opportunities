import { describe, expect, it } from 'vitest';
import { hidePaymentEvidence, paymentPostingHeld } from '@/lib/payment-status';
describe('payment access and evidence privacy', () => {
  it('unmatched pending payment holds posting', () => expect(paymentPostingHeld(false, true)).toBe(true));
  it('unknown pending status fails closed', () => expect(paymentPostingHeld(false, undefined)).toBe(true));
  it('users not submitting payment retain their existing free allowance', () => expect(paymentPostingHeld(false, false)).toBe(false));
  it('existing active membership is not removed by a later retry', () => expect(paymentPostingHeld(true, true)).toBe(false));
  it('ordinary admin conversation hides payment references', () => expect(hidePaymentEvidence('UTR: 412345678901', true, false)).toBe(true));
  it('administrators can still review payment references', () => expect(hidePaymentEvidence('UTR: 412345678901', true, true)).toBe(false));
  it('ordinary conversations remain unchanged', () => expect(hidePaymentEvidence('UTR: 412345678901', false, false)).toBe(false));
});