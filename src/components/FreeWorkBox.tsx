import { useRef, useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Bell, MessageCircle, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { useAddedCategories } from './AddCategoryBox';
import { addDiscoveryCategory } from '@/lib/discovery-category.functions';
import { freeWorkAction } from '@/lib/free-work.functions';
import { FREE_WORK_LABELS, freeWorkNames, freeWorkLabel, type FreeWorkSection } from '@/lib/free-work';

export function FreeWorkBox({ section, area }: { section: FreeWorkSection; area: string }) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
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
    if (!me) { toast.error('ముందు ప్రవేశించండి'); return; }
    if (saving.current || name.trim().length < 2) return;
    saving.current = true;
    setBusy(true);
    try { await add({ data: { section, name: name.trim() } }); setSelected(name.trim()); await qc.invalidateQueries({ queryKey: ['discovery-categories', section] }); setName(''); }
    catch (error) { toast.error(error instanceof Error && error.message.includes('BAD_CONTENT') ? 'ఈ పని పేరు అనుమతి లేదు' : 'కేటగిరీ చేరలేదు; మళ్లీ ప్రయత్నించండి'); }
    finally { saving.current = false; setBusy(false); }
  };
  const renderRow = (row: { id: string; source: string; category: string; area: string }) => <article key={`${row.source}-${row.id}`} className="border-b border-border py-3">
    <p translate="no" className="break-words font-bold">{freeWorkLabel(row.category)}</p><p translate="no" className="break-words text-sm">{row.area}</p>
    <div className="mt-2 flex gap-2"><Button variant="outline" size="icon" title="గంట" aria-label="పని గంట" disabled={busy} onClick={() => void action('ring', '', row)}><Bell /></Button><Button variant="outline" size="icon" title="చాట్" aria-label="పని చాట్" disabled={busy} onClick={() => void action('ring', '', row)}><MessageCircle /></Button></div>
  </article>;
  return <div className="min-w-0 space-y-2" data-free-work={section}>
    <Button className="h-auto min-h-16 w-full whitespace-normal px-2" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{FREE_WORK_LABELS[section]}</Button>
    {expanded && <div className="space-y-3">
      {!me && <Button asChild variant="outline" className="h-auto w-full whitespace-normal"><Link to="/auth">ప్రవేశించండి</Link></Button>}
      <form onSubmit={event => { event.preventDefault(); void saveCategory(); }} className="space-y-2">
        <label className="block font-bold" htmlFor={`category-${section}`}>కేటగిరీ లో చేర్చండి</label>
        <p className="break-words text-sm">మీకు ఎలాంటి పని కావాలో ఇక్కడ రాయండి - ప్లంబర్, ఎలక్ట్రీషియన్, షాప్ కీపర్, సాఫ్ట్వేర్ ఇంజనీర్...</p>
        <div className="flex gap-1"><Input id={`category-${section}`} aria-label="కొత్త పని పేరు" value={name} onChange={event => setName(event.target.value)} onBlur={() => { if (name.trim().length >= 2 && !busy) void saveCategory(); }} maxLength={40} translate="no" disabled={busy} className="min-w-0" /><Button type="submit" size="icon" title="కేటగిరీ చేర్చండి" aria-label="కేటగిరీ చేర్చండి" disabled={busy || name.trim().length < 2} onPointerDown={event => event.preventDefault()}><Plus /></Button></div>
      </form>
      <Button variant="outline" className="w-full" onClick={() => setSelected('')}>అన్నీ</Button>
      <div className="divide-y divide-border">{names.map(category => <div key={category} className="flex items-center gap-1 py-1"><Button variant={selected === category ? 'default' : 'ghost'} className="h-auto min-h-12 min-w-0 flex-1 justify-start whitespace-normal px-1 text-left" onClick={() => setSelected(category)}><span translate="no" className="break-words">{category}</span></Button><Button variant="outline" size="icon" title={`${category} గంట`} aria-label={`${category} గంట`} disabled={busy} onClick={() => { setSelected(category); void action('category', category); }}><Bell /></Button></div>)}</div>
      {selected && <Button variant="outline" className="h-auto w-full whitespace-normal" disabled={busy} onClick={() => void action('join')}><Check />{section === 'service-providers' ? 'ఈ సేవలో నేను చేరతాను' : section === 'work-offered' ? 'ఈ పని ఇస్తాను' : section === 'service-wanted' ? 'ఈ సేవ కావాలి' : 'ఈ పనికి అప్లై చేస్తాను'}</Button>}
      <div aria-live="polite">{isPending ? <p>వస్తున్నాయి</p> : isError ? <p role="alert">జాబితా రాలేదు</p> : rows.length ? rows.map(renderRow) : <p className="break-words text-sm">ఇంకా నమోదులు లేవు</p>}</div>
    </div>}
    <Button variant="outline" className="h-auto min-h-14 w-full whitespace-normal px-2 text-sm" onClick={() => setExpanded(true)}>ఈ {FREE_WORK_LABELS[section]} గంట కొట్టిన వారి లిస్ట్</Button>
    {expanded && <div aria-live="polite">{interests.map(renderRow)}</div>}
    {expanded && notices.length > 0 && <div aria-live="polite"><p className="font-bold">నా నోటిఫికేషన్లు</p>{notices.map(notice => <p key={notice.id} className="break-words border-b border-border py-2 text-sm">{notice.message}</p>)}</div>}
  </div>;
}