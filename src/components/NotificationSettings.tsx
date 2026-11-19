import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBellSound } from '@/lib/use-bell-sound';
import { playTapBell } from '@/lib/bell';

export function NotificationSettings() {
  const { muted, volume, selectVolume, change } = useBellSound();
  return <section className="space-y-2 border-y py-4">
    <div className="flex items-center justify-between gap-3">
      <span id="dashboard-notification-sound" className="text-lg font-bold">నోటిఫికేషన్ గంట శబ్దం</span>
      <Button role="switch" aria-checked={!muted} aria-labelledby="dashboard-notification-sound" variant={muted ? 'outline' : 'default'} className="min-h-12 min-w-24 shrink-0" onClick={() => change(muted)}>
        {muted ? <VolumeX /> : <Volume2 />}{muted ? 'ఆఫ్' : 'ఆన్'}
      </Button>
    </div>
    <p className="text-base">ఒకే గాయత్రి వన్ గంట — ఫోన్ కాల్ లాగా 30 సెకన్లు మోగుతుంది.</p>
    <div role="radiogroup" aria-label="గంట శబ్దం ఎంత" className="grid grid-cols-2 gap-2" data-subscription-exempt>
      {([['high', 'గట్టిగా'], ['low', 'తక్కువగా']] as const).map(([id, label]) => <Button key={id} role="radio" aria-checked={volume === id} variant={volume === id ? 'default' : 'outline'} className="min-h-14 text-lg" onClick={() => { selectVolume(id); setTimeout(playTapBell, 0); }}><Volume2 className="shrink-0" />{label}</Button>)}
    </div>
    <p className="text-sm text-muted-foreground">ఆఫ్ చేసినా నోటిఫికేషన్ ఆగదు; గంట శబ్దం మాత్రమే ఆగుతుంది.</p>
  </section>;
}
