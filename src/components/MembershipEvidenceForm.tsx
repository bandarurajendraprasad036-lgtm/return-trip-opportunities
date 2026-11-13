import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { scanPaymentEvidence, sendChatEntry } from '@/lib/chat-upload.functions';
import { CHAT_IMAGE_LIMIT } from '@/lib/chat-rules';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useMe } from '@/lib/session';
import { payerUpiSchema } from '@/lib/payment-image';

export function MembershipEvidenceForm({ amount = 100, beneficiary }: { amount?: number; beneficiary?: string }) {
  const [reference, setReference] = useState(''); const [image, setImage] = useState<File | null>(null); const [busy, setBusy] = useState(false);
  const [payerUpi,setPayerUpi]=useState(''); const [feedback,setFeedback]=useState('');
  const [scanning,setScanning]=useState(false); const [manual,setManual]=useState(false); const scanVersion=useRef(0); const fileInput=useRef<HTMLInputElement>(null);
  const scan=useServerFn(scanPaymentEvidence);
  const send = useServerFn(sendChatEntry); const qc = useQueryClient();
  const {data:me} = useMe();
  const requests = useQuery({queryKey:['membership-evidence-status',me?.id,beneficiary],enabled:!!me,refetchInterval:10000,queryFn:async()=>{
    if (!me) return [];
    const result = await supabase.from('membership_requests').select('id,status').eq('payer_id',me.id).eq('user_id',beneficiary ?? me.id).order('submitted_at',{ascending:false}).limit(5);
    if(result.error) throw result.error;
    return result.data;
  }});
  return <form className="space-y-3" onSubmit={async event => {
    event.preventDefault(); if (busy || scanning || !image || !/^\d{12}$/.test(reference) || !payerUpiSchema.safeParse(payerUpi).success) return; setBusy(true);setFeedback('');
    try {
      const admin = await supabase.rpc('support_admin_id'); if (admin.error || !admin.data) throw new Error('Admin unavailable');
      const form = new FormData(); form.set('receiver', admin.data); form.set('post', ''); form.set('body', `UTR: ${reference}`); form.set('phone', ''); form.set('image', image); form.set('membership_amount', String(amount)); if (beneficiary) form.set('beneficiary', beneficiary);
      form.set('payer_upi',payerUpi.trim());
      const result = await send({ data: form });
      if(result.feedback){setFeedback('చెల్లింపు పరిశీలనలో ఉంది');await qc.invalidateQueries();return;}
      if (!result.membershipStatus) throw new Error('Evidence not registered');
      setReference(''); setPayerUpi(''); setImage(null);setManual(false);if(fileInput.current)fileInput.current.value=''; await qc.invalidateQueries(); toast.success(result.membershipStatus==='approved'?'మీ చెల్లింపు ఆమోదించాం':'వివరాలు సరిపోలాయి. తాత్కాలిక ప్రైమ్ ఆన్ అయింది; అడ్మిన్ వెరిఫికేషన్ కోసం వెయిటింగ్');
    } catch(e) { setFeedback(e instanceof Error ? e.message : 'చెల్లింపు ఆధారం పంపలేకపోయాం. మళ్లీ ప్రయత్నించండి.'); } finally { setBusy(false); }
  }}>
    {requests.data?.map(request=><p key={request.id} role="status">{request.status==='approved'?'మీ చెల్లింపు ఆమోదించాం':'చెల్లింపు పరిశీలనలో ఉంది'}</p>)}
    <p>1. పైన ఉన్న QR ని Scan చేసి పే చేయండి.</p><p>2. పేమెంట్ అయ్యాక స్క్రీన్‌షాట్ ఇక్కడ అప్‌లోడ్ చేయండి.</p>
    <Label htmlFor="membership-screenshot">పేమెంట్ స్క్రీన్ షాట్ ఫోటో</Label><Input ref={fileInput} id="membership-screenshot" type="file" accept="image/png,image/jpeg,image/webp" required disabled={busy} onChange={async e=>{
      const version=++scanVersion.current;const file=e.target.files?.[0];setImage(null);setReference('');setPayerUpi('');setFeedback('');setManual(false);setScanning(false);
      if(!file)return;
      if(file.size>CHAT_IMAGE_LIMIT){toast.error('చిన్న ఫోటో పంపండి');e.target.value='';return;}
      setImage(file);setScanning(true);
      try{const form=new FormData();form.set('image',file);const result=await scan({data:form});if(version!==scanVersion.current)return;setReference(result.reference);setPayerUpi(result.payerUpi);setManual(!result.reference);if(!result.reference)setFeedback('చిత్రంలో లావాదేవీ సంఖ్య చదవలేకపోయాం. కింద మీరే ఇవ్వండి.');}
      catch(error){if(version===scanVersion.current){setManual(true);setFeedback(error instanceof Error?error.message:'చిత్రం చదవలేకపోయాం. సంఖ్య మీరే ఇవ్వండి.');}}
      finally{if(version===scanVersion.current)setScanning(false);}
    }}/>
    {scanning&&<p role="status">చిత్రంలోని లావాదేవీ సంఖ్య చదువుతున్నాం…</p>}
    <Label htmlFor="membership-utr">₹{amount} చెల్లింపు లావాదేవీ సంఖ్య</Label>
    <Input id="membership-utr" inputMode="numeric" maxLength={12} value={reference} onChange={e => setReference(e.target.value.replace(/\D/g, '').slice(0,12))} readOnly={!manual} placeholder="చిత్రం నుంచి లావాదేవీ సంఖ్య ఇక్కడ నిండుతుంది" required disabled={busy||scanning}/>
    <Label htmlFor="membership-upi">మీ చెల్లింపు చిరునామా</Label>
    <Input id="membership-upi" value={payerUpi} onChange={e=>setPayerUpi(e.target.value)} maxLength={100} autoCapitalize="none" autoCorrect="off" translate="no" required disabled={busy}/>
    <p className="text-sm">మీ లావాదేవీ సంఖ్య, మీ చెల్లింపు చిరునామా చిత్రంలోని వివరాలతో సరిపోలితేనే తాత్కాలిక ప్రైమ్ ఆన్ అవుతుంది. అడ్మిన్ చెల్లింపు పరిశీలిస్తారు.</p>
    {feedback&&<p role="status">{feedback}</p>}
    <p className="text-payment-warning">గమనిక: మీరు రాసిన Transaction ID కి, స్క్రీన్‌షాట్ లో ఉన్న Transaction ID కి రెండూ సేమ్ ఉండాలి.</p>
    <Button type="submit" className="w-full" disabled={busy || scanning || !image || !/^\d{12}$/.test(reference) || !payerUpiSchema.safeParse(payerUpi).success}>{busy?'చిత్రం పరిశీలిస్తున్నాం':'చెల్లింపు వివరాలు పంపండి'}</Button>
  </form>;
}