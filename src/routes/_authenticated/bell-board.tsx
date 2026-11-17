import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Bell, MessageCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { freeWorkClientAction } from '@/lib/free-work-client';
import { FREE_WORK_SECTIONS, freeWorkLabel, type FreeWorkSection } from '@/lib/free-work';
import { toast } from 'sonner';
import { loadBellBoard } from '@/lib/bell-board-client';
import { BELL_BOARD_LABELS, bellBoardSection, type BellBoardSection } from '@/lib/bell-board';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useMasterArea } from '@/lib/master-area';
import { IndiaPlaceInput } from '@/components/IndiaPlaceInput';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ResponsibilityNotice } from '@/components/ResponsibilityNotice';
import { rotateServicePriority } from '@/lib/service-priority';
import { PrivateBellDisplay } from '@/components/PrivateBellDisplay';

const options = (section: BellBoardSection, area = '') => queryOptions({ queryKey: ['bell-board', section, area], queryFn: () => loadBellBoard(section, area), staleTime: 0, refetchInterval: 15000 });

export const Route = createFileRoute('/_authenticated/bell-board')({
  validateSearch: (search: Record<string, unknown>): { section: BellBoardSection; category?: string | undefined } => ({ section: bellBoardSection(search['section']), category: typeof search['category'] === 'string' && search['category'].trim() ? search['category'].trim().slice(0, 60) : undefined }),
  loaderDeps: ({ search }) => ({ section: search.section }),
  loader: ({ context, deps }) => isFree(deps.section) ? undefined : context.queryClient.ensureQueryData(options(deps.section)),
  head: ({ match }) => { const title = `${BELL_BOARD_LABELS[match.search.section]} — గాయత్రి వన్`; const description = 'పేర్లు, మొబైల్, ఫోటోలు లేని గంటల జాబితా. చెల్లించినవారికి వ్యక్తిగత చాట్.'; return { meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }; },
  component: Board,
});

function isFree(section: BellBoardSection): section is FreeWorkSection { return (FREE_WORK_SECTIONS as readonly string[]).includes(section); }

