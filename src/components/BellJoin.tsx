import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/session";
import { GoogleSignIn } from "@/components/GoogleSignIn";
import { enableBellAudio, playBell } from '@/lib/bell';
import { Input } from '@/components/ui/input';
import { hasValidMobile } from '@/lib/phone';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ProfileRequest } from '@/components/ProfileRequest';
import { markAccountBellActivated } from '@/lib/bell-activation';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { enablePush, pushDeviceId, deviceSound } from '@/lib/firebase-push';
import { registerPushDevice } from '@/lib/push.functions';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { homeActionPending, usePrime99 } from '@/lib/prime99';
import { BellPaymentNotice } from '@/components/BellPaymentNotice';

export function BellJoin({ children }: { children?: React.ReactNode }) {
  const { data: me } = useMe();
  const { data: prime } = usePrime99(me?.id);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const register = useServerFn(registerPushDevice);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobile, setMobile] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const activate = async () => {
    if (!me) return;
    const registration = enablePush(); setBusy(true);
    try {
      const saved = await supabase.from('notification_preferences').upsert({ user_id: me.id, enabled: true }); if (saved.error) throw saved.error;
      await markAccountBellActivated(me.id);
      const code = await supabase.rpc('ensure_my_referral_code'); if (code.error) throw code.error;
      const result = await registration;
      if (result.status === 'registered' && result.token) await register({ data: { id: pushDeviceId(), token: result.token, sound: deviceSound() } });
      else toast.info('గంట ఎంపిక నమోదైంది; ఫోన్ సూచనలకు పరికర అనుమతి అవసరం.');
      await queryClient.invalidateQueries({ queryKey: ['me'] }); setProfileOpen(false); await navigate({ to: '/dashboard', hash: 'account-profile' });
    } catch { toast.error('సూచనలు ప్రారంభించలేకపోయాం; మళ్లీ ప్రయత్నించండి.'); } finally { setBusy(false); }
  };
  return <>
    <Button type="button" variant="ghost" disabled={busy} data-touched={touched} onClick={() => setProfileOpen(true)} aria-label="గంట కొట్టండి · Ring the bell" className={`${children ? 'home-temple-trigger' : 'home-bell relative z-10 mx-auto -mt-2 grid size-20 place-items-center rounded-none border-0 bg-transparent p-2 text-gold shadow-none ring-0 hover:bg-transparent active:scale-95'} ${homeActionPending('bell', Boolean(touched || me?.profile?.bell_activated_at)) ? 'unfinished-action' : ''}`}>{children || <Bell className="size-16!" fill="currentColor" strokeWidth={1.5} />}</Button>
    <ProfileRequest home open={profileOpen} onOpenChange={setProfileOpen} showProfileLink={Boolean(me)}>
      {!me && <><GoogleSignIn /><Button asChild variant="outline"><Link to="/feed">ప్రకటనలు చూడండి · Browse</Link></Button></>}
    </ProfileRequest>
    <Dialog open={mobileOpen} onOpenChange={setMobileOpen}><DialogContent><DialogTitle>మీ మొబైల్ నంబరు · Your mobile</DialogTitle><DialogDescription>మీ ఖాతాలో మాత్రమే భద్రపరుస్తాం; బయట చూపించం. సంఖ్య ఇవ్వడం ఫోన్ ధృవీకరణ కాదు.</DialogDescription><Input aria-label="మీ మొబైల్ నంబరు" inputMode="numeric" maxLength={10} value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} /><Button disabled={busy || !hasValidMobile(mobile)} onClick={async () => { if (!me) return; setBusy(true); const r = await supabase.from('profiles').update({ phone: mobile }).eq('id', me.id); setBusy(false); if (r.error) { toast.error('నంబరు భద్రపడలేదు'); return; } await queryClient.invalidateQueries({ queryKey: ['me'] }); setMobileOpen(false); toast.success('నంబరు భద్రపడింది; ప్రధాన గంటను నొక్కి ఫోన్ సూచనలు అనుమతించండి'); }}>కొనసాగించండి · Continue</Button></DialogContent></Dialog>
    <p className="mt-1 text-center text-lg font-bold">ఏది కావాలన్నా గంట కొట్టు</p>
    <BellPaymentNotice open={paymentOpen} onOpenChange={setPaymentOpen} />
  </>;
}
