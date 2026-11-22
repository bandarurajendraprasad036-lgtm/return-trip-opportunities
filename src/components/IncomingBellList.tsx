import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SignedImg } from '@/components/SignedImg';
import { useHydrated, useNavigate } from '@tanstack/react-router';
import { BellRing, MessageCircle, MessageSquare, Phone, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useMe } from '@/lib/session';
import { BELL_BOARD_REFRESH_MS } from '@/lib/bell-board-refresh';
import type { BellBoardSection } from '@/lib/bell-board';
import { bellDateTime } from '@/lib/bell-details';

export function IncomingBellList({ section, post, hideEmpty = false }: { section: BellBoardSection; post?: string | undefined; hideEmpty?: boolean }) {
  const hydrated = useHydrated();
  const { data: me } = useMe();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: rows = [], isPending, isError } = useQuery({
    queryKey: ['incoming-bells', me?.id, section, post], enabled: hydrated && (!!me || !!post),
    refetchInterval: BELL_BOARD_REFRESH_MS,
    queryFn: async () => {
      const times = await supabase.rpc('incoming_bell_times', { _section: section, ...(post ? { _post: post } : {}) });
      if (times.error) throw times.error;
      const withTime = <T extends { id: string; source: string }>(row: T) => ({ ...row, rang_at: times.data.find(time => time.id === row.id && time.source === row.source)?.rang_at ?? null });
      if (post) {
        const result = await supabase.rpc('list_post_bell_contacts', { _post: post });
        if (result.error) throw result.error;
        return result.data.map(withTime);
      }
      const result = await supabase.rpc('my_incoming_bell_contacts', { _section: section });
      if (result.error) throw result.error;
      const hidden = await supabase.from('dashboard_dismissals').select('item_id,source').eq('kind', 'bell');
      if (hidden.error) throw hidden.error;
      return result.data.filter(row => !hidden.data.some(d => d.item_id === row.id && d.source === row.source)).map(row => withTime({ ...row, can_delete: true }));
    },
  });
  if (!hydrated || (!me && !post)) return null;
  if (hideEmpty && !isPending && !isError && !rows.length) return null;
  async function open(id: string, source: string, other: string, own: boolean) {
    if (!me) { toast.error('సంభాషణ కోసం మీ ఖాతాలోకి ప్రవేశించండి'); return; }
    if (!own) { await nav({ to: '/chat/$userId', params: { userId: other }, search: { post } }); return; }
    const result = await supabase.rpc('open_incoming_bell_chat', { _id: id, _source: source, _section: section });
    const pair = result.data?.[0];
    if (result.error || !pair) { toast.error('సంభాషణ తెరుచుకోలేదు. మళ్లీ ప్రయత్నించండి'); return; }
    await nav({ to: '/chat/$userId', params: { userId: pair.other_id }, search: { post: source === 'free' ? undefined : pair.post_id ?? undefined } });
  }
  return <section data-subscription-exempt className="space-y-3 border-y py-4" aria-label="మీ ప్రకటనకు గంట కొట్టిన వాళ్ళు">
    <h2 className="text-xl font-bold">{post && !rows.some(row => row.can_delete) ? 'ఈ ప్రకటనకు గంట కొట్టిన వాళ్ళు' : 'మీ ప్రకటనకు గంట కొట్టిన వాళ్ళు'}</h2>
    {isPending ? <p role="status">జాబితా వస్తోంది</p> : isError ? <p role="alert">జాబితా రాలేదు. మళ్లీ ప్రయత్నించండి</p> : !rows.length ? <p>మీ ప్రకటనకు ఇంకా ఎవరూ గంట కొట్టలేదు</p> : rows.map(row => {
      const digits = row.phone.replace(/\D/g, '').slice(-10);
      const name = row.full_name.trim() || digits || 'వివరాలు దాచారు';
      const canDial = digits.length === 10;
      const dateTime = bellDateTime(row.rang_at);
      return <div key={`${row.source}-${row.id}`} className="flex min-h-20 w-full items-center gap-2 rounded-md border border-primary p-2">
        {row.photo ? <SignedImg src={row.photo} alt="" className="size-16 shrink-0 rounded-full border-2 border-primary object-cover" /> : <span aria-hidden className="flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary text-3xl font-bold text-primary-foreground">{(name[0] ?? '?').toUpperCase()}</span>}
        <span className="min-w-0 flex-1 break-words" translate="no"><span className="block text-xl font-bold leading-tight">{name}</span>{digits && name !== digits && <span className="block text-lg font-semibold">{digits}</span>}<span className="block text-sm">{row.need} · {row.area}</span>{dateTime ? <span className="block text-sm">గంట కొట్టిన తేదీ / సమయం: <time dateTime={row.rang_at ?? undefined}>{dateTime}</time></span> : <span className="block text-sm">గంట కొట్టిన సమయం అందుబాటులో లేదు</span>}</span>
        <div className="grid shrink-0 grid-cols-2 items-center gap-1 sm:flex">
          <Button size="icon" className="size-11 [&_svg]:size-6" aria-label={`${name} తో చాట్`} onClick={() => void open(row.id, row.source, row.other_id, row.can_delete)}><MessageCircle className="size-6" /></Button>
          {canDial ? <Button asChild size="icon" variant="outline" className="size-11 [&_svg]:size-6"><a href={`https://wa.me/91${digits}`} target="_blank" rel="noopener noreferrer" aria-label={`${name} కు వాట్సాప్ సందేశం`} title="వాట్సాప్ సందేశం"><MessageSquare className="size-6" /></a></Button> : <Button size="icon" variant="outline" className="size-11 [&_svg]:size-6" disabled aria-label="వాట్సాప్ కోసం నంబర్ లేదు"><MessageSquare className="size-6" /></Button>}
          <span role="img" aria-label="గంట కొట్టారు" className="flex size-11 items-center justify-center rounded-md border border-primary text-primary"><BellRing className="size-6" /></span>
          {canDial ? <Button asChild size="icon" variant="outline" className="size-11 [&_svg]:size-6"><a href={`tel:+91${digits}`} aria-label={`ఫోన్ ${digits}`}><Phone className="size-6" /></a></Button> : <Button size="icon" variant="outline" className="size-11 [&_svg]:size-6" disabled aria-label="ఫోన్ నంబర్ లేదు"><Phone className="size-6" /></Button>}
          {row.can_delete && <Button size="icon" variant="ghost" className="size-11" aria-label="గంట వివరాలు తొలగించండి" title="గంట వివరాలు తొలగించండి" onClick={async () => {
            if (!window.confirm('ఈ గంట వివరాలను మీ ఖాతా నుంచి తొలగించాలా?')) return;
            const r = await supabase.rpc('dismiss_incoming_bell', { _id: row.id, _source: row.source, _section: section, ...(post ? { _post: post } : {}) });
            if (r.error) { toast.error('తొలగించలేకపోయాం'); return; }
            await qc.invalidateQueries({ queryKey: ['incoming-bells'] });
          }}><Trash2 /></Button>}
        </div>
      </div>;
    })}
  </section>;
}