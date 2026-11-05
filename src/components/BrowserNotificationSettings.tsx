import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useBellSound } from '@/lib/use-bell-sound';
import { browserPermission, permissionHelp, type PermissionStatus } from '@/lib/browser-notifications';
import { permissionThanks } from '@/lib/friendly-notifications';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { registerPushDevice, updatePushSound, removePushDevice } from '@/lib/push.functions';
import { enablePush, pushDeviceId, type PushStatus } from '@/lib/firebase-push';

export function BrowserNotificationSettings() {
  const { muted, change } = useBellSound();
  const [permission, setPermission] = useState<PermissionStatus>('default');
  const [busy, setBusy] = useState(false);
  const [push, setPush] = useState<PushStatus>('idle');
  const register = useServerFn(registerPushDevice);
  const sound = useServerFn(updatePushSound);
  const remove = useServerFn(removePushDevice);
  const { data: me } = useMe();
  const { data: delivery, refetch } = useQuery({ queryKey: ['push-device-status', me?.id], enabled: Boolean(me), queryFn: async () => {
    if (!me) return null;
    const id = pushDeviceId();
    const device = await supabase.from('push_devices').select('id').eq('id', id).eq('user_id', me.id).maybeSingle();
    if (device.error) throw device.error;
    const result = await supabase.from('push_deliveries').select('status,provider_status,updated_at').eq('device_id', id).eq('user_id', me.id).order('updated_at', { ascending: false }).limit(1).maybeSingle();
    if (result.error) throw result.error;
    return { registered: Boolean(device.data), latest: result.data };
  }, refetchInterval: 30000 });
  const registerPhone = async () => {
    setBusy(true);
    try {
      const result = await enablePush(); setPermission(browserPermission());
      if (result.status === 'registered' && result.token) {
        await register({ data: { id: pushDeviceId(), token: result.token, sound: !muted } });
        setPush('registered'); await refetch();
        const thanks = permissionThanks(true); if (thanks) toast.success(thanks);
      } else setPush(result.status);
    } catch { setPush('failed'); } finally { setBusy(false); }
  };
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
      <Button role="switch" disabled={busy} aria-checked={!muted} aria-labelledby="bell-sound-label" variant={muted ? 'outline' : 'default'} onClick={async () => {
        const nextSound = muted;
        setBusy(true);
        try { if (delivery?.registered) await sound({ data: { id: pushDeviceId(), sound: nextSound } }); change(nextSound); }
        catch { toast.error('శబ్దం ఎంపిక భద్రపడలేదు · Sound not saved'); }
        finally { setBusy(false); }
      }}>
        {muted ? <BellOff /> : <Bell />}{muted ? 'ఆపాం · Off' : 'ప్రారంభం · On'}
      </Button>
    </div>
    <p className="text-sm">ఈ పరికరంలో శబ్దం ఎంపిక నిలుస్తుంది; శబ్దం ఆపినా యాప్‌లో సమాచారం వస్తుంది. · Saved on this device; muting does not stop your inbox.</p>
    <p role="status">{permissionHelp[permission]}</p>
    {permission !== 'unsupported' && permission !== 'denied' && <Button variant="outline" disabled={busy || !me} onClick={registerPhone}><Bell />{delivery?.registered ? 'ఫోన్ నమోదు తాజా చేయండి · Refresh registration' : 'ఫోన్ సూచనలు ప్రారంభించండి · Enable phone alerts'}</Button>}
    <p role="status">{push === 'not-configured' ? 'అనుసంధానంలో వెబ్ సూచనల వివరాలు చేర్చండి · Include web push in connection settings' : push === 'open-in-new-tab' ? permissionHelp['open-in-new-tab'] : push === 'denied' ? permissionHelp.denied : push === 'unsupported' ? permissionHelp.unsupported : push === 'failed' ? 'ఫోన్ నమోదు కాలేదు; మళ్లీ ప్రయత్నించండి · Registration failed; retry' : delivery?.registered ? 'ఈ ఫోన్ నమోదైంది; చేరినట్లు ఇంకా నిర్ధారణ లేదు · Device registered; delivery unverified' : 'ఈ ఫోన్ ఇంకా నమోదు కాలేదు · Device not registered'}</p>
    {delivery?.latest && <p role="status">{delivery.latest.status === 'accepted' ? 'సేవ సూచనను స్వీకరించింది; ఫోన్‌కు చేరినట్లు నిర్ధారణ కాదు · Provider accepted; not a delivery receipt' : delivery.latest.status === 'failed' ? `పంపడం విఫలమైంది · Send failed (${delivery.latest.provider_status ?? '—'})` : delivery.latest.status === 'skipped' ? 'చదివిన సమాచారం లేదా మీ ఎంపికల కారణంగా పంపలేదు · Skipped' : 'పంపేందుకు వేచి ఉంది · Awaiting send'}</p>}
    {delivery?.registered && <Button variant="outline" disabled={busy} onClick={async () => { setBusy(true); try { await remove({ data: { id: pushDeviceId() } }); setPush('idle'); await refetch(); } catch { toast.error('సూచనలు ఆపలేకపోయాం · Could not stop push'); } finally { setBusy(false); } }}>ఈ ఫోన్ సూచనలు ఆపండి · Stop phone push</Button>}
    <p className="text-sm">యాప్ మూసినప్పుడు ఫోన్ నిర్ణయించిన శబ్దం రావచ్చు; ప్రత్యేక గంట శబ్దానికి హామీ లేదు. ఫోన్‌లో సూచనలు, శబ్దం అనుమతించండి. బలవంతంగా ఆపిన యాప్‌కు సూచనలు రాకపోవచ్చు. · Background sound depends on browser and phone settings; custom bell sound is not guaranteed.</p>
  </div>;
}