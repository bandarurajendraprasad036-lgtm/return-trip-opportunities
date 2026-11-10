import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { MessageSquareText, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { hasValidMobile } from '@/lib/phone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PhoneSignIn({ destination = '/dashboard' }: { destination?: '/dashboard' | '/admin-login' }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fullPhone = `+91${phone}`;

  const clear = () => {
    setPhone(''); setCode(''); setSent(false); setMessage(''); setError('');
  };
  const requestCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasValidMobile(phone) || busy) { setError('సరైన 10 అంకెల మొబైల్ నంబరు ఇవ్వండి · Enter a valid mobile'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const { error: requestError } = await supabase.auth.signInWithOtp({ phone: fullPhone, options: { shouldCreateUser: true } });
      if (requestError) throw requestError;
      setSent(true);
      setMessage('కోడ్ పంపే అభ్యర్థన అంగీకరించబడింది. మీ ఫోన్‌కు వచ్చిన కోడ్ నమోదు చేయండి · Code requested; enter the code you received');
    } catch {
      setError('కోడ్ పంపలేకపోయాం. నంబరు సరిచూడండి లేదా కొద్దిసేపు తర్వాత ప్రయత్నించండి · Could not request a code');
    } finally { setBusy(false); }
  };
  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code) || busy) { setError('ఫోన్‌కు వచ్చిన 6 అంకెల కోడ్ ఇవ్వండి · Enter the 6-digit code'); return; }
    setBusy(true); setError('');
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({ phone: fullPhone, token: code, type: 'sms' });
      if (verifyError) throw verifyError;
      await queryClient.invalidateQueries();
      await navigate({ to: destination, replace: true });
    } catch {
      setError('కోడ్ సరికాలేదు లేదా గడువు ముగిసింది. మళ్లీ ప్రయత్నించండి · Invalid or expired code');
    } finally { setBusy(false); }
  };

  return <section className="space-y-3 rounded-xl border bg-card p-4" aria-label="మొబైల్ ద్వారా ప్రవేశం · Phone sign-in">
    <h2 className="text-xl font-bold">మొబైల్ నంబరుతో ప్రవేశం · Phone sign-in</h2>
    <form className="space-y-3" onSubmit={sent ? verify : requestCode}>
      <div className="space-y-1">
        <Label htmlFor="login-phone">మొబైల్ నంబరు · Mobile number</Label>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <Input id="login-phone" type="tel" inputMode="numeric" autoComplete="off" value={phone} onChange={event => { setPhone(event.target.value.replace(/\D/g, '').slice(0, 10)); setSent(false); setCode(''); setError(''); }} disabled={busy} pattern="[6-9][0-9]{9}" maxLength={10} placeholder="కొత్త నంబరు ఇవ్వండి" className="h-12 text-base" />
          <Button type="button" variant="outline" onClick={clear} disabled={busy || (!phone && !code)}><X />తుడిచేయండి · Clear</Button>
        </div>
      </div>
      {sent && <div className="space-y-1"><Label htmlFor="login-code">ఫోన్‌కు వచ్చిన కోడ్ · Received code</Label><Input id="login-code" type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} className="h-12 text-base" autoFocus /></div>}
      <Button type="submit" className="w-full" disabled={busy || !hasValidMobile(phone)}><MessageSquareText />{busy ? 'వేచి ఉండండి…' : sent ? 'కోడ్ సరిచూసి ప్రవేశించండి · Verify and sign in' : 'కోడ్ పొందండి · Get code'}</Button>
      {sent && <Button type="button" variant="ghost" className="w-full" disabled={busy} onClick={() => void requestCode({ preventDefault() {} } as React.FormEvent)}>కోడ్ మళ్లీ పంపండి · Request code again</Button>}
      {message && <p role="status" className="text-sm">{message}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </form>
  </section>;
}
