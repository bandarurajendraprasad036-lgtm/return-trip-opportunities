import { z } from "zod";
import { indianDay } from "@/lib/daily-devotional";

export const capacityInput = z.coerce.number().positive().max(100);
export function welcomeDue(lastDay: string | null, now: Date) {
  return lastDay !== indianDay(now);
}
export function replyGroupKey(message: { post_id: string | null; sender_id: string; receiver_id: string }, me: string) {
  return message.post_id ?? (message.sender_id === me ? message.receiver_id : message.sender_id);
}