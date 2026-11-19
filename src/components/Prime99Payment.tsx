import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { usePrime99 } from '@/lib/prime99';
import { PaymentScanner } from '@/components/PaymentScanner';
import { MembershipEvidenceForm } from '@/components/MembershipEvidenceForm';

export function Prime99Payment({ compact = false }: { bellPayment?: boolean; compact?: boolean }) {
  const amount = 100;
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

  const plans = <p className="text-base">₹100 — మూడు నెలల చందా మాత్రమే. పని, సేవలు, వాహనాల గంట, సంభాషణ కోసం. నిర్వాహకుల ఆమోదం తర్వాతే మూడు నెలల చందా మొదలవుతుంది.</p>;
  if (compact) return <section className="space-y-3 profile-copy">{plans}<PaymentScanner amount={amount} compact /><MembershipEvidenceForm key={amount} amount={amount} /></section>;
  if (!me) return null;
  const completed = !!prime?.active;
  const waiting = !completed && request.data === 'pending';
  return <section className="space-y-4 border-y py-4 profile-copy">
    <h2 className="text-center text-2xl font-bold">₹100 — మూడు నెలల చందా</h2>
    {plans}
    {!completed && <p className="text-lg">నిర్వాహకులు ఆమోదించినప్పటి నుంచి మూడు నెలలు సంభాషణ, గంట ఉపయోగించవచ్చు. పేరు, ఫోటో, మొబైల్ నంబరు దాచబడతాయి. మూడు నెలలు ముగిశాక మళ్లీ ₹100 చెల్లించి ఆమోదం పొందాలి.</p>}
    {completed ? <p role="status" className="text-center text-lg font-bold">మీ ప్రైమ్ ఆన్ అయింది{prime.ends_at && ` · ${new Date(prime.ends_at).toLocaleDateString('te-IN')} వరకు`}</p>
      : waiting ? <p role="status" className="text-center text-lg font-bold">మీ చెల్లింపు ఫోటో అందింది. అడ్మిన్ చెక్ చేసి ఆమోదిస్తారు.</p>
        : <><PaymentScanner amount={amount} /><MembershipEvidenceForm key={`${me.id}-${amount}`} amount={amount} /></>}
  </section>;
}
