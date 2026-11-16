import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

export function AdminAdditionalRecipientPayments() {
  const queryClient = useQueryClient();
  const [image, setImage] = useState('');
  const [busy, setBusy] = useState(false);
  const { data, isError, isPending } = useQuery({
    queryKey: ['admin-additional-recipient-payments'],
    refetchInterval: 10000,
    queryFn: async () => {
      const [payments, recipients, people] = await Promise.all([
        supabase.from('additional_recipient_payments').select('*').order('submitted_at', { ascending: false }),
        supabase.from('additional_phone_recipients').select('id,owner_id,phone'),
        supabase.from('profiles').select('id,full_name,phone'),
      ]);
      if (payments.error || recipients.error || people.error) throw payments.error ?? recipients.error ?? people.error;
      return payments.data.map(payment => {
        const recipient = recipients.data.find(item => item.id === payment.recipient_id);
        return { ...payment, recipient, person: people.data.find(item => item.id === payment.payer_id) };
      }).sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending'));
    },
  });

  const action = async (id: string, approve: boolean) => {
    if (approve && !window.confirm('బ్యాంకులో అదనపు నంబరు ₹80 నిజంగా అందిందని చూశారా?')) return;
    setBusy(true);
    const result = await supabase.rpc('review_additional_recipient_payment', { _id: id, _approve: approve });
    setBusy(false);
    if (result.error) toast.error('పరిశీలన నమోదు కాలేదు');
    else await queryClient.invalidateQueries();
  };

  const showImage = async (messageId: string) => {
    const message = await supabase.from('messages').select('image_path').eq('id', messageId).maybeSingle();
    if (message.error || !message.data?.image_path) { toast.error('చిత్రం రాలేదు'); return; }
    const signed = await supabase.storage.from('chat-images').createSignedUrl(message.data.image_path, 60);
    if (signed.error || !signed.data?.signedUrl) { toast.error('చిత్రం తెరవలేకపోయాం'); return; }
    setImage(signed.data.signedUrl);
  };

  return <section className="space-y-3 border-t py-4" aria-label="అదనపు నంబర్ల చెల్లింపులు">
    <h2 className="text-xl font-bold">అదనపు నంబర్ల ₹80 చెల్లింపులు</h2>
    {isPending && <p role="status">వివరాలు వస్తున్నాయి</p>}
    {isError && <p role="alert">అదనపు నంబర్ల చెల్లింపు వివరాలు రాలేదు</p>}
    {data?.length === 0 && <p>అదనపు నంబర్ల చెల్లింపులు లేవు</p>}
    {data?.map(payment => <article className="space-y-2 border-b py-3" key={payment.id}>
      <p translate="no">{payment.person?.full_name || '—'} · {payment.person?.phone || '—'}</p>
      <p translate="no">అదనపు నంబరు: {payment.recipient?.phone || '—'} · ₹80</p>
      <p>{new Date(payment.submitted_at).toLocaleString('te-IN')} · {payment.status === 'pending' ? 'నిర్వాహక పరిశీలన కోసం వెయిటింగ్' : payment.status === 'approved' ? 'చెల్లింపు ఆమోదించాం' : 'చెల్లింపు తిరస్కరించాం'}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => void showImage(payment.message_id)}>స్క్రీన్ షాట్ చూడండి</Button>
        {payment.status === 'pending' && <><Button disabled={busy} onClick={() => void action(payment.id, true)}>ఆమోదించండి</Button><Button variant="outline" disabled={busy} onClick={() => void action(payment.id, false)}>తిరస్కరించండి</Button></>}
      </div>
    </article>)}
    <Dialog open={!!image} onOpenChange={open => { if (!open) setImage(''); }}><DialogContent><DialogTitle>అదనపు నంబరు చెల్లింపు స్క్రీన్ షాట్</DialogTitle>{image && <img src={image} alt="అదనపు నంబరు చెల్లింపు స్క్రీన్ షాట్" className="max-h-[70svh] w-full object-contain" />}</DialogContent></Dialog>
  </section>;
}
