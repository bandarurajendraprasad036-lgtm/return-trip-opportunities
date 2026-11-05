import { getDistance } from 'geolib';
import type { Coordinates } from './india-places';
export const ROUTE_RADIUS_PERCENT = 20;
// Distance provenance must be labeled by callers; never claim this is road distance.
export function routeRadiusKm(distanceKm: number) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return null;
  return distanceKm * ROUTE_RADIUS_PERCENT / 100;
}
export function approximateDistanceKm(from: Coordinates, to: Coordinates) {
  if (![from, to].every(p => Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && Math.abs(p.latitude) <= 90 && Math.abs(p.longitude) <= 180)) return null;
  return getDistance(from, to, 0.001) / 1000;
}