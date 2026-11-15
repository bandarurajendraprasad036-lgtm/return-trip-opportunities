import { supabase } from '@/integrations/supabase/client';
import type { BellBoardSection } from './bell-board';

// Browser-side read: has_paid_bell and list_area_bell_board authorize the signed-in caller and return anonymous rows only.
export async function loadBellBoard(section: BellBoardSection, area: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { paid: false, rows: [] };
  const access = await supabase.rpc('has_paid_bell', { _user: auth.user.id });
  if (access.error) throw access.error;
  if (!access.data && ['goods', 'returns', 'cars'].includes(section)) return { paid: false, rows: [] };
  const trimmed = area.slice(0, 80).trim();
  if (!trimmed) return { paid: !!access.data, rows: [] };
  const result = await supabase.rpc('list_area_bell_board', { _section: section, _area: trimmed });
  if (result.error) throw result.error;
  return { paid: !!access.data, rows: result.data ?? [] };
}
