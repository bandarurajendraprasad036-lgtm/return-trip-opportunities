import { useEffect } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { BELL_PREFERENCE_EVENT, bellMuted } from '@/lib/bell';
import { updatePushSound } from '@/lib/push.functions';
import { pushDeviceId } from '@/lib/firebase-push';
import { useMe } from '@/lib/session';

export function PushSoundSync() {
  const { data: me } = useMe();
  const update = useServerFn(updatePushSound);
  useEffect(() => {
    if (!me) return;
    const sync = () => { void update({ data: { id: pushDeviceId(), sound: !bellMuted() } }).catch(() => toast.error('ఫోన్ శబ్దం ఎంపిక భద్రపడలేదు · Phone sound not saved')); };
    window.addEventListener(BELL_PREFERENCE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(BELL_PREFERENCE_EVENT, sync); window.removeEventListener('storage', sync); };
  }, [me?.id, update]);
  return null;
}