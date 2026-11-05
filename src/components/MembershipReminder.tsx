import { useEffect,useState } from 'react';
import { Link,useRouterState } from '@tanstack/react-router';
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { indianDay } from '@/lib/daily-devotional';
import { MEMBERSHIP_AMOUNT, GROUP_MEMBERSHIP_AMOUNT } from '@/lib/membership';
export function MembershipReminder({ userId,prime }: {userId:string;prime:boolean}) {
  const [open,setOpen]=useState(false);
  const path=useRouterState({select:s=>s.location.pathname});
  useEffect(()=>{
    if(prime || !['/','/feed'].includes(path))return;
    const key=`gayatri-membership-reminder-${userId}`;const day=indianDay(new Date());
    try{if(localStorage.getItem(key)===day)return;}catch{/* Optional. */}
    const timer=setTimeout(()=>{try{localStorage.setItem(key,day);}catch{/* Optional. */}setOpen(true);},12000);
    return()=>clearTimeout(timer);
  },[userId,prime,path]);
  if(prime)return null;
  return <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-sm"><DialogHeader><DialogTitle>అన్నా… గాయత్రి వన్‌కు తోడుగా ఉంటారా? · Support Gayatri One</DialogTitle><DialogDescription>మీకు ఉపయోగపడితే ఒక్కరికి నెలకు ₹{MEMBERSHIP_AMOUNT}, నలుగురికి నెలకు ₹{GROUP_MEMBERSHIP_AMOUNT} సభ్యత్వంతో మాకు తోడుగా ఉండండి 🙏 మీ ఇష్టం; తరువాత కూడా తీసుకోవచ్చు. — ప్రసాద్ అన్న · Optional monthly membership: individual ₹{MEMBERSHIP_AMOUNT}, four people ₹{GROUP_MEMBERSHIP_AMOUNT}.</DialogDescription></DialogHeader><Button asChild onClick={()=>setOpen(false)}><Link to="/dashboard">సభ్యత్వ వివరాలు · Membership</Link></Button><Button variant="outline" onClick={()=>setOpen(false)}>తరువాత · Later</Button></DialogContent></Dialog>;
}