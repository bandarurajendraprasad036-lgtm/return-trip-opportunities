import { describe, expect, it } from 'vitest';
import { jobIsVisible } from '@/lib/post-publication';
describe('paid monthly job rules', () => {
  it('keeps a free post private until the five-hour boundary',()=>{const p={status:'active',visible_after:'2026-11-05T12:00:00Z'};expect(jobIsVisible(p,new Date('2026-11-05T11:59:59Z'))).toBe(false);expect(jobIsVisible(p,new Date('2026-11-05T12:00:00Z'))).toBe(true);});
  it('hides a job exactly at its stored monthly expiry', () => { const p={status:'active',job_expires_at:'2026-12-05T07:00:00Z'}; expect(jobIsVisible(p,new Date('2026-12-05T06:59:59Z'))).toBe(true); expect(jobIsVisible(p,new Date('2026-12-05T07:00:00Z'))).toBe(false); });
});