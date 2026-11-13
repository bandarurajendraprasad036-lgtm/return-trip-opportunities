import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { fetchBellBoard } from '@/lib/bell-board.functions';
import { BELL_BOARD_LABELS, bellBoardSection, type BellBoardSection } from '@/lib/bell-board';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useMasterArea } from '@/lib/master-area';
import { IndiaPlaceInput } from '@/components/IndiaPlaceInput';
const options = (section: BellBoardSection, area = '') => queryOptions({ queryKey: ['bell-board', section, area], queryFn: () => fetchBellBoard({ data: { section, area } }), staleTime: 0, refetchInterval: 15000 });
export const Route = createFileRoute('/_authenticated/bell-board')({
  validateSearch: (search: Record<string, unknown>) => ({ section: bellBoardSection(search['section']) }),
  loaderDeps: ({ search }) => ({ section: search.section }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(options(deps.section)),
  head: ({ match }) => { const title = `${BELL_BOARD_LABELS[match.search.section]} — గాయత్రి వన్`; const description = 'పేర్లు, మొబైల్, ఫోటోలు లేని గంటల జాబితా. చెల్లించినవారికి వ్యక్తిగత చాట్.'; return { meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }; },
  component: Board,
});
function Board() {
  const { section } = Route.useSearch(); const [area,setArea] = useMasterArea(); const { data } = useSuspenseQuery(options(section, area));
  const nav = useNavigate(); const [busy, setBusy] = useState(false);
  async function chat(id: string, source: string) { if (busy) return; setBusy(true); try { const result = await supabase.rpc('open_anonymous_bell_chat', { _id: id, _source: source }); if (result.error || !result.data) { toast.error('చాట్ తెరుచుకోలేదు'); return; } await nav({ to: '/chat/$userId', params: { userId: result.data }, search: { post: undefined } }); } finally { setBusy(false); } }
  return <main className="space-y-4 p-4"><h1 className="break-words text-2xl font-bold">{BELL_BOARD_LABELS[section]}</h1><IndiaPlaceInput id="bell-board-area" value={area} onChange={setArea} placeholder="మీ ప్రాంతం పేరు" /><p translate="no">{area}</p>{!data.paid && <><p>₹100 పే చేసి చాట్ చేయండి</p><Button asChild><Link to="/dashboard">₹100 చెల్లింపు</Link></Button></>}{!area.trim() ? <p>మీ ప్రాంతం పేరు రాయండి</p> : <>{!data.rows.length && <p>ఈ ప్రాంతంలో ఇంకా ఎవరూ గంట కొట్టలేదు</p>}{data.rows.map(row => <article key={`${row.source}-${row.id}`} className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3"><div className="min-w-0"><p translate="no" className="break-words">{row.area}</p><p translate="no" className="break-words font-bold">{row.need}</p></div><Button variant="outline" size="icon" aria-label="చాట్" disabled={busy || !data.paid} onClick={() => void chat(row.id, row.source)}><MessageCircle /></Button></article>)}</>}</main>;
}