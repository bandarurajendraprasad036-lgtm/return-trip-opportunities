import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { useMe } from '@/lib/session';
import { supabase } from '@/integrations/supabase/client';
import { registerPushDevice } from '@/lib/push.functions';
import { enablePush, pushDeviceId, deviceSound } from '@/lib/firebase-push';

export function BellPhoneRequest() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const register = useServerFn(registerPushDevice);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  if (!me?.profile) return null;
  return <section className="space-y-3 border-b pb-4" aria-label="నా ఫోన్‌కు సూచన · My phone alert">
    <Button disabled={busy} className="w-full whitespace-normal" onClick={async () => {
      // Permission comes only from the explicit device notification action.
      const registration = enablePush();
      setBusy(true); setStatus('');
      try {
        const result = await registration;
        if (result.status !== 'registered' || !result.token) {
          setStatus(result.status === 'open-in-new-tab' ? 'వెబ్‌సైట్‌ను విడి పేజీలో తెరిచి అనుమతించండి · Open the site in its own tab' : result.status === 'denied' ? 'ఫోన్ సూచనల అనుమతి ఇవ్వలేదు · Permission denied' : result.status === 'not-configured' ? 'ఫోన్ సూచనల అనుసంధాన వివరాలు అసంపూర్తి · Web push setup incomplete' : result.status === 'unsupported' ? 'ఈ ఫోన్‌లో ఈ సూచన విధానం అందుబాటులో లేదు · Device unsupported' : 'ఫోన్ నమోదు కాలేదు; మళ్లీ ప్రయత్నించండి · Registration failed');
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
  </section>;
}