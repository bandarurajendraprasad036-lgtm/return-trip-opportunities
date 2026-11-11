import type { Post } from '@/components/PostCard';
import { jobIsVisible } from '@/lib/post-publication';
import { isCar } from '@/lib/vehicle-types';
export type VehiclePageKind = 'goods' | 'returns' | 'cars';
export function vehiclePageRows(posts: Post[], kind: VehiclePageKind, from = '', to = '', date = '') {
  const norm = (v: string | null | undefined) => v?.trim().toLocaleLowerCase() || '';
  return posts.filter(p => p.module === 'vehicle' && jobIsVisible(p)
    && (!from || norm(p.from_place).includes(norm(from))) && (!to || norm(p.to_place).includes(norm(to)))
    && (!date || p.trip_date === date)
    && (kind === 'cars' ? isCar(p.vehicle_type) : !isCar(p.vehicle_type)
      && (kind === 'goods' ? !!norm(p.from_place) && norm(p.from_place) === norm(p.to_place) : norm(p.from_place) !== norm(p.to_place))));
}