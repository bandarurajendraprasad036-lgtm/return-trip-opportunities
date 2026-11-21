import { useQuery } from '@tanstack/react-query';
import { SignedImg } from '@/components/SignedImg';
import { useNavigate } from '@tanstack/react-router';
import { BellRing, MessageCircle, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useMe } from '@/lib/session';
import { BELL_BOARD_REFRESH_MS } from '@/lib/bell-board-refresh';
import type { BellBoardSection } from '@/lib/bell-board';

export function IncomingBellList({ section, post, hideEmpty = false }: { section: BellBoardSection; post?: string | undefined; hideEmpty?: boolean }) {
  const { data: me } = useMe();
  const nav = useNavigate();
  const { data: rows = [], isPending, isError } = useQuery({
    queryKey: ['incoming-bells', me?.id, section, post], enabled: !!me,
    refetchInterval: BELL_BOARD_REFRESH_MS,
    queryFn: async () => {
      const result = await supabase.rpc('my_incoming_bell_contacts', { _section: section, ...(post ? { _post: post } : {}) });
      if (result.error) throw result.error;
      return result.data;
    },
  });
  if (!me) return null;
  if (hideEmpty && !isPending && !isError && !rows.length) return null;
  async function open(id: string, source: string) {
    const result = await supabase.rpc('open_incoming_bell_chat', { _id: id, _source: source, _section: section });
    const pair = result.data?.[0];
    if (result.error || !pair) { toast.error('సంభాషణ తెరుచుకోలేదు. మళ్లీ ప్రయత్నించండి'); return; }
    await nav({ to: '/chat/$userId', params: { userId: pair.other_id }, search: { post: source === 'free' ? undefined : pair.post_id ?? undefined } });
  }
  return <section data-subscription-exempt className="space-y-3 border-y py-4" aria-label="మీ ప్రకటనకు గంట కొట్టిన వాళ్ళు">
    <h2 className="text-xl font-bold">మీ ప్రకటనకు గంట కొట్టిన వాళ్ళు</h2>
    {isPending ? <p role="status">జాబితా వస్తోంది</p> : isError ? <p role="alert">జాబితా రాలేదు. మళ్లీ ప్రయత్నించండి</p> : !rows.length ? <p>మీ ప్రకటనకు ఇంకా ఎవరూ గంట కొట్టలేదు</p> : rows.map(row => {
      const digits = row.phone.replace(/\D/g, '').slice(-10);
      const name = row.full_name.trim() || digits || 'వివరాలు దాచారు';
      const canDial = digits.length === 10;
      return <div key={`${row.source}-${row.id}`} className="flex min-h-20 w-full items-center gap-2 rounded-md border border-primary p-2">
        {row.photo ? <SignedImg src={row.photo} alt="" className="size-16 shrink-0 rounded-full border-2 border-primary object-cover" /> : <span aria-hidden className="flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary text-3xl font-bold text-primary-foreground">{(name[0] ?? '?').toUpperCase()}</span>}
        <span className="min-w-0 flex-1 break-words" translate="no"><span className="block text-xl font-bold leading-tight">{name}</span>{digits && name !== digits && <span className="block text-lg font-semibold">{digits}</span>}<span className="block text-sm">{row.need} · {row.area}</span></span>
        <div className="flex shrink-0 items-center gap-1">
          <Button size="icon" className="size-11 [&_svg]:size-6" aria-label={`${name} తో చాట్`} onClick={() => void open(row.id, row.source)}><MessageCircle className="size-6" /></Button>
          <span role="img" aria-label="గంట కొట్టారు" className="flex size-11 items-center justify-center rounded-md border border-primary text-primary"><BellRing className="size-6" /></span>
          {canDial ? <Button asChild size="icon" variant="outline" className="size-11 [&_svg]:size-6"><a href={`tel:+91${digits}`} aria-label={`ఫోన్ ${digits}`}><Phone className="size-6" /></a></Button> : <Button size="icon" variant="outline" className="size-11 [&_svg]:size-6" disabled aria-label="ఫోన్ నంబర్ లేదు"><Phone className="size-6" /></Button>}
        </div>
      </div>;
    })}
  </section>;
}