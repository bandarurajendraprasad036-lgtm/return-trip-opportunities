import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Briefcase, Truck, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/session";
import { GoogleSignIn } from "@/components/GoogleSignIn";
import { enableBellAudio, playBell } from '@/lib/bell';
import { BellPhoneRequest } from '@/components/BellPhoneRequest';
import { ProfileRequest } from '@/components/ProfileRequest';
import { useAccountProgram } from '@/lib/use-account-program';
import { markAccountBellActivated, shouldShowProfileRequest } from '@/lib/bell-activation';
import { useQueryClient } from '@tanstack/react-query';

export function BellJoin({ children }: { children?: React.ReactNode }) {
  const { data: me } = useMe();
  const { data: program } = useAccountProgram(me?.id);
  const queryClient = useQueryClient();
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
    <Button type="button" variant="ghost" data-touched={touched} onClick={() => {
      enableBellAudio(); playBell(); setTouched(true);
      const showRequest = shouldShowProfileRequest(!!program, me?.profile?.bell_activated_at);
      if (me && !me.profile?.bell_activated_at) {
        void markAccountBellActivated(me.id).then(() => queryClient.invalidateQueries({ queryKey: ['me'] }));
      }
      setProfileOpen(!me || showRequest);
    }} aria-label="గంట కొట్టండి · Ring the bell" className={children ? "home-temple-trigger" : "home-bell relative z-10 mx-auto -mt-2 grid size-20 place-items-center rounded-none border-0 bg-transparent p-2 text-gold shadow-none ring-0 hover:bg-transparent active:scale-95"}>{children || <Bell className="size-16!" fill="currentColor" strokeWidth={1.5} />}</Button>
    <ProfileRequest home open={profileOpen} onOpenChange={setProfileOpen}>{me ? <><BellPhoneRequest />{choices}</> : <><GoogleSignIn /><Button asChild variant="outline"><Link to="/feed">ప్రకటనలు చూడండి · Browse</Link></Button></>}</ProfileRequest>
    <p className="mt-1 text-center text-lg font-bold">ఏది కావాలన్నా గంట కొట్టు</p>
  </>;
}
