import { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { saveLocalPaymentEvidence } from '@/lib/local-payment-evidence';
import { useMe } from '@/lib/session';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { submitPrimePayment } from '@/lib/prime-payment.functions';

export function MembershipEvidenceForm({ amount = 100, beneficiary }: { amount?: number; beneficiary?: string }) {
  const [reference, setReference] = useState(''); const [image, setImage] = useState<File | null>(null); const [busy, setBusy] = useState(false);
  const [feedback,setFeedback]=useState(''); const fileInput=useRef<HTMLInputElement>(null);
  const formRef=useRef<HTMLFormElement>(null); const navigate=useNavigate();
  useEffect(()=>{const frame=requestAnimationFrame(()=>{formRef.current?.scrollIntoView({block:'start',behavior:'instant'});formRef.current?.focus({preventScroll:true});});return()=>cancelAnimationFrame(frame);},[]);
  const {data:me}=useMe();const send=useServerFn(submitPrimePayment);const qc=useQueryClient();
  return <form ref={formRef} tabIndex={-1} aria-label="చెల్లింపు వివరాలు" noValidate className="space-y-3 rounded-lg border border-primary p-3 scroll-mt-24" onSubmit={async event => {
    event.preventDefault(); if (busy) return;
    if (!image) {setFeedback('స్క్రీన్ షాట్ జత చేయండి');return;}
    if (!/^\d{12}$/.test(reference)) {setFeedback('12 అంకెల లావాదేవీ సంఖ్య ఇవ్వండి');return;}
    setBusy(true);setFeedback('');
    if(!me?.id){setBusy(false);return;}
    try { await saveLocalPaymentEvidence({ownerId:me.id,reference,image,amount,beneficiary}); } catch { /* phone copy is only a backup */ }
    let status:'approved'|'pending';
    try {
      const form=new FormData();form.set('image',image);form.set('reference',reference);form.set('amount',String(amount));if(beneficiary)form.set('beneficiary',beneficiary);
      status=(await send({data:form})).status;
    } catch (error) {
      setFeedback(error instanceof Error&&error.message.includes('REFERENCE_ALREADY_USED')?'ఈ నంబర్ ఇంకో ఖాతాలో వాడారు. అడ్మిన్ తో చాట్ చేయండి.':'ఇంటర్నెట్ సరిగా లేదు. కొద్దిసేపు ఆగి మళ్లీ నొక్కండి.');setBusy(false);return;
    }
    setReference(''); setImage(null);if(fileInput.current)fileInput.current.value='';
    await qc.invalidateQueries();
    if(status==='approved')toast.success('మీ చెల్లింపు అందింది. మీ ప్రైమ్ ఆన్ అయింది - గంట, చాట్ తెరుచుకున్నాయి');
    else toast.success('మీ వివరాలు అందాయి. అడ్మిన్ చెక్ చేసి ఆమోదిస్తారు');
    await navigate({to:'/post/new'});
    setBusy(false);
  }}>
    <div className="flex min-w-0 items-center gap-3"><Button type="button" variant="outline" size="icon" className="size-12 shrink-0" aria-label="స్క్రీన్ షాట్ జత చేయండి" title="స్క్రీన్ షాట్ జత చేయండి" disabled={busy} onClick={()=>fileInput.current?.click()}><Plus className="size-7"/></Button><span className="min-w-0 break-all" translate={image?'no':undefined}>{image?image.name:'పేమెంట్ స్క్రీన్ షాట్ జత చేయండి'}</span></div>
    <Input ref={fileInput} id="membership-screenshot" className="hidden" aria-label="పేమెంట్ స్క్రీన్ షాట్" type="file" accept="image/png,image/jpeg,image/webp" required disabled={busy} onChange={e=>{
      const file=e.target.files?.[0];setImage(null);setFeedback('');
      if(!file)return;
      setImage(file);
    }}/>
    <Label htmlFor="membership-utr">ట్రాన్సాక్షన్ నెంబర్ ఇవ్వండి</Label>
    <Input id="membership-utr" inputMode="numeric" maxLength={12} value={reference} onChange={e => setReference(e.target.value.replace(/\D/g, '').slice(0,12))} placeholder="12 అంకెల లావాదేవీ సంఖ్య ఇవ్వండి" required disabled={busy}/>
    {feedback&&<p role="status">{feedback}</p>}
    <Button type="submit" className="w-full" disabled={busy || !me?.id || !image || !/^\d{12}$/.test(reference)}>{busy?'వివరాలు పంపుతున్నాం':'చెల్లింపు వివరాలు పంపండి'}</Button>
  </form>;
}