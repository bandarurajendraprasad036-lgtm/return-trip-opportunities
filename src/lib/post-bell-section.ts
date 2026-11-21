import type { BellBoardSection } from './bell-board';
import { vehicleDemandCategory } from './vehicle-demand';

/** Owner inbox sections follow the ad's purpose, not the opposite public service board. */
export function postBellSection(post: { module: string; kind: string; service_type: string | null; from_place: string | null; to_place: string | null; vehicle_type: string | null }): BellBoardSection {
  if (post.module === 'vehicle') return vehicleDemandCategory(post);
  if (post.service_type === 'service') return post.kind === 'seeker' ? 'service-wanted' : 'service-providers';
  return post.kind === 'seeker' ? 'work-wanted' : 'work-offered';
}