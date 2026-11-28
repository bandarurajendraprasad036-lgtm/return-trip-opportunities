import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, LayoutDashboard } from 'lucide-react';
import { InstallButton } from '@/components/AppHelpers';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog,DialogContent,DialogTitle,DialogDescription } from '@/components/ui/dialog';
import { useMe } from '@/lib/session';
import { GoogleSignIn } from '@/components/GoogleSignIn';
import { markAccountBellActivated } from '@/lib/bell-activation';
import { enablePush,pushDeviceId,deviceSound } from '@/lib/firebase-push';
import { registerPushDevice } from '@/lib/push-client';
import { referralLink } from '@/lib/account-program';
import { supabase } from '@/integrations/supabase/client';
import { shareReferralWithImage } from '@/lib/share-referral';
import { markHomeBellRung } from '@/lib/home-bell';
import { requestBrowserPermission, shouldShowDeniedNotice, rememberBellStatus, BELL_STATUS_TOAST } from '@/lib/browser-notifications';
import { bellErrorMessage, requireCompleteProfile, retryBell } from '@/lib/bell-request';
import { playTapBell } from '@/lib/bell';
import { PROFILE_ACCESS_MESSAGE } from '@/lib/profile-access';
type InstallEvent=Event&{prompt:()=>Promise<void>};
export function BellJoin({children}:{children?:React.ReactNode}) {
 const {data:me,isPending,isError,refetch}=useMe();const qc=useQueryClient();const register=registerPushDevice;
 const [install,setInstall]=useState<InstallEvent|null>(null);const [installed,setInstalled]=useState(false);const [open,setOpen]=useState(false);const [touched,setTouched]=useState(false);
 const activating=useRef(false);
 useEffect(()=>{setInstalled(localStorage.getItem('gayatri-installed-confirmed')==='1'||matchMedia('(display-mode: standalone)').matches);setTouched(localStorage.getItem('gayatri-home-bell-touched')==='1');const h=(e:Event)=>{e.preventDefault();setInstall(e as InstallEvent);};const done=()=>{localStorage.setItem('gayatri-installed-confirmed','1');setInstalled(true);setInstall(null);};window.addEventListener('beforeinstallprompt',h);window.addEventListener('appinstalled',done);return()=>{window.removeEventListener('beforeinstallprompt',h);window.removeEventListener('appinstalled',done);};},[]);
 useEffect(()=>{if(me&&window.location.hash==='#bell-referral'){setOpen(true);markHomeBellRung();setTouched(true);window.history.replaceState(window.history.state,'',window.location.pathname+window.location.search);}},[me]);
 const joined=!!me;const code=me?.profile?.referral_code??'';
 const share=()=>{if(code)void shareReferralWithImage(`మీ రిఫరల్ కోడ్: ${code}\n${referralLink(code)}`);};
 const activate=async()=>{if(!me||activating.current)return;activating.current=true;try{const permission=await requestBrowserPermission();if(permission==='denied'){if(shouldShowDeniedNotice())toast.info('మీ బ్రౌజర్ సెట్టింగ్స్ లో నోటిఫికేషన్ ఆన్ చేయండి',{id:BELL_STATUS_TOAST});return;}if(permission!=='granted')return;
  // Granted permission owns the single visible status; background registration problems never replace it.
  rememberBellStatus('granted');toast.success('నోటిఫికేషన్ ఆన్ అయింది',{id:BELL_STATUS_TOAST});
  try{const result=await enablePush();const saved=await supabase.from('notification_preferences').upsert({user_id:me.id,enabled:true});if(saved.error)throw saved.error;if(result.status==='registered'&&result.token)await register({data:{id:pushDeviceId(),token:result.token,sound:deviceSound()}});await markAccountBellActivated(me.id);await supabase.rpc('ensure_my_referral_code');await qc.invalidateQueries({queryKey:['me']});}catch(e){console.warn('bell background registration incomplete',e);}
 }finally{activating.current=false;}};
 const click=async()=>{markHomeBellRung();setTouched(true);playTapBell();setOpen(true);if(!installed&&install){try{await install.prompt();}catch{toast.info('మీ బ్రౌజర్ లో డౌన్లోడ్ ఎంచుకోండి');}setInstall(null);}if(me){try{await requireCompleteProfile();void activate();await retryBell(()=>supabase.rpc('ring_my_main_bell'));}catch(error){toast.error(bellErrorMessage(error));}}};
 return <><Button type="button" variant="ghost" onClick={()=>void click()} aria-label="గంట కొట్టండి · Ring the bell" className={children?'home-temple-trigger':'home-bell mx-auto grid size-20 place-items-center text-gold'}>{children??<Bell className="size-16"/>}</Button><p className="text-center text-2xl font-extrabold text-gold">ఏది కావాలన్నా గంట కొట్టు</p><p className="text-center text-lg font-bold">గంట కొట్టండి - నోటిఫికేషన్ ఆన్ అవుతుంది</p><p className="text-center text-base">{PROFILE_ACCESS_MESSAGE}</p>
 <div className="home-action-row" aria-label="గంట కింద ఎంపికలు">
 <Button variant="outline" className={`home-action ${touched ? '' : 'homeRow-reminder'}`} onClick={()=>void click()}><Bell className="size-5" /><span>గంట కొట్టండి</span></Button>
 <InstallButton homeRow remind />
 <Button asChild variant="outline" className="home-action"><Link to="/dashboard"><LayoutDashboard className="size-5" /><span>నా పేజీ తెరవండి</span></Link></Button>
 </div>
 <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85svh] overflow-y-auto"><DialogTitle>{joined?'🎉 మీరు ఆల్రెడీ జాయిన్ అయ్యారు!':isPending?'మీ ఖాతా చూస్తున్నాం…':isError?'మీ ఖాతా కనిపించలేదు':'డౌన్లోడ్ / Install'}</DialogTitle><DialogDescription asChild><div className="space-y-3 text-lg">{joined?<><p>ఇప్పుడు మీ వంతు!</p><p>మీ ద్వారా మరి కొంతమందిని జాయిన్ చేయండి!</p><p>మీ రిఫరల్ కోడ్ ద్వారా మరి కొంతమందిని జాయిన్ చేయండి!</p></>:isPending?<p>కొద్దిసేపు ఆగండి…</p>:isError?<p>మళ్లీ మీ ఖాతా చూడండి.</p>:<p>డౌన్లోడ్ / Install ఎంచుకోండి. మీ ఫోన్ అనుమతిస్తే గాయత్రి వన్ ఐకాన్ వస్తుంది.</p>}</div></DialogDescription>
 {joined?<><p className="text-xl font-bold">మీ రిఫరల్ కోడ్: <span translate="no">{code||'వస్తుంది'}</span></p><Button disabled={!code} onClick={async()=>{if(!code)return;try{await navigator.clipboard.writeText(`${code}\n${referralLink(code)}`);toast.success('కాపీ చేశాం');}catch{share();}}}>📲 రిఫరల్ కోడ్ షేర్ చేయండి</Button><Button disabled={!code} variant="outline" onClick={share}>వాట్సాప్ లో షేర్ చేయండి</Button></>:isPending?null:isError?<Button onClick={()=>void refetch()}>మళ్లీ చూడండి</Button>:<>{install&&<Button onClick={async()=>{await install.prompt();setInstall(null);}}>డౌన్లోడ్ / Install</Button>}{!install&&!installed&&<p>బ్రౌజర్ మూడు చుక్కల దగ్గర డౌన్లోడ్ / Install ఎంచుకోండి. ఈ ఎంపిక మీ ఫోన్ లో అందుబాటులో ఉంటేనే డౌన్లోడ్ అవుతుంది.</p>}<GoogleSignIn returnTo="/#bell-referral"/><Button asChild variant="outline"><Link to="/dashboard" hash="account-profile" onClick={()=>setOpen(false)}>ప్రొఫైల్ (మీ వివరాలు) నింపండి</Link></Button></>}
 </DialogContent></Dialog></>;
}
