import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import type { VipSlotCount } from '@/lib/referral-vip';

export function VipSlots() {
  const { data, isError, refetch } = useQuery({
    queryKey: ['vip-slots'],
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const result = await supabase.rpc('referral_vip_slots');
      if (result.error) throw result.error;
      return result.data as unknown as VipSlotCount;
    },
  });
  return <div className="space-y-1" aria-live="polite">
    <h3 className="text-xl font-bold">టాప్ 100 అవకాశం / Top 100 Offer</h3>
    <p className="font-bold">మొదటి 100 మందికి ప్రత్యేక అవకాశం!</p>
    <p>టాప్ 100 అంటే మొదటి 100 మంది!</p>
    <p>ఇప్పటివరకు చేరినవారు: {data ? `${data.occupied} / ${data.total} మంది` : '—'}</p>
    <p>మిగిలిన స్థానాలు: {data ? `${data.remaining} మంది` : '—'}</p>
    <p className="text-sm">ఇది బుకింగ్ కాదు, కేవలం మీ స్థానం. పూర్తి వివరాలు 15 రోజుల్లో తెలియజేస్తాం.</p>
    {isError && <Button variant="outline" onClick={() => void refetch()}>స్థానాలు మళ్లీ చూడండి · Refresh slots</Button>}
  </div>;
}