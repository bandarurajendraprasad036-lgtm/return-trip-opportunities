import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useMe } from '@/lib/session';
import { GoogleSignIn } from '@/components/GoogleSignIn';
import { Prime99Payment } from '@/components/Prime99Payment';
import { PaymentScanner } from '@/components/PaymentScanner';

export function BellPaymentNotice({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: me } = useMe();
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[85svh] overflow-y-auto"><DialogTitle>మీరు ₹100/- మంత్లీ కట్టండి</DialogTitle>{me ? <Prime99Payment bellPayment /> : <><PaymentScanner /><GoogleSignIn /></>}</DialogContent></Dialog>;
}
