import { describe, expect, it } from 'vitest';
import type { Post } from '@/components/PostCard';
import { workListings } from '@/lib/work-listings';
import { paymentDestination } from '@/lib/payment-destination';
import { notificationWindowOpen } from '@/lib/work-notification-rules';
const post = (values: Partial<Post>) => ({ id: 'job', module: 'job', kind: 'seeker', service_type: '', location: 'మంచిర్యాల', status: 'active', ...values }) as Post;
describe('jobs and services rules', () => {
  it('keeps the four demands/offers separate without fake rows', () => {
    const rows = [post({ id: 'job' }), post({ id: 'employer', kind: 'employer' }), post({ id: 'need-service', service_type: 'service' }), post({ id: 'give-service', service_type: 'service', kind: 'employer' })];
    expect(workListings(rows, '', 'seeker').map(p => p.id)).toEqual(['job']);
    expect(workListings(rows, '', 'employer').map(p => p.id)).toEqual(['employer']);
    expect(workListings(rows, '', 'seeker', true).map(p => p.id)).toEqual(['need-service']);
    expect(workListings(rows, '', 'employer', true).map(p => p.id)).toEqual(['give-service']);
  });
  it('applies one exact area filter and excludes other towns', () => {
    expect(workListings([post({}), post({ id: 'other', location: 'మంచిర్యాల పక్క ఊరు' })], 'మంచిర్యాల', 'seeker').map(p => p.id)).toEqual(['job']);
  });
  it('includes a declared any-area request but hides five-hour pending posts', () => {
    expect(workListings([post({ id: 'any', area_scope: 'country' }), post({ id: 'pending', visible_after: new Date(Date.now() + 5 * 3600000).toISOString() })], 'హైదరాబాద్', 'seeker').map(p => p.id)).toEqual(['any']);
  });
  it('opens only the supplied receiving account with exactly 100 rupees', () => {
    const destination = new URL(paymentDestination(100));
    expect(destination.searchParams.get('pa')).toBe('bandarurajendraprasad036@okhdfcbank');
    expect(destination.searchParams.get('am')).toBe('100');
    expect(destination.searchParams.get('cu')).toBe('INR');
  });
  it('allows 09:00 and rejects before 09:00 and at or after 20:00', () => {
    expect(notificationWindowOpen(new Date('2026-11-12T08:59:59+05:30'))).toBe(false);
    expect(notificationWindowOpen(new Date('2026-11-12T09:00:00+05:30'))).toBe(true);
    expect(notificationWindowOpen(new Date('2026-11-12T19:59:59+05:30'))).toBe(true);
    expect(notificationWindowOpen(new Date('2026-11-12T20:00:00+05:30'))).toBe(false);
  });
});