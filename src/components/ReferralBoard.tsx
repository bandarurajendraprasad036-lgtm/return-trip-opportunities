import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { getReferralBoard } from '@/lib/referral-board.functions';
import { VipSlots } from '@/components/VipSlots';
export function ReferralBoard() {
  const read = useServerFn(getReferralBoard);
  const { data, isError } = useQuery({ queryKey: ['referral-board'], refetchInterval: 10000, refetchOnWindowFocus: true, queryFn: () => read() });
  return <section className="space-y-2 border-y py-4"><h2 className="text-xl font-bold">మొదటి {data?.limit ?? 10} స్థానాలు · Top {data?.limit ?? 10}</h2><VipSlots /><p>తెలంగాణ: {data?.totals.TG ?? '—'} · Telangana</p><p>ఆంధ్రప్రదేశ్: {data?.totals.AP ?? '—'} · Andhra Pradesh</p><p>వేడుక: {data?.event_label ?? 'డిసెంబర్ 31'}</p><p>పూర్తి వివరాలు మరో పదిహేను రోజుల్లో తెలియజేస్తాం.</p>{isError && <p role="alert">లెక్కలు రాలేదు · Rankings unavailable</p>}{data?.rows.length === 0 && <p>కొత్త చేరికల లెక్కలు ఇంకా లేవు · No new campaign rankings yet</p>}{data?.rows.map(row => <article key={row.rank} className="flex items-center justify-between gap-2 border-b py-2">{row.photo && <img src={row.photo} alt={row.name || 'అనుమతించిన చిత్రం · Consented photo'} className="size-14 rounded-md object-cover" />}<span className="min-w-0 flex-1 break-words">{row.rank}. {row.name || 'పేరు పంచుకోలేదు · Private name'}</span><span>{row.count}</span></article>)}</section>;
}