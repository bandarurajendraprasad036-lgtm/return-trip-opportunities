import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Prime99Payment } from '@/components/Prime99Payment';
import { useMe } from '@/lib/session';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from '@tanstack/react-router';
import { usePrime99 } from '@/lib/prime99';

export function PostSubmissionNotice({ postId }: { postId: string }) {
  const [payment, setPayment] = useState(false);
  const { data: me } = useMe();
  const navigate = useNavigate();
  const { data: prime } = usePrime99(me?.id);
  const { data: adminId } = useQuery({ queryKey: ['support-admin-id'], queryFn: async () => {
    const result = await supabase.rpc('support_admin_id'); if (result.error) throw result.error; return result.data;
  } });
  const share = () => {
    const url = `${window.location.origin}/feed`;
    window.open(`https://wa.me/?text=${encodeURIComponent(`గాయత్రి వన్ — ${url}`)}`, '_blank', 'noopener,noreferrer');
    if (adminId) void navigate({ to: '/chat/$userId', params: { userId: adminId }, search: { post: postId } });
  };
  if (prime?.active) return <section className="space-y-4 p-4" aria-live="polite"><p className="break-words text-lg font-bold leading-relaxed">మీ పోస్ట్ వేయబడింది. ఇప్పుడే వెబ్సైట్లో చూసుకోవచ్చు.</p><Button className="h-auto min-h-14 w-full whitespace-normal" onClick={() => void navigate({ to: '/' })}>హోమ్ కి వెళ్ళండి</Button></section>;
  return <section className="space-y-4 p-4" aria-live="polite">
    <p translate="no" className="break-words text-lg leading-relaxed">మీ సమాచారం మా వద్ద మాకు సబ్మిట్ చేయబడింది మీ సమాచారాన్ని మరో ఐదు గంటల్లో వెబ్సైట్లో చూసుకోవచ్చు. లేదు ఇప్పుడే చూసుకుంటాను నాకు ఇప్పుడే కావాలి అని అనుకుంటే మీరు మీ స్టేటస్ తో పాటు మరో నలుగురికి కింద ఉన్న బటన్ తో షేర్ చేయండి లేదా ₹100 పేమెంట్ చేసి మంత్లీ సబ్స్క్రైబర్ కండి మీకు బెల్ తో పాటు మరిన్ని పోస్టులు ఉచితంగా పోస్ట్ చేసుకునే అవకాశం ఉంటుంది.</p>
    <div className="grid grid-cols-2 gap-2"><Button className="h-auto min-h-14 whitespace-normal" disabled={!me || !adminId} onClick={share}>4 గురికి షేర్ చేయండి</Button><Button className="h-auto min-h-14 whitespace-normal" onClick={() => setPayment(true)}>₹100 పేమెంట్ చేయండి</Button></div>
    {payment && <Prime99Payment bellPayment />}
  </section>;
}