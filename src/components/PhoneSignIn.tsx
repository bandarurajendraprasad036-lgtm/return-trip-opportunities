import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { MessageSquareText, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { hasValidMobile } from '@/lib/phone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { rememberAuthReturn, takeAuthReturn } from '@/lib/auth-navigation';

export function PhoneSignIn({ destination = '/dashboard', returnTo }: { destination?: '/dashboard' | '/admin-login'; returnTo?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const clear = () => {
    setPhone(''); setCode(''); setSent(false); setMessage(''); setError('');
  };
  const requestCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasValidMobile(phone) || busy) { setError('సరైన 10 అంకెల మొబైల్ నంబరు ఇవ్వండి · Enter a valid mobile'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const { error: requestError } = await supabase.auth.signInWithOtp({ phone: `+91${phone}`, options: { shouldCreateUser: false } });
      if (requestError) throw requestError;
      setSent(true);
      if (returnTo) rememberAuthReturn(returnTo);
      setMessage('మీ ఖాతా నంబరుకు నిర్ధారణ కోడ్ అభ్యర్థన పంపాం. అందిన కోడ్ ఇవ్వండి.');
    } catch {
      setError('కోడ్ పంపలేకపోయాం. ఫోన్ సందేశ సదుపాయం ఆన్‌లో ఉండాలి; ఈ నంబరు పాత ఖాతాకు జతై ఉండాలి. కొత్త ఖాతా సృష్టించలేదు.');
    } finally { setBusy(false); }
  };
  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !/^\d{6}$/.test(code)) return;
    setBusy(true); setError('');
    try {
      const result = await supabase.auth.verifyOtp({ phone: `+91${phone}`, token: code, type: 'sms' });
      if (result.error || !result.data.session) throw result.error ?? new Error('SESSION_REQUIRED');
      await queryClient.invalidateQueries();
      await navigate({ href: takeAuthReturn(destination === '/admin-login' ? '/admin-login' : '/'), replace: true });
    } catch {
      setError('కోడ్ సరికాలేదు లేదా గడువు ముగిసింది. మళ్లీ కోడ్ పొందండి.');
    } finally { setBusy(false); }
  };

  return <section className="space-y-3 border-y py-4" aria-label="వాట్సాప్ నంబరుతో ప్రవేశం">
    <h2 className="text-xl font-bold">వాట్సాప్ నంబరుతో ప్రవేశం</h2>
    <form className="space-y-3" onSubmit={sent ? verify : requestCode}>
      <div className="space-y-1">
        <Label htmlFor="login-phone">వాట్సాప్ మొబైల్ నంబరు</Label>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <Input id="login-phone" type="tel" inputMode="numeric" autoComplete="off" value={phone} onChange={event => { setPhone(event.target.value.replace(/\D/g, '').slice(0, 10)); setSent(false); setError(''); }} disabled={busy} pattern="[6-9][0-9]{9}" maxLength={10} placeholder="మీ నంబరు ఇవ్వండి" className="h-12 text-base" />
          <Button type="button" variant="outline" onClick={clear} disabled={busy || !phone}><X />తుడిచేయండి</Button>
        </div>
      </div>
      {sent && <><Label htmlFor="login-code">ఫోన్‌కు వచ్చిన కోడ్</Label><Input id="login-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} required disabled={busy} /></>}
      <Button type="submit" className="w-full" disabled={busy || !hasValidMobile(phone) || (sent && !/^\d{6}$/.test(code))}><MessageSquareText />{busy ? 'వేచి ఉండండి…' : sent ? 'కోడ్ నిర్ధారించి ప్రవేశించండి' : 'నిర్ధారణ కోడ్ పొందండి'}</Button>
      {message && <p role="status" className="text-sm">{message}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </form>
  </section>;
}
