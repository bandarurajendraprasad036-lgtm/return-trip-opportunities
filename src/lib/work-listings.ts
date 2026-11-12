import type { Post } from '@/components/PostCard';
import { jobIsVisible } from '@/lib/post-publication';

export const WORK_SERVICE_TYPE = 'service';
export function workListings(posts: Post[], location: string, kind: 'seeker' | 'employer', services = false) {
  const place = location.trim().toLocaleLowerCase();
  return posts.filter(post => jobIsVisible(post) && post.module === 'job' && post.kind === kind
    && (post.service_type === WORK_SERVICE_TYPE) === services
    && (!place || post.area_scope === 'country' || post.location?.trim().toLocaleLowerCase() === place));
}