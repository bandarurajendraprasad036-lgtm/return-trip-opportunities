import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const registerPushDevice = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ id: z.string().uuid(), token: z.string().min(20).max(4096), sound: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.from('push_devices').upsert({ id: data.id, user_id: context.userId, token: data.token, sound_enabled: data.sound, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    if (result.error) throw new Error('ఫోన్ నమోదు కాలేదు · Device registration failed');
    return { registered: true };
  });
export const updatePushSound = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ id: z.string().uuid(), sound: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.from('push_devices').update({ sound_enabled: data.sound }).eq('id', data.id).eq('user_id', context.userId);
    if (result.error) throw new Error('శబ్దం ఎంపిక నమోదు కాలేదు · Sound preference not saved');
    return { saved: true };
  });
export const removePushDevice = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.from('push_devices').delete().eq('id', data.id).eq('user_id', context.userId);
    if (result.error) throw new Error('ఫోన్ సూచనలు ఆగలేదు · Could not stop device push');
    return { removed: true };
  });