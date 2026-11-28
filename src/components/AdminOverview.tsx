import { useState } from 'react';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { RefreshCw, Users, Truck, IndianRupee, Clock, Phone } from 'lucide-react';
import { loadAdminOverview } from '@/lib/admin-overview-client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AdminAccountActions } from './AdminAccountActions';

export const adminOverviewQuery = queryOptions({ queryKey: ['admin-overview'], queryFn: loadAdminOverview, refetchInterval: 15000, staleTime: 10000 });
const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const date = (value: string) => new Date(value).toLocaleString('te-IN', { timeZone: 'Asia/Kolkata' });

export function AdminOverview() {
  const { data, refetch, isFetching, isRefetchError } = useSuspenseQuery(adminOverviewQuery);
  const [memberLimit, setMemberLimit] = useState(20);
  const [vehicleLimit, setVehicleLimit] = useState(20);
  const [peopleLimit, setPeopleLimit] = useState(20);
  const stats = [
    { label: 'నిర్ధారించిన చందా ఆదాయం', value: money(data.revenue), icon: IndianRupee },
    { label: '₹100 చెల్లించినవారు', value: data.paid100, icon: Users },
    { label: 'ప్రస్తుతం చందా ఉన్నవారు', value: data.active, icon: Users },
    { label: '₹100 పరిశీలనలో ఉన్నవారు', value: data.pending100, icon: Clock },
  ];
  return <section aria-label="నిర్వాహకుల పూర్తి వివరాలు" className="space-y-5 border-b pb-5">
    <div className="flex items-start justify-between gap-3"><div><h2 className="text-2xl font-bold">నిజమైన నమోదుల వివరాలు</h2><p className="text-sm text-muted-foreground">చివరిగా చూసిన సమయం: <span translate="no">{date(data.loadedAt)}</span></p></div><Button variant="outline" size="icon" aria-label="తాజా వివరాలు చూడండి" title="తాజా వివరాలు చూడండి" disabled={isFetching} onClick={() => void refetch()}><RefreshCw className={isFetching ? 'animate-spin' : ''}/></Button></div>
    {isRefetchError && <p role="alert">తాజా వివరాలు రాలేదు; చివరిగా వచ్చిన వివరాలు చూపిస్తున్నాము.</p>}
    <div className="grid grid-cols-2 gap-3">{stats.map(s => <article key={s.label} className="min-w-0 rounded-lg border p-3"><s.icon className="mb-2 size-5 text-primary"/><p translate="no" className="break-words text-2xl font-bold text-primary">{s.value}</p><h3 className="mt-1 text-base font-semibold">{s.label}</h3></article>)}</div>
    <p className="text-sm text-muted-foreground">ఆదాయం: ఆమోదించిన చందా చెల్లింపులు మాత్రమే. వాహన ప్రయాణ ఛార్జీలు కాదు.</p>
    <Tabs defaultValue="subscriptions">
      <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-background"><TabsTrigger className="min-h-11 whitespace-normal" value="subscriptions">₹100 చందా వివరాలు</TabsTrigger><TabsTrigger className="min-h-11 whitespace-normal" value="vehicles">వాహనాలు / డ్రైవర్లు</TabsTrigger><TabsTrigger className="min-h-11 whitespace-normal" value="customers">వినియోగదారులు</TabsTrigger></TabsList>
      <TabsContent value="subscriptions" className="space-y-3 pt-3"><h3 className="text-xl font-bold">₹100 చెల్లింపు, ప్రస్తుత చందా</h3><p>చెల్లింపు నిర్ధారణ లేనివారిని చెల్లించినట్లు చూపించము. ఉచిత / నిర్వాహక అనుమతి చందా వేరుగా కనిపిస్తుంది.</p>
        {data.members.length === 0 && <p>ఇంకా వినియోగదారుల నమోదులు లేవు.</p>}
        {data.members.slice(0, memberLimit).map(p => <article key={p.id} className="space-y-2 rounded-lg border p-3"><h4 translate="no" className="break-words text-lg font-bold">{p.full_name || 'పేరు నమోదు కాలేదు'}</h4><dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2"><dt>ఫోన్</dt><dd translate="no" className="break-all">{p.phone || 'నమోదు కాలేదు'}{p.phone && <Button asChild variant="outline" size="icon" className="ml-2" aria-label="నంబర్‌కు ఫోన్ చేయండి"><a href={`tel:${p.phone}`}><Phone /></a></Button>}</dd><dt>ఊరు / వాడ</dt><dd translate="no" className="break-words">{p.location || 'నమోదు కాలేదు'}</dd><dt>వర్గం</dt><dd translate="no" className="break-words">{p.member_kind === 'owner' ? 'వాహన యజమాని' : p.member_kind === 'business' ? 'వ్యాపారం' : p.member_kind === 'service' ? 'సేవలు' : p.member_kind ? 'పని / ఉద్యోగం' : 'నమోదు కాలేదు'}{p.category && ` · ${p.category}`}</dd><dt>వృత్తి</dt><dd translate="no">{p.occupation || 'నమోదు కాలేదు'}</dd><dt>₹100 చెల్లింపు</dt><dd className="font-semibold text-primary">{p.paid ? 'చెల్లింపు ఆమోదించారు' : p.pending ? 'పరిశీలనలో ఉంది' : p.rejected ? 'ఆమోదించలేదు' : 'నిర్ధారించిన చెల్లింపు లేదు'}</dd><dt>ప్రస్తుత చందా</dt><dd>{p.active ? p.paid ? 'చందా పొందారు' : 'అనుమతితో ఉంది' : 'లేదు / ముగిసింది'}</dd><dt>మిగిలిన రోజులు</dt><dd translate="no">{p.daysRemaining}</dd>{p.expires && <><dt>ముగింపు</dt><dd translate="no">{date(p.expires)}</dd></>}</dl><AdminAccountActions user={p.id} name={p.full_name} /></article>)}
        {memberLimit < data.members.length && <Button variant="outline" onClick={() => setMemberLimit(n => n + 20)}>మరిన్ని వివరాలు</Button>}
      </TabsContent>
      <TabsContent value="vehicles" className="space-y-3 pt-3"><h3 className="text-xl font-bold">నమోదైన వాహనాలు <span translate="no">({data.vehicles.length})</span></h3><p>ప్రకటనలో ఇచ్చిన వివరాలు మాత్రమే. డ్రైవర్ ఇప్పుడు పనిలో ఉన్నారా అనే నిజమైన నమోదు లేదు.</p>{!data.vehicles.length && <p>వాహన ప్రకటనలు లేవు.</p>}{data.vehicles.slice(0, vehicleLimit).map(v => <article key={v.id} className="space-y-2 rounded-lg border p-3"><h4 translate="no" className="flex items-start gap-2 break-words text-lg font-bold"><Truck className="mt-1 size-5 shrink-0 text-primary"/>{v.vehicle_name || v.vehicle_type || 'వాహనం పేరు నమోదు కాలేదు'}</h4><dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">{[['రకం', v.vehicle_type], ['వాహన నంబరు', v.vehicle_number], ['డ్రైవర్ పేరు', v.driver_name], ['ప్రకటన ఫోన్', v.contact_phone], ['నుండి', v.from_place], ['వరకు', v.to_place]].map(([label, value]) => <div key={label} className="contents"><dt>{label}</dt><dd translate="no" className="break-words">{value || 'నమోదు కాలేదు'}</dd></div>)}<dt>ప్రకటన స్థితి</dt><dd>{v.status === 'active' ? 'అందుబాటులో ఉంది' : v.status === 'closed' ? 'ముగిసింది' : 'ఇతర స్థితి'}</dd></dl></article>)}{vehicleLimit < data.vehicles.length && <Button variant="outline" onClick={() => setVehicleLimit(n => n + 20)}>మరిన్ని వాహనాలు</Button>}</TabsContent>
      <TabsContent value="customers" className="space-y-3 pt-3"><h3 className="text-xl font-bold">వినియోగదారులు <span translate="no">({data.members.length})</span></h3><p>వారు ఇచ్చిన నంబర్‌కు ఫోన్ చేసి అది వారిదేనా చూడండి. నంబర్ ఇవ్వడం మాత్రమే నిర్ధారణ కాదు.</p>{data.members.slice(0, peopleLimit).map(p => <article key={p.id} translate="no" className="space-y-1 rounded-lg border p-3"><h4 className="break-words text-lg font-bold">{p.full_name || 'పేరు నమోదు కాలేదు'}</h4><p className="break-all">{p.phone || 'ఫోన్ నమోదు కాలేదు'}{p.phone && <Button asChild variant="outline" size="icon" className="ml-2" aria-label="నంబర్‌కు ఫోన్ చేయండి"><a href={`tel:${p.phone}`}><Phone /></a></Button>}</p><p className="break-words">{p.location || 'ఊరు నమోదు కాలేదు'}</p><AdminAccountActions user={p.id} name={p.full_name} /></article>)}{peopleLimit < data.members.length && <Button variant="outline" onClick={() => setPeopleLimit(n => n + 20)}>మరిన్ని వినియోగదారులు</Button>}</TabsContent>
    </Tabs>
  </section>;
}