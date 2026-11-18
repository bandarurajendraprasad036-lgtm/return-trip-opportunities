import { useRef, useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Bell, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { useMe } from '@/lib/session';
import { useAddedCategories } from './AddCategoryBox';
import { addDiscoveryCategory } from '@/lib/discovery-category.functions';
import { freeWorkClientAction } from '@/lib/free-work-client';
import { FREE_WORK_LABELS, freeWorkNames, type FreeWorkSection } from '@/lib/free-work';
import { resolveServiceCategory } from '@/lib/service-category-display';

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
  const act = freeWorkClientAction;
  const names = freeWorkNames(categories);
  const openCategory = (category: string) => { setExpanded(false); void nav({ to: '/bell-board', search: { section, category } }); };
  const refresh = async () => { await Promise.all([qc.invalidateQueries({ queryKey: ['free-work'] }), qc.invalidateQueries({ queryKey: ['free-work-interests'] })]); };
  const action = async (action: 'category' | 'ring' | 'chat', category = selected, row?: { id: string; source: string }): Promise<boolean> => {
    if (!me) { toast.error('ముందు ప్రవేశించండి'); return false; }
    if (action === 'category' && !area.trim().replaceAll('/', '').trim()) { toast.error('మీ ఊరు / వాడ పేరు రాయండి'); return false; }
    setBusy(true);
    try {
      const source = row?.source;
      const result = await act({ data: { action, section, category, area, id: row?.id ?? '', source: source === 'post' || source === 'provider' || source === 'interest' ? source : 'entry' } });
      await refresh();
      if (action === 'chat') { if (result.target) await nav({ to: '/chat/$userId', params: { userId: result.target }, search: { post: undefined } }); else toast.info('ఇది మీ సొంత నమోదు'); }
      else {
        // Truthful status: a queued notice is not proof that the other phone received it.
        const count = result.rung ?? 0;
        if (count === 0) toast.info('మీ గంట నమోదైంది. ఇప్పుడు ఈ ప్రాంతంలో ఈ కేటగిరీకి ఎదుటివారు ఎవరూ లేరు; ఎవరైనా చేరితే వారికి సూచన వెళ్తుంది.', { duration: 9000 });
        else toast.success(`${count} మందికి సూచన పంపే ఏర్పాటు చేశాం; సుమారు ఒక నిమిషంలో వారి యాప్ నోటిఫికేషన్లలో చేరుతుంది. వారు తమ ఫోన్‌లో "గంట సూచనలు అనుమతించండి" నొక్కి ఉంటేనే ఫోన్‌కు శబ్దంతో వస్తుంది. వారు చూశారో లేదో ఇక్కడ తెలియదు.`, { duration: 12000 });
      }
      return true;
    } catch { toast.error('కాలేదు; మళ్లీ ప్రయత్నించండి'); return false; }
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
  return <div className="min-w-0 space-y-2" data-free-work={section}>
    <Button className="h-auto min-h-16 w-full whitespace-normal px-2" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{FREE_WORK_LABELS[section]}</Button>
    <Dialog open={expanded} onOpenChange={setExpanded}><DialogContent aria-describedby={undefined} className="inset-0! left-0! top-0! h-dvh! max-h-dvh! w-full! max-w-none! translate-x-0! translate-y-0! overflow-y-auto rounded-none! bg-royal! text-on-royal content-start px-4 py-5 sm:left-1/2! sm:max-w-[480px]! sm:translate-x-[-50%]! [&>button]:hidden">
      <DialogTitle className="min-w-0 break-words leading-normal tracking-normal">{FREE_WORK_LABELS[section]}</DialogTitle>
      <div className="space-y-4">
      <Button asChild variant="outline" className="h-auto min-h-14 w-full whitespace-normal"><Link to="/bell-board" search={{ section }}><Bell />గంట కొట్టిన వాళ్ళు</Link></Button>
      {!me && <Button asChild variant="outline" className="h-auto w-full whitespace-normal"><Link to="/auth">ప్రవేశించండి</Link></Button>}
      <section className="space-y-2 rounded-md border border-primary p-3" data-box="categories">
        <h3 className="font-bold">కేటగిరీలు</h3>
        <div className="flex flex-wrap gap-2">{names.map(category => <div key={category} className="flex max-w-full items-center rounded-md border border-primary bg-card">
          <Button variant="ghost" aria-pressed={selected === category} className="h-auto min-h-12 min-w-0 whitespace-normal px-3 text-left text-lg" onClick={() => openCategory(category)}><span translate="no" className="break-words">{category}</span></Button>
          <Button variant="ghost" size="icon" className="size-11 shrink-0 border-l border-border" title={`${category} గంట`} aria-label={`${category} గంట`} disabled={busy} onClick={() => { setSelected(category); void action('category', category).then(ok => { if (ok) openCategory(category); }); }}><Bell className="size-4" /></Button>
        </div>)}</div>
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