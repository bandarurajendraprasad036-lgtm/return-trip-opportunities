import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Bell, MessageCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { freeWorkAction } from '@/lib/free-work.functions';
import { FREE_WORK_SECTIONS, freeWorkLabel, type FreeWorkSection } from '@/lib/free-work';
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
function isFree(section: BellBoardSection): section is FreeWorkSection { return (FREE_WORK_SECTIONS as readonly string[]).includes(section); }
// The four work/service boards are free: anonymous ringers list with bell and private chat, never a payment prompt.
function FreeBoard({ section }: { section: FreeWorkSection }) {
  const [area, setArea] = useMasterArea(); const nav = useNavigate(); const qc = useQueryClient(); const act = useServerFn(freeWorkAction); const [busy, setBusy] = useState(false);
  const { data: rows = [], isPending, isError } = useQuery({ queryKey: ['free-work-interests', section, area, ''], refetchInterval: 10000, queryFn: async () => { const r = await supabase.rpc('list_free_work_interests', { _section: section, _area: area.trim(), _category: '' }); if (r.error) throw r.error; return r.data; } });
  async function run(action: 'ring' | 'chat', id: string) { if (busy) return; setBusy(true); try { const result = await act({ data: { action, section, id, source: 'interest', area, category: '' } }); await qc.invalidateQueries({ queryKey: ['free-work-interests'] }); if (action === 'chat') { if (result.target) await nav({ to: '/chat/$userId', params: { userId: result.target }, search: { post: undefined } }); else toast.info('ఇది మీ సొంత నమోదు'); } else toast.success('గంట వెళ్ళింది'); } catch { toast.error('కాలేదు; మళ్లీ ప్రయత్నించండి'); } finally { setBusy(false); } }
  return <main className="space-y-4 p-4"><h1 className="break-words text-2xl font-bold">{BELL_BOARD_LABELS[section]}</h1><IndiaPlaceInput id="bell-board-area" value={area} onChange={setArea} placeholder="మీ ప్రాంతం పేరు" /><p translate="no">{area}</p>
    {isPending ? <p>వస్తున్నాయి</p> : isError ? <p role="alert">జాబితా రాలేదు</p> : !rows.length ? <p>ఇంకా ఎవరూ గంట కొట్టలేదు</p> : rows.map(row => <article key={`${row.source}-${row.id}`} className="flex items-center gap-2 rounded-lg border bg-card p-3"><div className="min-w-0 flex-1"><p translate="no" className="break-words font-bold">{freeWorkLabel(row.category)}</p><p translate="no" className="break-words text-sm">{row.area}</p></div><Button variant="outline" size="icon" className="size-11 shrink-0" aria-label="గంట కొట్టండి" disabled={busy} onClick={() => void run('ring', row.id)}><Bell /></Button><Button variant="outline" className="h-11 shrink-0 px-3" aria-label="చాట్" disabled={busy} onClick={() => void run('chat', row.id)}><MessageCircle />Chat</Button></article>)}
    <Button asChild variant="outline" className="h-auto min-h-14 w-full text-lg"><Link to="/">వెనక్కి</Link></Button></main>;
}
function Board() {
  const { section } = Route.useSearch();
  return isFree(section) ? <FreeBoard section={section} /> : <PaidBoard />;
}
function PaidBoard() {
  const { section } = Route.useSearch(); const [area,setArea] = useMasterArea(); const { data } = useSuspenseQuery(options(section, area));
  const nav = useNavigate(); const [busy, setBusy] = useState(false);
  async function chat(id: string, source: string) { if (busy) return; setBusy(true); try { const result = await supabase.rpc('open_anonymous_bell_chat', { _id: id, _source: source }); if (result.error || !result.data) { toast.error('చాట్ తెరుచుకోలేదు'); return; } await nav({ to: '/chat/$userId', params: { userId: result.data }, search: { post: undefined } }); } finally { setBusy(false); } }
  return <main className="space-y-4 p-4"><h1 className="break-words text-2xl font-bold">{BELL_BOARD_LABELS[section]}</h1><IndiaPlaceInput id="bell-board-area" value={area} onChange={setArea} placeholder="మీ ప్రాంతం పేరు" /><p translate="no">{area}</p>{!data.paid && <><p>₹100 పే చేసి చాట్ చేయండి</p><Button asChild><Link to="/dashboard">₹100 చెల్లింపు</Link></Button></>}{!area.trim() ? <p>మీ ప్రాంతం పేరు రాయండి</p> : <>{!data.rows.length && <p>ఈ ప్రాంతంలో ఇంకా ఎవరూ గంట కొట్టలేదు</p>}{data.rows.map(row => <article key={`${row.source}-${row.id}`} className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3"><div className="min-w-0"><p translate="no" className="break-words">{row.area}</p><p translate="no" className="break-words font-bold">{row.need}</p></div><Button variant="outline" size="icon" aria-label="చాట్" disabled={busy || !data.paid} onClick={() => void chat(row.id, row.source)}><MessageCircle /></Button></article>)}</>}</main>;
}