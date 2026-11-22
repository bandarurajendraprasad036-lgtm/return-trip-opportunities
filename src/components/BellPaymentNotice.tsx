import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Prime99Payment } from '@/components/Prime99Payment';
import { SUBSCRIPTION_MESSAGE } from '@/lib/subscription-access';

export function BellPaymentNotice({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[85svh] overflow-y-auto" aria-describedby={undefined}><DialogTitle className="text-xl leading-relaxed">{SUBSCRIPTION_MESSAGE}</DialogTitle><Prime99Payment compact /></DialogContent></Dialog>;
}
