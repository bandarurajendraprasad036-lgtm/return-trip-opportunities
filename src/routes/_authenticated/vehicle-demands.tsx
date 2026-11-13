import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { fetchVehicleDemands } from '@/lib/vehicle-demand.functions';
import { VEHICLE_DEMAND_SECTIONS, VEHICLE_DEMAND_TITLE } from '@/lib/vehicle-demand';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { vehicleTypeLabel } from '@/lib/vehicle-types';
const options=queryOptions({queryKey:['vehicle-demands'],queryFn:()=>fetchVehicleDemands(),staleTime:0,refetchInterval:15000});
export const Route=createFileRoute('/_authenticated/vehicle-demands')({
 loader:({context})=>context.queryClient.ensureQueryData(options),
 head:()=>({meta:[{title:`${VEHICLE_DEMAND_TITLE} — గాయత్రి వన్`},{name:'description',content:'గంట కొట్టిన వారి వాహన అవసరాలు, మార్గాలు, వ్యక్తిగత చాట్.'},{property:'og:title',content:`${VEHICLE_DEMAND_TITLE} — గాయత్రి వన్`},{property:'og:description',content:'చెల్లించినవారి కోసం వాహనాలు కావాలి జాబితా.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),
 component:DemandPage,errorComponent:DemandError,notFoundComponent:()=> <p className="p-4">జాబితా కనిపించలేదు</p>,
});
function DemandError(){const router=useRouter();return <div className="p-4"><Button onClick={()=>void router.invalidate()}>మళ్లీ ప్రయత్నించండి</Button></div>;}
function DemandPage(){const {data}=useSuspenseQuery(options);const nav=useNavigate();const [busy,setBusy]=useState<string|null>(null);
 async function chat(id:string){if(busy)return;setBusy(id);try{const result=await supabase.rpc('open_vehicle_demand_chat',{_demand:id});if(result.error||!result.data){toast.error('చాట్ తెరుచుకోలేదు');return;}await nav({to:'/chat/$userId',params:{userId:result.data},search:{post:undefined}});}finally{setBusy(null);}}
 return <div className="space-y-6 p-4"><h1 className="break-words text-2xl font-bold">{VEHICLE_DEMAND_TITLE}</h1>{!data.paid?<div className="space-y-3"><p>అమౌంట్ కట్టినవాళ్లకు మాత్రమే ఈ డిస్ప్లే ఆప్షన్</p><Button asChild><Link to="/dashboard">₹100 చెల్లింపు</Link></Button></div>:Object.entries(VEHICLE_DEMAND_SECTIONS).map(([category,title])=>{const rows=data.rows.filter(row=>row.category===category);return <section key={category} className="space-y-3"><h2 className="border-b pb-2 text-xl font-bold">{title}</h2>{!rows.length&&<p className="text-muted-foreground">ఇంకా ఎవరూ గంట కొట్టలేదు</p>}{rows.map(row=><article key={row.id} className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3"><div className="min-w-0 space-y-1"><p translate="no" className="break-words text-lg font-bold">{row.display_name}</p><p translate="no" className="break-words">{row.from_place} → {row.to_place}</p><p translate="no" className="break-words">{vehicleTypeLabel(row.vehicle_type)} కావాలి</p><time dateTime={row.rang_at} className="text-sm text-muted-foreground">{new Date(row.rang_at).toLocaleString('te-IN',{timeZone:'Asia/Kolkata'})}</time></div><Button variant="outline" size="icon" className="shrink-0" aria-label="చాట్" disabled={busy!==null} onClick={()=>void chat(row.id)}><MessageCircle/></Button></article>)}</section>;})}</div>;
}
