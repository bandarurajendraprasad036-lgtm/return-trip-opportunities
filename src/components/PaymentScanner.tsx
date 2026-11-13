import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { PAYMENT_UPI, paymentDestination } from '@/lib/payment-destination';
import { Button } from '@/components/ui/button';
export function PaymentScanner({amount=100}:{amount?:number}) {
  const [qr,setQr]=useState('');
  useEffect(()=>{let active=true;setQr('');QRCode.toDataURL(paymentDestination(amount),{width:640,margin:4,errorCorrectionLevel:'M'}).then(url=>{if(active)setQr(url);}).catch(()=>{if(active)setQr('');});return()=>{active=false;};},[amount]);
  return <section className="space-y-3"><h3 className="text-center text-2xl font-bold">గాయత్రి వన్ / GAYATRI ONE</h3><div className="mx-auto aspect-square w-full max-w-80 overflow-hidden bg-scanner-paper">{qr&&<img src={qr} alt="గాయత్రి వన్ చెల్లింపు QR" className="h-full w-full object-contain"/>}</div><p translate="no" className="break-all text-center text-sm">{PAYMENT_UPI}</p><p>ఈ QR ని Google Pay / PhonePe / Paytm తో Scan చేసి పే చేయండి.</p><Button asChild className="h-auto min-h-12 w-full whitespace-normal"><a href={paymentDestination(amount)}>₹{amount} చెల్లించండి</a></Button></section>;
}
