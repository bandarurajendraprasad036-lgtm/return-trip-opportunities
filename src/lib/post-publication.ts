export function jobIsVisible(post: { status: string; job_expires_at?: string | null; visible_after?: string | null }, now = new Date()) {
  return post.status === 'active' && (!post.job_expires_at || Date.parse(post.job_expires_at) > now.getTime()) && (!post.visible_after || Date.parse(post.visible_after)<=now.getTime());
}