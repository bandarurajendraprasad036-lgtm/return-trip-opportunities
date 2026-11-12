import { describe, it, expect } from 'vitest';
import { pushFailure, pushPolicy } from '@/lib/push-rules';
describe('background notification rules', () => {
  it('sound-only mute preserves delivery', () => { expect(pushPolicy(new Date('2026-11-05T04:00:00Z'), null, false)).toEqual({ allowed: true, silent: true }); });
  it('explicit opt-out blocks delivery', () => { expect(pushPolicy(new Date(), { enabled: false }, true).allowed).toBe(false); });
  it('overnight local quiet hours block delivery until their exact end', () => {
    const pref = { timezone: 'Asia/Kolkata', quiet_start: '22:00', quiet_end: '06:00' };
    expect(pushPolicy(new Date('2026-11-04T18:31:00Z'), pref, true).allowed).toBe(false);
    expect(pushPolicy(new Date('2026-11-05T00:30:00Z'), pref, true).allowed).toBe(false);
    expect(pushPolicy(new Date('2026-11-05T03:30:00Z'), pref, true).allowed).toBe(true);
  });
  it('keeps the 20:30 India bell cutoff', () => { expect(pushPolicy(new Date('2026-11-04T15:00:00Z'), null, true).silent).toBe(true); });
  it('removes unregistered and invalid device tokens without retries', () => {
    for (const code of ['UNREGISTERED', 'INVALID_ARGUMENT']) expect(pushFailure(400, JSON.stringify({ error: { details: [{ errorCode: code }] } }))).toEqual({ stale: true, retry: false });
  });
  it('backs off only on 429 and server errors', () => { expect(pushFailure(429, '').retry).toBe(true); expect(pushFailure(503, '').retry).toBe(true); expect(pushFailure(403, '').retry).toBe(false); });
});