// FREE - Jobs / Service: Bell = Chat vachindi ani SIGNAL. Bell kodithe chat auto open avvadu.
function FreeBoard({ section, category = '' }: { section: FreeWorkSection; category?: string }) {
  const [area, setArea] = useMasterArea(); const nav = useNavigate(); const qc = useQueryClient(); const act = freeWorkClientAction; const [busy, setBusy] = useState(false);
  const [rotation, setRotation] = useState(0);
  const priority = useQuery({ queryKey: ['service-priority', section, area, category], enabled: section === 'service-providers', refetchInterval: 10000, queryFn: async () => { const result = await supabase.rpc('list_service_priority', { _area: area.trim(), _category: category }); if (result.error) throw result.error; return result.data; } });
  const { data: rows = [], isPending, isError } = useQuery({ queryKey: ['free-work-interests', section, area, category], refetchInterval: 10000, queryFn: async () => { const r = await supabase.rpc('list_free_work_interests', { _section: section, _area: area.trim(), _category: category }); if (r.error) throw r.error; return r.data; } });
  const orderedProviders = rotateServicePriority(priority.data ?? [], rotation);

  // Bell: only signal - avatala vallaki vinabadali, chat vachindi ani artham avvali
  async function run(action: 'ring' | 'chat', id: string) {
    if (busy) return; setBusy(true);
    try {
      const result = await act({ data: { action, section, id, source: 'interest', area, category: '' } });
      await qc.invalidateQueries({ queryKey: ['free-work-interests'] });
      if (action === 'ring') {
        toast.success('గంట వెళ్ళింది - అవతల వాళ్ళకి వినబడింది, చాట్ వచ్చింది అని వాళ్ళకి తెలుస్తుంది');
      } else {
        if (result.target) await nav({ to: '/chat/$userId', params: { userId: result.target }, search: { post: undefined } });
        else toast.info('ఇది మీ సొంత నమోదు');
      }
    } catch { toast.error('కాలేదు; మళ్లీ ప్రయత్నించండి'); } finally { setBusy(false); }
  }

  return <main className="space-y-4 p-4"><h1 className="break-words text-2xl font-bold">{BELL_BOARD_LABELS[section]}</h1>{category && <div className="flex flex-wrap items-center gap-2"><p translate="no" className="break-words text-xl font-bold">{freeWorkLabel(category)} కోసం గంట కొట్టిన వాళ్ళు</p><Button asChild variant="outline" size="sm"><Link to="/bell-board" search={{ section }}>అన్నీ చూపించు</Link></Button></div>}<IndiaPlaceInput id="bell-board-area" value={area} onChange={setArea} placeholder="మీ ఊరి పేరు / మీ వాడ పేరు" />
    {section === 'service-providers' && <section className="space-y-3 border-y py-3"><h2 className="text-xl font-bold">ఈ ప్రాంతంలో సేవలు</h2>{priority.isPending ? <p role="status">సేవలు వస్తున్నాయి</p> : priority.isError ? <p role="alert">సేవలు రాలేదు</p> : orderedProviders.map(row => <article key={`${row.source}-${row.id}`} className="flex min-h-16 items-center gap-2 border-b py-3"><PrivateBellDisplay /><div className="min-w-0 flex-1"><p translate="no" className="break-words font-bold">{freeWorkLabel(row.category)}</p><p translate="no">{row.area}</p>{row.priority > 0 && <p className="text-primary">చందాతో ప్రత్యేక స్థానం</p>}</div><Button variant="outline" size="icon" aria-label="సేవ చాట్" disabled={busy} onClick={async () => { setRotation(value => value + 1); setBusy(true); try { const result = await act({ data: { action: 'ring', section, id: row.id, source: row.source === 'provider' ? 'provider' : row.source === 'post' ? 'post' : 'entry', area, category } }); if (result.target) await nav({ to: '/chat/$userId', params: { userId: result.target }, search: { post: undefined } }); else toast.info('ఇది మీ సొంత నమోదు'); } catch { toast.error('చాట్ తెరుచుకోలేదు'); } finally { setBusy(false); } }}><MessageCircle /></Button></article>)}</section>}
    {isPending ? <p>వస్తున్నాయి</p> : isError ? <p role="alert">జాబితా రాలేదు</p> : !rows.length ? <p>ఇంకా ఎవరూ గంట కొట్టలేదు</p> : rows.map(row => <article key={`${row.source}-${row.id}`} className="flex items-center gap-2 rounded-lg border bg-card p-3"><PrivateBellDisplay /><div className="min-w-0 flex-1"><p translate="no" className="break-words font-bold">{freeWorkLabel(row.category)}</p><p translate="no" className="break-words text-sm">{row.area}</p></div><Button variant="outline" size="icon" className="size-11 shrink-0" aria-label="గంట కొట్టండి" disabled={busy} onClick={() => void run('ring', row.id)}><Bell /></Button><Button variant="outline" className="h-11 shrink-0 px-3" aria-label="చాట్" disabled={busy} onClick={() => void run('chat', row.id)}><MessageCircle />Chat</Button></article>)}
    <Button asChild variant="outline" className="h-auto min-h-14 w-full text-lg"><Link to="/">వెనక్కి</Link></Button></main>;
}

function Board() {
  const { section, category } = Route.useSearch();
  return isFree(section) ? <FreeBoard key={`${section}-${category ?? ''}`} section={section} category={category ?? ""} /> : <PaidBoard />;
}

