import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { SUBSCRIPTION_MESSAGE } from '@/lib/subscription-access';

export function BellPaymentNotice({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[85svh] overflow-y-auto" aria-describedby={undefined}><DialogTitle className="text-xl leading-relaxed">{SUBSCRIPTION_MESSAGE}</DialogTitle><Button asChild className="min-h-12 w-full"><Link to="/payment" onClick={() => onOpenChange(false)}>ఇప్పుడే చెల్లించండి</Link></Button></DialogContent></Dialog>;
}
