import { afterEach, expect, it } from 'vitest';
import { BELL_TONES, validBellTone } from '@/lib/bell-tones';
import { bellTone, setBellTone, setBellMuted, bellMuted } from '@/lib/bell';
afterEach(() => localStorage.clear());
it('offers exactly three distinct sounds', () => {
  expect(BELL_TONES).toHaveLength(3);
  expect(new Set(BELL_TONES.map(tone => tone.frequencies.join(','))).size).toBe(3);
});
it('persists all three choices without changing notification mute', () => {
  setBellMuted(true);
  for (const tone of BELL_TONES) { setBellTone(tone.id); expect(bellTone()).toBe(tone.id); }
  expect(bellMuted()).toBe(true);
});
it('unknown stored choices fall back to the temple bell', () => {
  expect(validBellTone('unknown')).toBe('temple');
});