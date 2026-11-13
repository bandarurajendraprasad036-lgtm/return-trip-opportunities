import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { chatEntrySchema, CHAT_IMAGE_LIMIT, validChatImage } from '@/lib/chat-rules';
import { paymentUtr } from '@/lib/november-profile';
import { payerUpiSchema, paymentImageDecision, paymentImageFeedback, type PaymentReading } from '@/lib/payment-image';

export const sendChatEntry = createServerFn({ method:'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    if (!(input instanceof FormData)) throw new Error('Invalid form');
    const entry = chatEntrySchema.parse({ receiver:input.get('receiver'), post:input.get('post') || null, body:input.get('body') || '', phone:input.get('phone') || '' });
    const image = input.get('image');
    if (image && (!(image instanceof File) || image.size>CHAT_IMAGE_LIMIT)) throw new Error('చిత్రం పరిమాణం ఎక్కువ · Image too large');
    const amount = input.get('membership_amount') ? z.coerce.number().int().refine(value => value === 80 || value === 100).parse(input.get('membership_amount')) : null;
    const beneficiary = z.string().uuid().nullable().parse(input.get('beneficiary') || null);
    const payerUpi = input.get('payer_upi') ? payerUpiSchema.parse(input.get('payer_upi')) : null;
    if (amount && (!payerUpi || !(image instanceof File) || !image.size || !paymentUtr(entry.body))) throw new Error('లావాదేవీ సంఖ్య, మీ చెల్లింపు చిరునామా, స్క్రీన్ షాట్ తప్పనిసరి');
    return { ...entry, amount, beneficiary, payerUpi, image:image instanceof File && image.size>0 ? image : null };
  }).handler(async ({data,context}) => {
    const allowed = await context.supabase.rpc('can_post_chat',{...(data.post ? {_post:data.post} : {}),_other:data.receiver});
    if (allowed.error || !allowed.data) throw new Error('ముందుగా ప్రకటన గంట నొక్కండి · Ring the post bell first');
    if (!data.body && !data.phone && !data.image) throw new Error('వివరాలు నమోదు చేయండి · Enter details');
    let path = '';
    let reading: PaymentReading | null = null;
    const receivingAdmin = await context.supabase.rpc('has_role', { _user_id: data.receiver, _role: 'admin' });
    if (data.amount && (data.post || receivingAdmin.error || !receivingAdmin.data)) throw new Error('చెల్లింపు ఆధారం నిర్వాహకుడికే పంపాలి');
    const {supabaseAdmin} = await import('@/integrations/supabase/client.server');
    if (data.image) {
      const bytes = new Uint8Array(await data.image.arrayBuffer());
      if (!validChatImage(bytes,data.image.type)) throw new Error('సరైన చిత్రం ఎంచుకోండి · Invalid image');
      // Only explicitly submitted payment evidence is read; ordinary chat images stay untouched.
      if (!data.post && receivingAdmin.data && paymentUtr(data.body)) {
        if (!data.payerUpi) throw new Error('మీ చెల్లింపు చిరునామా కూడా ఇవ్వండి');
        try {
          const { readPaymentImage } = await import('@/lib/payment-reading.server');
          reading = await readPaymentImage(bytes, data.image.type);
        } catch { throw new Error('చిత్రం పరిశీలించలేకపోయాం. వివరాలు అలాగే ఉన్నాయి; మళ్లీ ప్రయత్నించండి.'); }
      }
      const ext = data.image.type==='image/png'?'png':data.image.type==='image/webp'?'webp':'jpg';
      path = `${context.userId}/${crypto.randomUUID()}.${ext}`;
      const upload = await supabaseAdmin.storage.from('chat-images').upload(path,bytes,{contentType:data.image.type,upsert:false});
      if (upload.error) throw new Error('చిత్రం పంపలేకపోయాం · Upload failed');
    }
    const saved = await context.supabase.from('messages').insert({ sender_id:context.userId,receiver_id:data.receiver,post_id:data.post,body:data.body,chat_phone:data.phone,image_path:path }).select('id').single();
    if (saved.error || !saved.data) {
      if (path) await supabaseAdmin.storage.from('chat-images').remove([path]);
      throw new Error('వివరాలు భద్రపడలేదు · Message not saved');
    }
    const admin = receivingAdmin;
    let provisional = false;
    let membershipStatus: string | null = null;
    if (!data.post && admin.data) {
      let reference = paymentUtr(data.body);
      if (!reference && path) {
        const previous = await context.supabase.from('messages').select('body').eq('sender_id',context.userId).eq('receiver_id',data.receiver).gte('created_at',new Date(Date.now()-30*60*1000).toISOString()).order('created_at',{ascending:false}).limit(10);
        reference = previous.data?.map(row=>paymentUtr(row.body)).find(value=>value!==null) ?? null;
      }
      if (reference && path) {
        if (!reading || !data.payerUpi) throw new Error('లావాదేవీ సంఖ్య, మీ చెల్లింపు చిరునామాతో స్క్రీన్ షాట్ మళ్లీ పంపండి');
        const decision=paymentImageDecision(reference,data.payerUpi,reading);
        const check=await supabaseAdmin.from('payment_image_checks').insert({message_id:saved.data.id,payer_id:context.userId,entered_upi:data.payerUpi,observed_upi:reading.payer_upi,observed_utr:reading.utr,match_status:decision});
        if(check.error) throw new Error('చిత్రం పరిశీలన భద్రపడలేదు; మళ్లీ ప్రయత్నించండి');
        if(decision!=='matched') {
          const feedback=paymentImageFeedback(decision);
          return {id:saved.data.id,provisional:false,membershipStatus:null,feedback};
        }
        const price = data.amount ?? (await context.supabase.rpc('my_membership_price')).data ?? 100;
        const grant = await supabaseAdmin.rpc('register_membership_evidence', { _payer: context.userId, _user: data.beneficiary ?? context.userId, _amount: price, _reference: reference, _message: saved.data.id });
        if (grant.error && !grant.error.message.includes('REVIEW_PENDING')) throw new Error('చెల్లింపు ఆధారం నమోదు కాలేదు. అడ్మిన్ తో చాట్ చేయండి.');
        const request = await context.supabase.from('membership_requests').select('status').eq('payer_id',context.userId).eq('user_id',data.beneficiary ?? context.userId)
          .eq(grant.data ? 'id' : 'status', grant.data ?? 'pending').order('submitted_at',{ascending:false}).limit(1).maybeSingle();
        if (request.error || !request.data) throw new Error('చెల్లింపు పరిశీలన వివరాలు రాలేదు. మళ్లీ చూడండి.');
        membershipStatus = request.data.status;
        provisional = membershipStatus === 'pending';
      } else if (reference) {
        await supabaseAdmin.from('messages').insert({ sender_id: data.receiver, receiver_id: context.userId, body: 'దయచేసి స్క్రీన్ షాట్ కూడా పంపండి', is_auto: true });
      }
    }
    return {id:saved.data.id, provisional, membershipStatus, feedback:null};
  });

