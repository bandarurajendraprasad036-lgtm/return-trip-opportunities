import { supabase } from '@/integrations/supabase/client';
import { CHAT_IMAGE_LIMIT, validChatImage } from '@/lib/chat-rules';

export async function uploadMembershipScreenshot(input: {
  userId: string;
  image: File;
  amount: number;
  beneficiary?: string | undefined;
}) {
  const { userId, image, amount, beneficiary } = input;
  if (image.size === 0 || image.size > CHAT_IMAGE_LIMIT) throw new Error('చిత్రం పరిమాణం ఎక్కువగా ఉంది');
  const bytes = new Uint8Array(await image.arrayBuffer());
  if (!validChatImage(bytes, image.type)) throw new Error('సరైన చిత్రం ఎంచుకోండి');

  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const reference = `screenshot:${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')}`;
  const extension = image.type === 'image/png' ? 'png' : image.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const uploaded = await supabase.storage.from('chat-images').upload(path, bytes, { contentType: image.type, upsert: false });
  if (uploaded.error) throw new Error('చిత్రం పంపలేకపోయాం. మళ్లీ ప్రయత్నించండి');

  const saved = await supabase.rpc('submit_membership_screenshot', {
    _amount: amount,
    _beneficiary: beneficiary ?? userId,
    _reference: reference,
    _path: path,
  });
  if (saved.error) {
    await supabase.storage.from('chat-images').remove([path]);
    if (saved.error.message.includes('REFERENCE_ALREADY_USED')) throw new Error('ఈ ఫోటో ఇప్పటికే పంపారు');
    if (saved.error.message.includes('REVIEW_PENDING')) throw new Error('మీ చెల్లింపు ఫోటో ఇప్పటికే పరిశీలనలో ఉంది');
    throw new Error('చిత్రం నమోదు కాలేదు. మళ్లీ ప్రయత్నించండి');
  }
  if (!saved.data) throw new Error('చిత్రం నమోదు కాలేదు. మళ్లీ ప్రయత్నించండి');
  return saved.data;
}
