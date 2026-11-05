import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { SearchExample as Example } from '@/lib/search-examples';

export function SearchExample({ example }: { example: Example }) {
  const [open, setOpen] = useState(false);
  return <article className="home-post-row">
    <p className="font-bold">నమూనా మాత్రమే · Example only</p>
    {example.type === 'vehicle' ? <p>{example.from} → {example.to}</p> : <><p>{example.location}</p><p>{example.salary}</p></>}
    <Button type="button" variant="outline" size="icon" aria-label="నమూనా వివరాలు · Example details" onClick={() => setOpen(true)}><Bell /></Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogTitle>{example.type === 'vehicle' ? 'నిజమైన వాహన నమోదు కాదు · Not a real vehicle listing' : 'నిజమైన ఉద్యోగ ఖాళీ కాదు · Not a real vacancy'}</DialogTitle><DialogDescription>ఇది నమూనా మాత్రమే. బుకింగ్ లేదా ఉద్యోగ ఖాళీ అందుబాటులో లేదు; ఎవరికీ సమాచారం పంపలేదు. · Example only. No booking or vacancy is available and no alert was sent.</DialogDescription><Button onClick={() => setOpen(false)}>మూసివేయండి · Close</Button></DialogContent></Dialog>
  </article>;
}