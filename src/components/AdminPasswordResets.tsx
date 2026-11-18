import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { adminResetPassword } from '@/lib/password-reset.functions';
import { passwordPairError } from '@/lib/phone-password';
import { hasValidMobile } from '@/lib/phone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AdminPasswordResets() {
  const qc = useQueryClient();
  const reset = useServerFn(adminResetPassword);
  const [phone, setPhone] = useState(''), [password, setPassword] = useState(''), [again, setAgain] = useState(''), [busy, setBusy] = useState(false), [status, setStatus] = useState('');
  const { data: requests = [] } = useQuery({ queryKey: ['password-reset-requests'], refetchInterval: 15000, queryFn: async () => { const r = await supabase.from('password_reset_requests').select('id,phone,created_at').eq('status', 'pending').order('created_at', { ascending: false }).limit(50); if (r.error) throw r.error; return r.data; } });
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!hasValidMobile(phone)) { setStatus('సరైన మొబైల్ నంబర్ ఇవ్వండి'); return; }
    const problem = passwordPairError(password, again); if (problem) { setStatus(problem); return; }
    setBusy(true); setStatus('');
    try { await reset({ data: { phone, password } }); setStatus(`పాస్వర్డ్ మారింది (${phone}). ఈ కొత్త పాస్వర్డ్ ఆ వ్యక్తికి మీరే చెప్పండి.`); setPassword(''); setAgain(''); await qc.invalidateQueries({ queryKey: ['password-reset-requests'] }); }
    catch (error) { const m = error instanceof Error ? error.message : ''; setStatus(m.includes('NO_ACCOUNT') ? 'ఈ నంబర్‌తో మొబైల్-పాస్వర్డ్ ఖాతా లేదు' : 'పాస్వర్డ్ మారలేదు. మళ్ళీ ప్రయత్నించండి'); }
    finally { setBusy(false); }
  };
  const dismiss = async (id: string) => { const r = await supabase.from('password_reset_requests').update({ status: 'dismissed', handled_at: new Date().toISOString() }).eq('id', id); if (r.error) toast.error('మారలేదు'); else await qc.invalidateQueries({ queryKey: ['password-reset-requests'] }); };
  return <section className="space-y-3 rounded-lg border p-4" aria-label="పాస్వర్డ్ రీసెట్">
    <h2 className="text-xl font-bold">పాస్వర్డ్ మర్చిపోయిన వాళ్ళు</h2>
    <p className="text-sm">ముందు ఆ నంబర్‌కు ఫోన్ చేసి, అతనే అని నిర్ధారించుకున్న తర్వాతే కొత్త పాస్వర్డ్ పెట్టండి.</p>
    {requests.length === 0 ? <p>కొత్త అభ్యర్థనలు లేవు</p> : <ul className="space-y-2">{requests.map(r => <li key={r.id} className="flex flex-wrap items-center gap-2 border-b pb-2"><span translate="no" className="font-bold">{r.phone}</span><span className="text-xs">{new Date(r.created_at).toLocaleString('te-IN', { timeZone: 'Asia/Kolkata' })}</span><Button size="sm" variant="outline" onClick={() => setPhone(r.phone)}>ఎంచుకోండి</Button><Button size="sm" variant="ghost" onClick={() => void dismiss(r.id)}>తీసేయండి</Button></li>)}</ul>}
    <form className="space-y-2" onSubmit={save}>
      <Input type="tel" inputMode="numeric" aria-label="మొబైల్ నంబర్" placeholder="మొబైల్ నంబర్" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} maxLength={10} />
      <Input type="password" aria-label="కొత్త పాస్వర్డ్" placeholder="కొత్త పాస్వర్డ్" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} maxLength={72} />
      <Input type="password" aria-label="కొత్త పాస్వర్డ్ మళ్ళీ" placeholder="కొత్త పాస్వర్డ్ మళ్ళీ" autoComplete="new-password" value={again} onChange={e => setAgain(e.target.value)} maxLength={72} />
      <Button type="submit" disabled={busy} className="w-full">కొత్త పాస్వర్డ్ సేవ్ చేయండి</Button>
      {status && <p role="status">{status}</p>}
    </form>
  </section>;
}
