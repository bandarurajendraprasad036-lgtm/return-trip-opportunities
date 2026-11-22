import { useEffect, useState } from 'react';
import { BellPaymentNotice } from '@/components/BellPaymentNotice';

/** Payment is requested by an authorized vehicle action, never inferred from button text. */
export function SubscriptionActionGate() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const notice = () => setOpen(true);
    window.addEventListener('gayatri-subscription-required', notice);
    return () => window.removeEventListener('gayatri-subscription-required', notice);
  }, []);
  return <BellPaymentNotice open={open} onOpenChange={setOpen} />;
}