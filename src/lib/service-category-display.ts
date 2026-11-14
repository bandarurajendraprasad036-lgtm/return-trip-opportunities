import { freeWorkCategory, freeWorkLabel } from './free-work';

function distance(a: string, b: string) {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) current[j] = Math.min((current[j - 1] ?? 0) + 1, (previous[j] ?? 0) + 1, (previous[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1));
    previous = current;
  }
  return previous[b.length] ?? 0;
}

export function resolveServiceCategory(input: string, names: readonly string[]) {
  const value = input.trim().replace(/\s+/g, ' ');
  const key = freeWorkCategory(value);
  const exact = names.find(name => freeWorkCategory(name) === key);
  if (exact) return { name: exact, exists: true };
  const candidates = names.filter(name => {
    const normalized = freeWorkCategory(name);
    return key.length >= 5 && (distance(key, normalized) <= 1 || distance(value, name) <= 1);
  });
  if (candidates.length === 1 && candidates[0]) return { name: candidates[0], exists: true };
  return { name: freeWorkLabel(value), exists: false };
}

export function serviceCategoryCount(rows: readonly { id: string; source: string; category: string }[], category: string) {
  return new Set(rows.filter(row => freeWorkCategory(row.category) === freeWorkCategory(category)).map(row => `${row.source}:${row.id}`)).size;
}

/** Groups real listed people under the category names, keeping each person once and the given category order. */
export function groupRingersByCategory<T extends { id: string; source: string; category: string }>(rows: readonly T[], names: readonly string[]) {
  const seen = new Set<string>();
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const key = `${row.source}:${row.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const category = freeWorkCategory(row.category);
    groups.set(category, [...(groups.get(category) ?? []), row]);
  }
  const ordered = names.map(name => ({ category: name, rows: groups.get(freeWorkCategory(name)) ?? [] }));
  const known = new Set(names.map(name => freeWorkCategory(name)));
  const extra = [...groups.entries()].filter(([key]) => !known.has(key)).map(([, list]) => ({ category: freeWorkLabel(list[0]?.category ?? ''), rows: list }));
  return [...ordered, ...extra].filter(group => group.rows.length > 0);
}
