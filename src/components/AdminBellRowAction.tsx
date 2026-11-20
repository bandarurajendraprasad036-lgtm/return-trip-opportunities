import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useMe } from '@/lib/session';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useManageableAdditions } from '@/lib/manage-additions';
export function AdminBellRowAction({ id, source, section }: { id: string; source: string; section: string }) {
  const { data: me } = useMe(); const qc = useQueryClient();
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false);
  const { data: manageable = [] } = useManageableAdditions();
  if (!me || (!me.isAdmin && !manageable.some(row => row.id === id && row.source === source && row.section === section))) return null;
  async function remove() {
    if (busy) return; setBusy(true);
    try {
      const result = await supabase.rpc('remove_my_addition', { _id: id, _source: source, _section: section });
      if (result.error || result.data !== true) throw new Error('NOT_REMOVED');
      setOpen(false); await qc.invalidateQueries(); toast.success('గంట నమోదు తొలగించారు.');
    } catch { toast.error('నమోదు తొలగించలేదు; మళ్లీ ప్రయత్నించండి.'); }
    finally { setBusy(false); }
  }
  return <><Button data-subscription-exempt variant="destructive" size="icon" className="size-11 shrink-0" aria-label="గంట నమోదు తొలగించండి" onClick={event => { event.stopPropagation(); setOpen(true); }}><Trash2 /></Button><Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}><DialogContent data-subscription-exempt aria-describedby={undefined} onClick={event => event.stopPropagation()}><DialogTitle>ఈ గంట నమోదు తొలగించాలా?</DialogTitle><p>ఇది అందరి జాబితాల నుంచి పోతుంది. ఖాతా, వ్యక్తిగత సంభాషణ తొలగించబడవు.</p><Button variant="destructive" disabled={busy} onClick={() => void remove()}>{busy ? 'తొలగిస్తున్నాం…' : 'అవును, తొలగించండి'}</Button></DialogContent></Dialog></>;
}