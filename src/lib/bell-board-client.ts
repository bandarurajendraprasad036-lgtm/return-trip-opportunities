import { supabase } from '@/integrations/supabase/client';
import type { BellBoardSection } from './bell-board';

// Browser-side read: has_paid_bell and list_area_bell_board authorize the signed-in caller and return anonymous rows only.
export async function loadBellBoard(section: BellBoardSection, area: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { paid: false, rows: [] };

  const access = await supabase.rpc('has_paid_bell', { _user: auth.user.id });
  if (access.error) throw access.error;

  // goods / returns / cars కి మాత్రమే పేమెంట్ అడ్డు - work / service కి అడ్డు లేదు
  if (!access.data && ['goods', 'returns', 'cars'].includes(section)) {
    return { paid: false, rows: [] };
  }

  // ఏరియా ఖాళీగా ఉన్నా లిస్ట్ రావాలి - ఇదే మెయిన్ ఫిక్స్!
  // ఇంతకుముందు ఇక్కడ `if (!trimmed) return rows: []` ఉండేది - దాన్ని తీసేసాం!
  const trimmed = (area || '').slice(0, 80).trim();

  // ఏరియా ని ఒకేలా చెయ్యడం - Mancherial / mancherial / MANCHERIAL అన్నీ ఒకటే!
  const normalizedArea = trimmed.toLowerCase();

  const result = await supabase.rpc('list_area_bell_board', {
    _section: section,
    _area: normalizedArea,
  });
  if (result.error) throw result.error;

  return { paid: !!access.data, rows: result.data ?? [] };
}
