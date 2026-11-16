import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { AdminPaymentImageChecks } from '@/components/AdminPaymentImageChecks';
import { AdminAdditionalRecipientPayments } from '@/components/AdminAdditionalRecipientPayments';

export function AdminMembershipRequests() {
  const queryClient = useQueryClient();
  const [image, setImage] = useState('');
  const [busy, setBusy] = useState(false);
  const { data, isError, isPending } = useQuery({ queryKey: ['admin-membership-requests'], refetchInterval: 10000, queryFn: async () => {
    const [requests, people] = await Promise.all([
      supabase.from('membership_requests').select('*').order('submitted_at', { ascending: false }),
      supabase.from('profiles').select('id,full_name,phone'),
    ]);
    if (requests.error || people.error) throw requests.error ?? people.error;
    return requests.data.map(request => ({ ...request, person: people.data.find(person => person.id === request.user_id) })).sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending'));
  } });

  const action = async (id: string, approve: boolean) => {
    if (approve && !window.confirm('బ్యాంకులో డబ్బు అందిందని చూశారా?')) return;
    setBusy(true);
    const result = await supabase.rpc('review_membership_evidence', { _id: id, _approve: approve });
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

  return <section id="admin-pending-payments" className="space-y-3 border-y py-4 scroll-mt-20">
    <AdminPaymentImageChecks />
    <h2 className="text-xl font-bold">పెండింగ్ పేమెంట్స్ లిస్ట్</h2>
    {isPending && <p role="status">వివరాలు వస్తున్నాయి</p>}
    {isError && <p role="alert">వివరాలు రాలేదు</p>}
    {data && !data.some(request => request.status === 'pending') && <p>పరిశీలించాల్సిన చెల్లింపులు లేవు</p>}
    {data?.map(request => <article className="space-y-2 border-b py-3" key={request.id}>
      <p translate="no">{request.person?.full_name || '—'} · {request.person?.phone || '—'}</p>
      <p translate="no">₹{request.amount} · {request.reference.startsWith('screenshot:') ? 'ఫోటో ఆధారం' : request.reference}</p>
      <p>{new Date(request.submitted_at).toLocaleString('te-IN')} · {request.status === 'pending' ? 'అడ్మిన్ పరిశీలన కోసం వెయిటింగ్' : request.status === 'approved' ? 'చెల్లింపు ఆమోదించాం' : 'చెల్లింపు తిరస్కరించాం'}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => void showImage(request.message_id)}>స్క్రీన్ షాట్ చూడండి</Button>
        {request.status === 'pending' && <><Button disabled={busy} onClick={() => void action(request.id, true)}>ఆమోదించండి</Button><Button variant="outline" disabled={busy} onClick={() => void action(request.id, false)}>తిరస్కరించండి</Button></>}
        <Button variant="outline" disabled={busy} onClick={async () => {
          setBusy(true);
          const result = await supabase.rpc('admin_membership_access', { _user: request.user_id, _enable: false });
          setBusy(false);
          if (result.error) toast.error('ప్రైమ్ ఆఫ్ కాలేదు');
          else await queryClient.invalidateQueries();
        }}>సభ్యత్వం తీసేయండి</Button>
      </div>
    </article>)}
    <Dialog open={!!image} onOpenChange={open => { if (!open) setImage(''); }}><DialogContent><DialogTitle>పేమెంట్ స్క్రీన్ షాట్</DialogTitle>{image && <img src={image} alt="పేమెంట్ స్క్రీన్ షాట్" className="max-h-[70svh] w-full object-contain" />}</DialogContent></Dialog>
    <AdminAdditionalRecipientPayments />
  </section>;
}
