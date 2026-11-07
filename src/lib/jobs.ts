export const JOB_CATEGORIES = [
  { id: "driver", te: "డ్రైవర్", en: "Driver" },
  { id: "shopkeeper", te: "షాప్ పని", en: "Shopkeeper" },
  { id: "labour", te: "కూలి / మేస్త్రి", en: "Labour" },
  { id: "security", te: "సెక్యూరిటీ", en: "Security" },
  { id: "farm", te: "వ్యవసాయం", en: "Farm" },
  { id: "teacher", te: "ఉపాధ్యాయుడు", en: "Teacher" },
  { id: "other", te: "ఇతర", en: "Other" },
] as const;

export const CITIES = ["Hyderabad", "Delhi", "Bombay", "Warangal", "Karimnagar", "Vijayawada", "Guntur", "Visakhapatnam", "Bangalore", "Chennai"];
export const ANYWHERE = "anywhere";
export const FREE_DAILY_ALERTS = 5;
export { MEMBERSHIP_AMOUNT as PRIME_PRICE } from '@/lib/membership';
export const DEFAULT_CITY = "Hyderabad";

/** Matches a post location against a city/district/state query; "anywhere" matches all. */
export function locationMatches(location: string | null | undefined, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q || q === ANYWHERE) return true;
  return (location ?? "").toLowerCase().includes(q);
}
