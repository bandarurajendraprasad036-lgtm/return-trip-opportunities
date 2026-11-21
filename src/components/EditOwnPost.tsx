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

// Owner-only edit of the ad's own visible fields; row-level rules also restrict updates to the owner.
export function EditOwnPost({ post }: { post: Post }) {
  const { data: me } = useMe(); const qc = useQueryClient();
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false);
  const isJob = post.module === 'job';
  const [skill, setSkill] = useState(post.skill ?? post.title ?? '');
  const [location, setLocation] = useState(post.location ?? '');
  const [salary, setSalary] = useState(post.salary ?? '');
  const [from, setFrom] = useState(post.from_place ?? '');
  const [to, setTo] = useState(post.to_place ?? '');
  const [date, setDate] = useState(post.trip_date ?? '');
  if (!me || me.id !== post.user_id) return null;
  const save = async () => {
    if (busy) return; setBusy(true);
    const changes = isJob ? { skill: skill.trim(), title: skill.trim() || post.title, location: location.trim(), salary: salary.trim() } : { from_place: from.trim(), to_place: to.trim(), trip_date: date || null };
    const r = await supabase.from('posts').update(changes).eq('id', post.id).eq('user_id', me.id).select('id');
    setBusy(false);
    if (r.error || !r.data?.length) { toast.error(r.error?.message.includes('BAD') ? 'ఈ పదాలు అనుమతి లేదు' : 'మార్పు భద్రపడలేదు; మళ్లీ ప్రయత్నించండి'); return; }
    toast.success('ప్రకటన మార్చారు'); setOpen(false); await qc.invalidateQueries();
  };
  return <>
    <Button variant="outline" data-subscription-exempt className="h-auto min-h-11 whitespace-normal" onClick={() => setOpen(true)}><Pencil />ప్రకటన మార్చండి</Button>
    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}><DialogContent aria-describedby={undefined} className="max-h-[85svh] overflow-y-auto">
      <DialogTitle>ప్రకటన మార్చండి</DialogTitle>
      {isJob ? <>
        <div className="space-y-1"><Label htmlFor={`edit-skill-${post.id}`}>పని</Label><Input id={`edit-skill-${post.id}`} value={skill} onChange={e => setSkill(e.target.value)} maxLength={80} translate="no" /></div>
        <div className="space-y-1"><Label htmlFor={`edit-loc-${post.id}`}>ఊరు / ఏరియా</Label><Input id={`edit-loc-${post.id}`} value={location} onChange={e => setLocation(e.target.value)} maxLength={120} translate="no" /></div>
        <div className="space-y-1"><Label htmlFor={`edit-sal-${post.id}`}>జీతం</Label><Input id={`edit-sal-${post.id}`} value={salary} onChange={e => setSalary(e.target.value)} maxLength={60} translate="no" /></div>
      </> : <>
        <div className="space-y-1"><Label htmlFor={`edit-from-${post.id}`}>ఎక్కడినుండి</Label><Input id={`edit-from-${post.id}`} value={from} onChange={e => setFrom(e.target.value)} maxLength={120} translate="no" /></div>
        <div className="space-y-1"><Label htmlFor={`edit-to-${post.id}`}>ఎక్కడికి</Label><Input id={`edit-to-${post.id}`} value={to} onChange={e => setTo(e.target.value)} maxLength={120} translate="no" /></div>
        <div className="space-y-1"><Label htmlFor={`edit-date-${post.id}`}>తేదీ</Label><Input id={`edit-date-${post.id}`} type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
      </>}
      <Button disabled={busy} className="min-h-12" onClick={() => void save()}>{busy ? 'భద్రపరుస్తున్నాం…' : 'భద్రపరచండి'}</Button>
    </DialogContent></Dialog>
  </>;
}
