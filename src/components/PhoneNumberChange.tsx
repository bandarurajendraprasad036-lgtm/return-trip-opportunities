import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { hasValidMobile } from '@/lib/phone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PhoneNumberChange({ currentPhone }: { currentPhone: string }) {
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fullPhone = `+91${phone}`;
  const clear = () => { setPhone(''); setCode(''); setSent(false); setError(''); };

  const request = async () => {
    if (!hasValidMobile(phone) || busy) { setError('సరైన 10 అంకెల కొత్త నంబరు ఇవ్వండి · Enter a valid new mobile'); return; }
    if (phone === currentPhone) { setError('ఇది ఇప్పటికే మీ నంబరు · This is already your number'); return; }
    setBusy(true); setError('');
    try {
      const { error: updateError } = await supabase.auth.updateUser({ phone: fullPhone });
      if (updateError) throw updateError;
      setSent(true);
      toast.success('నంబరు మార్పు కోడ్ అభ్యర్థన అంగీకరించబడింది · Phone-change code requested');
    } catch {
      setError('నంబరు మార్పు కోడ్ పంపలేకపోయాం. వేరు నంబరు ప్రయత్నించండి · Could not request phone-change code');
    } finally { setBusy(false); }
  };
  const verify = async () => {
    if (!/^\d{6}$/.test(code) || busy) { setError('6 అంకెల కోడ్ ఇవ్వండి · Enter the 6-digit code'); return; }
    setBusy(true); setError('');
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({ phone: fullPhone, token: code, type: 'phone_change' });
      if (verifyError) throw verifyError;
      const { error: profileError } = await supabase.from('profiles').update({ phone }).eq('id', (await supabase.auth.getUser()).data.user?.id);
      if (profileError) throw profileError;
      await queryClient.invalidateQueries();
      clear();
      toast.success('కొత్త నంబరు ధృవీకరించి భద్రపరచాం · New number verified and saved');
    } catch {
      setError('కోడ్ సరిచూడలేకపోయాం లేదా నంబరు భద్రపరచలేకపోయాం · Verification or save failed');
    } finally { setBusy(false); }
  };

  return <div className="space-y-2 rounded-lg border p-3">
    <p className="text-sm">ప్రస్తుత నంబరు · Current: <strong>{currentPhone || 'ఇంకా లేదు · Not set'}</strong></p>
    <Label htmlFor="profile-new-phone">కొత్త నంబరుకు మార్చండి · Change number</Label>
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
      <Input id="profile-new-phone" type="tel" inputMode="numeric" autoComplete="off" value={phone} onChange={event => { setPhone(event.target.value.replace(/\D/g, '').slice(0, 10)); setSent(false); setCode(''); setError(''); }} disabled={busy} maxLength={10} pattern="[6-9][0-9]{9}" placeholder="పాత నంబరు తానుగా రాదు" className="h-12 text-base" />
      <Button type="button" variant="outline" onClick={clear} disabled={busy || (!phone && !code)}><X />తుడిచేయండి · Clear</Button>
    </div>
    {sent && <><Label htmlFor="profile-phone-code">ధృవీకరణ కోడ్ · Verification code</Label><Input id="profile-phone-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} className="h-12 text-base" /></>}
    <Button type="button" variant="outline" className="w-full" disabled={busy || !hasValidMobile(phone)} onClick={() => void (sent ? verify() : request())}>{busy ? 'వేచి ఉండండి…' : sent ? 'కోడ్ సరిచూసి నంబరు మార్చండి · Verify and change' : 'మార్పు కోడ్ పొందండి · Get change code'}</Button>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}
