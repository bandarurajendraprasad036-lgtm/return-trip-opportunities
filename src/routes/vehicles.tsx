import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { POST_LIST_COLUMNS } from '@/lib/post-access';
import { vehiclePageRows, type VehiclePageKind } from '@/lib/vehicle-page';
import { useMe } from '@/lib/session';
import { PostCard, type Post } from '@/components/PostCard';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VehicleDemandBell } from '@/components/VehicleDemandBell';

// Vehicle kinds shown when no real listing matches; never invented numbers, drivers or phones.
const CATALOG: Record<VehiclePageKind, string[]> = {
  goods: ['ఆటో · Auto', 'ఆపే ట్రాలీ · Ape trolley', 'టాటా ఏస్ · Tata Ace', 'బొలెరో పికప్ · Bolero Pickup', 'డీసీఎం · DCM', 'లారీ · Lorry'],
  returns: ['ఆపే ట్రాలీ · Ape trolley', 'టాటా ఏస్ · Tata Ace', 'బొలెరో పికప్ · Bolero Pickup', 'డీసీఎం · DCM', 'లారీ · Lorry'],
  cars: ['ఇన్నోవా · Innova', 'స్విఫ్ట్ డిజైర్ · Swift Dzire', 'ఎర్టిగా · Ertiga', 'బొలెరో · Bolero'],
};

export const Route = createFileRoute('/vehicles')({
  validateSearch: (s: Record<string, unknown>): { category: VehiclePageKind; from: string; to: string } => ({ category: s['category'] === 'cars' || s['category'] === 'returns' ? s['category'] : 'goods', from: typeof s['from'] === 'string' ? s['from'].slice(0,80) : '', to: typeof s['to'] === 'string' ? s['to'].slice(0,80) : '' }),
  head: ({ match }) => { const title = match.search.category === 'cars' ? 'స్థానిక కార్లు' : match.search.category === 'returns' ? 'తిరిగి వచ్చే, ముందస్తు వాహనాలు' : 'స్థానిక సరకు వాహనాలు'; return { meta: [{ title: `${title} — గాయత్రి వన్` }, { name: 'description', content: `${title}: నిజమైన ప్రకటనలు, మార్గం, తేదీ ఎంపిక.` }, { property: 'og:title', content: `${title} — గాయత్రి వన్` }, { property: 'og:description', content: 'నిజమైన వాహన ప్రకటనలు, మార్గం, తేదీ ఎంపిక.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }; },
  component: VehiclesPage,
});
function VehiclesPage() { const search = Route.useSearch(); return <AppShell hideTopActions><Vehicles /></AppShell>; }
function Vehicles() {
  const search = Route.useSearch();
  const { data: me } = useMe();
  const [date, setDate] = useState('');
  const [carMode, setCarMode] = useState<'advance' | 'return'>('advance');
  const instant = search.category === 'goods';
  const { data: posts = [], isError, isPending, refetch } = useQuery({ queryKey: ['vehicle-page-posts'], queryFn: async () => { const result = await supabase.from('posts').select(POST_LIST_COLUMNS).eq('status','active').order('created_at',{ ascending: false }); if (result.error) throw result.error; return result.data as Post[]; } });
  const rows = vehiclePageRows(posts, search.category, search.from, search.to, instant ? '' : date).filter(p => search.category !== 'cars' || carMode === 'advance' || (p.from_place ?? '').trim().toLowerCase() !== (p.to_place ?? '').trim().toLowerCase());
  return <div className="space-y-3 p-4"><h2 className="text-xl font-bold">{search.category === 'cars' ? 'స్థానిక కార్ల బుకింగ్ · Local cars booking' : search.category === 'returns' ? 'తిరిగి & ముందస్తు సరకు వాహనాలు · Return & advance goods' : 'స్థానిక సరకు వాహన బుకింగ్ · Local goods booking'}</h2>
    {(search.from || search.to) && <p>{search.from} → {search.to}</p>}
    {search.category === 'cars' && <div className="grid grid-cols-2 gap-2"><Button variant={carMode === 'advance' ? 'default' : 'outline'} aria-pressed={carMode === 'advance'} className="h-auto min-h-12 whitespace-normal" onClick={() => setCarMode('advance')}>ముందస్తు కార్లు · Advance cars</Button><Button variant={carMode === 'return' ? 'default' : 'outline'} aria-pressed={carMode === 'return'} className="h-auto min-h-12 whitespace-normal" onClick={() => setCarMode('return')}>ముందస్తు + తిరుగు కార్లు · Advance + return cars</Button></div>}
    {instant ? <p className="text-muted-foreground">ఇప్పటికప్పుడు బుక్ చేసే వాహనాలు · Instant booking vehicles</p> : <><Label htmlFor="vehicle-date">వాహన తేదీ · Vehicle date</Label><Input id="vehicle-date" type="date" value={date} onChange={e => setDate(e.target.value)} /><Button variant="ghost" onClick={() => setDate('')}>అన్ని తేదీలు · All dates</Button></>}
    {isPending && <p role="status">వస్తున్నాయి · Loading</p>}{isError && <Button onClick={() => void refetch()}>మళ్లీ చూడండి · Retry</Button>}
    <p className="text-sm">అందరి పోస్టులు ఫ్రీగా చూడవచ్చు</p>
    {!isPending && !isError && rows.length === 0 && <ul className="space-y-2">{CATALOG[search.category].map(name => <li key={name} className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3"><div className="min-w-0"><p className="text-lg font-bold">{name}</p><p className="text-sm text-muted-foreground">వాహన రకం మాత్రమే; ఈ ఎంపికకు నమోదైన వాహనం లేదు · Category, not an available listing</p></div><VehicleDemandBell category={search.category} from={search.from} to={search.to} vehicle={name} /></li>)}</ul>}
    {rows.map(post => <PostCard key={post.id} post={post} meId={me?.id} />)}
  </div>;
}