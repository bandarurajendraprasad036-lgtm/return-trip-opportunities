import { describe, expect, it } from 'vitest';
import { shouldShowProfileRequest } from '@/lib/bell-activation';

describe('account bell and profile reminder', () => {
  it('shows the profile request before the first bell activation for an incomplete profile', () => {
    expect(shouldShowProfileRequest(false, null)).toBe(true);
  });
  it('does not repeat the request after the bell was activated', () => {
    expect(shouldShowProfileRequest(false, '2026-11-10T04:00:00Z')).toBe(false);
  });
  it('stops the request permanently after profile completion and bell activation', () => {
    expect(shouldShowProfileRequest(true, '2026-11-10T04:00:00Z')).toBe(false);
  });
});
