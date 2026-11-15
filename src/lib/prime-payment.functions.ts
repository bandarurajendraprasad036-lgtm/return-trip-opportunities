import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { CHAT_IMAGE_LIMIT, validChatImage } from '@/lib/chat-rules';

export type PrimePaymentResult = { status: 'approved' | 'pending' };

export const submitPrimePayment = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    if (!(input instanceof FormData)) throw new Error('Invalid form');
    const amount = z.coerce.number().int().refine(v => v === 80 || v === 100).parse(input.get('amount') ?? 100);
    const beneficiary = z.string().uuid().nullable().parse(input.get('beneficiary') || null);
    const image = input.get('image');
    if (!(image instanceof File) || !image.size || image.size > CHAT_IMAGE_LIMIT) throw new Error('IMAGE_REQUIRED');
    return { amount, beneficiary, image };
  })
  .handler(async ({ data, context }): Promise<PrimePaymentResult> => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const adminId = (await supabaseAdmin.rpc('support_admin_id')).data as string | null;
    if (!adminId) throw new Error('ADMIN_MISSING');
    const bytes = new Uint8Array(await data.image.arrayBuffer());
    if (!validChatImage(bytes, data.image.type)) throw new Error('IMAGE_INVALID');
    // Stable proof identity is not a bank transaction number or payment confirmation.
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const reference = `screenshot:${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')}`;
    const ext = data.image.type === 'image/png' ? 'png' : data.image.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `${context.userId}/${crypto.randomUUID()}.${ext}`;
    const upload = await supabaseAdmin.storage.from('chat-images').upload(path, bytes, { contentType: data.image.type, upsert: false });
    if (upload.error) throw new Error('UPLOAD_FAILED');
    const saved = await supabaseAdmin.from('messages').insert({ sender_id: context.userId, receiver_id: adminId, body: `కొత్త పేమెంట్ వచ్చింది. ₹${data.amount} స్క్రీన్ షాట్ చూడండి`, image_path: path, needs_admin: true }).select('id').single();
    if (saved.error || !saved.data) { await supabaseAdmin.storage.from('chat-images').remove([path]); throw new Error('SAVE_FAILED'); }
    const user = data.beneficiary ?? context.userId;
    const grant = await supabaseAdmin.rpc('register_membership_evidence', { _payer: context.userId, _user: user, _amount: data.amount, _reference: reference, _message: saved.data.id });
    if (grant.error) {
      if (grant.error.message.includes('REVIEW_PENDING')) return { status: 'pending' };
      throw new Error(grant.error.message.includes('REFERENCE_ALREADY_USED') ? 'REFERENCE_ALREADY_USED' : 'REGISTER_FAILED');
    }
    const requestId = grant.data as string;

    // Owner decision: no automatic approval; an admin checks the bank and approves.
    const held = await supabaseAdmin.rpc('hold_membership_evidence_for_admin', { _id: requestId });
    if (held.error) throw new Error('REVIEW_HOLD_FAILED');
    return { status: 'pending' };
  });
