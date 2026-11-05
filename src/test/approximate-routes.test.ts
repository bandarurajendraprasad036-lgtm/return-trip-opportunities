import { describe, expect, it } from 'vitest';
import { approximateDistanceKm, routeRadiusKm } from '@/lib/route-radius';
import { findPlaces, placeShard, type PlaceRow } from '@/lib/india-places';

describe('Approximate endpoint radius', () => {
  it('uses selected coordinates, with twenty percent of the calculated distance', () => {
    const distance = approximateDistanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 });
    expect(distance).toBeCloseTo(111.319, 2);
    expect(routeRadiusKm(distance ?? 0)).toBeCloseTo(22.264, 2);
  });
  it('rejects invalid positions, and does not invent a nonzero distance', () => {
    expect(approximateDistanceKm({ latitude: 91, longitude: 0 }, { latitude: 0, longitude: 0 })).toBeNull();
    expect(approximateDistanceKm({ latitude: 1, longitude: 2 }, { latitude: 1, longitude: 2 })).toBe(0);
    expect(routeRadiusKm(0)).toBeNull();
  });
});
describe('India place suggestions after one or two letters', () => {
  const rows: PlaceRow[] = [['1', 'Mancherial', 'మంచిర్యాల', 'Telangana', 18.8, 79.4, ['Mancherial', 'మంచిర్యాల'], 100]];
  it('matches one Latin letter from the top list and two from a prefix shard', () => {
    expect(placeShard('M')).toBe('top');
    expect(placeShard('Ma')).toBe('6d-61');
    expect(findPlaces(rows, 'M')[0]?.[1]).toBe('Mancherial');
    expect(findPlaces(rows, 'Ma')[0]?.[4]).toBe(18.8);
  });
  it('preserves Telugu marks and returns no invented result', () => {
    expect(findPlaces(rows, 'మం')[0]?.[1]).toBe('Mancherial');
    expect(findPlaces(rows, 'missing-place')).toEqual([]);
  });
});