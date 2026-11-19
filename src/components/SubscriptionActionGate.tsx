import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BellPaymentNotice } from '@/components/BellPaymentNotice';
import { requireSubscription } from '@/lib/subscription-access';

/** One capture boundary covers existing home, board, card and navigation actions. */
export function SubscriptionActionGate() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const bypass = new WeakSet<HTMLElement>();
    let busy = false;
    const notice = () => setOpen(true);
    const capture = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const control = event.target.closest<HTMLElement>('button,a');
      if (!control || control.closest('[data-subscription-exempt]')) return;
      if (bypass.has(control)) { bypass.delete(control); return; }
      const label = `${control.getAttribute('aria-label') ?? ''} ${control.textContent ?? ''}`;
      const href = control.getAttribute('href') ?? '';
      const action = control.querySelector('.lucide-bell,.lucide-message-circle') || /గంట|చాట్|సంభాషణ|మాట్లాడండి|\bchat\b|ring the bell/i.test(label) || /^\/chats?(\/|\?|$)/.test(href);
      // List viewing and post detail selection stay free; only actual actions are gated.
      if (!action || /జాబితా/.test(label) || href.startsWith('/bell-board') || control.closest('[role="dialog"]')?.querySelector('h2')?.textContent === 'వాహన వివరాలు' && !/గంట|చాట్/.test(control.getAttribute('aria-label') ?? label)) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (busy) return;
      busy = true;
      void requireSubscription().then(allowed => {
        if (allowed && control.isConnected) { bypass.add(control); control.click(); }
      }).catch(() => toast.error('చందా తనిఖీ కాలేదు. మళ్లీ ప్రయత్నించండి')).finally(() => { busy = false; });
    };
    window.addEventListener('gayatri-subscription-required', notice);
    document.addEventListener('click', capture, true);
    return () => { window.removeEventListener('gayatri-subscription-required', notice); document.removeEventListener('click', capture, true); };
  }, []);
  return <BellPaymentNotice open={open} onOpenChange={setOpen} />;
}