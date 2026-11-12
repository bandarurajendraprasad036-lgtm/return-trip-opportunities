import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { getReferralBoard } from '@/lib/referral-board.functions';
import { VipSlots } from '@/components/VipSlots';
import { supabase } from '@/integrations/supabase/client';
export function ReferralBoard() {
  const read = useServerFn(getReferralBoard);
  const { data, isError } = useQuery({ queryKey: ['referral-board'], refetchInterval: 10000, refetchOnWindowFocus: true, queryFn: () => read() });
  const areas = useQuery({ queryKey: ['competition-areas'], queryFn: async () => { const r = await supabase.rpc('public_competition_areas'); if (r.error) throw r.error; return r.data as { region: string; district: string; district_group: string; score: number }[]; } });
  return <section className="space-y-2 border-y py-4"><h2 className="text-xl font-bold">మొదటి {data?.limit ?? 10} స్థానాలు · Top {data?.limit ?? 10}</h2><VipSlots /><p>తెలంగాణ · ఆంధ్రప్రదేశ్ జిల్లాల మధ్య స్నేహపూర్వక పోటీ</p><p>వేడుక: {data?.event_label ?? 'నిర్వాహకుడు ప్రకటిస్తారు'}</p><p>మొదటి వారపు విజేతలు నవంబర్ 22 ఆదివారం రాత్రి; ఈ ఆదివారం కాదు. బహుమతులు, ప్రత్యేక ప్రవేశం ఏర్పాట్లు ఇంకా నిర్ధారణ కాలేదు.</p>{areas.data?.filter(a => a.score > 0).map(a => <p key={`${a.region}-${a.district}-${a.district_group}`} className="break-words">{a.region === 'TG' ? 'తెలంగాణ' : 'ఆంధ్రప్రదేశ్'} · {a.district}{a.district_group && ` (${a.district_group})`} · {a.score}</p>)}{isError && <p role="alert">లెక్కలు రాలేదు · Rankings unavailable</p>}{data?.rows.map(row => <article key={row.rank} className="flex items-center justify-between gap-2 border-b py-2">{row.photo && <img src={row.photo} alt={row.name || 'అనుమతించిన చిత్రం · Consented photo'} className="size-14 rounded-md object-cover" />}<span className="min-w-0 flex-1 break-words">{row.rank}. {row.name || 'పేరు పంచుకోలేదు · Private name'}</span><span>{row.count}</span></article>)}</section>;
}