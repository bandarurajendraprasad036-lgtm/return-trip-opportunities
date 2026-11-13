import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
export const fetchVehicleDemands=createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 const access=await context.supabase.rpc('has_paid_bell',{_user:context.userId});if(access.error)throw new Error('మళ్లీ ప్రయత్నించండి');if(!access.data)return {paid:false,rows:[]};
 const rows=[];for(const category of ['goods','returns','cars']){const result=await context.supabase.rpc('list_anonymous_bell_board',{_section:category});if(result.error)throw new Error('జాబితా రాలేదు. మళ్లీ ప్రయత్నించండి');rows.push(...result.data.map(row=>({...row,category})));}return {paid:true,rows};
});
