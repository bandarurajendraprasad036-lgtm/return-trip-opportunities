import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Prime99Payment } from '@/components/Prime99Payment';

/** Shown only after the profile form is fully submitted and the account has no paid bell. */
export function SubscribeAfterProfile({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [payment, setPayment] = useState(false);
  return <Dialog open={open} onOpenChange={value => { if (!value) setPayment(false); onOpenChange(value); }}><DialogContent className="max-h-[85svh] overflow-y-auto"><DialogTitle>₹100 ప్రైమ్ మెంబర్ షిప్</DialogTitle><DialogDescription className="text-base leading-relaxed">మీ పూర్తి వివరాలు నింపారు. మీకు సంబంధించిన జాబ్ వస్తే నోటిఫికేషన్ కావాలంటే ప్రైమ్ తీసుకోండి. డబ్బు కట్టినంత మాత్రాన మీకు కస్టమర్ వస్తాడని గ్యారెంటీ లేదు.</DialogDescription><Button onClick={() => setPayment(true)}>ప్రైమ్ అవ్వండి - ₹100 కట్టండి</Button>{payment && <Prime99Payment bellPayment />}</DialogContent></Dialog>;
}
