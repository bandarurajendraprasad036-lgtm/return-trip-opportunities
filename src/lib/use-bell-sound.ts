import { useEffect, useState } from 'react';
import { bellMuted, BELL_PREFERENCE_EVENT, enableBellAudio, setBellMuted } from '@/lib/bell';

export function useBellSound() {
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    const sync = () => setMuted(bellMuted());
    sync();
    window.addEventListener(BELL_PREFERENCE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(BELL_PREFERENCE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return { muted, change: (soundOn: boolean) => {
    if (soundOn) enableBellAudio();
    setBellMuted(!soundOn);
  } };
}