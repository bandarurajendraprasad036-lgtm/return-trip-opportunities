export type LocationFreshness = 'fresh' | 'aging' | 'stale' | 'unavailable';

/** Confirmed vehicle-location requirement: exactly five minutes is still fresh. */
export function locationFreshness(updatedAt: string | null, now: Date): LocationFreshness {
  if (!updatedAt) return 'unavailable';
  const age = now.getTime() - Date.parse(updatedAt);
  if (!Number.isFinite(age) || age < 0) return 'unavailable';
  if (age <= 5 * 60 * 1000) return 'fresh';
  if (age <= 15 * 60 * 1000) return 'aging';
  return 'stale';
}

export const LOCATION_FRESHNESS_LABELS: Record<LocationFreshness, string> = {
  fresh: 'తాజా · Fresh',
  aging: 'కొంత పాతది · Somewhat old',
  stale: 'పాతది · Old',
  unavailable: 'స్థానం సమయం అందుబాటులో లేదు · Update time unavailable',
};