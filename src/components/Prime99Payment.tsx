import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { usePrime99 } from '@/lib/prime99';
import { PaymentScanner } from '@/components/PaymentScanner';
import { MembershipEvidenceForm } from '@/components/MembershipEvidenceForm';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function Prime99Payment({ compact = false }: { bellPayment?: boolean; compact?: boolean }) {
  const [amount, setAmount] = useState<49 | 100>(100);
  const { data: me } = useMe();
  const { data: prime } = usePrime99(me?.id);
  const request = useQuery({
    queryKey: ['my-membership-request', me?.id],
    enabled: !!me,
    refetchInterval: 15000,
    queryFn: async () => {
      if (!me) return null;
      const result = await supabase.from('membership_requests').select('status').eq('user_id', me.id).order('submitted_at', { ascending: false }).limit(1).maybeSingle();
      if (result.error) throw result.error;
      return result.data?.status ?? null;
    },
  });

  const plans = <><p className="text-base">ఓన్లీ సర్వీస్ ప్రొవైడర్స్ / జాబ్స్ తీసుకుంటే ₹49/- మాత్రమే (వాహన గంట, వాహన చాట్ పని చేయవు). అలా కాకుండా టోటల్ ఏది కావాలన్నా, ఈ యాప్‌లో ఏది కావాలన్నా తీసుకుంటే ₹100/- పేమెంట్ చేయాలి. నిర్వాహకుల ఆమోదం తర్వాతే ఒక నెల చందా మొదలవుతుంది.</p><div className="grid grid-cols-2 gap-2" role="group" aria-label="నెల చందా ఎంపిక"><Button type="button" variant={amount === 49 ? 'default' : 'outline'} aria-pressed={amount === 49} className="h-auto min-h-14 whitespace-normal" onClick={() => setAmount(49)}>పని / సేవలు ₹49</Button><Button type="button" variant={amount === 100 ? 'default' : 'outline'} aria-pressed={amount === 100} className="h-auto min-h-14 whitespace-normal" onClick={() => setAmount(100)}>అన్ని ఎంపికలు ₹100</Button></div></>;
  if (compact) return <section className="space-y-3 profile-copy">{plans}<PaymentScanner amount={amount} compact /><MembershipEvidenceForm key={amount} amount={amount} /></section>;
  if (!me) return null;
  const completed = !!prime?.active;
  const waiting = !completed && request.data === 'pending';
  return <section className="space-y-4 border-y py-4 profile-copy">
    <h2 className="text-center text-2xl font-bold">నెల చందా — పని / సేవలు ₹49 · అన్ని ఎంపికలు ₹100</h2>
    {plans}
    {!completed && <p className="text-lg">నిర్వాహకులు ఆమోదించినప్పటి నుంచి ఒక నెల చాట్, గంట ఉపయోగించవచ్చు. పేరు, ఫోటో, మొబైల్ నంబరు దాచబడతాయి. నెల ముగిశాక మళ్లీ ₹100 చెల్లించి ఆమోదం పొందాలి.</p>}
    {completed ? <p role="status" className="text-center text-lg font-bold">మీ ప్రైమ్ ఆన్ అయింది{prime.ends_at && ` · ${new Date(prime.ends_at).toLocaleDateString('te-IN')} వరకు`}</p>
      : waiting ? <p role="status" className="text-center text-lg font-bold">మీ చెల్లింపు ఫోటో అందింది. అడ్మిన్ చెక్ చేసి ఆమోదిస్తారు.</p>
        : <><PaymentScanner amount={amount} /><MembershipEvidenceForm key={`${me.id}-${amount}`} amount={amount} /></>}
  </section>;
}
