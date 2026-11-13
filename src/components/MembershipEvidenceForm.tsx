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

export function MembershipEvidenceForm({ amount = 100, beneficiary }: { amount?: number; beneficiary?: string }) {
  const [reference, setReference] = useState(''); const [image, setImage] = useState<File | null>(null); const [busy, setBusy] = useState(false);
  const send = useServerFn(sendChatEntry); const qc = useQueryClient();
  const {data:me} = useMe();
  const requests = useQuery({queryKey:['membership-evidence-status',me?.id,beneficiary],enabled:!!me,refetchInterval:10000,queryFn:async()=>{
    if (!me) return [];
    const result = await supabase.from('membership_requests').select('id,status,reference').eq('payer_id',me.id).eq('user_id',beneficiary ?? me.id).order('submitted_at',{ascending:false}).limit(5);
    if(result.error) throw result.error;
    return result.data;
  }});
  return <form className="space-y-3" onSubmit={async event => {
    event.preventDefault(); if (busy || !image || !/^\d{12}$/.test(reference)) return; setBusy(true);
    try {
      const admin = await supabase.rpc('support_admin_id'); if (admin.error || !admin.data) throw new Error('Admin unavailable');
      const form = new FormData(); form.set('receiver', admin.data); form.set('post', ''); form.set('body', `UTR: ${reference}`); form.set('phone', ''); form.set('image', image); form.set('membership_amount', String(amount)); if (beneficiary) form.set('beneficiary', beneficiary);
      const result = await send({ data: form });
      if (!result.membershipStatus) throw new Error('Evidence not registered');
      setReference(''); setImage(null); await qc.invalidateQueries(); toast.success(result.membershipStatus==='approved'?'మీ చెల్లింపు ఆమోదించాం':'అడ్మిన్ వెరిఫికేషన్ కోసం వెయిటింగ్');
    } catch { toast.error('చెల్లింపు ఆధారం పంపలేకపోయాం. లావాదేవీ సంఖ్య, చిత్రం సరిచూసి అడ్మిన్ తో చాట్ చేయండి.'); } finally { setBusy(false); }
  }}>
    {requests.data?.map(request=><p key={request.id} role="status"><span translate="no">{request.reference}</span> · {request.status==='pending'?'అడ్మిన్ వెరిఫికేషన్ కోసం వెయిటింగ్':request.status==='approved'?'మీ చెల్లింపు ఆమోదించాం':'చెల్లింపు తిరస్కరించారు; సరైన ఆధారం మళ్లీ పంపండి'}</p>)}
    <Label htmlFor="membership-utr">₹{amount} చెల్లింపు లావాదేవీ సంఖ్య</Label>
    <Input id="membership-utr" inputMode="numeric" maxLength={12} value={reference} onChange={e => setReference(e.target.value.replace(/\D/g, '').slice(0,12))} placeholder="పేమెంట్ చేసిన తర్వాత వచ్చిన UTR / లావాదేవీ నంబర్ ఇక్కడ ఇవ్వండి - ఉదాహరణ: 412345678901" required disabled={busy}/>
    <p className="text-sm">UTR నంబర్ + స్క్రీన్ షాట్ పంపితే తాత్కాలిక ప్రైమ్ ఆన్ అవుతుంది. మేము చూసి చెల్లింపు నిర్ధారిస్తాం.</p>
    <Label htmlFor="membership-screenshot">పేమెంట్ స్క్రీన్ షాట్ ఫోటో</Label><Input id="membership-screenshot" type="file" accept="image/png,image/jpeg,image/webp" required disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (file && file.size > CHAT_IMAGE_LIMIT) { toast.error('చిన్న ఫోటో పంపండి'); e.target.value=''; setImage(null); return; } setImage(file ?? null); }}/>
    <Button type="submit" className="w-full" disabled={busy || !image || !/^\d{12}$/.test(reference)}>UTR + స్క్రీన్ షాట్ పంపండి</Button>
  </form>;
}