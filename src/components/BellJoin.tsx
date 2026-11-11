import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Briefcase, Truck, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/session";
import { GoogleSignIn } from "@/components/GoogleSignIn";
import { enableBellAudio, playBell } from '@/lib/bell';
import { BellPhoneRequest } from '@/components/BellPhoneRequest';
import { ProfileRequest } from '@/components/ProfileRequest';
import { markAccountBellActivated } from '@/lib/bell-activation';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { enablePush, pushDeviceId, deviceSound } from '@/lib/firebase-push';
import { registerPushDevice } from '@/lib/push.functions';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { homeActionPending, usePrime99 } from '@/lib/prime99';

export function BellJoin({ children }: { children?: React.ReactNode }) {
  const { data: me } = useMe();
  const { data: prime } = usePrime99(me?.id);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const register = useServerFn(registerPushDevice);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const choices = (
    <div className="grid gap-2">
      <Button asChild size="xl" className="w-full"><Link to="/feed" search={{ module: "job" }}><Briefcase />ఉద్యోగం · Jobs</Link></Button>
      <Button asChild size="xl" className="w-full"><Link to="/feed" search={{ module: "vehicle" }}><Truck />వాహనం · Vehicles</Link></Button>
      <Button asChild size="xl" variant="secondary" className="w-full"><Link to="/post/new"><Wrench />పోస్ట్ చేయండి · Post</Link></Button>
    </div>
  );

  return <>
    <Button type="button" variant="ghost" disabled={busy} data-touched={touched} onClick={async () => {
      enableBellAudio(); if (prime?.active) playBell(); setTouched(true);
      if (me) {
        const registration = enablePush();
        setBusy(true);
        try {
          const saved = await supabase.from('notification_preferences').upsert({ user_id: me.id, enabled: true });
          if (saved.error) throw saved.error;
          await markAccountBellActivated(me.id);
          const result = await registration;
          if (result.status === 'registered' && result.token) await register({ data: { id: pushDeviceId(), token: result.token, sound: deviceSound() } });
          else toast.info('గంట ఎంపిక నమోదైంది; సూచనలకు ఆమోదించిన ₹99 చెల్లింపు, ఫోన్ అనుమతి అవసరం.');
          await queryClient.invalidateQueries({ queryKey: ['me'] });
          await navigate({ to: '/dashboard' });
        } catch { toast.error('సూచనలు ప్రారంభించలేకపోయాం; మళ్లీ ప్రయత్నించండి.'); }
        finally { setBusy(false); }
        return;
      }
      setProfileOpen(true);
    }} aria-label="గంట కొట్టండి · Ring the bell" className={`${children ? 'home-temple-trigger' : 'home-bell relative z-10 mx-auto -mt-2 grid size-20 place-items-center rounded-none border-0 bg-transparent p-2 text-gold shadow-none ring-0 hover:bg-transparent active:scale-95'} ${homeActionPending('bell', Boolean(touched || me?.profile?.bell_activated_at)) ? 'unfinished-action' : ''}`}>{children || <Bell className="size-16!" fill="currentColor" strokeWidth={1.5} />}</Button>
    <ProfileRequest home open={profileOpen} onOpenChange={setProfileOpen}>{me ? <><BellPhoneRequest />{choices}</> : <><GoogleSignIn /><Button asChild variant="outline"><Link to="/feed">ప్రకటనలు చూడండి · Browse</Link></Button></>}</ProfileRequest>
    <p className="mt-1 text-center text-lg font-bold">ఏది కావాలన్నా గంట కొట్టు</p>
  </>;
}
