import { createFileRoute, Link, useNavigate, ClientOnly } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Bell, BellRing, MessageCircle, MessageSquare, Phone, Trash2 } from 'lucide-react';
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
import { AdminBellRowAction } from '@/components/AdminBellRowAction';
import { BELL_BOARD_REFRESH_MS, bellBoardArea } from '@/lib/bell-board-refresh';
import { playTapBell } from '@/lib/bell';
import { bellErrorMessage, requireCompleteProfile, retryBell } from '@/lib/bell-request';
import { IncomingBellList } from '@/components/IncomingBellList';
import { useMe } from '@/lib/session';
import { SignedImg } from '@/components/SignedImg';
import { PrivacyToggles } from '@/components/PrivacyToggles';
import { bellDateTime } from '@/lib/bell-details';
import { z } from 'zod';
import { BellPaymentNotice } from '@/components/BellPaymentNotice';

const options = (section: BellBoardSection, area = '', viewer = '') => queryOptions({ queryKey: ['bell-board', section, area, viewer], queryFn: () => loadBellBoard(section, area), staleTime: 0, refetchInterval: BELL_BOARD_REFRESH_MS });

export const Route = createFileRoute('/bell-board')({
  validateSearch: (search: Record<string, unknown>): { section: BellBoardSection; category?: string | undefined; post?: string | undefined } => ({ section: bellBoardSection(search['section']), category: typeof search['category'] === 'string' && search['category'].trim() ? search['category'].trim().slice(0, 60) : undefined, post: z.string().uuid().safeParse(search['post']).success ? String(search['post']) : undefined }),
  loaderDeps: ({ search }) => ({ section: search.section }),
  head: ({ match }) => { const title = `${BELL_BOARD_LABELS[match.search.section]} — గాయత్రి వన్`; const description = 'పేర్లు, మొబైల్, ఫోటోలు లేని గంటల జాబితా. చెల్లించినవారికి వ్యక్తిగత చాట్.'; return { meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }; },
  component: Board,
});

function isFree(section: BellBoardSection): section is FreeWorkSection { return (FREE_WORK_SECTIONS as readonly string[]).includes(section); }

