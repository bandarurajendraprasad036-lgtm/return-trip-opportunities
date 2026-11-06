import { describe, expect, it } from 'vitest';
import { chatEntrySchema, validChatImage, CHAT_IMAGE_LIMIT } from '@/lib/chat-rules';

describe('private chat entry validation', () => {
  const entry = { receiver:'11111111-1111-4111-8111-111111111111', post:null, body:'', phone:'9876543210' };
  it('accepts a user-entered ten-digit mobile', () => expect(chatEntrySchema.safeParse(entry).success).toBe(true));
  it('rejects an invalid mobile', () => expect(chatEntrySchema.safeParse({...entry,phone:'123'}).success).toBe(false));
  it('rejects a fake image despite its image MIME type', () => expect(validChatImage(new TextEncoder().encode('<script>'), 'image/png')).toBe(false));
  it('accepts PNG signature', () => expect(validChatImage(new Uint8Array([137,80,78,71,13,10,26,10]),'image/png')).toBe(true));
  it('rejects files over five megabytes', () => expect(validChatImage(new Uint8Array(CHAT_IMAGE_LIMIT+1),'image/jpeg')).toBe(false));
});