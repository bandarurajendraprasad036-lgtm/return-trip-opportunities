import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useBellSound } from '@/lib/use-bell-sound';
import { browserPermission, permissionHelp, type PermissionStatus } from '@/lib/browser-notifications';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { updatePushSound } from '@/lib/push.functions';
import { pushDeviceId } from '@/lib/firebase-push';
import { usePrime99 } from '@/lib/prime99';

export function BrowserNotificationSettings() {
  const { muted, change } = useBellSound();
  const [permission, setPermission] = useState<PermissionStatus>('default');
  const [busy, setBusy] = useState(false);
  const sound = useServerFn(updatePushSound);
  const { data: me } = useMe();
  const { data: prime } = usePrime99(me?.id);
  const { data: delivery, refetch } = useQuery({ queryKey: ['push-device-status', me?.id], enabled: Boolean(me), queryFn: async () => {
    if (!me) return null;
    const id = pushDeviceId();
    const device = await supabase.from('push_devices').select('id').eq('id', id).eq('user_id', me.id).maybeSingle();
    if (device.error) throw device.error;
    const result = await supabase.from('push_deliveries').select('status,provider_status,updated_at').eq('device_id', id).eq('user_id', me.id).order('updated_at', { ascending: false }).limit(1).maybeSingle();
    if (result.error) throw result.error;
    return { registered: Boolean(device.data), latest: result.data };
  }, refetchInterval: 30000 });
  useEffect(() => {
    const refresh = () => setPermission(browserPermission());
    refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  return <div className="space-y-3 border-b pb-4">
    <div className="flex items-center justify-between gap-3">
      <span id="bell-sound-label">గంట శబ్దం · Bell sound</span>
      <Button role="switch" size="lg" disabled={busy || !me} aria-checked={!muted} aria-labelledby="bell-sound-label" variant={muted ? 'outline' : 'default'} onClick={async () => {
        const turnOn = muted;
        setBusy(true);
        try {
          if (delivery?.registered) await sound({ data: { id: pushDeviceId(), sound: turnOn } });
          change(turnOn); await refetch();
        } catch { toast.error('మళ్లీ ప్రయత్నించండి · Please retry'); }
        finally { setBusy(false); }
      }}>
        {muted ? <VolumeX /> : <Volume2 />}{muted ? 'ఆఫ్ · Off' : 'ఆన్ · On'}
      </Button>
    </div>
    <p className="text-sm">{!prime?.alerts_ready ? 'సూచనలకు ఆమోదించిన ₹100 చెల్లింపు, మూడు రోజుల గడువు, హోమ్ గంట ఎంపిక అవసరం. అర్హమైన నంబర్ల తగ్గింపు ₹49.' : muted ? 'ఆఫ్: గంట శబ్దం రాదు; అర్హమైన సమాచారం తెరపై కనిపిస్తుంది. · Silent eligible alerts.' : 'ఆన్: మీ ఎంపికలకు లోబడి అర్హమైన సూచనలకు గంట శబ్దం. · Eligible alerts with sound, subject to preferences.'}</p>
    <p role="status">{permissionHelp[permission]}</p>
    <p role="status">{delivery?.registered ? 'ఈ ఫోన్ నమోదైంది; చేరినట్లు ఇంకా నిర్ధారణ లేదు · Device registered; delivery unverified' : 'ఫోన్ నమోదు కోసం హోమ్ పేజీలో ప్రధాన గంటను ఎంచుకోండి · Use home bell to register'}</p>
    {delivery?.latest && <p role="status">{delivery.latest.status === 'accepted' ? 'సేవ సూచనను స్వీకరించింది; ఫోన్‌కు చేరినట్లు నిర్ధారణ కాదు · Provider accepted; not a delivery receipt' : delivery.latest.status === 'failed' ? `పంపడం విఫలమైంది · Send failed (${delivery.latest.provider_status ?? '—'})` : delivery.latest.status === 'skipped' ? 'చదివిన సమాచారం లేదా మీ ఎంపికల కారణంగా పంపలేదు · Skipped' : 'పంపేందుకు వేచి ఉంది · Awaiting send'}</p>}
    <p className="text-sm">యాప్ మూసినప్పుడు ఫోన్ నిర్ణయించిన శబ్దం రావచ్చు; ప్రత్యేక గంట శబ్దానికి హామీ లేదు. ఫోన్‌లో సూచనలు, శబ్దం అనుమతించండి. బలవంతంగా ఆపిన యాప్‌కు సూచనలు రాకపోవచ్చు. · Background sound depends on browser and phone settings; custom bell sound is not guaranteed.</p>
  </div>;
}