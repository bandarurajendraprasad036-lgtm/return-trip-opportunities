import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { bellBoardSection } from '@/lib/bell-board';
export const fetchBellBoard = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth])
  .inputValidator((data: { section: string }) => ({ section: bellBoardSection(data.section) }))
  .handler(async ({ context, data }) => {
    const access = await context.supabase.rpc('has_paid_bell', { _user: context.userId });
    if (access.error) throw new Error('మళ్లీ ప్రయత్నించండి');
    if (!access.data) return { paid: false, rows: [] };
    const result = await context.supabase.rpc('list_anonymous_bell_board', { _section: data.section });
    if (result.error) throw new Error('జాబితా రాలేదు');
    return { paid: true, rows: result.data };
  });