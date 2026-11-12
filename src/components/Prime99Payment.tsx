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
import { MEMBERSHIP_AMOUNT, EXTRA_POST_AMOUNT } from '@/lib/current-membership';

export function Prime99Payment({ bellPayment = false }: { bellPayment?: boolean }) {
  const { data: me } = useMe();
  const { data: prime } = usePrime99(me?.id);
  const qc = useQueryClient();
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [purpose, setPurpose] = useState<'membership' | 'extra_post'>('membership');
  const price = useQuery({ queryKey: ['membership-price', me?.id], enabled: Boolean(me), queryFn: async () => { const r = await supabase.rpc('my_membership_price'); if (r.error) throw r.error; return r.data; } });
  const amount = purpose === 'extra_post' ? EXTRA_POST_AMOUNT : bellPayment ? MEMBERSHIP_AMOUNT : price.data ?? MEMBERSHIP_AMOUNT;
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
    <h2 className="text-xl font-bold">₹100 ప్రైమ్ సభ్యత్వం · Prime membership</h2>
    <p>{prime?.active ? 'చెల్లింపు ఆమోదించబడింది · Active' : 'ఆమోదించిన చెల్లింపు అవసరం · Approved payment required'}</p>
    {prime?.active && prime.ends_at && <p>గడువు · Until: {new Date(prime.ends_at).toLocaleString('te-IN', { timeZone: 'Asia/Kolkata' })}</p>}
    <p>నెలకు మూడు పోస్టులు ఉచితం. అదనపు ఒక్కో పోస్టుకు ₹49. చూడటం అందరికీ ఉచితం; ఇప్పటికే ప్రారంభించిన వ్యక్తిగత సంభాషణ ఉచితం. గంటకు నెలకు ₹100 చెల్లింపు నిర్ధారణ అవసరం.</p>
    <p>కొత్త ₹100 చెల్లింపు నిర్ధారించిన రోజు నుంచి ఒక నెల గడువు. గంట సూచనలకు మీ గంట ఎంపిక, ఫోన్ అనుమతి అవసరం. చెల్లింపు ఆధారం పంపడమే నిర్ధారణ కాదు; కస్టమర్లు లేదా కాల్స్‌కు హామీ లేదు.</p>
    {prime?.alerts_start_at && !prime.alerts_ready && <p>సూచనలు ప్రారంభమయ్యే సమయం: {new Date(prime.alerts_start_at).toLocaleString('te-IN', { timeZone: 'Asia/Kolkata' })}; హోమ్ గంట ఎంపిక అవసరం.</p>}
    {price.data === 49 && !bellPayment && <p>మీ సేవా నంబర్ల పరిశీలన ఆమోదమైంది; సభ్యత్వానికి ₹49 మాత్రమే చెల్లించవచ్చు. గంట పని చేయడానికి మాత్రం ₹100 చెల్లించాలి.</p>}
    <p>ఈ నెల పోస్టులు · Posts used: {quota.data?.used ?? '—'} / 3</p>
    {quota.data?.ends_at && <p>పోస్టుల గడువు · Post period ends: {new Date(quota.data.ends_at).toLocaleString('te-IN', { timeZone: 'Asia/Kolkata' })}</p>}
    <AdminChatButton />
    <p className="text-sm">చెల్లింపు ఎక్కడ చేయాలో నిర్వాహకుడిని అడగండి. ఆధారం పంపడమే ఆమోదం కాదు. · Ask admin where to pay; submission is not approval.</p>
    {!bellPayment && <div className="grid grid-cols-2 gap-2"><Button variant={purpose === 'membership' ? 'default' : 'outline'} className="h-auto min-h-12 whitespace-normal" onClick={() => setPurpose('membership')}>సభ్యత్వం · Membership</Button><Button variant={purpose === 'extra_post' ? 'default' : 'outline'} className="h-auto min-h-12 whitespace-normal" onClick={() => setPurpose('extra_post')}>అదనపు పోస్ట్ ₹49 · Extra post</Button></div>}
    <Label htmlFor="prime99-reference">₹{amount} చెల్లింపు లావాదేవీ సంఖ్య · Transaction reference</Label>
    <Input id="prime99-reference" value={reference} maxLength={64} onChange={e => setReference(e.target.value)} disabled={busy} />
    <Button disabled={busy || price.isPending || price.isError || !/^[A-Za-z0-9-]{6,64}$/.test(reference.trim()) || payments.data?.some(p => p.status === 'pending' && p.payment_purpose === purpose)} onClick={async () => {
      setBusy(true);
      try { const result = await supabase.from('prime99_payments').insert({ user_id: me.id, reference: reference.trim(), payable_amount: amount, payment_purpose: purpose });
        if (result.error) throw result.error;
        setReference(''); await qc.invalidateQueries({ queryKey: ['prime99-payments'] }); toast.success('చెల్లింపు ఆధారం పరిశీలనకు పంపాం');
      } catch { toast.error('ఆధారం నమోదు కాలేదు; ఇదే సంఖ్య ఇప్పటికే ఉందేమో చూడండి'); } finally { setBusy(false); }
    }}>పరిశీలనకు పంపండి · Submit for review</Button>
    {payments.isError && <Button variant="outline" onClick={() => void payments.refetch()}>మళ్లీ చూడండి · Retry</Button>}
    {payments.data?.map(p => <article key={p.id} className="border-b py-2"><p className="break-all">₹{p.payable_amount} · {p.reference}</p><p>{p.payment_purpose === 'extra_post' ? 'అదనపు పోస్టు' : 'సభ్యత్వం'} · {p.status === 'approved' ? 'ఆమోదించబడింది · Approved' : p.status === 'rejected' ? 'ఆమోదించలేదు · Rejected' : 'పరిశీలనలో ఉంది · Under review'}</p>{p.status === 'approved' && <p>🙏 ధన్యవాదాలు! మీరు కట్టిన ₹{p.payable_amount} అందినట్లు నిర్వాహకుడు నిర్ధారించారు.{p.payment_purpose === 'membership' ? ' మీ ప్రకటనల ప్రదర్శనలో వ్యక్తిగత పేరు, ఫోటో, మొబైల్ దాచబడతాయి.' : p.used_post_id ? ' అదనపు పోస్టు అవకాశం వినియోగించారు.' : ' ఒక అదనపు పోస్టు పెట్టవచ్చు.'}</p>}{p.review_note && <p>{p.review_note}</p>}</article>)}
  </section>;
}