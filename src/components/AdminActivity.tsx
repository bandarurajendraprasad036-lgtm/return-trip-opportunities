import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useMe } from '@/lib/session';
import { CallButtons } from '@/components/CallManager';
export type AdminActivityData = { bells: {post_id:string;count:number}[]; chats:{first_id:string;second_id:string;count:number;latest:string}[] };
export function useAdminActivity() {
 const {data:me}=useMe();
 return useQuery({queryKey:['admin-activity',me?.id],enabled:!!me?.isAdmin,refetchInterval:5000,queryFn:async()=>{
   const r=await supabase.rpc('admin_activity_overview');if(r.error)throw r.error;return r.data as AdminActivityData;
 }});
}
export function AdminActivity() {
 const {data:me}=useMe();const qc=useQueryClient();const {data,isError}=useAdminActivity();
 const {data:people=[]}=useQuery({queryKey:['admin-activity-people',me?.id],enabled:!!me?.isAdmin,queryFn:async()=>{const r=await supabase.from('profiles').select('id,full_name,phone,location').order('created_at');if(r.error)throw r.error;return r.data;}});
 useEffect(()=>{if(!me?.isAdmin)return;const timer=window.setInterval(()=>{void qc.invalidateQueries({queryKey:['admin-activity']});void qc.invalidateQueries({queryKey:['admin']});},5000);return()=>window.clearInterval(timer);},[me?.id,me?.isAdmin,qc]);
 const name=(id:string)=>people.find(p=>p.id===id)?.full_name || 'సభ్యుడు';
 return <section className="space-y-3 border-y py-4"><h2 className="text-xl font-bold">సభ్యుల సంభాషణ వివరాలు</h2>{isError&&<p role="alert">వివరాలు రాలేదు. మళ్లీ ప్రయత్నించండి</p>}
 {data?.chats.map(c=><article key={`${c.first_id}:${c.second_id}`} className="space-y-2 rounded-lg border p-3"><p translate="no" className="break-words font-bold">{name(c.first_id)} ↔ {name(c.second_id)}</p><p>{c.count} సందేశాలు</p><div className="flex flex-wrap gap-2">{[c.first_id,c.second_id].filter(id=>id!==me?.id).map(id=><Button key={id} asChild variant="outline" data-subscription-exempt className="h-auto whitespace-normal"><Link to="/admin" search={{view:'chat',peer:id}}><MessageCircle /><span translate="no">{name(id)}</span>తో మాట్లాడండి</Link></Button>)}</div></article>)}
 {!data?.chats.length&&!isError&&<p>ఇంకా సంభాషణలు లేవు</p>}
 <h3 className="text-xl font-bold">సభ్యుల వివరాలు · వారితో మాట్లాడండి</h3><div className="space-y-2">{people.filter(p=>p.id!==me?.id).map(p=><div key={p.id} className="space-y-2 border-b py-2"><Button asChild variant="outline" data-subscription-exempt className="h-auto min-h-12 w-full whitespace-normal"><Link to="/admin" search={{view:'chat',peer:p.id}}><MessageCircle /><span translate="no" className="text-left">{p.full_name||'సభ్యుడు'}<br/>ఫోన్: {p.phone||'—'}<br/>చిరునామా: {p.location||'—'}</span></Link></Button><CallButtons peer={p.id}/></div>)}</div>
 </section>;
}