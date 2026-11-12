import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { LANGUAGES, setLanguage, useLanguage } from '@/lib/language';

export function LanguageButton() {
  const [open, setOpen] = useState(false);
  const language = useLanguage();
  return <>
    <Button className="min-h-11 shrink-0 px-2 text-xs" aria-label="తెలుగు | Language" translate="no" onClick={() => setOpen(true)}>తెలుగు | Language</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85dvh] max-w-[calc(100%-2rem)] overflow-y-auto p-4 sm:max-w-sm"><DialogTitle>భాష · Language</DialogTitle><DialogDescription>భాష ఎంచుకోండి · Select language</DialogDescription><div className="grid grid-cols-2 gap-2" translate="no">{LANGUAGES.map(item => <Button key={item.code} variant={language === item.code ? 'default' : 'outline'} className="min-w-0 justify-between whitespace-normal px-2" lang={item.code} aria-pressed={language === item.code} onClick={() => { setLanguage(item.code); setOpen(false); }}>{item.name}{language === item.code && <Check className="size-4" />}</Button>)}</div></DialogContent></Dialog>
  </>;
}