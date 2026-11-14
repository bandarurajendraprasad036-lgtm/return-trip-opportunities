export const FREE_WORK_SECTIONS = ['work-wanted', 'work-offered', 'service-providers', 'service-wanted'] as const;
export type FreeWorkSection = typeof FREE_WORK_SECTIONS[number];
export const FREE_WORK_CATEGORIES = ['ప్లంబర్', 'ఎలక్ట్రీషియన్', 'షాప్ కీపర్', 'సాఫ్ట్వేర్ ఇంజనీర్', 'డ్రైవర్', 'మేస్త్రీ', 'పెయింటర్', 'కార్పెంటర్'] as const;
export const FREE_WORK_LABELS: Record<FreeWorkSection, string> = {
  'work-wanted': 'పని కావాలి', 'work-offered': 'పని ఇస్తాను',
  'service-providers': 'నేను సర్వీస్ ప్రొవైడర్ ను', 'service-wanted': 'నాకు సర్వీస్ ప్రొవైడర్ కావాలి',
};
export function freeWorkCategory(value: string) {
  const aliases: Record<string, string> = { 'ప్లంబర్': 'plumber', 'ఎలక్ట్రీషియన్': 'electrician', 'ఎలక్ట్రిషియన్': 'electrician', electrition: 'electrician', 'షాప్ కీపర్': 'shop keeper', 'సాఫ్ట్వేర్ ఇంజనీర్': 'software engineer', 'డ్రైవర్': 'driver', 'మేస్త్రీ': 'mason', 'పెయింటర్': 'painter', 'కార్పెంటర్': 'carpenter' };
  const key = value.trim().normalize('NFC').toLowerCase();
  return aliases[key] ?? key;
}
export function freeWorkNames(added: readonly { name: string }[]) {
  const seen = new Set<string>();
  return [...FREE_WORK_CATEGORIES, ...added.map(row => row.name)].filter(name => {
    const key = freeWorkCategory(name); if (seen.has(key)) return false; seen.add(key); return true;
  });
}
export function freeWorkLabel(value: string) { return FREE_WORK_CATEGORIES.find(name => freeWorkCategory(name) === freeWorkCategory(value)) ?? value; }
export const FREE_WORK_FIRST_MATCHES = 5;
export function freeWorkMatch(a: { section: FreeWorkSection; category: string; area: string }, b: { section: FreeWorkSection; category: string; area: string }) {
  const opposites: Record<FreeWorkSection, FreeWorkSection> = { 'work-wanted': 'work-offered', 'work-offered': 'work-wanted', 'service-providers': 'service-wanted', 'service-wanted': 'service-providers' };
  return opposites[a.section] === b.section && freeWorkCategory(a.category) === freeWorkCategory(b.category) && a.area.trim().toLowerCase() !== '' && a.area.trim().toLowerCase() === b.area.trim().toLowerCase();
}