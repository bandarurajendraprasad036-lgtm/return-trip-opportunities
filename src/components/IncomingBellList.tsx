import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PrivateBellDisplay } from '@/components/PrivateBellDisplay';
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
      const result = await supabase.rpc('my_incoming_bells', { _section: section, ...(post ? { _post: post } : {}) });
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
    {isPending ? <p role="status">జాబితా వస్తోంది</p> : isError ? <p role="alert">జాబితా రాలేదు. మళ్లీ ప్రయత్నించండి</p> : !rows.length ? <p>మీ ప్రకటనకు ఇంకా ఎవరూ గంట కొట్టలేదు</p> : rows.map(row => <Button key={`${row.source}-${row.id}`} variant="outline" className="h-auto min-h-20 w-full justify-start gap-3 whitespace-normal text-left" onClick={() => void open(row.id, row.source)}>
      <PrivateBellDisplay /><span className="min-w-0 flex-1 break-words" translate="no">{row.need}<span className="block font-normal">{row.area}</span></span><MessageCircle className="shrink-0" /><span>మాట్లాడండి</span>
    </Button>)}
  </section>;
}