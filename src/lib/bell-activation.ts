import { supabase } from '@/integrations/supabase/client';

export function shouldShowProfileRequest(profileCompleted: boolean, bellActivatedAt: string | null | undefined) {
  return !profileCompleted && !bellActivatedAt;
}

export async function markAccountBellActivated(userId: string) {
  const result = await supabase.from('profiles').update({ bell_activated_at: new Date().toISOString() }).eq('id', userId).is('bell_activated_at', null);
  if (result.error) throw result.error;
}
