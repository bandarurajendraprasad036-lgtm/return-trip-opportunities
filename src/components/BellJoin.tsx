import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog,DialogContent,DialogTitle,DialogDescription } from '@/components/ui/dialog';
import { useMe } from '@/lib/session';
import { GoogleSignIn } from '@/components/GoogleSignIn';
import { markAccountBellActivated } from '@/lib/bell-activation';
import { enablePush,pushDeviceId,deviceSound } from '@/lib/firebase-push';
import { registerPushDevice } from '@/lib/push.functions';
import { referralLink } from '@/lib/account-program';
import { supabase } from '@/integrations/supabase/client';
import { shareReferralWithImage } from '@/lib/share-referral';
import { markHomeBellRung } from '@/lib/home-bell';
type InstallEvent=Event&{prompt:()=>Promise<void>};
export function BellJoin({children}:{children?:React.ReactNode}) {
 const {data:me}=useMe();const qc=useQueryClient();const register=useServerFn(registerPushDevice);
 const [install,setInstall]=useState<InstallEvent|null>(null);const [installed,setInstalled]=useState(false);const [open,setOpen]=useState(false);const [touched,setTouched]=useState(false);
 useEffect(()=>{setInstalled(localStorage.getItem('gayatri-installed-confirmed')==='1'||matchMedia('(display-mode: standalone)').matches);setTouched(localStorage.getItem('gayatri-home-bell-touched')==='1');const h=(e:Event)=>{e.preventDefault();setInstall(e as InstallEvent);};const done=()=>{localStorage.setItem('gayatri-installed-confirmed','1');setInstalled(true);setInstall(null);};window.addEventListener('beforeinstallprompt',h);window.addEventListener('appinstalled',done);return()=>{window.removeEventListener('beforeinstallprompt',h);window.removeEventListener('appinstalled',done);};},[]);
 const joined=!!me&&(touched||installed||!!me.profile?.bell_activated_at);const code=me?.profile?.referral_code??'';
 const share=()=>{if(code)void shareReferralWithImage(`మీ రిఫరల్ కోడ్: ${code}\n${referralLink(code)}`);};
 const activate=async()=>{if(!me)return;try{const result=await enablePush();const saved=await supabase.from('notification_preferences').upsert({user_id:me.id,enabled:true});if(saved.error)throw saved.error;if(result.status==='registered'&&result.token)await register({data:{id:pushDeviceId(),token:result.token,sound:deviceSound()}});await markAccountBellActivated(me.id);await supabase.rpc('ensure_my_referral_code');await qc.invalidateQueries({queryKey:['me']});if(result.status!=='registered')toast.info('నోటిఫికేషన్ కోసం మీ ఫోన్ అనుమతి కావాలి');}catch{toast.error('నోటిఫికేషన్ ఆన్ కాలేదు. మళ్లీ గంట కొట్టండి');}};
 const click=async()=>{setOpen(true);if(!installed&&install){try{await install.prompt();}catch{toast.info('మీ బ్రౌజర్ లో డౌన్లోడ్ ఎంచుకోండి');}setInstall(null);}markHomeBellRung();setTouched(true);if(me)void activate();};
 return <><Button type="button" variant="ghost" onClick={()=>void click()} aria-label="గంట కొట్టండి · Ring the bell" className={children?'home-temple-trigger':'home-bell mx-auto grid size-20 place-items-center text-gold'}>{children??<Bell className="size-16"/>}</Button><p className="text-center text-2xl font-extrabold text-gold">ఏది కావాలన్నా గంట కొట్టు</p><p className="text-center text-lg font-bold">గంట కొట్టండి - నోటిఫికేషన్ ఆన్ అవుతుంది</p>
 {!installed&&<Button variant="ghost" className="unfinished-action w-full whitespace-normal" onClick={()=>void click()}>⬇️ డౌన్లోడ్ చేయండి - గంట కొట్టండి</Button>}
 <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85svh] overflow-y-auto"><DialogTitle>{joined?'🎉 మీరు ఆల్రెడీ జాయిన్ అయ్యారు!':'డౌన్లోడ్ / Install'}</DialogTitle><DialogDescription asChild><div className="space-y-3 text-lg">{joined?<><p>ఇప్పుడు మీ వంతు!</p><p>మీ ద్వారా మరి కొంతమందిని జాయిన్ చేయండి!</p><p>మీ రిఫరల్ కోడ్ ద్వారా మరి కొంతమందిని జాయిన్ చేయండి!</p></>:<p>డౌన్లోడ్ / Install ఎంచుకోండి. మీ ఫోన్ అనుమతిస్తే గాయత్రి వన్ ఐకాన్ వస్తుంది.</p>}</div></DialogDescription>
 {joined?<><p className="text-xl font-bold">మీ రిఫరల్ కోడ్: <span translate="no">{code||'వస్తుంది'}</span></p><Button disabled={!code} onClick={async()=>{if(!code)return;try{await navigator.clipboard.writeText(`${code}\n${referralLink(code)}`);toast.success('కాపీ చేశాం');}catch{share();}}}>📲 రిఫరల్ కోడ్ షేర్ చేయండి</Button><Button disabled={!code} variant="outline" onClick={share}>వాట్సాప్ లో షేర్ చేయండి</Button></>:<>{install&&<Button onClick={async()=>{await install.prompt();setInstall(null);}}>డౌన్లోడ్ / Install</Button>}{!install&&!installed&&<p>బ్రౌజర్ మూడు చుక్కల దగ్గర డౌన్లోడ్ / Install ఎంచుకోండి. ఈ ఎంపిక మీ ఫోన్ లో అందుబాటులో ఉంటేనే డౌన్లోడ్ అవుతుంది.</p>}{!me&&<GoogleSignIn/>}<Button asChild variant="outline"><Link to="/dashboard" hash="account-profile" onClick={()=>setOpen(false)}>ప్రొఫైల్ (మీ వివరాలు) నింపండి</Link></Button></>}
 </DialogContent></Dialog></>;
}
