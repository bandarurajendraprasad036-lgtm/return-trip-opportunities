import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MEMBERSHIP_AMOUNT, FREE_POSTS } from '@/lib/current-membership';

export const PRIME99_AMOUNT = MEMBERSHIP_AMOUNT;
export const MONTHLY_POST_LIMIT = FREE_POSTS;
export type Prime99 = { active: boolean; provisional?: boolean; bell_active?: boolean; alerts_ready?: boolean; alerts_start_at?: string | null; ends_at: string | null; amount: number };
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