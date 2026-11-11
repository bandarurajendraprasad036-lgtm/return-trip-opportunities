import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VipSlots } from '@/components/VipSlots';
type Board = { limit: number; event_label: string; rows: { rank: number; count: number; name: string; region: string }[] };
export function ReferralBoard() {
  const { data, isError } = useQuery({ queryKey: ['referral-board'], refetchInterval: 10000, refetchOnWindowFocus: true, queryFn: async () => { const result = await supabase.rpc('public_referral_vip_board'); if (result.error) throw result.error; return result.data as unknown as Board; } });
  return <section className="space-y-2 border-y py-4"><h2 className="text-xl font-bold">మొదటి {data?.limit ?? 10} స్థానాలు · Top {data?.limit ?? 10}</h2><VipSlots /><p>తెలంగాణ + ఆంధ్రప్రదేశ్ · Telangana + Andhra Pradesh</p><p>వేడుక: {data?.event_label ?? 'డిసెంబర్ 31'}</p><p>పూర్తి వివరాలు మరో పదిహేను రోజుల్లో తెలియజేస్తాం.</p>{isError && <p role="alert">లెక్కలు రాలేదు · Rankings unavailable</p>}{data?.rows.length === 0 && <p>కొత్త చేరికల లెక్కలు ఇంకా లేవు · No new campaign rankings yet</p>}{data?.rows.map(row => <article key={row.rank} className="flex justify-between border-b py-2"><span>{row.rank}. {row.name || 'పేరు పంచుకోలేదు · Private name'}</span><span>{row.count}</span></article>)}</section>;
}