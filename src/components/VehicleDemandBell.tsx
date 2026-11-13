import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BellPaymentNotice } from '@/components/BellPaymentNotice';
import type { VehiclePageKind } from '@/lib/vehicle-page';
export function VehicleDemandBell({ postId, category, from, to, vehicle }: { postId?: string; category?: VehiclePageKind; from?: string; to?: string; vehicle?: string }) {
 const nav=useNavigate(); const [consent,setConsent]=useState(false),[payment,setPayment]=useState(false),[busy,setBusy]=useState(false);
 async function open(){const {data}=await supabase.auth.getUser();if(!data.user){setPayment(true);return;}const result=await supabase.rpc('has_paid_bell',{_user:data.user.id});if(result.error){toast.error('మళ్లీ ప్రయత్నించండి');return;}if(!result.data){setPayment(true);return;}setConsent(true);}
 async function ring(){if(busy)return;setBusy(true);try{const {data,error}=await supabase.rpc('ring_vehicle_demand',{...(postId ? {_post:postId} : {_category:category ?? 'goods',_from:from ?? '',_to:to ?? '',_vehicle:vehicle ?? ''}),_name_consent:true});if(error){if(error.message.includes('PAID_BELL_REQUIRED'))setPayment(true);else toast.error(error.message.includes('PROFILE_NAME_REQUIRED')?'మీ వివరాల్లో పేరు నింపండి':error.message.includes('VEHICLE_ROUTE_REQUIRED')?'నుండి - వరకు నింపండి':'గంట నమోదు కాలేదు. మళ్లీ ప్రయత్నించండి');return;}setConsent(false);toast.success('కావాలి లిస్ట్‌లో మీ పేరు చేరింది');if(data&&postId)await nav({to:'/chat/$userId',params:{userId:data},search:{post:postId}});else await nav({to:'/vehicle-demands'});}finally{setBusy(false);}}
 return <><Button type="button" variant="outline" size="icon" className="shrink-0" aria-label="గంట · Bell" disabled={busy} onClick={()=>void open()}><Bell/></Button><Dialog open={consent} onOpenChange={setConsent}><DialogContent><DialogTitle>ఈ వెహికల్ కావాలి</DialogTitle><DialogDescription>కావాలి లిస్ట్‌లో మీ పేరు, నుండి - వరకు, ఏ వెహికల్ కావాలి, గంట కొట్టిన సమయం చెల్లించినవారికి కనిపిస్తాయి. మీ మొబైల్ నంబర్ కనిపించదు.</DialogDescription><Button className="h-auto whitespace-normal" disabled={busy} onClick={()=>void ring()}>నా పేరు చూపించడానికి అనుమతి ఉంది - గంట కొట్టండి</Button></DialogContent></Dialog><BellPaymentNotice open={payment} onOpenChange={setPayment}/></>;
}
