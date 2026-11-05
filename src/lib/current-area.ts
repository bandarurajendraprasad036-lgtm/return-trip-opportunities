export type AreaResult = { area: string; address: string };
export type GeocodeResult = {
  formatted_address?: string;
  address_components?: { long_name: string; types: string[] }[];
};

export function areaFromResults(results: GeocodeResult[]): AreaResult | null {
  const address = results.find(r => r.formatted_address?.trim())?.formatted_address?.trim() ?? '';
  for (const type of ['neighborhood', 'sublocality_level_2', 'sublocality_level_1', 'sublocality', 'locality']) {
    for (const result of results) {
      const part = result.address_components?.find(c => c.types.includes(type) && c.long_name.trim());
      if (part) return { area: part.long_name.trim(), address };
    }
  }
  return address ? { area: '', address } : null;
}

export type PositionPoint = { latitude: number; longitude: number };
export function movedMeters(a: PositionPoint, b: PositionPoint) {
  const rad = Math.PI / 180;
  const dlat = (b.latitude - a.latitude) * rad;
  const dlng = (b.longitude - a.longitude) * rad;
  const h = Math.sin(dlat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dlng / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

// Bound paid lookups without persisting a user's precise position.
export function shouldResolveArea(previous: PositionPoint | null, next: PositionPoint, elapsed: number) {
  return !previous || (elapsed >= 60000 && movedMeters(previous, next) >= 100);
}