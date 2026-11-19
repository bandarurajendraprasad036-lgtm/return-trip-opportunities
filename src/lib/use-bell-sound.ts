import { useEffect, useState } from 'react';
import { bellMuted, bellTone, setBellTone, BELL_PREFERENCE_EVENT, enableBellAudio, setBellMuted } from '@/lib/bell';
import type { BellTone } from '@/lib/bell-tones';

export function useBellSound() {
  const [muted, setMuted] = useState(false);
  const [tone, updateTone] = useState<BellTone>('temple');
  useEffect(() => {
    const sync = () => { setMuted(bellMuted()); updateTone(bellTone()); };
    sync();
    window.addEventListener(BELL_PREFERENCE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(BELL_PREFERENCE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return { muted, tone, selectTone: setBellTone, change: (soundOn: boolean) => {
    if (soundOn) enableBellAudio();
    setBellMuted(!soundOn);
  } };
}