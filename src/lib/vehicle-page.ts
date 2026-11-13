import type { Post } from '@/components/PostCard';
import { jobIsVisible } from '@/lib/post-publication';
import { isCar } from '@/lib/vehicle-types';
export type VehiclePageKind = 'goods' | 'returns' | 'cars';
// Static types only: these entries are not registered or available vehicles.
export const VEHICLE_CATALOG: Record<VehiclePageKind, string[]> = {
  goods: ['ఆటో · Auto', 'ఆపే ట్రాలీ · Ape trolley', 'టాటా ఏస్ · Tata Ace', 'బొలెరో పికప్ · Bolero Pickup', 'డీసీఎం · DCM', 'లారీ · Lorry'],
  returns: ['ఆపే ట్రాలీ · Ape trolley', 'టాటా ఏస్ · Tata Ace', 'బొలెరో పికప్ · Bolero Pickup', 'డీసీఎం · DCM', 'లారీ · Lorry'],
  cars: ['ఇన్నోవా · Innova', 'స్విఫ్ట్ డిజైర్ · Swift Dzire', 'ఎర్టిగా · Ertiga', 'బొలెరో · Bolero'],
};
export function vehicleDisplay(paid: boolean, loading: boolean, failed: boolean, rowCount: number) {
  return { showCatalog: !paid || (!loading && !failed && rowCount === 0), showListings: paid };
}
export function vehiclePageRows(posts: Post[], kind: VehiclePageKind, from = '', to = '', date = '') {
  const norm = (v: string | null | undefined) => v?.trim().toLocaleLowerCase() || '';
  return posts.filter(p => p.module === 'vehicle' && jobIsVisible(p)
    && (!from || norm(p.from_place).includes(norm(from))) && (!to || norm(p.to_place).includes(norm(to)))
    && (!date || p.trip_date === date)
    && (kind === 'cars' ? isCar(p.vehicle_type) : !isCar(p.vehicle_type)
      && (kind === 'goods' ? !!norm(p.from_place) && norm(p.from_place) === norm(p.to_place) : norm(p.from_place) !== norm(p.to_place))));
}