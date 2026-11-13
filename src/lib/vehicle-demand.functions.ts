import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
export const fetchVehicleDemands=createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 const access=await context.supabase.rpc('has_paid_bell',{_user:context.userId});if(access.error)throw new Error('మళ్లీ ప్రయత్నించండి');if(!access.data)return {paid:false,rows:[]};
 const result=await context.supabase.rpc('list_vehicle_bell_demands');if(result.error)throw new Error('జాబితా రాలేదు. మళ్లీ ప్రయత్నించండి');return {paid:true,rows:result.data};
});
