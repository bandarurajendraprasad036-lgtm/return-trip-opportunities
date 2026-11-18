import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { findPlaces, placeShards, type PlaceRow } from '@/lib/india-places';

function search(query: string) {
  for (const name of placeShards(query)) {
    try { return findPlaces(JSON.parse(readFileSync(`public/places/${name}.json`, 'utf8')) as PlaceRow[], query); } catch { /* try next */ }
  }
  return [];
}
describe('village search from our own list', () => {
  it.each(['Mancherial', 'Warangal', 'Hyderabad', 'Garmela'])('finds %s exactly once', name => {
    const rows = search(name).filter(row => row[1].toLowerCase() === name.toLowerCase() && row[3] === 'Telangana');
    expect(rows).toHaveLength(1);
  });
  it('uses 4-letter then 3-letter files for longer names', () => {
    expect(placeShards('Mancherial')).toEqual(['6d-61-6e-63', '6d-61-6e']);
  });
});
