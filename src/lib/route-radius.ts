export const ROUTE_RADIUS_PERCENT = 20;
// Input must be an actual road distance, never an inferred map/search distance.
export function routeRadiusKm(roadDistanceKm: number) {
  if (!Number.isFinite(roadDistanceKm) || roadDistanceKm <= 0) return null;
  return roadDistanceKm * ROUTE_RADIUS_PERCENT / 100;
}