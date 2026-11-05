import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMe } from '@/lib/session';
import { supabase } from '@/integrations/supabase/client';
import { hasValidMobile } from '@/lib/phone';
import { registerPushDevice } from '@/lib/push.functions';
import { enablePush, pushDeviceId, deviceSound } from '@/lib/firebase-push';

export function BellPhoneRequest() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const register = useServerFn(registerPushDevice);
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  useEffect(() => { setPhone(me?.profile?.phone ?? ''); }, [me?.profile?.phone]);
  if (!me?.profile) return null;
  return <section className="space-y-3 border-b pb-4" aria-label="నా ఫోన్‌కు సూచన · My phone alert">
    <Label htmlFor="bell-mobile">మొబైల్ నంబరు · Mobile number</Label>
    <Input id="bell-mobile" type="tel" inputMode="numeric" value={phone} maxLength={10} disabled={busy} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} />
    <Button disabled={busy || !hasValidMobile(phone)} className="w-full whitespace-normal" onClick={async () => {
      // Start permission directly on the click, before asynchronous profile saving.
      const registration = enablePush();
      setBusy(true); setStatus('');
      try {
        const saved = await supabase.from('profiles').update({ phone }).eq('id', me.id).select('phone').single();
        if (saved.error || saved.data?.phone !== phone) throw new Error('మొబైల్ నంబరు భద్రపడలేదు · Mobile not saved');
        await qc.invalidateQueries({ queryKey: ['me'] });
        const result = await registration;
        if (result.status !== 'registered' || !result.token) {
          setStatus('నంబరు ఖాతాలో భద్రపడింది · Mobile saved. ' + (result.status === 'open-in-new-tab' ? 'వెబ్‌సైట్‌ను విడి పేజీలో తెరిచి అనుమతించండి · Open the site in its own tab' : result.status === 'denied' ? 'ఫోన్ సూచనల అనుమతి ఇవ్వలేదు · Permission denied' : result.status === 'not-configured' ? 'ఫోన్ సూచనల అనుసంధాన వివరాలు అసంపూర్తి · Web push setup incomplete' : result.status === 'unsupported' ? 'ఈ ఫోన్‌లో ఈ సూచన విధానం అందుబాటులో లేదు · Device unsupported' : 'ఫోన్ నమోదు కాలేదు; మళ్లీ ప్రయత్నించండి · Registration failed'));
          return;
        }
        const id = pushDeviceId();
        await register({ data: { id, token: result.token, sound: deviceSound() } });
        const notice = await supabase.rpc('request_own_bell_notice', { _device: id });
        if (notice.error) throw new Error(notice.error.message.includes('NOTIFICATION_PREFERENCES') ? 'మీ సూచనల ఎంపికలు, నిశ్శబ్ద సమయం లేదా రోజువారీ పరిమితి వల్ల పంపలేదు · Stopped by your notification preferences' : 'సూచన అభ్యర్థన భద్రపడలేదు · Notice request failed');
        setStatus('సూచన పంపేందుకు వేచి ఉంది; ఫోన్‌కు చేరినట్లు ఇంకా నిర్ధారణ లేదు · Queued; phone receipt not confirmed');
        await qc.invalidateQueries({ queryKey: ['push-device-status'] });
      } catch (e) { setStatus(e instanceof Error ? e.message : 'అభ్యర్థన పూర్తికాలేదు · Request failed'); }
      finally { setBusy(false); }
    }}>గంట సూచనలు అనుమతించండి · Enable bell notifications</Button>
    {status && <p role="status" className="break-words text-sm">{status}</p>}
    <p className="text-xs text-muted-foreground">నంబరు మీ ఖాతాలో భద్రంగా నిలుస్తుంది. · Mobile saved privately in your account.</p>
  </section>;
}