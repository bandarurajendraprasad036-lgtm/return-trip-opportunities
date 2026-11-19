import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBellSound } from '@/lib/use-bell-sound';
import { BELL_TONES } from '@/lib/bell-tones';
import { playTapBell } from '@/lib/bell';

export function NotificationSettings() {
  const { muted, tone, selectTone, change } = useBellSound();
  return <section className="space-y-2 border-y py-4">
    <div className="flex items-center justify-between gap-3">
      <span id="dashboard-notification-sound" className="text-lg font-bold">నోటిఫికేషన్ గంట శబ్దం</span>
      <Button role="switch" aria-checked={!muted} aria-labelledby="dashboard-notification-sound" variant={muted ? 'outline' : 'default'} className="min-h-12 min-w-24 shrink-0" onClick={() => change(muted)}>
        {muted ? <VolumeX /> : <Volume2 />}{muted ? 'ఆఫ్' : 'ఆన్'}
      </Button>
    </div>
    <div role="radiogroup" aria-label="గంట శబ్దం ఎంచుకోండి" className="grid grid-cols-3 gap-2" data-subscription-exempt>
      {BELL_TONES.map(option => <Button key={option.id} role="radio" aria-checked={tone === option.id} variant={tone === option.id ? 'default' : 'outline'} className="h-auto min-h-14 whitespace-normal" onClick={() => { selectTone(option.id); playTapBell(); }}><Volume2 className="shrink-0" />{option.label}</Button>)}
    </div>
    <p className="text-sm text-muted-foreground">ఆఫ్ చేసినా నోటిఫికేషన్ ఆగదు; గంట శబ్దం మాత్రమే ఆగుతుంది.</p>
  </section>;
}