export const viewChatImage = createServerFn({method:'POST'}).middleware([requireSupabaseAuth])
  .inputValidator((input:unknown) => z.object({message:z.string().uuid()}).parse(input))
  .handler(async ({data,context}) => {
    const row=await context.supabase.from('messages').select('image_path,sender_id,receiver_id').eq('id',data.message).maybeSingle();
    if (row.error || !row.data?.image_path) throw new Error('చిత్రం అందుబాటులో లేదు · Image unavailable');
    const participant = [row.data.sender_id,row.data.receiver_id].includes(context.userId);
    const role = await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});
    if (!participant && !role.data) throw new Error('చిత్రం అందుబాటులో లేదు · Image unavailable');
    if(!role.data){const check=await context.supabase.from('payment_image_checks').select('message_id').eq('message_id',data.message).maybeSingle();if(check.error||check.data)throw new Error('చెల్లింపు పరిశీలనలో ఉంది');}
    const signer = participant ? context.supabase : (await import('@/integrations/supabase/client.server')).supabaseAdmin;
    const signed=await signer.storage.from('chat-images').createSignedUrl(row.data.image_path,60);
    if(signed.error || !signed.data?.signedUrl) throw new Error('చిత్రం తెరవలేకపోయాం · Image unavailable');
    return {url:signed.data.signedUrl};
  });

export const deleteChatEntry = createServerFn({method:'POST'}).middleware([requireSupabaseAuth])
  .inputValidator((input:unknown) => z.object({message:z.string().uuid()}).parse(input))
  .handler(async ({data,context})=>{
    const row=await context.supabase.from('messages').select('id,image_path').eq('id',data.message).eq('sender_id',context.userId).maybeSingle();
    if(row.error || !row.data)throw new Error('మీ సందేశమే తొలగించండి · Own message required');
    const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
    if(row.data.image_path){const removed=await supabaseAdmin.storage.from('chat-images').remove([row.data.image_path]);if(removed.error)throw new Error('చిత్రం తొలగించలేకపోయాం · Could not remove image');}
    const removed=await supabaseAdmin.from('messages').delete().eq('id',data.message).eq('sender_id',context.userId);
    if(removed.error)throw new Error('సందేశం తొలగించలేకపోయాం · Could not delete');
    return {ok:true};
  });
export const scanPaymentEvidence = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    if (!(input instanceof FormData)) throw new Error('చిత్రం ఎంచుకోండి');
    const image = input.get('image');
    if (!(image instanceof File) || !image.size || image.size > CHAT_IMAGE_LIMIT) throw new Error('సరైన చిన్న చిత్రం ఎంచుకోండి');
    return image;
  }).handler(async ({ data, context }) => {
    const admin = await context.supabase.rpc('support_admin_id');
    if (admin.error || !admin.data) throw new Error('నిర్వాహకుడు అందుబాటులో లేరు');
    const active = await context.supabase.rpc('can_post_chat', { _other: admin.data });
    if (active.error || !active.data) throw new Error('మీ ఖాతాలో ఈ పని చేయలేరు');
    const bytes = new Uint8Array(await data.arrayBuffer());
    if (!validChatImage(bytes, data.type)) throw new Error('సరైన చిత్రం ఎంచుకోండి');
    try {
      const { readPaymentImage } = await import('@/lib/payment-reading.server');
      const reading = await readPaymentImage(bytes, data.type);
      return { reference: /^\d{12}$/.test(reading.utr) ? reading.utr : '', payerUpi: payerUpiSchema.safeParse(reading.payer_upi).success ? reading.payer_upi : '' };
    } catch { throw new Error('చిత్రం చదవలేకపోయాం. లావాదేవీ సంఖ్య మీరే ఇవ్వండి; పంపేటప్పుడు మళ్లీ తనిఖీ చేస్తాం.'); }
  });
