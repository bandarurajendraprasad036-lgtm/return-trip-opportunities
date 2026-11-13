import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { paymentDestination } from '@/lib/payment-destination';
import { Button } from '@/components/ui/button';
export function PaymentScanner({amount=100,onPaid}:{amount?:number;onPaid?:()=>void}) {
  const [qr,setQr]=useState('');
  useEffect(()=>{let active=true;setQr('');QRCode.toDataURL(paymentDestination(amount),{width:640,margin:4,errorCorrectionLevel:'M'}).then(url=>{if(active)setQr(url);}).catch(()=>{if(active)setQr('');});return()=>{active=false;};},[amount]);
  return <section className="space-y-3"><h3 className="text-center text-2xl font-bold">గాయత్రి వన్ / GAYATRI ONE</h3><div className="mx-auto aspect-square w-full max-w-80 overflow-hidden bg-scanner-paper">{qr&&<img src={qr} alt="గాయత్రి వన్ చెల్లింపు QR" className="h-full w-full object-contain"/>}</div><p>ఈ QR ని Google Pay / PhonePe / Paytm తో Scan చేసి పే చేయండి.</p><Button asChild className="h-auto min-h-12 w-full whitespace-normal"><a href={paymentDestination(amount)}>₹{amount} చెల్లించండి</a></Button>{onPaid&&<Button type="button" variant="outline" className="h-auto min-h-12 w-full whitespace-normal" onClick={onPaid}>మీరు కట్టిన అమౌంట్ స్క్రీన్ షాట్ తో పాటు మీ యూటీఆర్ నెంబర్ ఇందులో జత చేయండి</Button>}</section>;
}