// FREE - Jobs / Service: Bell = Chat vachindi ani SIGNAL. Bell kodithe chat auto open avvadu.
function FreeBoard({ section, category = '' }: { section: FreeWorkSection; category?: string }) {
  const [area, setArea] = useMasterArea(); const nav = useNavigate(); const qc = useQueryClient(); const act = freeWorkClientAction; const [busy, setBusy] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [filterArea, setFilterArea] = useState(false);
  const displayArea = bellBoardArea(filterArea, area);
  const priority = useQuery({ queryKey: ['service-priority', section, area, category], enabled: section === 'service-providers', refetchInterval: 10000, queryFn: async () => { const result = await supabase.rpc('list_service_priority', { _area: area.trim(), _category: category }); if (result.error) throw result.error; return result.data; } });
  const { data: me } = useMe();
  const { data: rows = [], isPending, isError } = useQuery({ queryKey: ['free-work-interests', section, displayArea, category, me?.id], refetchInterval: BELL_BOARD_REFRESH_MS, queryFn: async () => { const r = await supabase.rpc('list_free_work_interest_contacts', { _section: section, _area: displayArea, _category: category }); if (r.error) throw r.error; return r.data; } });
  const orderedProviders = rotateServicePriority(priority.data ?? [], rotation);

  // Bell: only signal - avatala vallaki vinabadali, chat vachindi ani artham avvali
  async function run(action: 'ring' | 'chat', id: string) {
    if (busy) return; setBusy(true);
    try {
      const result = await act({ data: { action, section, id, source: 'interest', area, category: '' } });
      await qc.invalidateQueries({ queryKey: ['free-work-interests'] });
      if (action === 'ring') {
        if (result.target) toast.success('గంట నమోదైంది; అవతలి ఫోన్ చేరిక ఇంకా నిర్ధారించలేదు');
        else toast.info('ఇది మీ సొంత నమోదు');
      } else {
        if (result.target) await nav({ to: '/chat/$userId', params: { userId: result.target }, search: { post: undefined } });
        else toast.info('ఇది మీ సొంత నమోదు');
      }
    } catch (error) { toast.error(bellErrorMessage(error)); } finally { setBusy(false); }
  }

  return <main className="space-y-4 p-4"><h1 className="break-words text-2xl font-bold">{BELL_BOARD_LABELS[section]}</h1>{category && <div className="flex flex-wrap items-center gap-2"><p translate="no" className="break-words text-xl font-bold">{freeWorkLabel(category)} కోసం గంట కొట్టిన వాళ్ళు</p><Button asChild variant="outline" size="sm"><Link to="/bell-board" search={{ section }}>అన్నీ చూపించు</Link></Button></div>}<IndiaPlaceInput id="bell-board-area" value={area} onChange={setArea} placeholder="మీ ఊరి పేరు / మీ వాడ పేరు" /><Button variant="outline" role="switch" aria-checked={filterArea} onClick={() => setFilterArea(value => !value)}>{filterArea ? "ఎంచుకున్న ఊరు మాత్రమే" : "అన్ని ఊర్లు"}</Button>
    {section === 'service-providers' && <section className="space-y-3 border-y py-3"><h2 className="text-xl font-bold">ఈ ప్రాంతంలో సేవలు</h2>{priority.isPending ? <p role="status">సేవలు వస్తున్నాయి</p> : priority.isError ? <p role="alert">సేవలు రాలేదు</p> : orderedProviders.map(row => <article key={`${row.source}-${row.id}`} className="flex min-h-16 items-center gap-2 border-b py-3"><PrivateBellDisplay /><div className="min-w-0 flex-1 basis-32"><p translate="no" className="break-words font-bold">{freeWorkLabel(row.category)}</p><p translate="no">{row.area}</p>{row.priority > 0 && <p className="text-primary">చందాతో ప్రత్యేక స్థానం</p>}</div><Button variant="outline" size="icon" aria-label="సేవ చాట్" disabled={busy} onClick={async () => { setRotation(value => value + 1); setBusy(true); try { const result = await act({ data: { action: 'ring', section, id: row.id, source: row.source === 'provider' ? 'provider' : row.source === 'post' ? 'post' : 'entry', area, category } }); if (result.target) await nav({ to: '/chat/$userId', params: { userId: result.target }, search: { post: undefined } }); else toast.info('ఇది మీ సొంత నమోదు'); } catch (error) { toast.error(bellErrorMessage(error)); } finally { setBusy(false); } }}><MessageCircle /></Button></article>)}</section>}
    {isPending ? <p>వస్తున్నాయి</p> : isError ? <p role="alert">జాబితా రాలేదు</p> : !rows.length ? <p>ఇంకా ఎవరూ గంట కొట్టలేదు</p> : rows.map(row => <FreeBellRow key={`${row.source}-${row.id}`} row={row} section={section} busy={busy} onRing={() => void run('ring', row.id)} onChat={() => void run('chat', row.id)} onRemoved={() => void qc.invalidateQueries({ queryKey: ['free-work-interests'] })} />)}
    {rows.some(row => row.own && !row.shown) && <><p className="text-sm">మీ పేరు, ఫోటో, మొబైల్ ఇప్పుడు అందరికీ దాచారు. చూపించాలంటే కింద "చూపించు" నొక్కండి.</p><PrivacyToggles /></>}
    <Button asChild variant="outline" className="h-auto min-h-14 w-full text-lg"><Link to="/">వెనక్కి</Link></Button></main>;
}

