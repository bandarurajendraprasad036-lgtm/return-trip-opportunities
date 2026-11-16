import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { MessageSquareText, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { hasValidMobile } from '@/lib/phone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { phoneDeviceIdentity } from '@/lib/phone-entry';
import { redeemPhoneEntry } from '@/lib/phone-entry.functions';
import { rememberAuthReturn, takeAuthReturn } from '@/lib/auth-navigation';

export function PhoneSignIn({ destination = '/dashboard', returnTo }: { destination?: '/dashboard' | '/admin-login'; returnTo?: string }) {
  const redeem = useServerFn(redeemPhoneEntry);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const clear = () => {
    setPhone(''); setSent(false); setMessage(''); setError('');
  };
  const requestCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasValidMobile(phone) || busy) { setError('సరైన 10 అంకెల మొబైల్ నంబరు ఇవ్వండి · Enter a valid mobile'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const device = await phoneDeviceIdentity();
      const { error: requestError } = await supabase.rpc('request_phone_entry', { _phone: phone, _hash: device.hash });
      if (requestError) throw requestError;
      setSent(true);
      if (returnTo) rememberAuthReturn(returnTo);
      setMessage('మీ నంబరు పంపారు. నిర్వాహకులు ఫోన్‌లో పరిశీలించి అనుమతిచ్చాక ఇక్కడ ప్రవేశించండి.');
    } catch {
      setError('అభ్యర్థన పంపలేకపోయాం. మళ్లీ ప్రయత్నించండి.');
    } finally { setBusy(false); }
  };
  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const device = await phoneDeviceIdentity();
      const result = await redeem({ data: { secret: device.secret } });
      if (!result.session) { setMessage(result.status === 'rejected' ? 'మీ అభ్యర్థనకు అనుమతి ఇవ్వలేదు.' : 'నిర్వాహకుల పరిశీలన ఇంకా పూర్తికాలేదు.'); return; }
      const saved = await supabase.auth.setSession(result.session);
      if (saved.error) throw saved.error;
      await queryClient.invalidateQueries();
      await navigate({ href: takeAuthReturn(destination === '/admin-login' ? '/admin-login' : '/feed'), replace: true });
    } catch {
      setError('ప్రవేశం తెరవలేదు. మీ అనుమతిని మళ్లీ చూడండి.');
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
      <Button type="submit" className="w-full" disabled={busy || !hasValidMobile(phone)}><MessageSquareText />{busy ? 'వేచి ఉండండి…' : sent ? 'అనుమతి చూసి ప్రవేశించండి' : 'నంబరు పంపండి'}</Button>
      {message && <p role="status" className="text-sm">{message}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </form>
  </section>;
}
