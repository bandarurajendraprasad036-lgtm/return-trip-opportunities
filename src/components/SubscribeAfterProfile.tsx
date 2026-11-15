import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Prime99Payment } from '@/components/Prime99Payment';

/** Shown only after the profile form is fully submitted and the account has no paid bell. */
export function SubscribeAfterProfile({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[85svh] overflow-y-auto"><DialogTitle>₹100 ప్రైమ్ మెంబర్‌షిప్</DialogTitle><Prime99Payment bellPayment /></DialogContent></Dialog>;
}
