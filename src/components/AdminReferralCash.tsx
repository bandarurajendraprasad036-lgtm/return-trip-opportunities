import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function AdminReferralCash() {
  const qc = useQueryClient();
  const [user, setUser] = useState(''), [reference, setReference] = useState(''), [amount, setAmount] = useState(''), [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const { data: people = [] } = useQuery({ queryKey: ['cash-users'], queryFn: async () => { const result = await supabase.from('profiles').select('id,full_name,phone').order('created_at'); if (result.error) throw result.error; return result.data; } });
  return <section className="space-y-3 border-y py-4"><h3 className="text-xl font-bold">పరిచయ నగదు బహుమతులు · Referral cash prizes</h3>
    <Label htmlFor="cash-user">చెల్లించిన వ్యక్తి · Payer</Label><select id="cash-user" className="h-12 w-full rounded-md border bg-card px-2" value={user} onChange={e => setUser(e.target.value)}><option value="">ఎంచుకోండి · Choose</option>{people.map(p => <option key={p.id} value={p.id}>{p.full_name} · {p.phone}</option>)}</select>
    <Label htmlFor="cash-reference">చెల్లింపు ఆధారం · Receipt reference</Label><Input id="cash-reference" value={reference} maxLength={120} onChange={e => setReference(e.target.value)} />
    <Label htmlFor="cash-amount">అందిన మొత్తం ₹ · Received amount</Label><Input id="cash-amount" type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
    <Button disabled={busy || !user || reference.trim().length < 3 || Number(amount) <= 0} onClick={async () => { if (!window.confirm('ఈ చెల్లింపు నిజంగా అందిందని నిర్ధారించారా?')) return; setBusy(true); try { const result = await supabase.rpc('confirm_referral_cash', { _user: user, _reference: reference.trim(), _amount_paise: Math.round(Number(amount) * 100) }); if (result.error) throw result.error; setReference(''); setAmount(''); await qc.invalidateQueries({ queryKey: ['referral-vip'] }); toast.success('అందిన చెల్లింపు, వర్తించే 20% బహుమతి నమోదయ్యాయి · Receipt and applicable reward recorded'); } catch { toast.error('నమోదు కాలేదు; ఆధారం ఇప్పటికే ఉందేమో చూడండి · Check receipt reference'); } finally { setBusy(false); } }}>అందిన చెల్లింపు నిర్ధారించండి · Confirm receipt</Button>
    <h3 className="text-lg font-bold">అందరికీ సమాచారం · Broadcast</h3><Input aria-label="అందరికీ సందేశం · Broadcast message" value={message} maxLength={1000} onChange={e => setMessage(e.target.value)} />
    <Button disabled={busy || !message.trim()} onClick={async () => { if (!window.confirm('అనుమతించిన ఖాతాలకు ఈ సందేశం పంపాలా?')) return; setBusy(true); try { const result = await supabase.rpc('admin_broadcast', { _message: message.trim() }); if (result.error) throw result.error; toast.success(`${result.data} ఖాతాల్లో సమాచారం నమోదైంది; ఫోన్ చేరిక నిర్ధారణ కాదు.`); setMessage(''); } catch { toast.error('పంపలేకపోయాం · Could not send'); } finally { setBusy(false); } }}>సమాచారం పంపండి · Send notice</Button>
  </section>;
}