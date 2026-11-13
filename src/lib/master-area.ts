import { useEffect, useState } from 'react';
const KEY = 'gayatri-selected-area';
const EVENT = 'gayatri-selected-area-change';
export function normalizeArea(value: string) { return value.trim().toLocaleLowerCase(); }
export function matchesArea(value: string | null | undefined, selected: string) {
  return !!normalizeArea(selected) && normalizeArea(value || '') === normalizeArea(selected);
}
export function useMasterArea(fallback = '') {
  const [area, update] = useState(fallback);
  useEffect(() => {
    const sync = () => { const saved = localStorage.getItem(KEY); if (saved !== null) update(saved); };
    sync(); window.addEventListener(EVENT, sync); window.addEventListener('storage', sync);
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener('storage', sync); };
  }, []);
  const setArea = (value: string) => {
    const next = value.slice(0, 80); update(next); localStorage.setItem(KEY, next); window.dispatchEvent(new Event(EVENT));
  };
  return [area, setArea] as const;
}