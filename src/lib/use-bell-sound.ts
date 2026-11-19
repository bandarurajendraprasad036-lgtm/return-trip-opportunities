import { useEffect, useState } from 'react';
import { bellMuted, bellVolume, setBellVolume, BELL_PREFERENCE_EVENT, enableBellAudio, setBellMuted } from '@/lib/bell';
import type { BellVolume } from '@/lib/bell-tones';

export function useBellSound() {
  const [muted, setMuted] = useState(false);
  const [volume, updateVolume] = useState<BellVolume>('high');
  useEffect(() => {
    const sync = () => { setMuted(bellMuted()); updateVolume(bellVolume()); };
    sync();
    window.addEventListener(BELL_PREFERENCE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(BELL_PREFERENCE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return { muted, volume, selectVolume: setBellVolume, change: (soundOn: boolean) => {
    if (soundOn) enableBellAudio();
    setBellMuted(!soundOn);
  } };
}