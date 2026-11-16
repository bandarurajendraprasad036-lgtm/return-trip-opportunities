import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { hasValidMobile } from '@/lib/phone';
import { ADDITIONAL_RECIPIENT_AMOUNT } from '@/lib/additional-recipients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaymentScanner } from '@/components/PaymentScanner';
import { MembershipEvidenceForm } from '@/components/MembershipEvidenceForm';

export function AdditionalPhoneRecipients() {
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [paymentFor, setPaymentFor] = useState('');

  const recipients = useQuery({
    queryKey: ['additional-phone-recipients', me?.id],
    enabled: !!me,
    queryFn: async () => {
      const result = await supabase.rpc('my_additional_phone_recipients');
      if (result.error) throw result.error;
      return result.data;
    },
  });
  const requests = useQuery({
    queryKey: ['additional-recipient-requests', me?.id],
    enabled: !!me,
    queryFn: async () => {
      const result = await supabase.rpc('my_additional_recipient_requests');
      if (result.error) throw result.error;
      return result.data;
    },
  });

  if (!me) return null;

  const add = async () => {
    if (!hasValidMobile(phone) || !consent || busy) return;
    setBusy(true);
    try {
      const result = await supabase.rpc('add_additional_phone_recipient', { _phone: phone, _consent: consent });
      if (result.error) throw result.error;
      setPhone('');
      setConsent(false);
      await queryClient.invalidateQueries({ queryKey: ['additional-phone-recipients'] });
      toast.success('నంబరు జతైంది. ఆ నంబరు యజమాని కోడ్‌తో ప్రవేశించి అనుమతి ఇవ్వాలి.');
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      toast.error(message.includes('OWN_NUMBER_NOT_ADDITIONAL') ? 'మీ సొంత నంబరును అదనపు నంబరుగా జతచేయకూడదు' : 'నంబరు జతచేయలేకపోయాం. నంబరు, అనుమతి సరిచూడండి');
    } finally { setBusy(false); }
  };

  const approveRequest = async (id: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await supabase.rpc('consent_additional_phone_recipient', { _id: id });
      if (result.error) throw result.error;
      await queryClient.invalidateQueries();
      toast.success('మీ నంబరు నిర్ధారించి, మీ అనుమతి నమోదు చేశాం');
    } catch {
      toast.error('ఈ ఖాతాలో అదే నంబరు కోడ్‌తో నిర్ధారించి ఉండాలి');
    } finally { setBusy(false); }
  };

  return <section className="space-y-4 border-y py-4" aria-label="అదనపు మొబైల్ నంబర్లు">
    <div>
      <h2 className="text-xl font-bold">అదనపు మొబైల్ నంబర్లు</h2>
      <p className="text-lg">ఒక్కొక్క అదనపు వ్యక్తికి ₹{ADDITIONAL_RECIPIENT_AMOUNT}. ఎంత మంది అయినా జతచేయవచ్చు.</p>
      <p>నంబరు యజమాని తన ఖాతాలోకి కోడ్‌తో ప్రవేశించి అనుమతి ఇచ్చిన తర్వాతే చెల్లింపు చేయవచ్చు.</p>
    </div>
    <div className="space-y-2">
      <Label htmlFor="additional-phone">అదనపు మొబైల్ నంబరు</Label>
      <Input id="additional-phone" type="tel" inputMode="numeric" autoComplete="off" value={phone} maxLength={10} pattern="[6-9][0-9]{9}" placeholder="పది అంకెల నంబరు" className="h-12 text-base" onChange={event => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} />
      <label className="flex min-h-12 items-start gap-3 text-base"><input type="checkbox" className="mt-1 size-5" checked={consent} onChange={event => setConsent(event.target.checked)} />ఈ నంబరును జతచేయడానికి ఆ వ్యక్తి అనుమతి ఉంది</label>
      <Button type="button" variant="outline" className="min-h-12 w-full" disabled={busy || !hasValidMobile(phone) || !consent} onClick={() => void add()}><Plus />మరో నంబరు జతచేయండి</Button>
    </div>

    {requests.data && requests.data.length > 0 && <div className="space-y-3 rounded-lg border p-3">
      <h3 className="text-lg font-bold">మీ నంబరుకు వచ్చిన అభ్యర్థనలు</h3>
      {requests.data.map(request => <div key={request.id} className="space-y-2 border-b pb-3 last:border-0">
        <p translate="no">{request.phone}</p>
        <Button type="button" className="min-h-12 w-full" disabled={busy} onClick={() => void approveRequest(request.id)}>ఈ నంబరుకు అనుమతి ఇస్తున్నాను</Button>
      </div>)}
    </div>}

    {recipients.isError && <Button type="button" variant="outline" onClick={() => void recipients.refetch()}>మళ్లీ ప్రయత్నించండి</Button>}
    {recipients.data?.map(recipient => <article key={recipient.id} className="space-y-3 rounded-lg border p-3">
      <p className="text-lg font-bold" translate="no">{recipient.phone} · ₹{ADDITIONAL_RECIPIENT_AMOUNT}</p>
      {!recipient.verified_at ? <p role="status">నంబరు యజమాని కోడ్‌తో ప్రవేశించి అనుమతి ఇవ్వాలి.</p>
        : recipient.payment_status === 'approved' ? <p role="status">₹80 చెల్లింపు నిర్వాహకులు ఆమోదించారు.</p>
          : recipient.payment_status === 'pending' ? <p role="status">చెల్లింపు ఫోటో నిర్వాహకుల పరిశీలనలో ఉంది.</p>
            : <>
              {recipient.payment_status === 'rejected' && <p role="status">చెల్లింపు ఆమోదించలేదు. మళ్లీ ఫోటో పంపవచ్చు.</p>}
              <Button type="button" variant="outline" className="min-h-12 w-full" aria-expanded={paymentFor === recipient.id} onClick={() => setPaymentFor(current => current === recipient.id ? '' : recipient.id)}>₹80 చెల్లించండి</Button>
              {paymentFor === recipient.id && <div className="space-y-4"><PaymentScanner amount={80} heading="అదనపు నంబరు కోసం స్కాన్ చేయండి" /><MembershipEvidenceForm amount={80} recipientId={recipient.id} /></div>}
            </>}
    </article>)}
    <p className="text-sm">చెల్లింపు ఆమోదం లేదా సూచన అనుమతి, ఫోన్‌కు సందేశం చేరిందనే హామీ కాదు.</p>
  </section>;
}
