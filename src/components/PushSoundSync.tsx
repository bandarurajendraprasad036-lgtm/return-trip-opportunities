import { useEffect } from 'react';
import { toast } from 'sonner';
import { BELL_PREFERENCE_EVENT, bellMuted } from '@/lib/bell';
import { updatePushSound } from '@/lib/push-client';
import { pushDeviceId } from '@/lib/firebase-push';
import { useMe } from '@/lib/session';

export function PushSoundSync() {
  const { data: me } = useMe();
  const update = updatePushSound;
  useEffect(() => {
    if (!me) return;
    const sync = () => { void update({ data: { id: pushDeviceId(), sound: !bellMuted() } }).catch(() => toast.error('ఫోన్ శబ్దం ఎంపిక భద్రపడలేదు · Phone sound not saved')); };
    window.addEventListener(BELL_PREFERENCE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(BELL_PREFERENCE_EVENT, sync); window.removeEventListener('storage', sync); };
  }, [me?.id, update]);
  return null;
}