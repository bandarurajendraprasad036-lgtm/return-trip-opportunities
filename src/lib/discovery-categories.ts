import { z } from 'zod';
import { freeWorkCategory } from './free-work';

export const CATEGORY_SECTIONS = ['goods', 'returns', 'cars', 'work-wanted', 'work-offered', 'service-providers', 'service-wanted'] as const;
export type CategorySection = typeof CATEGORY_SECTIONS[number];
export const categoryInput = z.object({ section: z.enum(CATEGORY_SECTIONS), name: z.string().trim().min(2).max(40).transform(value => value.normalize('NFC')) });
export function categoryNames(base: readonly string[], added: readonly { name: string }[]) {
  const seen = new Set<string>();
  return [...base, ...added.map(row => row.name)].filter(name => {
    // Same meaning in Telugu or English (ప్లంబర్ / plumber) counts as one category.
    const key = freeWorkCategory(name);
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}
/** Keeps each saved category row once, treating Telugu and English names of the same work as one. */
export function uniqueCategoryRows<T extends { name: string }>(rows: readonly T[]) {
  const seen = new Set<string>();
  return rows.filter(row => { const key = freeWorkCategory(row.name); if (seen.has(key)) return false; seen.add(key); return true; });
}