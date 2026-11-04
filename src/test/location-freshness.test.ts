import { describe, expect, it } from 'vitest';
import { lastPositionTime } from '@/lib/location-freshness';
describe('Last vehicle position timestamp only', () => {
  it('preserves the actual timestamp in India time', () => {
    expect(lastPositionTime('2026-11-04T10:00:00Z', 'Asia/Kolkata')).toContain('15:30:00');
  });
  it('uses the selected timezone', () => {
    expect(lastPositionTime('2026-11-04T10:00:00Z', 'UTC')).toContain('10:00:00');
  });
  it('changes the displayed time when a new position arrives', () => {
    expect(lastPositionTime('2026-11-04T10:01:00Z', 'UTC')).toContain('10:01:00');
  });
  it('does not invent a time for absent or invalid timestamps', () => {
    expect(lastPositionTime(null, 'UTC')).toBeNull();
    expect(lastPositionTime('invalid', 'UTC')).toBeNull();
  });
});