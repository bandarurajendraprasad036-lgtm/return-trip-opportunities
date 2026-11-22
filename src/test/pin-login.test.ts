import { describe, expect, it } from 'vitest';
import { pinCredential, pinPairError } from '@/lib/phone-password';
import { simplifyWords } from '@/lib/simple-words';
describe('4-digit PIN login', () => {
  it('accepts exactly four matching digits', () => { expect(pinPairError('1234', '1234')).toBe(''); });
  it('rejects three digits', () => { expect(pinPairError('123', '123')).not.toBe(''); });
  it('rejects mismatched PINs', () => { expect(pinPairError('1234', '1235')).not.toBe(''); });
  it('stretches the PIN past the six-character minimum', () => { expect(pinCredential('1234').length).toBeGreaterThanOrEqual(6); });
  it('uses everyday Telugu for login', () => { expect(simplifyWords('ప్రవేశించండి', 'te')).toBe('లాగిన్ అవ్వండి'); });
});
