import { useState } from 'react';
import { useMe } from '@/lib/session';
import { PaymentScanner } from '@/components/PaymentScanner';
import { MembershipEvidenceForm } from '@/components/MembershipEvidenceForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { CHAT_PACKAGE_AMOUNT, FULL_PACKAGE_AMOUNT } from '@/lib/vehicle-packages';

export function Prime99Payment({ compact = false, bellPayment = false }: { bellPayment?: boolean; compact?: boolean }) {
  const [amount, setAmount] = useState(bellPayment ? FULL_PACKAGE_AMOUNT : CHAT_PACKAGE_AMOUNT);
  const [details, setDetails] = useState(false);
  const [fullDetails, setFullDetails] = useState(false);
  const { data: me } = useMe();
  if (!compact && me?.isAdmin) return null;
  return <section className={compact ? 'space-y-3 profile-copy' : 'space-y-4 border-y py-4 profile-copy'}>
    <PaymentScanner amount={amount} compact={compact} />
    <Button variant="outline" className="w-full" onClick={() => setDetails(true)}>చందా వివరాలు</Button>
    {!me?.isAdmin && <MembershipEvidenceForm key={amount} amount={amount} />}
    <Dialog open={details} onOpenChange={setDetails}><DialogContent className="max-h-[85svh] overflow-y-auto" aria-describedby={undefined}><DialogTitle>చందా వివరాలు</DialogTitle>
      <Button variant={amount === CHAT_PACKAGE_AMOUNT ? 'default' : 'outline'} onClick={() => { setAmount(CHAT_PACKAGE_AMOUNT); }}>₹100 · మూడు నెలలు · చాట్ మాత్రమే</Button>
      <p>మొబైల్ నంబరు, పేరు, ఫోటో కనబడవు. గంట కొట్టలేరు. చాట్ మాత్రమే చేసుకోవచ్చు. అవతలి వ్యక్తి అందుబాటులో ఉన్నప్పుడు మీతో మాట్లాడవచ్చు.</p>
      <Button variant={amount === FULL_PACKAGE_AMOUNT ? 'default' : 'outline'} onClick={() => { setAmount(FULL_PACKAGE_AMOUNT); setFullDetails(true); }}>₹349 · మూడు నెలలు</Button>
      <p>చాట్, గంట, అనుమతించిన వివరాలు, ఫోన్ మరియు వీడియో కాల్.</p>
      <p>పని, ఉద్యోగాలు, సేవలు ఉచితం. చెల్లింపు ఫోటోను నిర్వాహకులు ఆమోదించిన తర్వాతే చందా మొదలవుతుంది.</p>
      <Button onClick={() => setDetails(false)}>ఈ చందాను ఎంచుకోండి</Button>
    </DialogContent></Dialog>
    <Dialog open={fullDetails} onOpenChange={setFullDetails}><DialogContent className="max-h-[85svh] overflow-y-auto" aria-describedby={undefined}><DialogTitle>₹349 · మూడు నెలలు</DialogTitle>
      <p>₹349 చెల్లించండి. చాట్, గంట, ఫోన్ మరియు వీడియో కాల్ చేసుకోవచ్చు. అవతలి వ్యక్తి చూపించేందుకు అనుమతించిన పేరు, ఫోటో, మొబైల్ నంబరు మాత్రమే కనిపిస్తాయి.</p>
      <p>అవతలి ఫోన్‌లో గంట శబ్దం ఆన్‌లో ఉంటే వినబడుతుంది; ఆఫ్‌లో ఉంటే వినబడదు. వారు పేరు, ఫోటో లేదా నంబరు దాచితే మీకు కనిపించవు. శబ్దం ఆఫ్ చేయడం చాట్‌ను ఆపదు. ఫోన్‌కు చేరడం అనుమతి, అంతర్జాలం మీద ఆధారపడుతుంది.</p>
      <Button onClick={() => { setFullDetails(false); setDetails(false); }}>₹349 ఎంచుకోండి</Button>
    </DialogContent></Dialog>
  </section>;
}
