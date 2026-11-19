import { useEffect, useState } from 'react';
import { Bell, Phone, Video } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useMe } from '@/lib/session';
import { changeCommunication, COMMUNICATION_EVENT, DEFAULT_COMMUNICATION_CHOICES, readCommunicationChoices, saveCommunicationChoices } from '@/lib/dashboard-communications';

export function CommunicationSettings() {
  const { data: me } = useMe();
  const [choices, setChoices] = useState(DEFAULT_COMMUNICATION_CHOICES);
  useEffect(() => {
    if (!me) return;
    const sync = () => setChoices(readCommunicationChoices(me.id));
    sync(); window.addEventListener(COMMUNICATION_EVENT, sync); window.addEventListener('storage', sync);
    return () => { window.removeEventListener(COMMUNICATION_EVENT, sync); window.removeEventListener('storage', sync); };
  }, [me?.id]);
  if (!me) return null;
  return <section className="space-y-3 border-y py-4" data-subscription-exempt><h2 className="text-xl font-bold">పిలుపు ఎంపికలు</h2>
    {([['bell', 'గంట', Bell], ['voice', 'మాటల పిలుపు', Phone], ['video', 'వీడియో పిలుపు', Video]] as const).map(([kind, label, Icon]) => <div key={kind} className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-lg"><Icon />{label}</span><Button variant={choices[kind] ? 'default' : 'outline'} role="switch" aria-label={label} aria-checked={choices[kind]} onClick={() => {
      const next = changeCommunication(choices, kind, !choices[kind]);
      if (!next) { toast.error('గంట, మాటల పిలుపు, వీడియో పిలుపులో కనీసం ఒకటి తెరిచి ఉండాలి'); return; }
      if (saveCommunicationChoices(me.id, next)) setChoices(next);
      else toast.error('ఎంపిక నిలవలేదు. మళ్లీ ప్రయత్నించండి');
    }}>{choices[kind] ? 'ఆన్' : 'ఆఫ్'}</Button></div>)}
  </section>;
}