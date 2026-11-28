import { supabase } from '@/integrations/supabase/client';
import { enablePush, pushDeviceId, deviceSound } from './firebase-push';
import { registerPushDevice } from './push-client';
import { playTapBell } from './bell';

export async function ringChat(other: string, post?: string) {
  playTapBell();
  // Start permission from the actual tap; denying phone alerts never removes the inbox.
  const push = enablePush();
  const result = await supabase.rpc('ring_chat', { _other: other, ...(post ? { _post: post } : {}) });
  if (result.error) throw result.error;
  if (!result.data) throw new Error('CHAT_PAIR_REQUIRED');
  const registered = await push;
  if (registered.status === 'registered' && registered.token) {
    await registerPushDevice({ data: { id: pushDeviceId(), token: registered.token, sound: deviceSound() } }).catch(() => undefined);
  }
  return registered.status;
}