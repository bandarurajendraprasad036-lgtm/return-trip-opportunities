import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';

export const submitPostEvidence = createServerFn({method:'POST'}).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({post:z.string().uuid(),purpose:z.enum(['early_publication','notifications']),paths:z.array(z.string().max(200)).min(10).max(11)}).parse(input))
  .handler(async ({data,context}) => {
    const owned = await context.supabase.from('posts').select('id').eq('id',data.post).eq('user_id',context.userId).maybeSingle();
    if (owned.error || !owned.data || data.paths.some(path => !path.startsWith(`${context.userId}/`))) throw new Error('మీ ప్రకటన ఆధారాలనే పంపండి · Own post required');
    const {supabaseAdmin} = await import('@/integrations/supabase/client.server');
    const hashes:string[]=[];
    for (const path of data.paths) {
      const result = await supabaseAdmin.storage.from('sharing-evidence').download(path);
      if (result.error || !result.data || result.data.size>5*1024*1024 || !['image/jpeg','image/png','image/webp'].includes(result.data.type)) throw new Error('చిత్రం సరైంది కాదు · Invalid image');
      const bytes=await result.data.arrayBuffer();
      const hash=await crypto.subtle.digest('SHA-256',bytes);
      hashes.push(Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join(''));
    }
    const saved=await supabaseAdmin.rpc('submit_verified_post_evidence',{_user:context.userId,_post:data.post,_purpose:data.purpose,_paths:data.paths,_hashes:hashes});
    if(saved.error) throw new Error(saved.error.code==='23505'?'ఇదే చిత్రం ఇప్పటికే పంపారు · Image already submitted':saved.error.message);
    return {id:saved.data};
  });

export const openPostEvidence = createServerFn({method:'POST'}).middleware([requireSupabaseAuth])
  .inputValidator((input:unknown)=>z.object({id:z.string().uuid()}).parse(input))
  .handler(async({data,context})=>{
    const role=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});
    if(role.error || !role.data) throw new Error('నిర్వాహకులకు మాత్రమే · Admin only');
    const claim=await context.supabase.from('post_sharing_evidence').select('*').eq('id',data.id).single();
    if(claim.error || !claim.data || Date.parse(claim.data.expires_at)<=Date.now()) throw new Error('ఆధారాల 24 గంటల గడువు ముగిసింది · Evidence expired');
    const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
    const result=await supabaseAdmin.storage.from('sharing-evidence').createSignedUrls(claim.data.paths,Math.min(60,Math.max(1,Math.floor((Date.parse(claim.data.expires_at)-Date.now())/1000))));
    if(result.error) throw new Error('చిత్రాలు రాలేదు · Could not load');
    return result.data.flatMap(item=>item.signedUrl?[item.signedUrl]:[]);
  });