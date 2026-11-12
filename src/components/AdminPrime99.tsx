import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function AdminPrime99() {
  const qc = useQueryClient(); const [busy, setBusy] = useState(false); const [reference, setReference] = useState('');
  const payments = useQuery({ queryKey: ['admin-prime99'], refetchInterval: 10000, queryFn: async () => {
    const [result, people] = await Promise.all([supabase.from('prime99_payments').select('*').order('submitted_at', { ascending: false }), supabase.from('profiles').select('id,full_name,phone')]);
    if (result.error || people.error) throw result.error ?? people.error;
    return result.data.map(p => ({ ...p, person: people.data.find(u => u.id === p.user_id) }));
  } });
  const rewards = useQuery({ queryKey: ['admin-prize-payouts'], queryFn: async () => {
    const [result, paid] = await Promise.all([supabase.from('referral_cash_rewards').select('*'), supabase.from('referral_prize_payouts').select('receipt_id')]);
    if (result.error || paid.error) throw result.error ?? paid.error;
    return result.data.filter(r => !paid.data.some(p => p.receipt_id === r.receipt_id));
  } });
  const review = async (id: string, approve: boolean) => {
    const payment = payments.data?.find(p => p.id === id);
    if (!payment) return;
    if (approve && !window.confirm(`బ్యాంకులో ₹${payment.payable_amount} నిజంగా అందిందని నిర్ధారించారా?`)) return;
    setBusy(true); try {
      const result = await supabase.rpc('review_prime99', { _id: id, _approve: approve, _note: approve ? `₹${payment.payable_amount} అందినట్లు నిర్ధారించాం` : 'చెల్లింపు ఆమోదించలేదు' });
      if (result.error) throw result.error;
      await qc.invalidateQueries(); toast.success('పరిశీలన నమోదైంది');
    } catch { toast.error('పరిశీలన నమోదు కాలేదు; చెల్లింపు సంఖ్యను తనిఖీ చేయండి'); } finally { setBusy(false); }
  };
  return <section className="space-y-3 border-y py-4"><h2 className="text-xl font-bold">చెల్లింపుల పరిశీలన, చరిత్ర · Payment review</h2>
    {payments.isError && <Button onClick={() => void payments.refetch()}>మళ్లీ చూడండి · Retry</Button>}
    {payments.data?.length === 0 && <p>పరిశీలనకు కొత్త చెల్లింపులు లేవు · No pending payments</p>}
    {payments.data?.map(p => <article key={p.id} className="space-y-2 border-b py-3"><p>{p.person?.full_name || '—'} · {p.person?.phone}</p><p className="break-all">₹{p.payable_amount} · {p.reference}</p><p>{p.payment_purpose === 'extra_post' ? 'అదనపు పోస్ట్' : 'సభ్యత్వం'} · {p.status === 'approved' ? 'ఆమోదం' : p.status === 'rejected' ? 'తిరస్కరణ' : 'పరిశీలనలో'}</p>{p.status === 'pending' && <div className="flex gap-2"><Button disabled={busy} onClick={() => void review(p.id, true)}>ఆమోదించు · Approve</Button><Button variant="outline" disabled={busy} onClick={() => void review(p.id, false)}>తిరస్కరించు · Reject</Button></div>}</article>)}
    <h3 className="text-lg font-bold">వేడుక నగదు ఇచ్చిన నమోదు · Record actual payout</h3>
    <p>వేడుక రోజు నిజంగా ఇచ్చిన తర్వాతే నమోదు చేయండి. లెక్కలో బహుమతి ఉండటం నగదు ఇచ్చినట్లు కాదు.</p>
    <Input aria-label="నగదు ఇచ్చిన ఆధారం · Payout reference" value={reference} maxLength={120} onChange={e => setReference(e.target.value)} />
    {rewards.isError && <Button onClick={() => void rewards.refetch()}>మళ్లీ చూడండి · Retry</Button>}
    {rewards.data?.map(r => <article key={r.receipt_id} className="space-y-2 border-b py-2"><p>₹{(r.amount_paise / 100).toFixed(2)}</p><p className="break-all text-sm">{r.user_id}</p><Button disabled={busy || reference.trim().length < 6} variant="outline" onClick={async () => {
      if (!window.confirm('ఈ బహుమతి నిజంగా ఇచ్చారా?')) return;
      setBusy(true); try { const result = await supabase.rpc('record_referral_prize_paid', { _receipt: r.receipt_id, _reference: reference.trim() }); if (result.error) throw result.error; await qc.invalidateQueries(); setReference(''); toast.success('నిజమైన నగదు చెల్లింపు నమోదైంది'); } catch { toast.error('నమోదు కాలేదు'); } finally { setBusy(false); }
    }}>నగదు ఇచ్చినట్లు నమోదు · Record paid</Button></article>)}
  </section>;
}