import { useState } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { SearchExample as Example } from '@/lib/search-examples';

export function SearchExample({ example }: { example: Example }) {
  const [open, setOpen] = useState(false);
  return <article className="home-post-row">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm text-muted-foreground">నమూనా మాత్రమే · Example only</p>
        <h3 className="break-words text-lg font-bold">{example.title || (example.type === 'vehicle' ? 'వాహనం · Vehicle' : 'పని · Work')}</h3>
        <p className="break-words text-sm">{example.type === 'vehicle' ? [example.from, example.to].filter(Boolean).join(' → ') : example.location}</p>
        {example.type === 'job' && <p className="text-sm font-semibold">{example.salary}</p>}
      </div>
      <Button type="button" variant="outline" size="icon" className="shrink-0" aria-label="నమూనా వివరాలు · Example details" onClick={() => setOpen(true)}><Info /></Button>
    </div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogTitle>{example.type === 'vehicle' ? 'నిజమైన వాహన నమోదు కాదు · Not a real vehicle listing' : 'నిజమైన ఉద్యోగ ఖాళీ కాదు · Not a real vacancy'}</DialogTitle><DialogDescription>ఇది నమూనా మాత్రమే. బుకింగ్ లేదా ఉద్యోగ ఖాళీ అందుబాటులో లేదు; ఎవరికీ సమాచారం పంపలేదు. · Example only. No booking or vacancy is available and no alert was sent.</DialogDescription><Button onClick={() => setOpen(false)}>మూసివేయండి · Close</Button></DialogContent></Dialog>
  </article>;
}