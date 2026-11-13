import { z } from 'zod';

export const CATEGORY_SECTIONS = ['goods', 'returns', 'cars', 'work-wanted', 'work-offered', 'service-providers', 'service-wanted'] as const;
export type CategorySection = typeof CATEGORY_SECTIONS[number];
export const categoryInput = z.object({ section: z.enum(CATEGORY_SECTIONS), name: z.string().trim().min(2).max(40).transform(value => value.normalize('NFC')) });
export function categoryNames(base: readonly string[], added: readonly { name: string }[]) {
  const seen = new Set<string>();
  return [...base, ...added.map(row => row.name)].filter(name => {
    const key = name.trim().normalize('NFC').toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}