import { describe, expect, it } from 'vitest';
import { locationFreshness } from '@/lib/location-freshness';

const updatedAt = '2026-11-04T10:00:00.000Z';
describe('Vehicle location freshness thresholds', () => {
  it('remains fresh before five minutes', () => {
    expect(locationFreshness(updatedAt, new Date('2026-11-04T10:04:59.999Z'))).toBe('fresh');
  });
  it('remains fresh at exactly five minutes', () => {
    expect(locationFreshness(updatedAt, new Date('2026-11-04T10:05:00.000Z'))).toBe('fresh');
  });
  it('becomes somewhat old immediately after five minutes', () => {
    expect(locationFreshness(updatedAt, new Date('2026-11-04T10:05:00.001Z'))).toBe('aging');
  });
  it('remains somewhat old before fifteen minutes', () => {
    expect(locationFreshness(updatedAt, new Date('2026-11-04T10:14:59.999Z'))).toBe('aging');
  });
  it('remains somewhat old at exactly fifteen minutes', () => {
    expect(locationFreshness(updatedAt, new Date('2026-11-04T10:15:00.000Z'))).toBe('aging');
  });
  it('becomes old immediately after fifteen minutes', () => {
    expect(locationFreshness(updatedAt, new Date('2026-11-04T10:15:00.001Z'))).toBe('stale');
  });
  it('uses the newest position timestamp rather than a previous one', () => {
    const now = new Date('2026-11-04T10:20:00Z');
    expect(locationFreshness(updatedAt, now)).toBe('stale');
    expect(locationFreshness('2026-11-04T10:19:00Z', now)).toBe('fresh');
  });
  it('does not claim freshness for absent, invalid or future times', () => {
    const now = new Date(updatedAt);
    expect(locationFreshness(null, now)).toBe('unavailable');
    expect(locationFreshness('invalid', now)).toBe('unavailable');
    expect(locationFreshness('2026-11-04T10:01:00Z', now)).toBe('unavailable');
  });
});