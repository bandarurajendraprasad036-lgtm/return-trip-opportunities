import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Send, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ResponsibilityNotice } from '@/components/ResponsibilityNotice';
import { BELL_BOARD_LABELS, type BellBoardSection } from '@/lib/bell-board';

export function DashboardGroups() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [opened, setOpened] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const { data: groups = [], isError } = useQuery({ queryKey: ['bell-groups', me?.id], enabled: !!me, refetchInterval: 2000, queryFn: async () => {
    const result = await supabase.rpc('my_bell_groups'); if (result.error) throw result.error; return result.data;
  } });
  const group = groups.find(g => g.id === opened);
  const { data: messages = [] } = useQuery({ queryKey: ['bell-group-messages', me?.id, opened], enabled: !!group, refetchInterval: 2000, queryFn: async () => {
    if (!opened) return [];
    const result = await supabase.from('bell_group_messages').select('id,sender_id,body,created_at').eq('group_id', opened).order('created_at').limit(300);
    if (result.error) throw result.error; return result.data;
  } });
  useEffect(() => { if (opened && !groups.some(g => g.id === opened)) { setOpened(null); setBody(''); } }, [groups, opened]);
  if (!me) return null;
  return <section className="space-y-3 border-y py-4" data-subscription-exempt aria-label="సమూహ సంభాషణలు"><h2 className="text-xl font-bold">సమూహ సంభాషణలు</h2>
    {isError && <p role="alert">సమూహాలు రాలేదు. మళ్లీ ప్రయత్నించండి</p>}
    {!opened && groups.map(g => <Button key={g.id} variant="outline" className="h-auto min-h-14 w-full justify-start whitespace-normal" onClick={() => { setOpened(g.id); setBody(''); }}><Plus /><span>{BELL_BOARD_LABELS[g.section as BellBoardSection] ?? 'ప్రకటన'} · {g.members} మంది</span></Button>)}
    {!opened && !groups.length && <p>ఇంకా సమూహ సంభాషణలు లేవు</p>}
    {group && <><Button variant="ghost" onClick={() => setOpened(null)}><ArrowLeft />సమూహాలు</Button><p className="text-sm">ముగింపు: {new Date(group.expires_at).toLocaleString('te-IN')}</p>
      <div className="max-h-80 space-y-2 overflow-y-auto" aria-live="polite">{messages.map(m => <div key={m.id} className="border-b py-2"><span className="text-sm font-bold">{m.sender_id === me.id ? 'మీరు' : 'సభ్యుడు'}</span><p translate="no" className="whitespace-pre-wrap break-words">{m.body}</p></div>)}</div>
      <form className="flex gap-2" onSubmit={async e => {
        e.preventDefault(); if (busy || !body.trim()) return; setBusy(true);
        try { const r = await supabase.rpc('send_bell_group_message', { _group: group.id, _body: body }); if (r.error) throw r.error; setBody(''); await qc.invalidateQueries({ queryKey: ['bell-group-messages'] }); }
        catch (e) { toast.error(e && typeof e === 'object' && 'message' in e && String(e.message).includes('PHONE_SHARING_BLOCKED') ? 'ఫోన్ సంఖ్యను పంచుకోకండి; ఆ సందేశం పంపలేదు' : 'సందేశం పంపలేదు; సమూహ గడువు పరిశీలించండి'); }
        finally { setBusy(false); }
      }}><Input aria-label="సమూహ సందేశం" className="min-w-0" value={body} maxLength={1000} onChange={e => setBody(e.target.value)} /><Button type="submit" size="icon" aria-label="సమూహానికి పంపండి" disabled={busy || !body.trim()}><Send /></Button></form>
      <Button variant="outline" className="min-h-12 w-full" onClick={() => document.querySelector<HTMLInputElement>('input[aria-label="సమూహ సందేశం"]')?.focus()}>సమాచారం కోసం మాట్లాడండి</Button>
      <ResponsibilityNotice />
    </>}
  </section>;
}