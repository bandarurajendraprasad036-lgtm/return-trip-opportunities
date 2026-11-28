import { supabase } from '@/integrations/supabase/client';
import { CHAT_IMAGE_LIMIT, validChatImage } from '@/lib/chat-rules';
import { validVehiclePackage } from '@/lib/vehicle-packages';

async function uploadScreenshot(userId: string, image: File) {
  if (image.size === 0 || image.size > CHAT_IMAGE_LIMIT) throw new Error('చిత్రం పరిమాణం ఎక్కువగా ఉంది');
  const bytes = new Uint8Array(await image.arrayBuffer());
  if (!validChatImage(bytes, image.type)) throw new Error('సరైన చిత్రం ఎంచుకోండి');

  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const reference = `screenshot:${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')}`;
  const extension = image.type === 'image/png' ? 'png' : image.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const uploaded = await supabase.storage.from('chat-images').upload(path, bytes, { contentType: image.type, upsert: false });
  if (uploaded.error) throw new Error('చిత్రం పంపలేకపోయాం. మళ్లీ ప్రయత్నించండి');
  return { reference, path };
}

async function removeFailedUpload(path: string) {
  await supabase.storage.from('chat-images').remove([path]);
}

export async function uploadMembershipScreenshot(input: {
  userId: string;
  image: File;
  amount: number;
  beneficiary?: string | undefined;
}) {
  const { userId, image, amount, beneficiary } = input;
  if (!validVehiclePackage(amount) || (beneficiary && beneficiary !== userId)) throw new Error('₹100 లేదా ₹349 చందా ఎంచుకోండి');
  const { reference, path } = await uploadScreenshot(userId, image);
  const saved = await supabase.rpc('submit_membership_screenshot', {
    _amount: amount,
    _beneficiary: beneficiary ?? userId,
    _reference: reference,
    _path: path,
  });
  if (saved.error) {
    await removeFailedUpload(path);
    if (saved.error.message.includes('REFERENCE_ALREADY_USED')) throw new Error('ఈ ఫోటో ఇప్పటికే పంపారు');
    if (saved.error.message.includes('REVIEW_PENDING')) throw new Error('మీ చెల్లింపు ఫోటో ఇప్పటికే పరిశీలనలో ఉంది');
    throw new Error('చిత్రం నమోదు కాలేదు. మళ్లీ ప్రయత్నించండి');
  }
  if (!saved.data) throw new Error('చిత్రం నమోదు కాలేదు. మళ్లీ ప్రయత్నించండి');
  return saved.data;
}

export async function uploadAdditionalRecipientScreenshot(input: { userId: string; image: File; recipientId: string }) {
  const { userId, image, recipientId } = input;
  const { reference, path } = await uploadScreenshot(userId, image);
  const saved = await supabase.rpc('submit_additional_recipient_screenshot', { _recipient: recipientId, _reference: reference, _path: path });
  if (saved.error) {
    await removeFailedUpload(path);
    if (saved.error.message.includes('REFERENCE_ALREADY_USED')) throw new Error('ఈ ఫోటో ఇప్పటికే పంపారు');
    if (saved.error.message.includes('REVIEW_PENDING')) throw new Error('ఈ నంబరు చెల్లింపు ఫోటో ఇప్పటికే పరిశీలనలో ఉంది');
    if (saved.error.message.includes('VERIFIED_RECIPIENT_CONSENT_REQUIRED')) throw new Error('నంబరు యజమాని కోడ్‌తో నిర్ధారించి అనుమతి ఇవ్వాలి');
    throw new Error('చిత్రం నమోదు కాలేదు. మళ్లీ ప్రయత్నించండి');
  }
  if (!saved.data) throw new Error('చిత్రం నమోదు కాలేదు. మళ్లీ ప్రయత్నించండి');
  return saved.data;
}
