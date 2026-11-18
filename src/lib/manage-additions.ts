import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { BELL_BOARD_REFRESH_MS } from '@/lib/bell-board-refresh';
export function useManageableAdditions() {
 const { data: me } = useMe();
 return useQuery({ queryKey: ['my-manageable-additions',me?.id], enabled: !!me, refetchInterval: BELL_BOARD_REFRESH_MS, queryFn: async () => {
  const result = await supabase.rpc('my_manageable_additions'); if (result.error) throw result.error; return result.data;
 }});
}