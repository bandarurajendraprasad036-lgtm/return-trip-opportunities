import { useRef, useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Bell, MessageCircle, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { useAddedCategories } from './AddCategoryBox';
import { addDiscoveryCategory } from '@/lib/discovery-category.functions';
import { freeWorkAction } from '@/lib/free-work.functions';
import { FREE_WORK_LABELS, freeWorkNames, freeWorkLabel, type FreeWorkSection } from '@/lib/free-work';
import { resolveServiceCategory, serviceCategoryCount } from '@/lib/service-category-display';

export function FreeWorkBox({ section, area }: { section: FreeWorkSection; area: string }) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [categoryFeedback, setCategoryFeedback] = useState('');
  const service = section === 'service-providers' || section === 'service-wanted';
  const saving = useRef(false);
  const { data: me } = useMe();
  const { data: categories = [] } = useAddedCategories(section);
  const qc = useQueryClient();
  const nav = useNavigate();
  const add = useServerFn(addDiscoveryCategory);
  const act = useServerFn(freeWorkAction);
  const names = freeWorkNames(categories);
  const query = { _section: section, _area: area.trim(), _category: selected };
  const { data: allRows, isError: countError } = useQuery({ queryKey: ['free-work', section, area, 'category-counts'], enabled: expanded && service, refetchInterval: 10000, queryFn: async () => { const r = await supabase.rpc('list_free_work', { ...query, _category: '' }); if (r.error) throw r.error; return r.data; } });
  const { data: rows = [], isPending, isError } = useQuery({ queryKey: ['free-work', section, area, selected], enabled: expanded, refetchInterval: 10000, queryFn: async () => { const r = await supabase.rpc('list_free_work', query); if (r.error) throw r.error; return r.data; } });
  const { data: interests = [] } = useQuery({ queryKey: ['free-work-interests', section, area, selected], enabled: expanded, refetchInterval: 10000, queryFn: async () => { const r = await supabase.rpc('list_free_work_interests', query); if (r.error) throw r.error; return r.data; } });
  const { data: notices = [] } = useQuery({ queryKey: ['free-work-notices', me?.id, section], enabled: expanded && !!me, refetchInterval: 10000, queryFn: async () => {
    if (!me) return [];
    const queue = await supabase.from('free_work_notice_queue').select('notification_id').eq('user_id', me.id).not('processed_at', 'is', null).order('created_at', { ascending: false }).limit(20);
    if (queue.error) throw queue.error;
    const ids = queue.data.map(row => row.notification_id); if (!ids.length) return [];
    const result = await supabase.from('notifications').select('id,message').in('id', ids); if (result.error) throw result.error; return result.data;
  } });
  const refresh = async () => { await Promise.all([qc.invalidateQueries({ queryKey: ['free-work'] }), qc.invalidateQueries({ queryKey: ['free-work-interests'] })]); };
  const action = async (action: 'join' | 'category' | 'ring', category = selected, row?: { id: string; source: string }) => {
    if (!me) { toast.error('ముందు ప్రవేశించండి'); return; }
    if (action !== 'ring' && !area.trim().replaceAll('/', '').trim()) { toast.error('మీ ఊరు / వాడ పేరు రాయండి'); return; }
    setBusy(true);
    try {
      const source = row?.source;
      const result = await act({ data: { action, section, category, area, id: row?.id ?? '', source: source === 'post' || source === 'provider' || source === 'interest' ? source : 'entry' } });
      await refresh();
      if (result.target) await nav({ to: '/chat/$userId', params: { userId: result.target }, search: { post: undefined } });
      else if (action === 'join') toast.success('మీ నమోదు ఇక్కడ చేరింది');
    } catch { toast.error('నమోదు కాలేదు; మళ్లీ ప్రయత్నించండి'); }
    finally { setBusy(false); }
  };
  const saveCategory = async () => {
    if (saving.current || name.trim().length < 2) return;
    const resolved = service ? resolveServiceCategory(name, names) : { name: name.trim(), exists: false };
    if (resolved.exists) { setName(resolved.name); setSelected(resolved.name); setCategoryFeedback('ఈ కేటగిరీ ఆల్రెడీ ఉంది'); return; }
    if (!me) { toast.error('ముందు ప్రవేశించండి'); return; }
    saving.current = true;
    setBusy(true);
    try { await add({ data: { section, name: resolved.name } }); setSelected(resolved.name); await qc.invalidateQueries({ queryKey: ['discovery-categories', section] }); setName(''); setCategoryFeedback('కొత్త కేటగిరీ చేరింది'); }
    catch (error) { toast.error(error instanceof Error && error.message.includes('BAD_CONTENT') ? 'ఈ పని పేరు అనుమతి లేదు' : 'కేటగిరీ చేరలేదు; మళ్లీ ప్రయత్నించండి'); }
    finally { saving.current = false; setBusy(false); }
  };
  const renderRow = (row: { id: string; source: string; category: string; area: string }) => <article key={`${row.source}-${row.id}`} className="border-b border-border py-3">
    <p translate="no" className="break-words font-bold">{freeWorkLabel(row.category)}</p><p translate="no" className="break-words text-sm">{row.area}</p>
    <div className="mt-2 flex gap-2"><Button variant="outline" size="icon" title="గంట" aria-label="పని గంట" disabled={busy} onClick={() => void action('ring', '', row)}><Bell /></Button><Button variant="outline" size="icon" title="చాట్" aria-label="పని చాట్" disabled={busy} onClick={() => void action('ring', '', row)}><MessageCircle /></Button></div>
  </article>;
  const categoryForm = <form onSubmit={event => { event.preventDefault(); void saveCategory(); }} className="space-y-2">
    <label className="block font-bold" htmlFor={`category-${section}`}>{service ? 'కొత్త కేటగిరీ' : 'కేటగిరీ లో చేర్చండి'}</label>
    <p className="break-words text-sm">{service ? 'పైన సూచించిన కేటగిరీల్లో మీకు సంబంధించిన కేటగిరీ లేకపోతే, ఇక్కడ కొత్తగా క్రియేట్ చేసుకోండి' : 'మీకు ఎలాంటి పని కావాలో ఇక్కడ రాయండి - ప్లంబర్, ఎలక్ట్రీషియన్, షాప్ కీపర్, సాఫ్ట్వేర్ ఇంజనీర్...'}</p>
    <div className="flex gap-1"><Input id={`category-${section}`} aria-label="కొత్త పని పేరు" value={name} onChange={event => { setName(event.target.value); setCategoryFeedback(''); }} onBlur={() => { if (name.trim().length >= 2 && !busy) void saveCategory(); }} maxLength={40} translate="no" disabled={busy} className="min-w-0" /><Button type="submit" size="icon" title="కేటగిరీ చేర్చండి" aria-label="కేటగిరీ చేర్చండి" disabled={busy || name.trim().length < 2} onPointerDown={event => event.preventDefault()}><Plus /></Button></div>
    {categoryFeedback && <p role="status" className="text-sm">{categoryFeedback}</p>}
  </form>;
  const categoryChips = (lower = false) => <div className="flex flex-wrap gap-2" data-category-chips={lower ? 'lower' : 'upper'}>{names.map(category => <div key={category} className="flex max-w-full items-center rounded-md border border-primary bg-card">
    <Button variant="ghost" aria-pressed={selected === category} className="h-auto min-h-11 min-w-0 whitespace-normal px-2 text-left text-sm" onClick={() => setSelected(category)}><span translate="no" className="break-words">{category}</span><span aria-label="నమోదుల సంఖ్య" className="ml-1 inline-flex min-w-6 shrink-0 items-center justify-center rounded-sm border border-border px-1 text-xs tabular-nums">{lower ? serviceCategoryCount(interests, category) : allRows && !countError ? serviceCategoryCount(allRows, category) : '—'}</span></Button>
    <Button variant="ghost" size="icon" className="size-11 shrink-0 border-l border-border" title={`${category} గంట`} aria-label={`${category} గంట`} disabled={busy} onClick={() => { setSelected(category); void action('category', category); }}><Bell className="size-4" /></Button>
  </div>)}</div>;
  return <div className="min-w-0 space-y-2" data-free-work={section}>
    <Button className="h-auto min-h-16 w-full whitespace-normal px-2" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{FREE_WORK_LABELS[section]}</Button>
    <Button variant="outline" className="h-auto min-h-14 w-full whitespace-normal px-2 text-sm" onClick={() => setExpanded(true)}>ఈ {FREE_WORK_LABELS[section]} గంట కొట్టిన వారి లిస్ట్</Button>
    <Dialog open={expanded} onOpenChange={setExpanded}><DialogContent aria-describedby={undefined} className="inset-0! left-0! top-0! h-dvh! max-h-dvh! w-full! max-w-none! translate-x-0! translate-y-0! overflow-y-auto rounded-none! bg-royal! text-on-royal content-start px-4 py-5 sm:left-1/2! sm:max-w-[480px]! sm:translate-x-[-50%]! [&>button]:hidden">
      <div className="flex items-start justify-between gap-2"><DialogTitle className="min-w-0 break-words leading-normal tracking-normal">{FREE_WORK_LABELS[section]}</DialogTitle><DialogClose asChild><Button variant="outline" className="shrink-0">వెనక్కి</Button></DialogClose></div>
      <div className="space-y-3">
      {!me && <Button asChild variant="outline" className="h-auto w-full whitespace-normal"><Link to="/auth">ప్రవేశించండి</Link></Button>}
      {!service && categoryForm}
      <Button variant="outline" className="w-full" onClick={() => setSelected('')}>అన్నీ</Button>
      {service ? categoryChips() : <div className="divide-y divide-border">{names.map(category => <div key={category} className="flex items-center gap-1 py-1"><Button variant={selected === category ? 'default' : 'ghost'} className="h-auto min-h-12 min-w-0 flex-1 justify-start whitespace-normal px-1 text-left" onClick={() => setSelected(category)}><span translate="no" className="break-words">{category}</span></Button><Button variant="outline" size="icon" title={`${category} గంట`} aria-label={`${category} గంట`} disabled={busy} onClick={() => { setSelected(category); void action('category', category); }}><Bell /></Button></div>)}</div>}
      {selected && <Button variant="outline" className="h-auto w-full whitespace-normal" disabled={busy} onClick={() => void action('join')}><Check />{section === 'service-providers' ? 'ఈ సేవలో నేను చేరతాను' : section === 'work-offered' ? 'ఈ పని ఇస్తాను' : section === 'service-wanted' ? 'ఈ సేవ కావాలి' : 'ఈ పనికి అప్లై చేస్తాను'}</Button>}
      {service && categoryForm}
      <div aria-live="polite">{isPending ? <p>వస్తున్నాయి</p> : isError ? <p role="alert">జాబితా రాలేదు</p> : rows.length ? rows.map(renderRow) : <p className="break-words text-sm">ఇంకా నమోదులు లేవు</p>}</div>
      <section className="space-y-3 border-t border-border pt-3"><h3 className="font-bold">గంట కొట్టిన వారి లిస్ట్</h3>{service && categoryChips(true)}<div aria-live="polite">{interests.map(renderRow)}</div></section>
      {notices.length > 0 && <div aria-live="polite"><p className="font-bold">నా నోటిఫికేషన్లు</p>{notices.map(notice => <p key={notice.id} className="break-words border-b border-border py-2 text-sm">{notice.message}</p>)}</div>}
      </div>
    </DialogContent></Dialog>
  </div>;
}