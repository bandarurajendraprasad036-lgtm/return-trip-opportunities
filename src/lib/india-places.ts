export type PlaceRow = [string, string, string, string, number, number, string[], number];
export type Coordinates = { latitude: number; longitude: number };
export function normalizePlace(value: string) {
  return value.trim().toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
const shardKey = (chars: string[], depth: number) => chars.slice(0, depth).map(c => c.codePointAt(0)?.toString(16)).join('-');
// Shards are built by scripts/build-place-shards.py: 2-letter, 3-letter and (for busy prefixes) 4-letter files.
export function placeShards(query: string) {
  const chars = Array.from(normalizePlace(query));
  if (chars.length < 2) return ['top'];
  if (chars.length === 2) return [shardKey(chars, 2)];
  if (chars.length === 3) return [shardKey(chars, 3)];
  return [shardKey(chars, 4), shardKey(chars, 3)];
}
export function placeShard(query: string) { return placeShards(query)[0] ?? 'top'; }
export function findPlaces(rows: PlaceRow[], query: string) {
  const q = normalizePlace(query);
  if (Array.from(q).length < 2) return [];
  const seen = new Set<string>();
  return rows.filter(row => {
    if (!normalizePlace(row[1]).startsWith(q)) return false;
    const key = normalizePlace(row[1]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}