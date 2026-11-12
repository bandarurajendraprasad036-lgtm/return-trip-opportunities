import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Prime99Payment } from '@/components/Prime99Payment';
import { GoogleSignIn } from '@/components/GoogleSignIn';
import { useMe } from '@/lib/session';

export function BellPaymentNotice({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [payment, setPayment] = useState(false);
  const { data: me } = useMe();
  return <Dialog open={open} onOpenChange={value => { if (!value) setPayment(false); onOpenChange(value); }}><DialogContent className="max-h-[85svh] overflow-y-auto"><DialogTitle>గంట చెల్లింపు</DialogTitle><DialogDescription>చెల్లింపు నిర్ధారణ తర్వాతే గంట ప్రారంభమవుతుంది.</DialogDescription><Button translate="no" className="h-auto whitespace-normal text-left leading-relaxed" onClick={() => setPayment(true)}>మీరు కొట్టిన గంట పని చేయాలి అంటే ₹100 పర్ మంత్ పే చేయండి. మీరు ఉచితంగా చాట్ చేసుకోవచ్చు. మీరు ప్రైమ్ మెంబర్ గా కూడా ఉండవచ్చు.</Button>{payment && (me ? <Prime99Payment bellPayment /> : <GoogleSignIn />)}</DialogContent></Dialog>;
}