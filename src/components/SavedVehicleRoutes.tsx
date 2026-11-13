import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { IndiaPlaceInput } from '@/components/IndiaPlaceInput';
import { BilingualLabel } from '@/components/BilingualLabel';
import { ROUTE_VEHICLES, ROUTE_TONNES, validDetailedRoute } from '@/lib/november-profile';
export function SavedVehicleRoutes() {
 const {data:me}=useMe(); const qc=useQueryClient();
 const [from,setFrom]=useState('');const [to,setTo]=useState('');const [vehicle,setVehicle]=useState('Mini Truck');const [tons,setTons]=useState(3);const [busy,setBusy]=useState(false);
 const {data:routes=[],isError}=useQuery({queryKey:['saved-vehicle-routes',me?.id],enabled:!!me,queryFn:async()=>{if(!me)return [];const r=await supabase.from('vehicle_route_preferences').select('id,from_place,to_place,vehicle_type,capacity_tons').eq('user_id',me.id).order('created_at');if(r.error)throw r.error;return r.data;}});
 if(!me)return null;
 return <section className="profile-route-panel space-y-4 border-y px-3 py-5">
 <h2><BilingualLabel te="మీకు ఏ రూట్లో గూడ్స్ వెహికల్స్ అవసరం?" en="Which Route Do You Need Goods Vehicle?"/></h2>
 <div className="space-y-3 border-l-2 border-primary pl-3"><p>మా దగ్గర రిటర్న్ గూడ్స్ వెహికల్స్ మాత్రమే లభిస్తాయి. కొత్త బండి కాదు, తిరిగి వచ్చే ఖాళీ బండి మాత్రమే.</p><p>రిటర్న్ బండి కాబట్టి ధర తక్కువ ఉండవచ్చు. 60% నుండి 70% తగ్గింపు హామీ కాదు; బండి యజమానితో ధర మాట్లాడుకోండి.</p><p>మీకు ఎన్ని రూట్లు కావాలంటే అన్ని రూట్లు జోడించండి. ప్రతి రూట్లో ఏ బండి కావాలో, ఎన్ని టన్నులు కావాలో కూడా రాయండి.</p><p>మీరు జోడించిన రూట్లో మాత్రమే రిటర్న్ బండి ఉంటే మీకు నోటిఫికేషన్ వస్తుంది. వేరే రూట్లో బండి ఉన్నా మీకు నోటిఫికేషన్ రాదు.</p></div>
 <form className="space-y-3" onSubmit={async e=>{e.preventDefault();if(busy||!validDetailedRoute(from,to,vehicle,tons))return;setBusy(true);const r=await supabase.rpc('save_detailed_vehicle_route',{_from:from.trim(),_to:to.trim(),_vehicle:vehicle,_tons:tons});setBusy(false);if(r.error){toast.error('రూట్ జోడించలేదు');return;}setFrom('');setTo('');await qc.invalidateQueries({queryKey:['saved-vehicle-routes',me.id]});toast.success('ఈ రూట్ జోడించాం');}}>
 <label htmlFor="saved-route-from"><BilingualLabel te="ఎక్కడ నుండి?" en="From?"/></label><IndiaPlaceInput id="saved-route-from" value={from} onChange={setFrom} disabled={busy} placeholder="ఉదాహరణ: మంచిర్యాల"/>
 <label htmlFor="saved-route-to"><BilingualLabel te="ఎక్కడి వరకు?" en="To?"/></label><IndiaPlaceInput id="saved-route-to" value={to} onChange={setTo} disabled={busy} placeholder="ఉదాహరణ: హైదరాబాద్"/>
 <label htmlFor="saved-route-vehicle"><BilingualLabel te="ఏ బండి కావాలి?" en="Which Vehicle?"/></label><select id="saved-route-vehicle" value={vehicle} onChange={e=>setVehicle(e.target.value)} className="h-12 w-full rounded-md border bg-card px-3">{ROUTE_VEHICLES.map(v=><option key={v}>{v}</option>)}</select>
 <label htmlFor="saved-route-tons"><BilingualLabel te="ఎన్ని టన్నులు?" en="How Many Tonnes?"/></label><select id="saved-route-tons" value={tons} onChange={e=>setTons(Number(e.target.value))} className="h-12 w-full rounded-md border bg-card px-3">{ROUTE_TONNES.map(t=><option key={t} value={t}>{t} {t===1?'టన్ను':'టన్నులు'}</option>)}</select>
 <Button type="submit" className="w-full min-h-12 whitespace-normal" disabled={busy||!validDetailedRoute(from,to,vehicle,tons)}>ఈ రూట్ ని జోడించండి / Add This Route</Button></form>
 {isError&&<p role="alert">రూట్లు రాలేదు</p>}{routes.map(r=><div key={r.id} className="flex items-center justify-between gap-2 border-b py-3"><p translate="no" className="min-w-0 break-words">{r.from_place} → {r.to_place}{r.vehicle_type&&` | ${r.vehicle_type}`}{r.capacity_tons&&` - ${r.capacity_tons} టన్నులు`}</p><Button variant="ghost" size="icon" aria-label="రూట్ తొలగించండి" disabled={busy} onClick={async()=>{setBusy(true);const result=await supabase.from('vehicle_route_preferences').delete().eq('id',r.id).eq('user_id',me.id);setBusy(false);if(result.error)toast.error('తొలగించలేదు');else await qc.invalidateQueries({queryKey:['saved-vehicle-routes',me.id]});}}><Trash2/></Button></div>)}
 <p className="text-sm">ఇది బుకింగ్ కాదు, కేవలం సమాచారం మాత్రమే. మీ రూట్లో రిటర్న్ బండి ఉంటే మేము చూపిస్తాం.</p></section>;
}
