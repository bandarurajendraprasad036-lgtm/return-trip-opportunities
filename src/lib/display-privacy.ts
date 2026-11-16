import type { PostDetails } from '@/lib/post-access';

// Discovery is not a private conversation or an administrator record.
export function anonymousPostDetails(details: PostDetails): PostDetails {
  return {
    goods_type: details.goods_type ?? null,
    capacity_tons: details.capacity_tons ?? null,
    trip_date: details.trip_date ?? null,
  };
}