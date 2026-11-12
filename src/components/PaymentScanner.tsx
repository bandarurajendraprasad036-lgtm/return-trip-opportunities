import paymentArtwork from '@/assets/gayatri-payment.png.asset.json';
import { paymentDestination } from '@/lib/payment-destination';
import { Button } from '@/components/ui/button';

export function PaymentScanner({ amount = 100 }: { amount?: number }) {
  return <section className="space-y-3"><img src={paymentArtwork.url} alt="రాజేంద్రప్రసాద్ చెల్లింపు చిహ్నం" className="mx-auto h-auto w-full max-w-80 object-contain" /><Button asChild className="h-auto min-h-12 w-full whitespace-normal"><a href={paymentDestination(amount)}>₹{amount} చెల్లించండి</a></Button><p className="text-sm">చిత్రం తెరవడమే చెల్లింపు కాదు. చెల్లించిన తరువాత లావాదేవీ సంఖ్య పంపండి; నిర్వాహకుడు నిర్ధారించిన తరువాతే చందా ప్రారంభమవుతుంది.</p></section>;
}