// PAID - Vehicle only: Display = Free + Blur. Touch = Rs.100. Paid = Only Bell + Chat. Peru/Photo/Number eppudu kanabadadu.
function PaidBoard() {
  const { section } = Route.useSearch(); const [area,setArea] = useMasterArea(); const { data } = useSuspenseQuery(options(section, area));
  const nav = useNavigate(); const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [showPay, setShowPay] = useState(false);

  async function ring() { if (busy || !selected) return; setBusy(true); try { const result = await supabase.rpc('ring_vehicle_board', { _demand: selected }); if (result.error) { toast.error('గంట నమోదు కాలేదు'); return; } setSelected(null); toast.success('గంట వెళ్ళింది - అవతల వాళ్ళకి వినబడింది, చాట్ వచ్చింది అని వాళ్ళకి తెలుస్తుంది'); } catch { toast.error('గంట నమోదు కాలేదు'); } finally { setBusy(false); } }

  async function chat(id: string, source: string) {
    if (!data.paid) { setShowPay(true); return; }
    if (busy) return; setBusy(true);
    try { const result = await supabase.rpc('open_anonymous_bell_chat', { _id: id, _source: source }); if (result.error || !result.data) { toast.error('చాట్ తెరుచుకోలేదు'); return; } await nav({ to: '/chat/$userId', params: { userId: result.data }, search: { post: undefined } }); } finally { setBusy(false); }
  }

  function onRowClick() { if (!data.paid) setShowPay(true); }

  return <main className="space-y-4 p-4"><h1 className="break-words text-2xl font-bold">{BELL_BOARD_LABELS[section]}</h1><IndiaPlaceInput id="bell-board-area" value={area} onChange={setArea} placeholder="మీ ఊరి పేరు / మీ వాడ పేరు" />{!data.paid && <><p>₹100 పే చేసి చాట్ చేయండి</p><Button asChild><Link to="/dashboard">₹100 చెల్లింపు</Link></Button></>}{!area.trim() ? <p>మీ ఊరి పేరు / మీ వాడ పేరు రాయండి</p> : <>{!data.rows.length && <p>ఈ ప్రాంతంలో ఇంకా ఎవరూ గంట కొట్టలేదు</p>}{data.rows.map(row => <article key={`${row.source}-${row.id}`} onClick={onRowClick} className="flex items-center gap-2 rounded-lg border bg-card p-3 cursor-pointer"><PrivateBellDisplay /><div className="min-w-0 flex-1"><p translate="no" className="break-words">{row.area}</p><p translate="no" className="break-words font-bold">{row.need}</p><p className="text-xs opacity-70">బాంబే నుండి అనకాపల్లి వరకు వెహికల్ ఉంది - చూడడం ఫ్రీ</p></div>{row.source === 'vehicle' && <Button variant="outline" size="icon" className="size-11 shrink-0" aria-label="గంట కొట్టండి" title="గంట కొట్టండి" disabled={busy || !data.paid} onClick={(e) => { e.stopPropagation(); if (!data.paid) { setShowPay(true); return; } setSelected(row.id); }}><Bell /></Button>}<Button variant="outline" size="icon" className="size-11 shrink-0" aria-label="చాట్" title="చాట్" disabled={busy || !data.paid} onClick={(e) => { e.stopPropagation(); void chat(row.id, row.source); }}><MessageCircle /></Button></article>)}</>}

    {/* Vehicle Touch chesthe Rs.100 Dialog */}
    <Dialog open={showPay} onOpenChange={setShowPay}><DialogContent aria-describedby={undefined}><DialogTitle>₹100 ఫర్ మంత్ పేమెంట్ చేయండి</DialogTitle><p>పేమెంట్ చేస్తే - మీరు వీళ్ళతో చాట్ చేసుకోవచ్చు, బెల్ నోటిఫికేషన్ కూడా తీసుకోవచ్చు.</p><p className="text-sm opacity-70">పేరు / ఫోటో / మొబైల్ నంబర్ ఎప్పుడూ కనబడదు. ఓన్లీ బెల్ + చాట్ మాత్రమే.</p><Button asChild><Link to="/dashboard">₹100 చెల్లింపు</Link></Button></DialogContent></Dialog>

    <Dialog open={selected !== null} onOpenChange={open => { if (!open && !busy) setSelected(null); }}><DialogContent aria-describedby={undefined}><DialogTitle>ఈ వెహికల్ కావాలి</DialogTitle><ResponsibilityNotice prominent /><Button disabled={busy} onClick={() => void ring()}><Bell />గంట కొట్టండి</Button></DialogContent></Dialog></main>;
          }