type FreeBellContact = { id: string; source: string; category: string; area: string; rang_at: string; other_id: string; own: boolean; shown: boolean; full_name: string; phone: string; photo: string };
// Shows the ringer's photo/name/mobile only when the database projected them (own row, admin, or the ringer's consent).
function FreeBellRow({ row, section, busy, onRing, onChat, onRemoved }: { row: FreeBellContact; section: FreeWorkSection; busy: boolean; onRing: () => void; onChat: () => void; onRemoved: () => void }) {
  const { data: me } = useMe();
  const digits = row.phone.replace(/\D/g, '').slice(-10);
  const name = row.full_name.trim();
  const canDial = digits.length === 10;
  const dateTime = bellDateTime(row.rang_at);
  const removeOwn = async () => {
    if (!window.confirm('మీ ఈ గంటను తొలగించాలా?')) return;
    const r = await supabase.from('free_work_interests').delete().eq('id', row.id);
    if (r.error) { toast.error('తొలగించలేకపోయాం'); return; }
    onRemoved();
  };
  return <article className="flex min-h-20 w-full items-center gap-2 rounded-md border border-primary bg-card p-2">
    {!row.shown ? <PrivateBellDisplay /> : row.photo ? <SignedImg src={row.photo} alt="" className="size-16 shrink-0 rounded-full border-2 border-primary object-cover" /> : <span aria-hidden className="flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary text-3xl font-bold text-primary-foreground">{((name || digits)[0] ?? '?').toUpperCase()}</span>}
    <span className="min-w-0 flex-1 break-words" translate="no">
      {name && <span className="block text-xl font-bold leading-tight">{name}</span>}
      {digits && <span className="block text-lg font-semibold">{digits}</span>}
      <span className="block font-bold">{freeWorkLabel(row.category)} కోసం గంట</span>
      <span className="block text-sm">{row.area}</span>
      {dateTime && <span className="block text-sm">గంట కొట్టిన తేదీ / సమయం: <time dateTime={row.rang_at}>{dateTime}</time></span>}
    </span>
    <div className="grid shrink-0 grid-cols-2 items-center gap-1 sm:flex">
      <Button size="icon" className="size-11 [&_svg]:size-6" aria-label="చాట్" disabled={busy} onClick={onChat}><MessageCircle className="size-6" /></Button>
      {canDial ? <Button asChild size="icon" variant="outline" className="size-11 [&_svg]:size-6"><a href={`https://wa.me/91${digits}`} target="_blank" rel="noopener noreferrer" aria-label="వాట్సాప్ సందేశం" title="వాట్సాప్ సందేశం"><MessageSquare className="size-6" /></a></Button> : <Button size="icon" variant="outline" className="size-11 [&_svg]:size-6" disabled aria-label="వాట్సాప్ కోసం నంబర్ లేదు"><MessageSquare className="size-6" /></Button>}
      <Button size="icon" variant="outline" className="size-11 [&_svg]:size-6" aria-label="గంట కొట్టండి" disabled={busy || row.own} onClick={onRing}>{row.own ? <BellRing className="size-6" /> : <Bell className="size-6" />}</Button>
      {canDial ? <Button asChild size="icon" variant="outline" className="size-11 [&_svg]:size-6"><a href={`tel:+91${digits}`} aria-label={`ఫోన్ ${digits}`}><Phone className="size-6" /></a></Button> : <Button size="icon" variant="outline" className="size-11 [&_svg]:size-6" disabled aria-label="ఫోన్ నంబర్ లేదు"><Phone className="size-6" /></Button>}
      {row.own && !me?.isAdmin && <Button size="icon" variant="ghost" className="size-11" aria-label="నా గంట తొలగించండి" onClick={() => void removeOwn()}><Trash2 /></Button>}
      <AdminBellRowAction id={row.id} source={row.source} section={section} />
    </div>
  </article>;
}

function Board() {
  const { section, category, post } = Route.useSearch();
  return <ClientOnly fallback={<main className="p-4" role="status">జాబితా వస్తోంది</main>}><div className="px-4"><IncomingBellList section={section} post={post} /></div>{isFree(section) ? <FreeBoard key={`${section}-${category ?? ''}`} section={section} category={category ?? ""} /> : <PaidBoard />}</ClientOnly>;
}

