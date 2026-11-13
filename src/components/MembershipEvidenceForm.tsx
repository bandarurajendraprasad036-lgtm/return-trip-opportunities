import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { sendChatEntry } from '@/lib/chat-upload.functions';
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
  const send = useServerFn(sendChatEntry); const qc = useQueryClient();
  const {data:me} = useMe();
  const requests = useQuery({queryKey:['membership-evidence-status',me?.id,beneficiary],enabled:!!me,refetchInterval:10000,queryFn:async()=>{
    if (!me) return [];
    const result = await supabase.from('membership_requests').select('id,status,reference').eq('payer_id',me.id).eq('user_id',beneficiary ?? me.id).order('submitted_at',{ascending:false}).limit(5);
    if(result.error) throw result.error;
    return result.data;
  }});
  return <form className="space-y-3" onSubmit={async event => {
    event.preventDefault(); if (busy || !image || !/^\d{12}$/.test(reference) || !payerUpiSchema.safeParse(payerUpi).success) return; setBusy(true);setFeedback('');
    try {
      const admin = await supabase.rpc('support_admin_id'); if (admin.error || !admin.data) throw new Error('Admin unavailable');
      const form = new FormData(); form.set('receiver', admin.data); form.set('post', ''); form.set('body', `UTR: ${reference}`); form.set('phone', ''); form.set('image', image); form.set('membership_amount', String(amount)); if (beneficiary) form.set('beneficiary', beneficiary);
      form.set('payer_upi',payerUpi.trim());
      const result = await send({ data: form });
      if(result.feedback){setFeedback(result.feedback);return;}
      if (!result.membershipStatus) throw new Error('Evidence not registered');
      setReference(''); setPayerUpi(''); setImage(null); await qc.invalidateQueries(); toast.success(result.membershipStatus==='approved'?'మీ చెల్లింపు ఆమోదించాం':'అడ్మిన్ వెరిఫికేషన్ కోసం వెయిటింగ్');
    } catch(e) { setFeedback(e instanceof Error ? e.message : 'చెల్లింపు ఆధారం పంపలేకపోయాం. మళ్లీ ప్రయత్నించండి.'); } finally { setBusy(false); }
  }}>
    {requests.data?.map(request=><p key={request.id} role="status"><span translate="no">{request.reference}</span> · {request.status==='pending'?'అడ్మిన్ వెరిఫికేషన్ కోసం వెయిటింగ్':request.status==='approved'?'మీ చెల్లింపు ఆమోదించాం':'చెల్లింపు తిరస్కరించారు; సరైన ఆధారం మళ్లీ పంపండి'}</p>)}
    <Label htmlFor="membership-utr">₹{amount} చెల్లింపు లావాదేవీ సంఖ్య</Label>
    <Input id="membership-utr" inputMode="numeric" maxLength={12} value={reference} onChange={e => setReference(e.target.value.replace(/\D/g, '').slice(0,12))} placeholder="పేమెంట్ చేసిన తర్వాత వచ్చిన UTR / లావాదేవీ నంబర్ ఇక్కడ ఇవ్వండి - ఉదాహరణ: 412345678901" required disabled={busy}/>
    <Label htmlFor="membership-upi">మీ చెల్లింపు చిరునామా</Label>
    <Input id="membership-upi" value={payerUpi} onChange={e=>setPayerUpi(e.target.value)} maxLength={100} autoCapitalize="none" autoCorrect="off" translate="no" required disabled={busy}/>
    <p className="text-sm">మీ లావాదేవీ సంఖ్య, మీ చెల్లింపు చిరునామా చిత్రంలోని వివరాలతో సరిపోలితేనే తాత్కాలిక ప్రైమ్ ఆన్ అవుతుంది. అడ్మిన్ చెల్లింపు పరిశీలిస్తారు.</p>
    <p className="text-sm text-destructive">ఎడిట్ చేసిన స్క్రీన్ షాట్ పెడితే మీ అకౌంట్ బ్లాక్ చేయబడుతుంది</p>
    <p className="text-sm">నిర్వాహకుడు నిర్ధారించిన తర్వాతే ఖాతా నిలిపివేస్తాం.</p>
    {feedback&&<p role="alert" className="text-destructive">{feedback}</p>}
    <Label htmlFor="membership-screenshot">పేమెంట్ స్క్రీన్ షాట్ ఫోటో</Label><Input id="membership-screenshot" type="file" accept="image/png,image/jpeg,image/webp" required disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (file && file.size > CHAT_IMAGE_LIMIT) { toast.error('చిన్న ఫోటో పంపండి'); e.target.value=''; setImage(null); return; } setImage(file ?? null); }}/>
    <Button type="submit" className="w-full" disabled={busy || !image || !/^\d{12}$/.test(reference) || !payerUpiSchema.safeParse(payerUpi).success}>{busy?'చిత్రం పరిశీలిస్తున్నాం':'చెల్లింపు వివరాలు పంపండి'}</Button>
  </form>;
}