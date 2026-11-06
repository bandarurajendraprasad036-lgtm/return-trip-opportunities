import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { chatEntrySchema, CHAT_IMAGE_LIMIT, validChatImage } from '@/lib/chat-rules';

export const sendChatEntry = createServerFn({ method:'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    if (!(input instanceof FormData)) throw new Error('Invalid form');
    const entry = chatEntrySchema.parse({ receiver:input.get('receiver'), post:input.get('post') || null, body:input.get('body') || '', phone:input.get('phone') || '' });
    const image = input.get('image');
    if (image && (!(image instanceof File) || image.size>CHAT_IMAGE_LIMIT)) throw new Error('చిత్రం పరిమాణం ఎక్కువ · Image too large');
    return { ...entry, image:image instanceof File && image.size>0 ? image : null };
  }).handler(async ({data,context}) => {
    const allowed = await context.supabase.rpc('can_post_chat',{_post:data.post as string,_other:data.receiver});
    if (allowed.error || !allowed.data) throw new Error('ముందుగా ప్రకటన గంట నొక్కండి · Ring the post bell first');
    if (!data.body && !data.phone && !data.image) throw new Error('వివరాలు నమోదు చేయండి · Enter details');
    let path = '';
    const {supabaseAdmin} = await import('@/integrations/supabase/client.server');
    if (data.image) {
      const bytes = new Uint8Array(await data.image.arrayBuffer());
      if (!validChatImage(bytes,data.image.type)) throw new Error('సరైన చిత్రం ఎంచుకోండి · Invalid image');
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
    return {id:saved.data.id};
  });

export const viewChatImage = createServerFn({method:'POST'}).middleware([requireSupabaseAuth])
  .inputValidator((input:unknown) => z.object({message:z.string().uuid()}).parse(input))
  .handler(async ({data,context}) => {
    const row=await context.supabase.from('messages').select('image_path,sender_id,receiver_id').eq('id',data.message).maybeSingle();
    if (row.error || !row.data?.image_path || ![row.data.sender_id,row.data.receiver_id].includes(context.userId)) throw new Error('చిత్రం అందుబాటులో లేదు · Image unavailable');
    const signed=await context.supabase.storage.from('chat-images').createSignedUrl(row.data.image_path,60);
    if(signed.error || !signed.data?.signedUrl) throw new Error('చిత్రం తెరవలేకపోయాం · Image unavailable');
    return {url:signed.data.signedUrl};
  });