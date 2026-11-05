import { describe, expect, it } from 'vitest';
import { paidJobSlots, jobIsVisible, MONTHLY_PAID_JOB_LIMIT } from '@/lib/post-publication';
describe('paid monthly job rules', () => {
  it('allows three submissions, with no fourth slot', () => { expect(MONTHLY_PAID_JOB_LIMIT).toBe(3); expect([0,1,2,3,4].map(paidJobSlots)).toEqual([3,2,1,0,0]); });
  it('hides a job exactly at its stored monthly expiry', () => { const p={status:'active',job_expires_at:'2026-12-05T07:00:00Z'}; expect(jobIsVisible(p,new Date('2026-12-05T06:59:59Z'))).toBe(true); expect(jobIsVisible(p,new Date('2026-12-05T07:00:00Z'))).toBe(false); });
});