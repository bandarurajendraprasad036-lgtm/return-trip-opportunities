import { z } from "zod";
export const serviceReviewSchema = z.object({ rating: z.number().int().min(1).max(5), body: z.string().trim().min(3).max(1000) });
export function canPublishPhoto(type: string, size: number, consent: boolean) {
  return consent && ["image/jpeg", "image/png", "image/webp"].includes(type) && size > 0 && size <= 5 * 1024 * 1024;
}
export function canReviewService(authorId: string, profileId: string) { return authorId !== profileId; }