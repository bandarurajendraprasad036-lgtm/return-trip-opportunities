import { isCar } from '@/lib/vehicle-types';
export function jobIsVisible(post: { status: string; module?: string; created_at?: string; from_place?: string | null; to_place?: string | null; vehicle_type?: string | null; trip_date?: string | null; job_expires_at?: string | null; visible_after?: string | null }, now = new Date()) {
  if (post.status !== 'active' || (post.job_expires_at && Date.parse(post.job_expires_at) <= now.getTime()) || (post.visible_after && Date.parse(post.visible_after) > now.getTime())) return false;
  if (post.module === 'job' && post.created_at && Date.parse(post.created_at) + 30 * 86400000 <= now.getTime()) return false;
  if (post.module === 'vehicle') {
    const from = post.from_place?.trim().toLocaleLowerCase();
    const localGoods = !isCar(post.vehicle_type) && !!from && from === post.to_place?.trim().toLocaleLowerCase();
    if (localGoods) return !!post.created_at && Date.parse(post.created_at) + 86400000 > now.getTime();
    const indiaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    return !!post.trip_date && post.trip_date >= indiaDate;
  }
  return true;
}