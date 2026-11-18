import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { BellPaymentNotice } from '@/components/BellPaymentNotice';
import type { VehiclePageKind } from '@/lib/vehicle-page';
import { ResponsibilityNotice } from '@/components/ResponsibilityNotice';
import { rememberAreaIfEmpty } from '@/lib/master-area';
import { enableBellAudio, playBell } from '@/lib/bell';
import { bellErrorMessage, requireCompleteProfile, retryBell } from '@/lib/bell-request';
export function VehicleDemandBell({ postId, category, from, to, vehicle }: { postId?: string; category?: VehiclePageKind; from?: string; to?: string; vehicle?: string }) {
 const nav=useNavigate(); const [consent,setConsent]=useState(false),[payment,setPayment]=useState(false),[busy,setBusy]=useState(false);
 async function open(){try{await requireCompleteProfile();setConsent(true);}catch(error){toast.error(bellErrorMessage(error));}}
 async function ring(){if(busy)return;enableBellAudio();setBusy(true);try{await requireCompleteProfile();await retryBell(()=>supabase.rpc('ring_vehicle_demand',{...(postId ? {_post:postId} : {_category:category ?? 'goods',_from:from ?? '',_to:to ?? '',_vehicle:vehicle ?? ''}),_name_consent:false}));playBell();setConsent(false);if(from)rememberAreaIfEmpty(from);await nav({to:'/bell-board',search:{section:category ?? 'goods'}});}catch(error){toast.error(bellErrorMessage(error));}finally{setBusy(false);}}
 return <><Button type="button" variant="outline" size="icon" className="shrink-0" aria-label="గంట · Bell" disabled={busy} onClick={()=>void open()}><Bell/></Button><Dialog open={consent} onOpenChange={setConsent}><DialogContent aria-describedby={undefined}><DialogTitle>ఈ వెహికల్ కావాలి</DialogTitle><ResponsibilityNotice prominent /><Button className="h-auto whitespace-normal" disabled={busy} onClick={()=>void ring()}><Bell />గంట కొట్టండి</Button></DialogContent></Dialog><BellPaymentNotice open={payment} onOpenChange={setPayment}/></>;
}
