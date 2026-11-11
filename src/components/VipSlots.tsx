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
    <p className="font-bold">ప్రత్యేక ప్రవేశానికి మిగిలిన స్థానాలు · Remaining VIP slots: {data ? `${data.remaining} / ${data.total}` : '—'}</p>
    <p className="text-sm text-muted-foreground">ప్రస్తుత మొదటి వంద అర్హుల లెక్క; ఖరారైన హోటల్ సీట్ల బుకింగ్ కాదు. · Current ranking capacity, not confirmed venue bookings.</p>
    {isError && <Button variant="outline" onClick={() => void refetch()}>స్థానాలు మళ్లీ చూడండి · Refresh slots</Button>}
  </div>;
}