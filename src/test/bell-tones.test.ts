import { describe, expect, it } from 'vitest';
import { RING_SECONDS, ringStrikes, validBellVolume, volumeGain } from '@/lib/bell-tones';
describe('Gayatri One ring', () => {
  it('rings for 30 seconds', () => { expect(RING_SECONDS).toBe(30); expect(ringStrikes()).toBe(19); });
  it('defaults to high volume and supports low', () => { expect(validBellVolume(null)).toBe('high'); expect(validBellVolume('low')).toBe('low'); expect(volumeGain('low')).toBeLessThan(volumeGain('high')); });
});
