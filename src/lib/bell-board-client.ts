import { supabase } from '@/integrations/supabase/client';
import type { BellBoardSection } from './bell-board';

// Browser-side read: has_paid_bell and list_area_bell_board authorize the signed-in caller and return anonymous rows only.
export async function loadBellBoard(section: BellBoardSection, area: string) {
  const { data: auth } = await supabase.auth.getUser();
  const access = auth.user ? await supabase.rpc('has_paid_bell', { _user: auth.user.id }) : { data: false, error: null };
  if (access.error) throw access.error;

  // చూడటం అందరికీ ఫ్రీ - goods / returns / cars అయినా సరే!
  // పేమెంట్ అడ్డు బెల్ కొట్టేటప్పుడు మాత్రమే, చూసేటప్పుడు కాదు!
  // అందుకే ఇక్కడ rows: [] తో ఆపడం లేదు!

  // ఏరియా ఖాళీగా ఉన్నా లిస్ట్ రావాలి - ఇదే మెయిన్ ఫిక్స్!
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
