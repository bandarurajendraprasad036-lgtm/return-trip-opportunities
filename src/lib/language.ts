import { useSyncExternalStore } from 'react';
import catalog from './locales/interface.json';

export const LANGUAGES = [
  { code: 'te', name: 'తెలుగు' }, { code: 'hi', name: 'हिन्दी' },
  { code: 'en', name: 'English' }, { code: 'ta', name: 'தமிழ்' },
  { code: 'kn', name: 'ಕನ್ನಡ' }, { code: 'ml', name: 'മലയാളം' },
  { code: 'mr', name: 'मराठी' }, { code: 'bn', name: 'বাংলা' },
  { code: 'or', name: 'ଓଡ଼ିଆ' }, { code: 'pa', name: 'ਪੰਜਾਬੀ' },
  { code: 'gu', name: 'ગુજરાતી' }, { code: 'ur', name: 'اردو' },
] as const;
export type Language = typeof LANGUAGES[number]['code'];
export const DEFAULT_LANGUAGE: Language = 'te';
export const LANGUAGE_KEY = 'gayatri-language';
let selected: Language = DEFAULT_LANGUAGE;
const listeners = new Set<() => void>();
export function validLanguage(value: unknown): value is Language {
  return LANGUAGES.some(language => language.code === value);
}
export function setLanguage(value: Language) {
  selected = value;
  if (typeof document !== 'undefined') {
    document.documentElement.lang = value;
    // Keep the established layout; Urdu text uses its own natural direction.
    try { localStorage.setItem(LANGUAGE_KEY, value); } catch { /* Optional persistence. */ }
  }
  listeners.forEach(listener => listener());
}
export function restoreLanguage() {
  try { const value = localStorage.getItem(LANGUAGE_KEY); if (validLanguage(value)) setLanguage(value); } catch { /* Telugu fallback. */ }
}
export function useLanguage() {
  return useSyncExternalStore(listener => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => selected, () => DEFAULT_LANGUAGE);
}
const messages = catalog as Record<string, Partial<Record<Language, string>>>;
export function translateText(value: string, language: Language): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  let result = messages[normalized]?.[language];
  if (!result && normalized.includes(' · ')) {
    const parts = normalized.split(' · ');
    const preferred = language === 'te' ? parts[0] : parts[parts.length - 1];
    if (preferred) result = messages[preferred]?.[language];
  }
  if (!result) return value;
  const leading = value.match(/^\s*/)?.[0] ?? '';
  const trailing = value.match(/\s*$/)?.[0] ?? '';
  return `${leading}${result}${trailing}`;
}