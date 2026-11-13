import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { sendChatEntry } from '@/lib/chat-upload.functions';
import { CHAT_IMAGE_LIMIT } from '@/lib/chat-rules';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function MembershipEvidenceForm({ amount = 100, beneficiary }: { amount?: number; beneficiary?: string }) {
  const [reference, setReference] = useState(''); const [image, setImage] = useState<File | null>(null); const [busy, setBusy] = useState(false);
  const [feedback,setFeedback]=useState(''); const fileInput=useRef<HTMLInputElement>(null);
  const formRef=useRef<HTMLFormElement>(null); const navigate=useNavigate();
  useEffect(()=>{const frame=requestAnimationFrame(()=>{formRef.current?.scrollIntoView({block:'start',behavior:'instant'});formRef.current?.focus({preventScroll:true});});return()=>cancelAnimationFrame(frame);},[]);
  const send = useServerFn(sendChatEntry); const qc = useQueryClient();
  return <form ref={formRef} tabIndex={-1} aria-label="చెల్లింపు వివరాలు" noValidate className="space-y-3 rounded-lg border border-primary p-3 scroll-mt-24" onSubmit={async event => {
    event.preventDefault(); if (busy) return;
    if (!image) {setFeedback('స్క్రీన్ షాట్ జత చేయండి');return;}
    if (!/^\d{12}$/.test(reference)) {setFeedback('12 అంకెల లావాదేవీ సంఖ్య ఇవ్వండి');return;}
    setBusy(true);setFeedback('');
    try {
      const admin = await supabase.rpc('support_admin_id'); if (admin.error || !admin.data) throw new Error('Admin unavailable');
      const form = new FormData(); form.set('receiver', admin.data); form.set('post', ''); form.set('body', `UTR: ${reference}`); form.set('phone', ''); form.set('image', image); form.set('membership_amount', String(amount)); if (beneficiary) form.set('beneficiary', beneficiary);
      const result = await send({ data: form });
      if (!result.membershipStatus) throw new Error('Evidence not registered');
      setReference(''); setImage(null);if(fileInput.current)fileInput.current.value=''; await qc.invalidateQueries(); toast.success('మీ వివరాలు అందాయి, మీ పోస్ట్ వేయవచ్చు');
      await navigate({to:'/post/new'});
    } catch { setFeedback('వివరాలు పంపలేకపోయాం. మళ్లీ ప్రయత్నించండి.'); } finally { setBusy(false); }
  }}>
    <div className="flex min-w-0 items-center gap-3"><Button type="button" variant="outline" size="icon" className="size-12 shrink-0" aria-label="స్క్రీన్ షాట్ జత చేయండి" title="స్క్రీన్ షాట్ జత చేయండి" disabled={busy} onClick={()=>fileInput.current?.click()}><Plus className="size-7"/></Button><span className="min-w-0 break-all" translate={image?'no':undefined}>{image?image.name:'పేమెంట్ స్క్రీన్ షాట్ జత చేయండి'}</span></div>
    <Input ref={fileInput} id="membership-screenshot" className="hidden" aria-label="పేమెంట్ స్క్రీన్ షాట్" type="file" accept="image/png,image/jpeg,image/webp" required disabled={busy} onChange={e=>{
      const file=e.target.files?.[0];setImage(null);setFeedback('');
      if(!file)return;
      if(file.size>CHAT_IMAGE_LIMIT){toast.error('చిన్న ఫోటో పంపండి');e.target.value='';return;}
      setImage(file);
    }}/>
    <Label htmlFor="membership-utr">ట్రాన్సాక్షన్ నెంబర్ ఇవ్వండి</Label>
    <Input id="membership-utr" inputMode="numeric" maxLength={12} value={reference} onChange={e => setReference(e.target.value.replace(/\D/g, '').slice(0,12))} placeholder="12 అంకెల లావాదేవీ సంఖ్య ఇవ్వండి" required disabled={busy}/>
    {feedback&&<p role="status">{feedback}</p>}
    <Button type="submit" className="w-full" disabled={busy || !image || !/^\d{12}$/.test(reference)}>{busy?'వివరాలు పంపుతున్నాం':'చెల్లింపు వివరాలు పంపండి'}</Button>
  </form>;
}