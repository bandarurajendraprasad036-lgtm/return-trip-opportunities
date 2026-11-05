import { CITIES, JOB_CATEGORIES } from '@/lib/jobs';

/** Point 8: capture the selected tab in the persisted job identity. */
export function jobPostIdentity(kind: 'seeker' | 'employer', skill: string) {
  return { module: 'job' as const, kind, title: kind === 'seeker' ? `${skill.trim()} పని కావాలి` : `${skill.trim()} కోసం పనివాడు కావాలి` };
}

// Point 8: these are local suggestions, not geocoding or verified job listings.
const TELUGU_CITIES = ['హైదరాబాద్', 'ఢిల్లీ', 'ముంబై', 'వరంగల్', 'కరీంనగర్', 'విజయవాడ', 'గుంటూరు', 'విశాఖపట్నం', 'బెంగళూరు', 'చెన్నై'];
export const VILLAGE_SUGGESTIONS = [...CITIES, ...TELUGU_CITIES];
export const WORK_SUGGESTIONS = JOB_CATEGORIES.filter(c => c.id !== 'other').flatMap(c => [c.te, c.en]);
export function jobSuggestions(input: string, options: readonly string[]): string[] {
  const query = input.trim().normalize('NFC').toLocaleLowerCase();
  const length = Array.from(new Intl.Segmenter('te', { granularity: 'grapheme' }).segment(query)).length;
  return length < 2 ? [] : [...new Set(options)].filter(option => option.toLocaleLowerCase().includes(query)).slice(0, 8);
}
export function hasProhibitedJobWords(text: string): boolean {
  return /fuck|bitch|bastard|asshole|motherfucker|madarchod|behenchod|bhenchod|chutiya|gandu|lanjakodaka|లంజ|దెంగ|పూకు|మొడ్డ|సుల్లి/i.test(text);
}
export function generalWorkValue(selected: string, general: string, useGeneral: boolean): string {
  return (useGeneral ? general : selected).trim();
}