import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { viewChatImage } from '@/lib/chat-upload.functions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export function AdminPaymentImageChecks() {
  const qc=useQueryClient();const show=useServerFn(viewChatImage);const [image,setImage]=useState('');const [busy,setBusy]=useState(false);
  const checks=useQuery({queryKey:['admin-payment-image-checks'],refetchInterval:10000,queryFn:async()=>{const r=await supabase.from('payment_image_checks').select('*').order('created_at',{ascending:false});if(r.error)throw r.error;return r.data;}});
  const confirmEdited=async(message:string)=>{
    if(!window.confirm('ఈ చెల్లింపు చిత్రం మార్చినదని నిర్ధారించారా? చెల్లింపు పంపిన వ్యక్తి ఖాతా నిలిపివేయబడుతుంది.'))return;
    setBusy(true);
    try{const r=await supabase.rpc('confirm_edited_payment_image',{_message:message});if(r.error)throw r.error;await qc.invalidateQueries();toast.success('ఖాతా నిలిపివేశాం');}
    catch{toast.error('ఖాతా నిలిపివేయలేకపోయాం');}finally{setBusy(false);}
  };
  return <section className="space-y-3 border-y py-4"><h3 className="text-lg font-bold">చిత్రం వివరాల పరిశీలన</h3>{checks.isError&&<p role="alert">చిత్రం పరిశీలన వివరాలు రాలేదు</p>}{checks.data?.map(c=><article key={c.message_id} className="space-y-2 border-b py-3"><p>{c.match_status==='matched'?'రెండు వివరాలు సరిపోలాయి':c.match_status==='suspected_edit'?'మార్చినట్లు అనుమానం — ఇంకా నిర్ధారణ కాలేదు':c.match_status==='unreadable'?'చిత్రంలోని వివరాలు చదవలేకపోయాం':'వివరాలు సరిపోలలేదు'}</p><p translate="no" className="break-all">ఇచ్చిన చిరునామా: {c.entered_upi}</p><p translate="no" className="break-all">చిత్రంలో: {c.observed_upi || '—'} · {c.observed_utr || '—'}</p><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={async()=>{try{setImage((await show({data:{message:c.message_id}})).url);}catch{toast.error('చిత్రం రాలేదు');}}}>స్క్రీన్ షాట్ చూడండి</Button><Button variant="destructive" disabled={busy} onClick={()=>void confirmEdited(c.message_id)}>మార్చిన చిత్రం నిర్ధారించాం — ఖాతా నిలపండి</Button></div></article>)}<Dialog open={!!image} onOpenChange={open=>{if(!open)setImage('');}}><DialogContent><DialogTitle>పేమెంట్ స్క్రీన్ షాట్</DialogTitle>{image&&<img src={image} alt="పేమెంట్ స్క్రీన్ షాట్" className="max-h-[70svh] w-full object-contain"/>}</DialogContent></Dialog></section>;
}