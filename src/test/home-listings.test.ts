import { describe, expect, it } from 'vitest';
import { homeJobs, homeVehicles, homeLocalVehicles, vehicleSection } from '@/lib/home-listings';
import type { Post } from '@/components/PostCard';

const post = (values: Partial<Post>): Post => ({ id: '1', module: 'vehicle', kind: 'owner', status: 'active', from_place: 'Guntur', to_place: 'Hyderabad', trip_date: '2026-11-04', ...values } as Post);
describe('Homepage listing partitions', () => {
  it('searches named streets/colonies nationally without requiring identical endpoints', () => {
    const rows = [post({ id: 'local', from_place: 'Ramnagar', to_place: 'ACC', district: 'Mancherial' }), post({ id: 'other', from_place: 'Ramnagar', to_place: 'Delhi', district: 'Delhi' })];
    expect(homeLocalVehicles(rows, 'Mancherial Ramnagar').map(p => p.id)).toEqual(['local']);
    expect(homeLocalVehicles(rows, 'ACC').map(p => p.id)).toEqual(['local']);
    expect(homeLocalVehicles(rows, 'Delhi Ramnagar').map(p => p.id)).toEqual(['other']);
  });
  it('does not invent nearby listings or show local rows before search', () => {
    const rows = [post({ from_place: 'ACC', status: 'closed' }), post({ from_place: 'Ramnagar' })];
    expect(homeLocalVehicles(rows, 'ACC')).toEqual([]);
    expect(homeLocalVehicles(rows, 'Mumbai')).toEqual([]);
    expect(homeLocalVehicles(rows, '')).toEqual([]);
  });
  it('shows local only for the same named endpoints, without inferring distance', () => {
    expect(vehicleSection(post({ to_place: ' guntur ' }), '2026-11-04')).toBe('local');
    expect(vehicleSection(post({ to_place: 'Vijayawada' }), '2026-11-04')).toBe('return');
  });
  it('separates return and advance on the date boundary', () => {
    expect(vehicleSection(post({ trip_date: '2026-11-04' }), '2026-11-04')).toBe('return');
    expect(vehicleSection(post({ trip_date: '2026-11-05' }), '2026-11-04')).toBe('advance');
  });
  it('filters both endpoints and never invents empty results', () => {
    const rows = [post({ id: 'return' }), post({ id: 'advance', trip_date: '2026-11-05' }), post({ id: 'inactive', status: 'closed' })];
    expect(homeVehicles(rows, 'guntur', 'Hyderabad', '2026-11-04', 'return').map(p => p.id)).toEqual(['return']);
    expect(homeVehicles(rows, 'Mumbai', '', '2026-11-04', 'return')).toEqual([]);
    expect(homeVehicles(rows, '', '', '2026-11-04', 'return')).toEqual([]);
  });
  it('keeps seeker and employer displays separate at the chosen job location', () => {
    const rows = [post({ id: 's', module: 'job', kind: 'seeker', location: 'Guntur' }), post({ id: 'e', module: 'job', kind: 'employer', location: 'Guntur' }), post({ id: 'other', module: 'job', kind: 'employer', location: 'Mumbai' })];
    expect(homeJobs(rows, 'guntur', 'seeker').map(p => p.id)).toEqual(['s']);
    expect(homeJobs(rows, 'guntur', 'employer').map(p => p.id)).toEqual(['e']);
    expect(homeJobs(rows, '', 'employer')).toEqual([]);
  });
});