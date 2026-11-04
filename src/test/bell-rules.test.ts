import { describe, expect, it } from 'vitest';
import { isBellNight } from '@/lib/bell-rules';
describe('Point 9 bell cutoff in India', () => {
  it('permits sound before 20:30', () => expect(isBellNight(new Date('2026-11-04T14:59:59Z'))).toBe(false));
  it('stops sound at 20:30', () => expect(isBellNight(new Date('2026-11-04T15:00:00Z'))).toBe(true));
  it('stops sound later that night', () => expect(isBellNight(new Date('2026-11-04T18:00:00Z'))).toBe(true));
});