import { describe, expect, it } from 'vitest';
import { homeJobs, homeVehicles, homeLocalVehicles, homeVehicleResults, vehicleSection } from '@/lib/home-listings';
import { VEHICLE_TYPES } from '@/lib/vehicle-types';
import type { Post } from '@/components/PostCard';

const post = (values: Partial<Post>): Post => ({ id: '1', module: 'vehicle', kind: 'owner', vehicle_type: 'Car', status: 'active', from_place: 'Guntur', to_place: 'Hyderabad', trip_date: '2026-11-04', ...values } as Post);
describe('Homepage listing partitions', () => {
  it('switches the same submitted route between return goods, local goods and cars', () => {
    const rows = [post({ id: 'goods', vehicle_type: 'Lorry' }), post({ id: 'car', vehicle_type: 'Car' }), post({ id: 'future', vehicle_type: 'Lorry', trip_date: '2026-11-06' }), post({ id: 'elsewhere', vehicle_type: 'Car', to_place: 'Mumbai' })];
    const route = { from: 'Guntur', to: 'Hyderabad', area: '' };
    expect(homeVehicleResults(rows, route, '2026-11-05', 'return').map(p => p.id)).toEqual(['car']);
    expect(homeVehicleResults(rows, route, '2026-11-05', 'local').map(p => p.id)).toEqual(['car']);
    expect(homeVehicleResults(rows, route, '2026-11-05', 'cars').map(p => p.id)).toEqual(['car']);
  });
  it('applies the submitted street area to all categories without inventing proximity', () => {
    const rows = [post({ id: 'goods', vehicle_type: '407', from_place: 'Ramnagar', to_place: 'ACC' }), post({ id: 'car', vehicle_type: 'Car', from_place: 'Ramnagar', to_place: 'ACC' })];
    const area = { from: '', to: '', area: 'ACC' };
    expect(homeVehicleResults(rows, area, '2026-11-05', 'local').map(p => p.id)).toEqual(['car']);
    expect(homeVehicleResults(rows, area, '2026-11-05', 'cars').map(p => p.id)).toEqual(['car']);
    expect(homeVehicleResults(rows, { ...area, area: '' }, '2026-11-05', 'cars')).toEqual([]);
  });
  it('includes cars but no bicycle type', () => {
    expect(VEHICLE_TYPES.some(type => type.value === 'Car')).toBe(true);
    expect(VEHICLE_TYPES.map(type => type.value)).not.toContain('Bicycle');
    expect(VEHICLE_TYPES.map(type => type.value)).not.toContain('Cycle');
  });
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