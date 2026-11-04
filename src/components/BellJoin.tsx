import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Briefcase, Truck, Wrench } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/session";
import { GoogleSignIn } from "@/components/GoogleSignIn";
import { enableBellAudio, playBell } from '@/lib/bell';

export function BellJoin() {
  const { data: me } = useMe();
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const choices = (
    <div className="grid gap-2">
      <Button asChild size="xl" className="w-full"><Link to="/feed" search={{ module: "job" }}><Briefcase />ఉద్యోగం · Jobs</Link></Button>
      <Button asChild size="xl" className="w-full"><Link to="/feed" search={{ module: "vehicle" }}><Truck />వాహనం · Vehicles</Link></Button>
      <Button asChild size="xl" variant="secondary" className="w-full"><Link to="/post/new"><Wrench />పోస్ట్ చేయండి · Post</Link></Button>
    </div>
  );

  return <>
    <Button type="button" variant="ghost" data-touched={touched} onClick={() => { enableBellAudio(); playBell(); setTouched(true); setOpen(true); }} aria-label="గంట కొట్టండి · Ring the bell" className="home-bell relative z-10 mx-auto -mt-2 grid size-20 place-items-center rounded-none border-0 bg-transparent p-2 text-gold shadow-none ring-0 hover:bg-transparent active:scale-95"><Bell className="size-16!" fill="currentColor" strokeWidth={1.5} /></Button>
    <p className="mt-1 text-center text-lg font-bold">ఏది కావాలన్నా గంట కొట్టు</p>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-sm"><DialogHeader><DialogTitle>గాయత్రి వన్</DialogTitle><DialogDescription>ఏం కావాలి? · What do you need?</DialogDescription></DialogHeader>{me ? choices : <><GoogleSignIn /><Button asChild variant="outline"><Link to="/feed">ప్రకటనలు చూడండి · Browse</Link></Button></>}</DialogContent></Dialog>
  </>;
}
