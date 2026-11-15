import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PaymentScanner } from '@/components/PaymentScanner';
import { MembershipEvidenceForm } from '@/components/MembershipEvidenceForm';

export function ReferralPaymentRequests() {
  const [selected, setSelected] = useState('');
  const { data } = useQuery({ queryKey: ['referral-payment-requests'], refetchInterval: 10000, queryFn: async () => {
    const result = await supabase.rpc('my_referral_payment_requests');
    if (result.error) throw result.error;
    return result.data;
  } });
  return <section className="space-y-3 border-y py-4"><h3 className="text-xl font-bold">కొత్త యూజర్ కోసం రిఫరల్ పేమెంట్ ₹80</h3>
    {data?.map((request, index) => <div key={request.joined_user} className="border-b py-2"><p>మీ ద్వారా చేరినవారు {index + 1} · {new Date(request.joined_at).toLocaleDateString('te-IN')}</p><Button variant="outline" onClick={() => setSelected(request.joined_user)}>₹80 స్కానర్ తెరవండి</Button></div>)}
    {selected && <><PaymentScanner amount={80} /><MembershipEvidenceForm key={selected} amount={80} beneficiary={selected} /></>}
  </section>;
}
