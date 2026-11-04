export const AREA_SCOPES = [
  { id: 'local', te: 'స్థానిక ప్రాంతం', en: 'Local' },
  { id: 'district', te: 'జిల్లా స్థాయి', en: 'District' },
  { id: 'state', te: 'రాష్ట్రవ్యాప్తంగా', en: 'State' },
  { id: 'country', te: 'దేశవ్యాప్తంగా', en: 'India' },
] as const;
export type AreaScope = typeof AREA_SCOPES[number]['id'];
export interface Area { location?: string | null; from_place?: string | null; district?: string; state?: string; area_scope?: string; }
const norm = (v?: string | null) => (v ?? '').trim().toLowerCase();
export function areaMatches(post: Area, scope: string, location: string, district: string, state: string) {
  if (scope === 'country') return true;
  if (scope === 'state') return !!norm(state) && norm(post.state) === norm(state);
  if (scope === 'district') return !!norm(district) && norm(post.district) === norm(district) && !!norm(state) && norm(post.state) === norm(state);
  return !norm(location) || norm(post.location || post.from_place).includes(norm(location));
}