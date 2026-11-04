import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const REF_KEY = "g1_ref";
type Stats = { month_count: number; today_count: number; target: number; offer_active: boolean };

/** Captures ?ref=CODE, applies it after sign-in, and shows the daily referral popup to paid members. */
export function Referral() {
  const { data: me } = useMe();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("ref");
    if (r && /^[A-Za-z0-9]{4,16}$/.test(r)) localStorage.setItem(REF_KEY, r.toUpperCase());
  }, []);

  useEffect(() => {
    if (!me?.id) return;
    const code = localStorage.getItem(REF_KEY);
    if (!code) return;
    localStorage.removeItem(REF_KEY);
    void supabase.rpc("apply_referral", { _code: code });
  }, [me?.id]);

  const prime = !!me?.profile?.is_prime;
  const { data: stats } = useQuery({
    queryKey: ["ref-stats", me?.id],
    enabled: prime,
    queryFn: async () => {
      const { data } = await supabase.rpc("my_referral_stats");
      return data as unknown as Stats;
    },
  });

  useEffect(() => {
    if (!prime || !stats?.offer_active) return;
    const today = new Date().toISOString().slice(0, 10);
    const k = `g1_ref_popup_${me?.id}`;
    if (localStorage.getItem(k) === today) return;
    const t = setTimeout(() => { setOpen(true); localStorage.setItem(k, today); }, 3000);
    return () => clearTimeout(t);
  }, [prime, stats?.offer_active, me?.id]);

  if (!prime || !stats?.offer_active) return null;
  const code = me?.profile?.referral_code ?? "";
  const link = `${window.location.origin}/?ref=${code}`;
  const msg = `గాయత్రి వన్‌లో జాయిన్ అవ్వండి – జాబ్స్, వాహనాలు, సేవలు అన్నీ ఒకేచోట! ${link}`;
  const pct = Math.min(100, Math.round((stats.month_count / Math.max(1, stats.target)) * 100));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl">🎁 వచ్చే నెల ఉచితం! · Next month free!</DialogTitle>
          <DialogDescription className="text-base">
            మీ రిఫరల్ కోడ్ ద్వారా ప్రతిరోజు 3 మందిని జాయిన్ చేయించండి. ఈ నెల మొత్తం {stats.target} మంది అయితే వచ్చే నెల ఉచితం. ఎక్కువ మందిని చేర్పిస్తే ఇంకా ఎక్కువ నెలలు ఉచితం.
            <br />Refer 3 people every day. {stats.target} this month = next month free.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border bg-muted p-3 text-center">
          <div className="text-sm">మీ కోడ్ · Your code</div>
          <div className="text-3xl font-extrabold tracking-widest">{code}</div>
        </div>
        <div className="space-y-1 text-base">
          <div>ఈరోజు · Today: <b>{stats.today_count} / 3</b></div>
          <div>ఈ నెల · This month: <b>{stats.month_count} / {stats.target}</b></div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
        </div>
        <Button size="xl" variant="secondary" className="w-full" asChild>
          <a href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer">WhatsApp లో పంపండి · Share</a>
        </Button>
        <Button size="lg" variant="outline" className="w-full" onClick={() => { void navigator.clipboard?.writeText(link); }}>
          లింక్ కాపీ · Copy link
        </Button>
      </DialogContent>
    </Dialog>
  );
}
