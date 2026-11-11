import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const PRIME99_AMOUNT = 99;
export const MONTHLY_POST_LIMIT = 3;
export type Prime99 = { active: boolean; ends_at: string | null; amount: number };
export function unfinishedHomeActions(bellActivated: boolean, installed: boolean, profileCompleted: boolean) {
  return { bell: !bellActivated, install: !installed, profile: !profileCompleted };
}
export function homeActionPending(action: 'bell' | 'install' | 'profile', completed: boolean) {
  return unfinishedHomeActions(action === 'bell' && completed, action === 'install' && completed, action === 'profile' && completed)[action];
}
export function usePrime99(userId?: string) {
  return useQuery({ queryKey: ['prime99', userId], enabled: Boolean(userId), refetchInterval: 10000, queryFn: async () => {
    const result = await supabase.rpc('my_prime99');
    if (result.error) throw result.error;
    return result.data as unknown as Prime99;
  } });
}