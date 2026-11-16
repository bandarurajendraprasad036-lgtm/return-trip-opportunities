import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { paymentDestination } from '@/lib/payment-destination';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export const PAYMENT_SCANNER_SETTING = 'payment_scanner_image';

// Scanner only: the admin-uploaded QR photo when present, otherwise the generated QR. No other payment buttons.
export function PaymentScanner({amount=100,onPaid,heading='మీరు మెంబర్‌షిప్ పొందాలి అంటే స్కాన్ చేయండి',compact=false}:{amount?:number;onPaid?:()=>void;heading?:string;compact?:boolean}) {
  const [qr,setQr]=useState('');
  const { data: uploaded = '' } = useQuery({ queryKey: ['payment-scanner-image'], queryFn: async () => { const r = await supabase.from('app_settings').select('value').eq('key', PAYMENT_SCANNER_SETTING).maybeSingle(); if (r.error) throw r.error; const v = r.data?.value ?? ''; return v.startsWith('data:image/') ? v : ''; } });
  useEffect(()=>{if(uploaded)return;let active=true;setQr('');QRCode.toDataURL(paymentDestination(amount),{width:640,margin:4,errorCorrectionLevel:'M'}).then(url=>{if(active)setQr(url);}).catch(()=>{if(active)setQr('');});return()=>{active=false;};},[amount,uploaded]);
  const image = uploaded || qr;
  return <section className="space-y-3">
    {!compact && <h3 className="text-center text-3xl font-extrabold leading-snug">{heading}</h3>}
    <p className={compact ? 'text-center text-lg font-bold' : 'text-center text-2xl font-bold'}>₹{amount} స్కాన్ చేయండి</p>
    <div className={`mx-auto aspect-square w-full overflow-hidden bg-scanner-paper ${compact ? 'max-w-40' : 'max-w-80'}`}>{image&&<img src={image} alt="చెల్లింపు స్కానర్" className="h-full w-full object-contain"/>}</div>
    {onPaid&&<div className="flex flex-col items-center gap-2 border border-primary p-3"><Button type="button" size="icon" className="size-16" aria-label="పేమెంట్ స్క్రీన్ షాట్ జత చేయండి" onClick={onPaid}><Plus className="size-9"/></Button><span className="text-center">పేమెంట్ చేసిన తర్వాత + నొక్కి స్క్రీన్ షాట్ జత చేయండి</span></div>}
  </section>;
}
