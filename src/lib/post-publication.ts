export const MONTHLY_PAID_JOB_LIMIT = 3;
export function paidJobSlots(used: number) { return Math.max(0, MONTHLY_PAID_JOB_LIMIT - Math.max(0, used)); }
export function jobIsVisible(post: { status: string; job_expires_at?: string | null; visible_after?: string | null }, now = new Date()) {
  return post.status === 'active' && (!post.job_expires_at || Date.parse(post.job_expires_at) > now.getTime()) && (!post.visible_after || Date.parse(post.visible_after)<=now.getTime());
}