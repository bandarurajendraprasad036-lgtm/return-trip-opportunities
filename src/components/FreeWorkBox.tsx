import { useRef, useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Bell, MessageCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { useAddedCategories } from './AddCategoryBox';
import { addDiscoveryCategory } from '@/lib/discovery-category.functions';
import { freeWorkAction } from '@/lib/free-work.functions';
import { FREE_WORK_LABELS, freeWorkNames, type FreeWorkSection } from '@/lib/free-work';
import { resolveServiceCategory, groupRingersByCategory } from '@/lib/service-category-display';

export function FreeWorkBox({ section, area }: { section: FreeWorkSection; area: string }) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [categoryFeedback, setCategoryFeedback] = useState('');
  const saving = useRef(false);
  const { data: me } = useMe();
  const { data: categories = [] } = useAddedCategories(section);
  const qc = useQueryClient();
  const nav = useNavigate();
  const add = useServerFn(addDiscoveryCategory);
  const act = useServerFn(freeWorkAction);
  const names = freeWorkNames(categories);
  const query = { _section: section, _area: area.trim(), _category: selected };
  const { data: rows = [], isPending, isError } = useQuery({ queryKey: ['free-work', section, area, selected], enabled: expanded, refetchInterval: 10000, queryFn: async () => { const r = await supabase.rpc('list_free_work', query); if (r.error) throw r.error; return r.data; } });
  const { data: interests = [] } = useQuery({ queryKey: ['free-work-interests', section, area, selected], enabled: expanded, refetchInterval: 10000, queryFn: async () => { const r = await supabase.rpc('list_free_work_interests', query); if (r.error) throw r.error; return r.data; } });
  const groups = groupRingersByCategory([...interests, ...rows], names);
  const refresh = async () => { await Promise.all([qc.invalidateQueries({ queryKey: ['free-work'] }), qc.invalidateQueries({ queryKey: ['free-work-interests'] })]); };
  const action = async (action: 'category' | 'ring' | 'chat', category = selected, row?: { id: string; source: string }) => {
    if (!me) { toast.error('ముందు ప్రవేశించండి'); return; }
    if (action === 'category' && !area.trim().replaceAll('/', '').trim()) { toast.error('మీ ఊరు / వాడ పేరు రాయండి'); return; }
    setBusy(true);
    try {
      const source = row?.source;
      const result = await act({ data: { action, section, category, area, id: row?.id ?? '', source: source === 'post' || source === 'provider' || source === 'interest' ? source : 'entry' } });
      await refresh();
      if (action === 'chat') { if (result.target) await nav({ to: '/chat/$userId', params: { userId: result.target }, search: { post: undefined } }); else toast.info('ఇది మీ సొంత నమోదు'); }
      else toast.success('గంట వెళ్ళింది');
    } catch { toast.error('కాలేదు; మళ్లీ ప్రయత్నించండి'); }
    finally { setBusy(false); }
  };
  const saveCategory = async () => {
    if (saving.current || name.trim().length < 2) return;
    const resolved = resolveServiceCategory(name, names);
    if (resolved.exists) { setName(''); setSelected(resolved.name); setCategoryFeedback(`ఈ కేటగిరీ ఆల్రెడీ ఉంది: ${resolved.name}`); return; }
    if (!me) { toast.error('ముందు ప్రవేశించండి'); return; }
    saving.current = true;
    setBusy(true);
    try { await add({ data: { section, name: resolved.name } }); setSelected(resolved.name); await qc.invalidateQueries({ queryKey: ['discovery-categories', section] }); setName(''); setCategoryFeedback('కొత్త కేటగిరీ చేరింది'); }
    catch (error) { toast.error(error instanceof Error && error.message.includes('BAD_CONTENT') ? 'ఈ పని పేరు అనుమతి లేదు' : 'కేటగిరీ చేరలేదు; మళ్లీ ప్రయత్నించండి'); }
    finally { saving.current = false; setBusy(false); }
  };
  const renderRow = (row: { id: string; source: string; category: string; area: string }) => <article key={`${row.source}-${row.id}`} className="flex items-center gap-2 border-b border-border py-2 last:border-b-0">
    <div className="min-w-0 flex-1"><p className="font-bold">సభ్యుడు</p><p translate="no" className="break-words text-sm">{row.area}</p></div>
    <Button variant="outline" size="icon" className="size-11 shrink-0" title="గంట" aria-label="గంట కొట్టండి" disabled={busy} onClick={() => void action('ring', '', row)}><Bell /></Button>
    <Button variant="outline" className="h-11 shrink-0 px-3" aria-label="చాట్" disabled={busy} onClick={() => void action('chat', '', row)}><MessageCircle />Chat</Button>
  </article>;
  return <div className="min-w-0 space-y-2" data-free-work={section}>
    <Button className="h-auto min-h-16 w-full whitespace-normal px-2" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{FREE_WORK_LABELS[section]}</Button>
    <Dialog open={expanded} onOpenChange={setExpanded}><DialogContent aria-describedby={undefined} className="inset-0! left-0! top-0! h-dvh! max-h-dvh! w-full! max-w-none! translate-x-0! translate-y-0! overflow-y-auto rounded-none! bg-royal! text-on-royal content-start px-4 py-5 sm:left-1/2! sm:max-w-[480px]! sm:translate-x-[-50%]! [&>button]:hidden">
      <DialogTitle className="min-w-0 break-words leading-normal tracking-normal">{FREE_WORK_LABELS[section]}</DialogTitle>
      <div className="space-y-4">
      {!me && <Button asChild variant="outline" className="h-auto w-full whitespace-normal"><Link to="/auth">ప్రవేశించండి</Link></Button>}
      <section className="space-y-2 rounded-md border border-primary p-3" data-box="categories">
        <h3 className="font-bold">కేటగిరీలు</h3>
        <div className="flex flex-wrap gap-2">{names.map(category => <div key={category} className="flex max-w-full items-center rounded-md border border-primary bg-card">
          <Button variant="ghost" aria-pressed={selected === category} className="h-auto min-h-11 min-w-0 whitespace-normal px-2 text-left text-sm" onClick={() => setSelected(value => value === category ? '' : category)}><span translate="no" className="break-words">{category}</span></Button>
          <Button variant="ghost" size="icon" className="size-11 shrink-0 border-l border-border" title={`${category} గంట`} aria-label={`${category} గంట`} disabled={busy} onClick={() => { setSelected(category); void action('category', category); }}><Bell className="size-4" /></Button>
        </div>)}</div>
        {selected && <Button variant="outline" size="sm" onClick={() => setSelected('')}>అన్నీ చూపించు</Button>}
      </section>
      <section className="space-y-3 rounded-md border border-primary p-3" data-box="ringers" aria-live="polite">
        <h3 className="font-bold">గంట కొట్టిన వాళ్ళు</h3>
        {isPending ? <p>వస్తున్నాయి</p> : isError ? <p role="alert">జాబితా రాలేదు</p> : groups.length ? groups.map(group => <div key={group.category}>
          <p translate="no" className="break-words border-b border-primary pb-1 text-sm font-bold">{group.category} కోసం గంట కొట్టిన వాళ్ళు</p>
          {group.rows.map(renderRow)}
        </div>) : <p className="break-words text-sm">ఇంకా ఎవరూ గంట కొట్టలేదు</p>}
      </section>
      <form onSubmit={event => { event.preventDefault(); void saveCategory(); }} className="space-y-2 rounded-md border border-primary p-3" data-box="new-category">
        <label className="block break-words text-sm" htmlFor={`category-${section}`}>పైన సూచించిన కేటగిరీల్లో మీకు సంబంధించిన కేటగిరీ లేకపోతే, ఇక్కడ కొత్తగా క్రియేట్ చేసుకోండి</label>
        <div className="flex gap-1"><Input id={`category-${section}`} aria-label="కొత్త కేటగిరీ" value={name} onChange={event => { setName(event.target.value); setCategoryFeedback(''); }} maxLength={40} translate="no" disabled={busy} className="min-w-0" /><Button type="submit" size="icon" title="కేటగిరీ చేర్చండి" aria-label="కేటగిరీ చేర్చండి" disabled={busy || name.trim().length < 2}><Plus /></Button></div>
        {categoryFeedback && <p role="status" className="text-sm">{categoryFeedback}</p>}
      </form>
      <DialogClose asChild><Button variant="outline" className="h-auto min-h-14 w-full text-lg">వెనక్కి</Button></DialogClose>
      </div>
    </DialogContent></Dialog>
  </div>;
}