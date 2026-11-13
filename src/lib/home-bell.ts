import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const KEY = 'gayatri-home-bell-touched';
const EVENT = 'gayatri-home-bell-rung';

/** Records that the big home bell was rung on this device. */
export function markHomeBellRung() {
  localStorage.setItem(KEY, '1');
  window.dispatchEvent(new Event(EVENT));
}

/** True after the big home bell was rung on this device (read after hydration). */
export function useHomeBellRung() {
  const [rung, setRung] = useState(false);
  useEffect(() => {
    const read = () => setRung(localStorage.getItem(KEY) === '1');
    read();
    window.addEventListener(EVENT, read);
    window.addEventListener('storage', read);
    return () => { window.removeEventListener(EVENT, read); window.removeEventListener('storage', read); };
  }, []);
  return rung;
}

/** Blocks a home option until the big bell is rung and points the user to it. */
export function requireHomeBell(rung: boolean, event: { preventDefault: () => void }) {
  if (rung) return true;
  event.preventDefault();
  toast.info('ముందు పైన పెద్ద గంట కొట్టండి 🔔');
  document.querySelector('.home-temple-trigger')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return false;
}
