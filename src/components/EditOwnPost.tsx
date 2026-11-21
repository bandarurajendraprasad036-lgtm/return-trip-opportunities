import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useMe } from '@/lib/session';
import type { Post } from '@/components/PostCard';
import { POST_LIST_COLUMNS } from '@/lib/post-access';

type Field = { key: keyof Post; label: string; type?: string };
const JOB: Field[] = [{ key: 'skill', label: 'పని / కేటగిరీ' }, { key: 'location', label: 'ఊరు / ఏరియా' }, { key: 'salary', label: 'జీతం / ధర' }, { key: 'contact_phone', label: 'ఫోన్ నంబర్', type: 'tel' }, { key: 'description', label: 'వివరాలు' }];
const VEHICLE: Field[] = [{ key: 'vehicle_name', label: 'వాహనం పేరు' }, { key: 'vehicle_type', label: 'వాహనం రకం' }, { key: 'from_place', label: 'ఎక్కడినుండి' }, { key: 'to_place', label: 'ఎక్కడికి' }, { key: 'trip_date', label: 'తేదీ', type: 'date' }, { key: 'salary', label: 'ధర' }, { key: 'driver_name', label: 'డ్రైవర్ పేరు' }, { key: 'contact_phone', label: 'ఫోన్ నంబర్', type: 'tel' }, { key: 'description', label: 'వివరాలు' }];

// Owner edits own ad; admin edits any ad. Row rules allow update only to the owner or admin.
export function EditOwnPost({ post }: { post: Post }) {
  const { data: me } = useMe(); const qc = useQueryClient();
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const fields = post.module === 'job' ? JOB : VEHICLE;
  if (!me || (me.id !== post.user_id && !me.isAdmin)) return null;
  const start = async () => {
    const [r, extra] = await Promise.all([supabase.from('posts').select(POST_LIST_COLUMNS).eq('id', post.id).maybeSingle(), supabase.rpc('post_edit_fields', { _post: post.id })]);
    if (r.error || !r.data || extra.error) { toast.error('ప్రకటన రాలేదు'); return; }
    const row = { ...(r.data as Record<string, unknown>), ...(extra.data?.[0] ?? {}) } as Record<string, unknown>;
    setValues(Object.fromEntries(fields.map(f => [f.key, row[f.key] == null ? '' : String(row[f.key])]))); setOpen(true);
  };
  const save = async () => {
    if (busy) return; setBusy(true);
    const changes: Record<string, string | null> = {};
    for (const f of fields) { const v = (values[f.key] ?? '').trim(); changes[f.key] = v || (f.key === 'trip_date' ? null : ''); }
    if (post.module === 'job' && changes['skill']) changes['title'] = changes['skill'];
    let q = supabase.from('posts').update(changes as never).eq('id', post.id);
    if (!me.isAdmin) q = q.eq('user_id', me.id);
    const r = await q.select('id');
    setBusy(false);
    if (r.error || !r.data?.length) { toast.error(r.error?.message.includes('BAD') ? 'ఈ పదాలు అనుమతి లేదు' : 'మార్పు భద్రపడలేదు; మళ్లీ ప్రయత్నించండి'); return; }
    toast.success('ప్రకటన మార్చారు'); setOpen(false); await qc.invalidateQueries();
  };
  return <>
    <Button variant="outline" data-subscription-exempt className="h-auto min-h-11 whitespace-normal" onClick={() => void start()}><Pencil />ఎడిట్</Button>
    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}><DialogContent aria-describedby={undefined} className="max-h-[85svh] overflow-y-auto">
      <DialogTitle>ప్రకటన మార్చండి</DialogTitle>
      {fields.map(f => <div key={f.key} className="space-y-1"><Label htmlFor={`edit-${f.key}-${post.id}`}>{f.label}</Label><Input id={`edit-${f.key}-${post.id}`} type={f.type ?? 'text'} value={values[f.key] ?? ''} onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))} maxLength={300} translate="no" /></div>)}
      <Button disabled={busy} className="min-h-12" onClick={() => void save()}>{busy ? 'భద్రపరుస్తున్నాం…' : 'సేవ్'}</Button>
    </DialogContent></Dialog>
  </>;
}
