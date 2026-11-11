import { useState } from 'react';
import { AdminChatButton } from '@/components/AdminChatButton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { usePrime99 } from '@/lib/prime99';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function Prime99Payment() {
  const { data: me } = useMe();
  const { data: prime } = usePrime99(me?.id);
  const qc = useQueryClient();
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const payments = useQuery({ queryKey: ['prime99-payments', me?.id], enabled: Boolean(me), refetchInterval: 10000, queryFn: async () => {
    const result = await supabase.from('prime99_payments').select('*').eq('user_id', me?.id ?? '').order('submitted_at', { ascending: false });
    if (result.error) throw result.error; return result.data;
  } });
  const quota = useQuery({ queryKey: ['post-quota99', me?.id], enabled: Boolean(me), queryFn: async () => {
    const result = await supabase.rpc('my_post_quota99'); if (result.error) throw result.error;
    return result.data as { limit: number; used: number; ends_at: string | null };
  } });
  if (!me) return null;
  return <section className="space-y-3 border-y py-4 profile-copy">
    <h2 className="text-xl font-bold">₹99 ప్రైమ్ సభ్యత్వం · Prime membership</h2>
    <p>{prime?.active ? 'చెల్లింపు ఆమోదించబడింది · Active' : 'ఆమోదించిన ₹99 చెల్లింపు అవసరం · Approved ₹99 payment required'}</p>
    {prime?.active && prime.ends_at && <p>గడువు · Until: {new Date(prime.ends_at).toLocaleString('te-IN', { timeZone: 'Asia/Kolkata' })}</p>}
    <p>ఒక నెలలో మొత్తం మూడు ఉద్యోగ/వాహన పోస్టులు. ₹99 చెల్లింపు ఆమోదిస్తేనే గంట శబ్దం, తెర సూచనలు. · Three total posts monthly; approved ₹99 required for alerts.</p>
    <p>ఈ నెల పోస్టులు · Posts used: {quota.data?.used ?? '—'} / 3</p>
    {quota.data?.ends_at && <p>పోస్టుల గడువు · Post period ends: {new Date(quota.data.ends_at).toLocaleString('te-IN', { timeZone: 'Asia/Kolkata' })}</p>}
    <AdminChatButton />
    <p className="text-sm">చెల్లింపు ఎక్కడ చేయాలో నిర్వాహకుడిని అడగండి. ఆధారం పంపడమే ఆమోదం కాదు. · Ask admin where to pay; submission is not approval.</p>
    <Label htmlFor="prime99-reference">₹99 చెల్లింపు లావాదేవీ సంఖ్య · Transaction reference</Label>
    <Input id="prime99-reference" value={reference} maxLength={64} onChange={e => setReference(e.target.value)} disabled={busy} />
    <Button disabled={busy || !/^[A-Za-z0-9-]{6,64}$/.test(reference.trim()) || payments.data?.some(p => p.status === 'pending')} onClick={async () => {
      setBusy(true);
      try { const result = await supabase.from('prime99_payments').insert({ user_id: me.id, reference: reference.trim() });
        if (result.error) throw result.error;
        setReference(''); await qc.invalidateQueries({ queryKey: ['prime99-payments'] }); toast.success('చెల్లింపు ఆధారం పరిశీలనకు పంపాం');
      } catch { toast.error('ఆధారం నమోదు కాలేదు; ఇదే సంఖ్య ఇప్పటికే ఉందేమో చూడండి'); } finally { setBusy(false); }
    }}>పరిశీలనకు పంపండి · Submit for review</Button>
    {payments.isError && <Button variant="outline" onClick={() => void payments.refetch()}>మళ్లీ చూడండి · Retry</Button>}
    {payments.data?.map(p => <article key={p.id} className="border-b py-2"><p className="break-all">₹99 · {p.reference}</p><p>{p.status === 'approved' ? 'ఆమోదించబడింది · Approved' : p.status === 'rejected' ? 'ఆమోదించలేదు · Rejected' : 'పరిశీలనలో ఉంది · Under review'}</p>{p.review_note && <p>{p.review_note}</p>}</article>)}
  </section>;
}