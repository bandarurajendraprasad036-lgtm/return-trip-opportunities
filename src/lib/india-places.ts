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
export function placeShard(query: string) { return placeShards(query)[0]!; }
export function findPlaces(rows: PlaceRow[], query: string) {
  const q = normalizePlace(query);
  if (!q) return [];
  const seen = new Set<string>();
  return rows.filter(row => {
    if (!row[6].some(name => normalizePlace(name).startsWith(q))) return false;
    const key = `${normalizePlace(row[1])}|${normalizePlace(row[3])}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 8);
}