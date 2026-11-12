import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Prime99Payment } from '@/components/Prime99Payment';
import { GoogleSignIn } from '@/components/GoogleSignIn';
import { useMe } from '@/lib/session';
import { PaymentScanner } from '@/components/PaymentScanner';

export function BellPaymentNotice({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [payment, setPayment] = useState(false);
  const { data: me } = useMe();
  return <Dialog open={open} onOpenChange={value => { if (!value) setPayment(false); onOpenChange(value); }}><DialogContent className="max-h-[85svh] overflow-y-auto"><DialogTitle>నెలవారీ చందా</DialogTitle><DialogDescription translate="no" className="text-base leading-relaxed">మీరు మంత్లీ సబ్ స్క్రిప్షన్ తీసుకోండి. మీరు పెట్టిన పోస్ట్ సబ్మిట్ చేయబడింది. మీ పోస్ట్ మీరు చూసుకోవచ్చు. ఇతరుల పోస్టులు కూడా చూడవచ్చు. కానీ వాళ్ళతో చాట్ చేయాలన్నా, మీకు నోటిఫికేషన్ రావాలన్నా ₹100 పేమెంట్ చేయాల్సిందే. మీరు పేమెంట్ చేయాలి అని అనుకుంటే ఇక్కడ టచ్ చేయండి.</DialogDescription><Button onClick={() => setPayment(true)}>ఇక్కడ టచ్ చేయండి</Button>{payment && (me ? <Prime99Payment bellPayment /> : <><PaymentScanner /><GoogleSignIn /></>)}</DialogContent></Dialog>;
}