import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Prime99Payment } from '@/components/Prime99Payment';

/** Shown only after the profile form is fully submitted and the account has no paid bell. */
export function SubscribeAfterProfile({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [payment, setPayment] = useState(false);
  return <Dialog open={open} onOpenChange={value => { if (!value) setPayment(false); onOpenChange(value); }}><DialogContent className="max-h-[85svh] overflow-y-auto"><DialogTitle>నెలవారీ చందా</DialogTitle><DialogDescription translate="no" className="text-base leading-relaxed">₹100 కట్టి మంత్లీ సబ్‌స్క్రిప్షన్ తీసుకోండి. సబ్‌స్క్రిప్షన్ తీసుకోవడం ద్వారా మీకు నోటిఫికేషన్‌తో పాటు బెల్ నోటిఫికేషన్ వస్తుంది. మన సైట్‌లో ఉన్న అందరి వ్యక్తులతో మీరు చాట్ చేయవచ్చు. మీరు చాట్ చేసినది వారికి చేరుతుంది, మీకు నోటిఫికేషన్లు వస్తాయి.</DialogDescription><Button onClick={() => setPayment(true)}>₹100 పేమెంట్ చేయండి</Button>{payment && <Prime99Payment bellPayment />}</DialogContent></Dialog>;
}
