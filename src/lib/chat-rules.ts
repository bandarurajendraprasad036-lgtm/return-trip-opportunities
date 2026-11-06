import { z } from 'zod';

export const chatEntrySchema = z.object({
  receiver: z.string().uuid(),
  post: z.string().uuid().nullable(),
  body: z.string().trim().max(1000),
  phone: z.union([z.literal(''), z.string().regex(/^[6-9][0-9]{9}$/)]),
});
export const CHAT_IMAGE_LIMIT = 5 * 1024 * 1024;
export function validChatImage(bytes: Uint8Array, mime: string): boolean {
  if (bytes.length === 0 || bytes.length > CHAT_IMAGE_LIMIT) return false;
  if (mime === 'image/jpeg') return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (mime === 'image/png') return [137,80,78,71,13,10,26,10].every((n,i) => bytes[i] === n);
  if (mime === 'image/webp') return new TextDecoder().decode(bytes.slice(0,4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8,12)) === 'WEBP';
  return false;
}