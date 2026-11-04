import type { Post } from '@/components/PostCard';

export type VehicleSection = 'local' | 'return' | 'advance';
const normalized = (value: string | null | undefined) => value?.trim().toLocaleLowerCase() ?? '';

// Without map data, only identical named endpoints establish a local trip.
export function vehicleSection(post: Post, today: string): VehicleSection {
  const from = normalized(post.from_place);
  if (from && from === normalized(post.to_place)) return 'local';
  return post.trip_date && post.trip_date > today ? 'advance' : 'return';
}

export function homeVehicles(posts: Post[], from: string, to: string, today: string, section: VehicleSection) {
  const start = normalized(from), end = normalized(to);
  if (!start && !end) return [];
  return posts.filter(post => post.status === 'active' && post.module === 'vehicle'
    && (!start || normalized(post.from_place).includes(start))
    && (!end || normalized(post.to_place).includes(end))
    && vehicleSection(post, today) === section);
}

export function homeJobs(posts: Post[], location: string, kind: 'seeker' | 'employer') {
  const place = normalized(location);
  if (!place) return [];
  return posts.filter(post => post.status === 'active' && post.module === 'job'
    && post.kind === kind && normalized(post.location).includes(place));
}