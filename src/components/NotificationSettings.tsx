import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBellSound } from '@/lib/use-bell-sound';

export function NotificationSettings() {
  const { muted, change } = useBellSound();
  return <section className="space-y-2 border-y py-4">
    <div className="flex items-center justify-between gap-3">
      <span id="dashboard-notification-sound" className="text-lg font-bold">నోటిఫికేషన్ గంట శబ్దం</span>
      <Button role="switch" aria-checked={!muted} aria-labelledby="dashboard-notification-sound" variant={muted ? 'outline' : 'default'} className="min-h-12 min-w-24 shrink-0" onClick={() => change(muted)}>
        {muted ? <VolumeX /> : <Volume2 />}{muted ? 'ఆఫ్' : 'ఆన్'}
      </Button>
    </div>
    <p className="text-sm text-muted-foreground">ఆఫ్ చేసినా నోటిఫికేషన్ ఆగదు; గంట శబ్దం మాత్రమే ఆగుతుంది.</p>
  </section>;
}
