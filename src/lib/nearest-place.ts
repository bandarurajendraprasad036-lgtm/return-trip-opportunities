import { movedMeters, type AreaResult, type PositionPoint } from './current-area';

// Static GeoNames places tiled by quarter degree (public/places-near/{floor(lat*4)}_{floor(lon*4)}.json),
// rows [teluguOrName, name, lat, lon]. Used when the hosted area lookup is unavailable.
export type NearRow = [string, string, number, number];
export const NEAREST_PLACE_LIMIT_METERS = 5000;
export function tileKeys(point: PositionPoint) {
  const a = Math.floor(point.latitude * 4), b = Math.floor(point.longitude * 4); const keys: string[] = [];
  for (const da of [-1, 0, 1]) for (const db of [-1, 0, 1]) keys.push(`${a + da}_${b + db}`);
  return keys;
}
export function nearestPlace(rows: NearRow[], point: PositionPoint, limit = NEAREST_PLACE_LIMIT_METERS): AreaResult | null {
  let best: NearRow | null = null, bestDistance = Infinity;
  for (const row of rows) { const d = movedMeters(point, { latitude: row[2], longitude: row[3] }); if (d < bestDistance) { best = row; bestDistance = d; } }
  return best && bestDistance <= limit ? { area: best[0] || best[1], address: '' } : null;
}
export async function lookupNearestPlace(point: PositionPoint): Promise<AreaResult | null> {
  const lists = await Promise.all(tileKeys(point).map(async key => {
    try { const response = await fetch(`/places-near/${key}.json`); if (!response.ok) return []; return await response.json() as NearRow[]; } catch { return []; }
  }));
  return nearestPlace(lists.flat(), point);
}
