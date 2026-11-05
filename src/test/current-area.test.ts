import { describe, expect, it } from 'vitest';
import { areaFromResults, shouldResolveArea } from '@/lib/current-area';

describe('actual current area selection', () => {
  it('prefers Ramnagar area over the city', () => {
    expect(areaFromResults([{ formatted_address: 'రాంనగర్, హైదరాబాద్', address_components: [
      { long_name: 'హైదరాబాద్', types: ['locality'] },
      { long_name: 'రాంనగర్', types: ['sublocality_level_1'] },
    ] }])).toEqual({ area: 'రాంనగర్', address: 'రాంనగర్, హైదరాబాద్' });
  });
  it('uses actual local address when area name is absent', () => {
    expect(areaFromResults([{ formatted_address: 'వీధి 4, తెలంగాణ', address_components: [] }]))
      .toEqual({ area: '', address: 'వీధి 4, తెలంగాణ' });
  });
  it('does not invent a name or address for empty results', () => {
    expect(areaFromResults([])).toBeNull();
  });
});
describe('bounded movement refresh', () => {
  const original = { latitude: 17.4, longitude: 78.5 };
  const moved = { latitude: 17.402, longitude: 78.5 };
  it('resolves the first actual device position', () => {
    expect(shouldResolveArea(null, original, 0)).toBe(true);
  });
  it('refreshes after movement and ignores stationary duplicate fixes', () => {
    expect(shouldResolveArea(original, moved, 60000)).toBe(true);
    expect(shouldResolveArea(original, original, 60000)).toBe(false);
  });
  it('does not repeat a lookup before the minimum interval', () => {
    expect(shouldResolveArea(original, moved, 59999)).toBe(false);
  });
});