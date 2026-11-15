import { describe, expect, it } from 'vitest';
import { nearestPlace, tileKeys, type NearRow } from '@/lib/nearest-place';

const rows: NearRow[] = [['రామ్‌నగర్', 'Ramnagar', 18.87, 79.45], ['మంచిర్యాల', 'Mancherial', 18.87, 79.46]];
describe('nearest village fallback', () => {
  it('returns the closest real place within 5 km', () => {
    expect(nearestPlace(rows, { latitude: 18.8705, longitude: 79.4502 })).toEqual({ area: 'రామ్‌నగర్', address: '' });
  });
  it('never names a place farther than 5 km', () => {
    expect(nearestPlace(rows, { latitude: 19.0, longitude: 79.45 })).toBeNull();
  });
  it('checks the surrounding nine quarter-degree tiles', () => {
    expect(tileKeys({ latitude: 18.87, longitude: 79.45 })).toHaveLength(9);
    expect(tileKeys({ latitude: 18.87, longitude: 79.45 })).toContain('75_317');
  });
});
