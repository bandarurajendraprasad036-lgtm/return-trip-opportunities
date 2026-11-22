import type { PostDetails } from '@/lib/post-access';

/** Only fields projected by the consent/payment-checked details RPC; never a profile fallback. */
export function consentedPostDetails(details: PostDetails): PostDetails {
  const { description, goods_type, capacity_tons, trip_date, created_at, vehicle_photo_path, public_photo, public_brand, contact_phone, vehicle_name, vehicle_number, driver_name } = details;
  return Object.fromEntries(Object.entries({ description, goods_type, capacity_tons, trip_date, created_at, vehicle_photo_path, public_photo, public_brand, contact_phone, vehicle_name, vehicle_number, driver_name }).filter(([, value]) => value !== undefined));
}

// Discovery is not a private conversation or an administrator record.
export function anonymousPostDetails(details: PostDetails): PostDetails {
  return {
    goods_type: details.goods_type ?? null,
    capacity_tons: details.capacity_tons ?? null,
    trip_date: details.trip_date ?? null,
  };
}