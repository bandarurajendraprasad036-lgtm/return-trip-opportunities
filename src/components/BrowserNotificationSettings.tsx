import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useBellSound } from '@/lib/use-bell-sound';
import { browserPermission, permissionHelp, requestBrowserPermission, type PermissionStatus } from '@/lib/browser-notifications';
import { permissionThanks } from '@/lib/friendly-notifications';

export function BrowserNotificationSettings() {
  const { muted, change } = useBellSound();
  const [permission, setPermission] = useState<PermissionStatus>('default');
  const [busy, setBusy] = useState(false);
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
      <Button role="switch" aria-checked={!muted} aria-labelledby="bell-sound-label" variant={muted ? 'outline' : 'default'} onClick={() => change(muted)}>
        {muted ? <BellOff /> : <Bell />}{muted ? 'ఆపాం · Off' : 'ప్రారంభం · On'}
      </Button>
    </div>
    <p className="text-sm">ఈ పరికరంలో శబ్దం ఎంపిక నిలుస్తుంది; శబ్దం ఆపినా యాప్‌లో సమాచారం వస్తుంది. · Saved on this device; muting does not stop your inbox.</p>
    <p role="status">{permissionHelp[permission]}</p>
    {permission !== 'granted' && permission !== 'unsupported' && permission !== 'denied' && <Button variant="outline" disabled={busy} onClick={async () => {
      setBusy(true); const result = await requestBrowserPermission(); setPermission(result); setBusy(false);
      const thanks = permissionThanks(result === 'granted'); if (thanks) toast.success(thanks);
    }}><Bell />అనుమతి ఇవ్వండి · Allow notifications</Button>}
    <p className="text-sm">యాప్ మూసినప్పుడు సూచనలు పంపే సేవ కలపలేదు; చేరినట్లు నిర్ధారణ లేదు. · Closed-app delivery is not connected; delivery is not verified.</p>
  </div>;
}