// PAID - Vehicle only: Display = Free + Blur. Touch = Rs.100. Paid = Only Bell + Chat. Consented ringer details (own/admin/consent) shown from list_vehicle_bell_contacts.
function PaidBoard() {
  const { data: me } = useMe();
  const { section } = Route.useSearch(); const [area,setArea] = useMasterArea(); const [filterArea,setFilterArea] = useState(false); const { data } = useSuspenseQuery(options(section, bellBoardArea(filterArea, area), me?.id ?? ''));
  const nav = useNavigate(); const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [showPay, setShowPay] = useState(false);

  async function ring() { if (busy || !selected) return; if (!data.paid) { setSelected(null); setShowPay(true); return; } const demand = selected; playTapBell(); setBusy(true); try { await requireCompleteProfile(); await retryBell(() => supabase.rpc('ring_vehicle_board', { _demand: demand })); setSelected(null); toast.success('గంట నమోదైంది; అవతలి ఫోన్ చేరిక ఇంకా నిర్ధారించలేదు'); } catch(error) { toast.error(bellErrorMessage(error)); } finally { setBusy(false); } }

  async function chat(id: string, source: string) {
    if (!data.chat) { setShowPay(true); return; }
    if (busy) return; setBusy(true);
    try { const result = await supabase.rpc('open_anonymous_bell_chat', { _id: id, _source: source }); if (result.error || !result.data) { toast.error('చాట్ తెరుచుకోలేదు'); return; } await nav({ to: '/chat/$userId', params: { userId: result.data }, search: { post: undefined } }); } finally { setBusy(false); }
  }

  function onRowClick() { /* Viewing remains free. */ }

  return <main className="space-y-4 p-4"><h1 className="break-words text-2xl font-bold">{BELL_BOARD_LABELS[section]}</h1><IndiaPlaceInput id="bell-board-area" value={area} onChange={setArea} placeholder="మీ ఊరి పేరు / మీ వాడ పేరు" /><Button variant="outline" role="switch" aria-checked={filterArea} onClick={() => setFilterArea(value => !value)}>{filterArea ? "ఎంచుకున్న ఊరు మాత్రమే" : "అన్ని ఊర్లు"}</Button>{!data.chat && <><p>చాట్‌కు ₹100; గంట, అనుమతించిన వివరాలకు ₹349 · మూడు నెలలు</p><Button variant="outline" onClick={() => setShowPay(true)}>చందా వివరాలు</Button></>}{<>{!data.rows.length && <p>ఈ ప్రాంతంలో ఇంకా ఎవరూ గంట కొట్టలేదు</p>}{data.rows.map(row => <article key={`${row.source}-${row.id}`} onClick={onRowClick} className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3 cursor-pointer">{row.contact?.shown ? (row.contact.photo ? <SignedImg src={row.contact.photo} alt="" className="size-16 shrink-0 rounded-full border-2 border-primary object-cover" /> : <span aria-hidden className="flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary text-3xl font-bold text-primary-foreground">{((row.contact.full_name.trim() || row.contact.phone)[0] ?? '?').toUpperCase()}</span>) : <PrivateBellDisplay />}<div className="min-w-0 flex-1 basis-32" translate="no">{row.contact?.full_name.trim() && <p className="break-words text-xl font-bold">{row.contact.full_name}</p>}{row.contact?.phone && <a href={`tel:+91${row.contact.phone.replace(/\D/g, '').slice(-10)}`} onClick={e => e.stopPropagation()} className="block break-words font-bold underline">{row.contact.phone}</a>}<p className="break-words">{row.area}</p><p className="break-words font-bold">{row.need}</p>{row.contact?.rang_at && <p className="text-sm">{bellDateTime(row.contact.rang_at)}</p>}</div>{row.contact?.phone && <><Button asChild size="icon" variant="outline" className="size-11 shrink-0"><a href={`tel:+91${row.contact.phone.replace(/\D/g, '').slice(-10)}`} onClick={e => e.stopPropagation()} aria-label="ఫోన్ చేయండి"><Phone /></a></Button><Button asChild size="icon" variant="outline" className="size-11 shrink-0"><a href={`https://wa.me/91${row.contact.phone.replace(/\D/g, '').slice(-10)}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} aria-label="వాట్సాప్"><MessageSquare /></a></Button></>}{row.source === 'vehicle' && <Button variant="outline" size="icon" className="size-11 shrink-0" aria-label="గంట కొట్టండి" title="గంట కొట్టండి" disabled={busy} onClick={(e) => { e.stopPropagation(); setSelected(row.id); }}><Bell /></Button>}<Button variant="outline" size="icon" className="size-11 shrink-0" aria-label="చాట్" title="చాట్" disabled={busy} onClick={(e) => { e.stopPropagation(); void chat(row.id, row.source); }}><MessageCircle /></Button><AdminBellRowAction id={row.id} source={row.source} section={section} /></article>)}</>}

    <BellPaymentNotice open={showPay} onOpenChange={setShowPay} />

    <Dialog open={selected !== null} onOpenChange={open => { if (!open && !busy) setSelected(null); }}><DialogContent aria-describedby={undefined}><DialogTitle>ఈ వెహికల్ కావాలి</DialogTitle><ResponsibilityNotice prominent /><Button disabled={busy} onClick={() => void ring()}><Bell />గంట కొట్టండి</Button></DialogContent></Dialog></main>;
          }
