import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
export function useAccountProgram(userId?: string) {
  return useQuery({ queryKey: ['account-program', userId], enabled: Boolean(userId), queryFn: async () => {
    if (!userId) return null;
    const result = await supabase.from('account_programs').select('*').eq('user_id', userId).maybeSingle();
    if (result.error) throw result.error;
    return result.data;
  } });
}