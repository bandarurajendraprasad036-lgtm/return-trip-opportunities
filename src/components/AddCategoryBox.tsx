import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { categoryInput, type CategorySection } from '@/lib/discovery-categories';
import { addDiscoveryCategory } from '@/lib/discovery-category.functions';
import { useMe } from '@/lib/session';

export function useAddedCategories(section: CategorySection) {
  return useQuery({ queryKey: ['discovery-categories', section], refetchInterval: 10000, queryFn: async () => {
    const result = await supabase.from('discovery_categories').select('id,name').eq('section', section).order('created_at');
    if (result.error) throw result.error;
    return result.data;
  } });
}

export function AddCategoryBox({ label, section }: { label: string; section: CategorySection }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const { data: me } = useMe();
  const save = useServerFn(addDiscoveryCategory);
  const qc = useQueryClient();
  const submit = async () => {
    if (!me) { toast.error('ముందు ప్రవేశించండి'); return; }
    const parsed = categoryInput.safeParse({ section, name });
    if (!parsed.success) { toast.error('రకం పేరు 2 నుంచి 40 అక్షరాల్లో రాయండి'); return; }
    setBusy(true);
    try { await save({ data: parsed.data }); await qc.invalidateQueries({ queryKey: ['discovery-categories', section] }); setName(''); }
    catch (error) { const message = error instanceof Error ? error.message : ''; toast.error(message.includes('BAD_CONTENT') ? 'బూతులు లేదా హింసను ప్రోత్సహించే రకాలు అనుమతి లేదు' : message.includes('CATEGORY_LIMIT') ? 'ఈరోజు చేర్చిన రకాలు సరిపోతాయి; రేపు చేర్చండి' : 'రకం చేరలేదు; మళ్లీ ప్రయత్నించండి'); }
    finally { setBusy(false); }
  };
  return <div className="space-y-3 border-2 border-dashed border-primary p-3 rounded-lg">
    <Button variant="ghost" className="h-auto min-h-12 w-full justify-start whitespace-normal text-left text-lg font-bold text-primary" aria-expanded={open} onClick={() => setOpen(value => !value)}><PlusCircle className="size-7 shrink-0" />{label}</Button>
    {open && <form onSubmit={event => { event.preventDefault(); void submit(); }} className="flex items-center gap-2"><Input aria-label="కొత్త రకం పేరు" placeholder="కొత్త రకం పేరు" value={name} onChange={event => setName(event.target.value)} maxLength={40} translate="no" disabled={busy} className="min-w-0 flex-1" /><Button type="submit" size="icon" aria-label="రకం చేర్చండి" disabled={busy || name.trim().length < 2}><PlusCircle /></Button></form>}
  </div>;
}
