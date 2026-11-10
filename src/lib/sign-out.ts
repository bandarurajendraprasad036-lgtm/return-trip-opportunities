import type { QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export async function clearAccountSession(queryClient: QueryClient) {
  await queryClient.cancelQueries();
  queryClient.clear();
  try {
    await supabase.auth.signOut();
  } finally {
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      window.sessionStorage.clear();
    }
  }
}
