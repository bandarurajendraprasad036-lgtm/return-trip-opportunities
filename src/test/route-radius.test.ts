import { describe, expect, it } from 'vitest';
import { ROUTE_RADIUS_PERCENT, routeRadiusKm } from '@/lib/route-radius';

describe('Requested route radius', () => {
  it('uses 20 percent of the actual 150 km road distance as 30 km', () => {
    expect(ROUTE_RADIUS_PERCENT).toBe(20);
    expect(routeRadiusKm(150)).toBe(30);
  });
  it('rejects absent or invalid actual road distances', () => {
    expect(routeRadiusKm(0)).toBeNull();
    expect(routeRadiusKm(-150)).toBeNull();
    expect(routeRadiusKm(NaN)).toBeNull();
  });
});