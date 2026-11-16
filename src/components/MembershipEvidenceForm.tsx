import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { saveLocalPaymentEvidence } from '@/lib/local-payment-evidence';
import { useMe } from '@/lib/session';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { uploadAdditionalRecipientScreenshot, uploadMembershipScreenshot } from '@/lib/membership-payment-client';
import { useNavigate } from '@tanstack/react-router';

export function MembershipEvidenceForm({ amount = 100, beneficiary, recipientId }: { amount?: number; beneficiary?: string; recipientId?: string }) {
  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return <form aria-label="చెల్లింపు ఫోటో పంపే పెట్టె" noValidate className="space-y-3 rounded-lg border-2 border-primary p-3" onSubmit={async event => {
    event.preventDefault();
    if (busy) return;
    if (!image) { setFeedback('స్క్రీన్ షాట్ జత చేయండి'); return; }
    if (!me?.id) return;
    setBusy(true);
    setFeedback('');
    try { await saveLocalPaymentEvidence({ ownerId: me.id, image, amount, beneficiary: beneficiary ?? recipientId }); } catch { /* Phone copy is only a backup. */ }
    try {
      if (recipientId) await uploadAdditionalRecipientScreenshot({ userId: me.id, image, recipientId });
      else await uploadMembershipScreenshot({ userId: me.id, image, amount, beneficiary });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'చిత్రం పంపలేకపోయాం. మళ్లీ ప్రయత్నించండి');
      setBusy(false);
      return;
    }
    setImage(null);
    if (fileInput.current) fileInput.current.value = '';
    await queryClient.invalidateQueries();
    toast.success('మీ చెల్లింపు ఫోటో అందింది. అడ్మిన్ చెక్ చేసి ఆమోదిస్తారు');
    setBusy(false);
    await navigate({ to: '/dashboard' });
  }}>
    <div className="flex min-w-0 items-center gap-3">
      <Button type="button" variant="outline" size="icon" className="size-16 shrink-0" aria-label="పేమెంట్ స్క్రీన్ షాట్ జత చేయండి" title="పేమెంట్ స్క్రీన్ షాట్ జత చేయండి" disabled={busy} onClick={() => fileInput.current?.click()}><Plus className="size-9" /></Button>
      <span className={`min-w-0 break-words text-lg ${image ? 'text-foreground' : 'text-muted-foreground'}`} translate={image ? 'no' : undefined}>{image ? image.name : 'మీ స్కానర్ స్క్రీన్ షాట్ ను అటాచ్ చేయండి'}</span>
    </div>
    <Input ref={fileInput} id={recipientId ? `additional-recipient-screenshot-${recipientId}` : beneficiary ? `membership-screenshot-${beneficiary}` : 'membership-screenshot'} className="hidden" aria-label="పేమెంట్ స్క్రీన్ షాట్" type="file" accept="image/png,image/jpeg,image/webp" required disabled={busy} onChange={event => {
      setImage(event.target.files?.[0] ?? null);
      setFeedback('');
    }} />
    {feedback && <p role="status">{feedback}</p>}
    <Button type="submit" className="min-h-14 w-full text-lg" disabled={busy || !me?.id || !image}>{busy ? 'ఫోటో పంపుతున్నాం…' : 'అడ్మిన్‌కు ఫోటో పంపండి'}</Button>
  </form>;
}
