export type PlaceRow = [string, string, string, string, number, number, string[], number];
export type Coordinates = { latitude: number; longitude: number };
export function normalizePlace(value: string) {
  return value.trim().toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
export function placeShard(query: string) {
  const chars = Array.from(normalizePlace(query));
  return chars.length < 2 ? 'top' : chars.slice(0, 2).map(c => c.codePointAt(0)?.toString(16)).join('-');
}
export function findPlaces(rows: PlaceRow[], query: string) {
  const q = normalizePlace(query);
  if (!q) return [];
  return rows.filter(row => row[6].some(name => normalizePlace(name).startsWith(q))).slice(0, 8);
}