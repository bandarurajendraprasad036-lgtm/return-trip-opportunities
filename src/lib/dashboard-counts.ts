import type { Post } from '@/components/PostCard';
import { jobIsVisible } from '@/lib/post-publication';
import { isCar } from '@/lib/vehicle-types';

export const DASHBOARD_LISTS = ['vehicles', 'localVehicles', 'returnVehicles', 'localGoods', 'returnGoods', 'cars', 'jobs', 'seekers', 'employers'] as const;
export type DashboardList = (typeof DASHBOARD_LISTS)[number];
export const DASHBOARD_LIST_LABELS: Record<DashboardList, string> = {
  vehicles: 'మొత్తం వాహనాలు', localVehicles: 'స్థానిక వాహనాలు', returnVehicles: 'తిరుగు వాహనాలు',
  localGoods: 'స్థానిక సరకు వాహనాలు', returnGoods: 'తిరుగు సరకు వాహనాలు', cars: 'కార్లు',
  jobs: 'మొత్తం పని ప్రకటనలు', seekers: 'పని కావాలి', employers: 'పని ఇస్తాను',
};
/** Public listing page that shows the currently visible records of each list. */
export type PublicPage = { to: '/vehicles'; category: 'goods' | 'returns' | 'cars' } | { to: '/work'; kind: 'seeker' | 'employer' };
export const DASHBOARD_PUBLIC_PAGE: Record<DashboardList, PublicPage> = {
  vehicles: { to: '/vehicles', category: 'goods' }, localVehicles: { to: '/vehicles', category: 'goods' }, returnVehicles: { to: '/vehicles', category: 'returns' },
  localGoods: { to: '/vehicles', category: 'goods' }, returnGoods: { to: '/vehicles', category: 'returns' }, cars: { to: '/vehicles', category: 'cars' },
  jobs: { to: '/work', kind: 'seeker' }, seekers: { to: '/work', kind: 'seeker' }, employers: { to: '/work', kind: 'employer' },
};
export function parseDashboardList(value: unknown): DashboardList | undefined {
  return DASHBOARD_LISTS.find(key => key === value);
}
const norm = (v: string | null | undefined) => v?.trim().toLocaleLowerCase() || '';
/** Same rule as the vehicle pages: local means identical From and To. */
export function isLocalTrip(p: Pick<Post, 'from_place' | 'to_place'>) {
  return !!norm(p.from_place) && norm(p.from_place) === norm(p.to_place);
}
export function postInList(p: Post, list: DashboardList) {
  const vehicle = p.module === 'vehicle';
  const car = isCar(p.vehicle_type);
  switch (list) {
    case 'vehicles': return vehicle;
    case 'localVehicles': return vehicle && isLocalTrip(p);
    case 'returnVehicles': return vehicle && !isLocalTrip(p);
    case 'localGoods': return vehicle && !car && isLocalTrip(p);
    case 'returnGoods': return vehicle && !car && !isLocalTrip(p);
    case 'cars': return vehicle && car;
    case 'jobs': return p.module === 'job';
    case 'seekers': return p.module === 'job' && p.kind === 'seeker';
    case 'employers': return p.module === 'job' && p.kind === 'employer';
  }
}
export type ListCount = { total: number; visible: number };
/** Counts every stored record and, separately, the records that listing pages show right now. */
export function dashboardCounts(posts: Post[], now = new Date()): Record<DashboardList, ListCount> {
  const out = Object.fromEntries(DASHBOARD_LISTS.map(k => [k, { total: 0, visible: 0 }])) as Record<DashboardList, ListCount>;
  for (const p of posts) for (const k of DASHBOARD_LISTS) if (postInList(p, k)) { out[k].total++; if (jobIsVisible(p, now)) out[k].visible++; }
  return out;
}
