import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Check, Pencil, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAddedCategories } from '@/components/AddCategoryBox';
import { AdminBellRowAction } from '@/components/AdminBellRowAction';
import { addDiscoveryCategory } from '@/lib/discovery-category.functions';
import { CATEGORY_SECTIONS, categoryInput, type CategorySection } from '@/lib/discovery-categories';
import { FREE_WORK_LABELS } from '@/lib/free-work';

const SECTION_LABELS: Record<CategorySection, string> = {
  goods: 'లోకల్ సరుకు వాహనాలు', returns: 'రిటర్న్ వాహనాలు', cars: 'కార్లు', ...FREE_WORK_LABELS,
};

function errorText(error: unknown) {
  const message = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String(error.message) : '';
  if (message.includes('CATEGORY_EXISTS')) return 'ఈ పేరుతో కేటగిరీ ఇప్పటికే ఉంది';
  if (message.includes('BAD_CONTENT')) return 'ఈ పేరు అనుమతి లేదు';
  return 'మార్పు జరగలేదు; మళ్లీ ప్రయత్నించండి';
}

function CategoryRow({ id, name, section }: { id: string; name: string; section: CategorySection }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const save = async () => {
    const parsed = categoryInput.safeParse({ section, name: value });
    if (!parsed.success) { toast.error('పేరు 2 నుంచి 40 అక్షరాల్లో రాయండి'); return; }
    setBusy(true);
    try {
      const result = await supabase.rpc('admin_rename_discovery_category', { _id: id, _name: parsed.data.name });
      if (result.error) throw result.error;
      await qc.invalidateQueries({ queryKey: ['discovery-categories', section] });
      setEditing(false); toast.success('కేటగిరీ పేరు మార్చారు');
    } catch (error) { toast.error(errorText(error)); }
    finally { setBusy(false); }
  };
  if (editing) return <form className="flex items-center gap-2" onSubmit={event => { event.preventDefault(); void save(); }}>
    <Input aria-label="కొత్త పేరు" value={value} onChange={event => setValue(event.target.value)} maxLength={40} translate="no" disabled={busy} className="min-w-0 flex-1" autoFocus />
    <Button type="submit" size="icon" className="size-11 shrink-0" aria-label="పేరు సేవ్ చేయండి" disabled={busy || value.trim().length < 2}><Check /></Button>
    <Button type="button" variant="outline" size="icon" className="size-11 shrink-0" aria-label="మార్పు వద్దు" disabled={busy} onClick={() => { setValue(name); setEditing(false); }}><X /></Button>
  </form>;
  return <div className="flex items-center gap-2 rounded-md border border-primary bg-card px-3 py-1">
    <span translate="no" className="min-w-0 flex-1 break-words text-lg">{name}</span>
    <Button variant="outline" size="icon" className="size-11 shrink-0" aria-label={`${name} పేరు మార్చండి`} onClick={() => setEditing(true)}><Pencil /></Button>
    <AdminBellRowAction id={id} source="category" section={section} />
  </div>;
}

function SectionCategories({ section }: { section: CategorySection }) {
  const { data: categories = [], isPending } = useAddedCategories(section);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const add = useServerFn(addDiscoveryCategory);
  const qc = useQueryClient();
  const submit = async () => {
    const parsed = categoryInput.safeParse({ section, name });
    if (!parsed.success) { toast.error('పేరు 2 నుంచి 40 అక్షరాల్లో రాయండి'); return; }
    setBusy(true);
    try { await add({ data: parsed.data }); await qc.invalidateQueries({ queryKey: ['discovery-categories', section] }); setName(''); toast.success('కేటగిరీ చేరింది'); }
    catch (error) { toast.error(errorText(error)); }
    finally { setBusy(false); }
  };
  return <div className="space-y-2 pb-3">
    {isPending && <p role="status" className="text-sm text-muted-foreground">వస్తున్నాయి…</p>}
    {!isPending && categories.length === 0 && <p className="text-sm text-muted-foreground">ఇంకా కేటగిరీలు లేవు</p>}
    {categories.map(row => <CategoryRow key={`${row.id}-${row.name}`} id={row.id} name={row.name} section={section} />)}
    <form className="flex items-center gap-2" onSubmit={event => { event.preventDefault(); void submit(); }}>
      <Input aria-label={`${SECTION_LABELS[section]} కొత్త కేటగిరీ`} placeholder="కొత్త కేటగిరీ పేరు" value={name} onChange={event => setName(event.target.value)} maxLength={40} translate="no" disabled={busy} className="min-w-0 flex-1" />
      <Button type="submit" size="icon" className="size-11 shrink-0" aria-label="కేటగిరీ చేర్చండి" disabled={busy || name.trim().length < 2}><Plus /></Button>
    </form>
  </div>;
}

/** Admin-only place to add, rename and remove the category names of every section. */
export function AdminCategoryManager() {
  return <section id="admin-categories" className="scroll-mt-4 space-y-3 border-y py-4">
    <h2 className="text-xl font-bold">కేటగిరీలు — చేర్చండి / మార్చండి / తొలగించండి</h2>
    {CATEGORY_SECTIONS.map(section => <details key={section} className="rounded-lg border px-3">
      <summary className="cursor-pointer py-3 text-lg font-bold">{SECTION_LABELS[section]}</summary>
      <SectionCategories section={section} />
    </details>)}
  </section>;
}
