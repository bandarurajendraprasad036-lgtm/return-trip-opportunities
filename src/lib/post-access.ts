import { isCar } from '@/lib/vehicle-types';

export const POST_LIST_COLUMNS = 'id,user_id,module,kind,title,location,skill,salary,from_place,to_place,trip_date,vehicle_type,vehicle_name,goods_type,status,created_at,show_contact,category,area_scope,district,state,service_type,capacity_tons,job_expires_at,visible_after,visibility_notified_at' as const;
export function isGoodsPost(post: { module: string; vehicle_type?: string | null }) {
  return post.module === 'vehicle' && !isCar(post.vehicle_type);
}
export type PostDetails = { description?: string | null; goods_type?: string | null; capacity_tons?: number | null; trip_date?: string | null; public_photo?: string; public_brand?: string; contact_phone?: string; vehicle_name?: string | null; vehicle_number?: string | null; driver_name?: string | null };