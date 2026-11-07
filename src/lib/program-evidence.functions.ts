import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { validChatImage } from '@/lib/chat-rules';
import { SHARE_IMAGES } from '@/lib/account-program';

export const submitProgramEvidence = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ paths: z.array(z.string().max(200)).length(SHARE_IMAGES), post: z.string().uuid().optional() }).parse(input))
  .handler(async ({ data, context }) => {
    const program = await context.supabase.from('account_programs').select('user_id').eq('user_id', context.userId).maybeSingle();
    if (program.error || !program.data) throw new Error('ముందుగా మీ వివరాలు నింపండి · Complete profile first');
    if (data.paths.some(path => !path.startsWith(`${context.userId}/`))) throw new Error('మీ ఆధారాలు మాత్రమే పంపండి · Own files only');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const hashes: string[] = [];
    for (const path of data.paths) {
      const file = await supabaseAdmin.storage.from('sharing-evidence').download(path);
      if (file.error || !file.data) throw new Error('చిత్రం రాలేదు · Image unavailable');
      const bytes = new Uint8Array(await file.data.arrayBuffer());
      if (!validChatImage(bytes, file.data.type)) throw new Error('సరైన చిత్రం ఇవ్వండి · Invalid image');
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      hashes.push(Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join(''));
    }
    if (new Set(hashes).size !== SHARE_IMAGES) throw new Error('ఒకే చిత్రం మళ్లీ వాడకండి · Distinct images required');
    const result = await supabaseAdmin.rpc('activate_program_sharing', { _user: context.userId, _paths: data.paths, _hashes: hashes, ...(data.post ? { _post: data.post } : {}) });
    if (result.error) throw new Error(result.error.code === '23505' ? 'ఇదే ఆధారం ఇప్పటికే పంపారు · Evidence already used' : 'ఆధారాలు నమోదు కాలేదు · Could not save evidence');
    return { id: result.data };
  });

export const openProgramEvidence = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const role = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (role.error || !role.data) throw new Error('నిర్వాహకులకు మాత్రమే · Admin only');
    const claim = await context.supabase.from('program_evidence').select('*').eq('id', data.id).single();
    if (claim.error || !claim.data || Date.parse(claim.data.expires_at) <= Date.now()) throw new Error('చిత్రాల గడువు ముగిసింది · Images expired');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const result = await supabaseAdmin.storage.from('sharing-evidence').createSignedUrls(claim.data.paths, 60);
    if (result.error) throw new Error('చిత్రాలు రాలేదు · Images unavailable');
    return { urls: result.data.flatMap(row => row.signedUrl ? [row.signedUrl] : []) };
  });