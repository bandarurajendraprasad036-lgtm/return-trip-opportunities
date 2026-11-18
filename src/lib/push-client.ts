import { supabase } from '@/integrations/supabase/client';

// Browser-side device registration: RLS (own_push_devices + active_account_required) authorizes the caller,
// so phone alerts work on every hosting, including hosts without server environment.
async function ownId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('ముందు ప్రవేశించండి · Sign in first');
  return data.user.id;
}
export async function registerPushDevice({ data }: { data: { id: string; token: string; sound: boolean } }) {
  const user = await ownId();
  const result = await supabase.from('push_devices').upsert({ id: data.id, user_id: user, token: data.token, sound_enabled: data.sound, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (result.error) throw new Error('ఫోన్ నమోదు కాలేదు · Device registration failed');
  return { registered: true };
}
export async function updatePushSound({ data }: { data: { id: string; sound: boolean } }) {
  const user = await ownId();
  const result = await supabase.from('push_devices').update({ sound_enabled: data.sound }).eq('id', data.id).eq('user_id', user);
  if (result.error) throw new Error('శబ్దం ఎంపిక నమోదు కాలేదు · Sound preference not saved');
  return { saved: true };
}
