import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { usePrime99 } from '@/lib/prime99';
import { PaymentScanner } from '@/components/PaymentScanner';
import { MembershipEvidenceForm } from '@/components/MembershipEvidenceForm';

export function Prime99Payment(_props: { bellPayment?: boolean }) {
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

  if (!me) return null;
  const completed = !!prime?.active;
  const waiting = !completed && request.data === 'pending';
  return <section className="space-y-4 border-y py-4 profile-copy">
    <h2 className="text-center text-2xl font-bold">₹100 — మూడు నెలల వాహన చందా</h2>
    {!completed && <p className="text-lg">మీరు సబ్స్క్రైబ్ చేద్దాం అనుకుంటే ఈ పేమెంట్ బాక్స్ లో ₹100 పే చేయండి. మీకు వెహికల్ కి సంబంధించిన పూర్తి సమాచారం దొరుకుతుంది.</p>}
    {completed ? <p role="status" className="text-center text-lg font-bold">మీ ప్రైమ్ ఆన్ అయింది{prime.ends_at && ` · ${new Date(prime.ends_at).toLocaleDateString('te-IN')} వరకు`}</p>
      : waiting ? <p role="status" className="text-center text-lg font-bold">మీ చెల్లింపు ఫోటో అందింది. అడ్మిన్ చెక్ చేసి ఆమోదిస్తారు.</p>
        : <><PaymentScanner amount={100} /><MembershipEvidenceForm key={me.id} amount={100} /></>}
  </section>;
}
