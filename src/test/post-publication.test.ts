import { describe, expect, it } from 'vitest';
import { jobIsVisible } from '@/lib/post-publication';
describe('paid monthly job rules', () => {
  it('keeps a free post private until the five-hour boundary',()=>{const p={status:'active',visible_after:'2026-11-05T12:00:00Z'};expect(jobIsVisible(p,new Date('2026-11-05T11:59:59Z'))).toBe(false);expect(jobIsVisible(p,new Date('2026-11-05T12:00:00Z'))).toBe(true);});
  it('hides a job exactly at its stored monthly expiry', () => { const p={status:'active',job_expires_at:'2026-12-05T07:00:00Z'}; expect(jobIsVisible(p,new Date('2026-12-05T06:59:59Z'))).toBe(true); expect(jobIsVisible(p,new Date('2026-12-05T07:00:00Z'))).toBe(false); });
});
it('local goods expire at exactly 24 hours without changing stored status', () => {
  const post = { status: 'active', module: 'vehicle', vehicle_type: 'Lorry', from_place: 'A', to_place: 'A', created_at: '2026-11-16T06:00:00Z' };
  expect(jobIsVisible(post, new Date('2026-11-17T05:59:59Z'))).toBe(true);
  expect(jobIsVisible(post, new Date('2026-11-17T06:00:00Z'))).toBe(false);
  expect(post.status).toBe('active');
});
it('local cars remain through the requested Indian date, then disappear', () => {
  const post = { status: 'active', module: 'vehicle', vehicle_type: 'Car', from_place: 'A', to_place: 'A', trip_date: '2026-11-16' };
  expect(jobIsVisible(post, new Date('2026-11-16T18:29:59Z'))).toBe(true);
  expect(jobIsVisible(post, new Date('2026-11-16T18:30:00Z'))).toBe(false);
});
it('return and advance goods stop after requested date and closed vehicles never display', () => {
  const post = { status: 'active', module: 'vehicle', vehicle_type: 'Lorry', from_place: 'A', to_place: 'B', trip_date: '2026-11-16' };
  expect(jobIsVisible(post, new Date('2026-11-16T18:29:59Z'))).toBe(true);
  expect(jobIsVisible(post, new Date('2026-11-16T18:30:00Z'))).toBe(false);
  expect(jobIsVisible({ ...post, status: 'closed' }, new Date('2026-11-16T06:00:00Z'))).toBe(false);
});
it('all jobs expire at 30 days even without a legacy expiry value', () => {
  const post = { status: 'active', module: 'job', created_at: '2026-11-16T06:00:00Z' };
  expect(jobIsVisible(post, new Date('2026-12-16T05:59:59Z'))).toBe(true);
  expect(jobIsVisible(post, new Date('2026-12-16T06:00:00Z'))).toBe(false);
});