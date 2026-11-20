import { describe, expect, it } from 'vitest';
import type { Post } from '@/components/PostCard';
import { dashboardCounts, postInList } from '@/lib/dashboard-counts';

const now = new Date('2026-11-20T10:00:00Z');
const post = (o: Partial<Post>): Post => ({ id: Math.random().toString(), user_id: 'u', module: 'vehicle', kind: 'business', status: 'active', created_at: '2026-11-20T08:00:00Z', ...o } as Post);

describe('dashboard counts from real records', () => {
  const rows = [
    post({ from_place: 'Hyderabad', to_place: 'Mancherial', vehicle_type: 'Mini truck', trip_date: '2026-11-15' }),
    post({ from_place: 'Hyderābād', to_place: 'Mancherial', vehicle_type: 'Mini truck', trip_date: '2026-11-25' }),
    post({ from_place: 'Tirupati', to_place: 'tirupati ', vehicle_type: 'Lorry' }),
    post({ from_place: 'Tirupati', to_place: 'Chennai', vehicle_type: 'Car', trip_date: '2026-11-21' }),
    post({ module: 'job', kind: 'seeker' }),
    post({ module: 'job', kind: 'employer', created_at: '2026-10-01T00:00:00Z' }),
  ];
  const c = dashboardCounts(rows, now);
  it('total vehicles counts every vehicle record, including expired', () => { expect(c.vehicles).toEqual({ total: 4, visible: 3 }); });
  it('local means identical From and To', () => { expect(c.localVehicles.total).toBe(1); expect(c.localGoods).toEqual({ total: 1, visible: 1 }); });
  it('return goods excludes cars and counts expired separately', () => { expect(c.returnGoods).toEqual({ total: 2, visible: 1 }); expect(c.returnVehicles.total).toBe(3); expect(c.cars.total).toBe(1); });
  it('work counts split seekers and employers; 30-day old job not visible', () => { expect(c.jobs).toEqual({ total: 2, visible: 1 }); expect(c.seekers.total).toBe(1); expect(c.employers).toEqual({ total: 1, visible: 0 }); });
  it('a job is never in a vehicle list', () => { expect(postInList(rows[4]!, 'vehicles')).toBe(false); });
});
