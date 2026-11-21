import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { MessageCircle, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useMe } from '@/lib/session';
import { BELL_BOARD_REFRESH_MS } from '@/lib/bell-board-refresh';
import type { BellBoardSection } from '@/lib/bell-board';

export function IncomingBellList({ section, post }: { section: BellBoardSection; post?: string | undefined }) {
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
      return <div key={`${row.source}-${row.id}`} className="flex min-h-20 w-full items-center gap-3 rounded-md border border-primary p-2">
        {row.photo ? <img src={row.photo} alt="" className="size-14 shrink-0 rounded-full object-cover" /> : <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">{(row.full_name.trim()[0] ?? '?').toUpperCase()}</span>}
        <span className="min-w-0 flex-1 break-words" translate="no"><span className="block font-bold">{row.full_name || 'పేరు లేదు'}</span>{digits && <span className="block">{digits}</span>}<span className="block text-sm">{row.need} · {row.area}</span></span>
        <div className="flex shrink-0 flex-col gap-1">
          <Button className="min-h-11 gap-1 px-2" onClick={() => void open(row.id, row.source)}><MessageCircle />చాట్</Button>
          {digits.length === 10 && <Button asChild variant="outline" className="min-h-11 gap-1 px-2"><a href={`tel:+91${digits}`} aria-label={`ఫోన్ ${digits}`}><Phone />ఫోన్</a></Button>}
        </div>
      </div>;
    })}
  </section>;
}