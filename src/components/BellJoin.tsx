import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Briefcase, Truck, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { phoneToEmail } from "@/lib/match";
import { useMe } from "@/lib/session";

export const JOIN_GOAL = 800000;

function useCountUp(target: number) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1500);
      setN(Math.round(from + (target - from) * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return n;
}

export function GoalCounter({ users }: { users?: number | undefined }) {
  const joined = useCountUp(users ?? 0);
  const pct = Math.max(1, Math.min(100, ((users ?? 0) / JOIN_GOAL) * 100));
  return (
    <div className="mt-4 rounded-2xl border-2 border-accent bg-primary-foreground/10 p-4 text-center">
      <p className="text-base font-bold">🎯 మా లక్ష్యం: 8,00,000 మంది · Our goal</p>
      <p className="mt-1 text-sm">ఇప్పటివరకు చేరినవాళ్లు · Joined so far</p>
      <p className="text-4xl font-extrabold text-accent">{joined.toLocaleString("en-IN")}</p>
      <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-primary-foreground/20">
        <div className="h-full rounded-full bg-accent transition-all duration-1000" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-sm font-semibold">మీరు కూడా గంట కొట్టండి 🔔 మా గాయత్రి వన్‌లో జాయిన్ అవ్వండి</p>
    </div>
  );
}

export function BellJoin() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [place, setPlace] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "").slice(-10);
    if (!name.trim()) return void toast.error("పేరు ఇవ్వండి / Enter name");
    if (!/^[6-9]\d{9}$/.test(digits)) return void toast.error("సరైన 10 అంకెల నంబర్ ఇవ్వండి / Enter valid mobile");
    if (pin.length < 6) return void toast.error("పాస్‌వర్డ్ కనీసం 6 అక్షరాలు / Password min 6");
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: phoneToEmail(digits),
      password: pin,
      options: { data: { full_name: name.trim().slice(0, 80), phone: digits, location: place.trim().slice(0, 80) } },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message.includes("registered") ? "ఈ నంబర్ ఇప్పటికే ఉంది. లాగిన్ చేయండి / Already registered" : error.message);
      return;
    }
    setDone(true);
    qc.invalidateQueries({ queryKey: ["public-stats"] });
  };

  const choices = (
    <div className="grid gap-2">
      <Button asChild size="xl" className="w-full"><Link to="/feed" search={{ module: "job" }}><Briefcase />ఉద్యోగం · Jobs</Link></Button>
      <Button asChild size="xl" className="w-full"><Link to="/feed" search={{ module: "vehicle" }}><Truck />వాహనం · Vehicles</Link></Button>
      <Button asChild size="xl" variant="secondary" className="w-full"><Link to="/post/new"><Wrench />పోస్ట్ చేయండి · Post</Link></Button>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => { setDone(false); setOpen(true); }}
        aria-label="గంట కొట్టండి · Ring the bell"
        className="mx-auto mt-4 grid size-24 place-items-center rounded-full bg-accent text-accent-foreground shadow-card ring-4 ring-accent/40 active:scale-95"
      >
        <Bell className="size-12 animate-pulse" />
      </button>
      <p className="mt-2 text-center text-lg font-bold">ఏది కావాలన్నా గంట కొట్టు 🔔</p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          {done ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">🎉 మీరు నమోదయ్యారు!</DialogTitle>
                <DialogDescription className="text-base">మా గాయత్రి వన్‌లో జాయిన్ అయ్యారు · You have joined Gayatri One</DialogDescription>
              </DialogHeader>
              {choices}
            </>
          ) : me ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">🙏 మీరు ఇప్పటికే చేరారు</DialogTitle>
                <DialogDescription>ఏం కావాలి? · What do you need?</DialogDescription>
              </DialogHeader>
              {choices}
            </>
          ) : (
            <form onSubmit={join} className="space-y-3">
              <DialogHeader>
                <DialogTitle className="text-xl">🔔 గాయత్రి వన్‌లో జాయిన్ అవ్వండి</DialogTitle>
                <DialogDescription>Join Gayatri One — free</DialogDescription>
              </DialogHeader>
              <Input className="h-12 text-lg" placeholder="పేరు · Name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
              <Input className="h-12 text-lg" placeholder="మొబైల్ నంబర్ · Mobile" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={14} />
              <Input className="h-12 text-lg" placeholder="ఊరు · Village" value={place} onChange={(e) => setPlace(e.target.value)} maxLength={80} />
              <Input className="h-12 text-lg" type="password" placeholder="పాస్‌వర్డ్ (6+) · Password" value={pin} onChange={(e) => setPin(e.target.value)} />
              <Button type="submit" size="xl" className="w-full" disabled={busy}>{busy ? "..." : "జాయిన్ అవ్వండి · Join"}</Button>
              <p className="text-center text-sm">ఇప్పటికే అకౌంట్ ఉందా? <Link to="/auth" className="font-bold underline">లాగిన్ · Login</Link></p>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
