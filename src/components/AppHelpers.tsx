import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { homeActionPending } from '@/lib/prime99';
import { pushPolicy } from '@/lib/push-rules';

type InstallEvent = Event & { prompt: () => Promise<void> };

/** "Add to Home screen" button — appears only when the browser allows installing. */
export function InstallButton({ compact = false, remind = false }: { compact?: boolean; remind?: boolean }) {
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState(false);
  const [ios, setIos] = useState(false);
  useEffect(() => {
    setInstalled(window.localStorage.getItem('gayatri-installed-confirmed') === '1' || window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && navigator.standalone === true));
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent));
    const h = (e: Event) => { e.preventDefault(); setEvt(e as InstallEvent); };
    const done = () => { window.localStorage.setItem('gayatri-installed-confirmed', '1'); setInstalled(true); setEvt(null); };
    window.addEventListener("beforeinstallprompt", h);
    window.addEventListener("appinstalled", done);
    return () => { window.removeEventListener("beforeinstallprompt", h); window.removeEventListener("appinstalled", done); };
  }, []);
  return (
    <>
      <Button variant="outline" aria-label={installed ? 'ఫోన్ తెరపై ఉంది · Installed' : 'దిగుమతి · Install app'} title={installed ? 'ఫోన్ తెరపై ఉంది · Installed' : 'దిగుమతి · Install app'} className={`${compact ? 'gold-ring shrink-0 p-0' : 'h-auto min-h-14 w-full whitespace-normal border-2 border-secondary px-3 py-3'} ${remind && homeActionPending('install', installed) ? 'unfinished-action' : ''}`} onClick={async () => {
        if (installed) { toast.info('ఈ ఫోన్‌లో ఇప్పటికే జోడించబడింది'); return; }
        if (!evt) { setHelp(true); return; }
        try { await evt.prompt(); } catch { setHelp(true); } finally { setEvt(null); }
      }}>
        <Download className="size-5 shrink-0" />{!compact && <span className="min-w-0"><span className="block">ఫోన్ తెరపై జోడించు</span><span className="block text-sm">Add to Home screen</span></span>}
      </Button>
      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-sm">
          <DialogHeader><DialogTitle>ఫోన్ తెరపై జోడించు · Add to Home screen</DialogTitle><DialogDescription>
            {ios ? "పంచుకునే గుర్తు నొక్కి, ‘హోమ్ స్క్రీన్‌కు జోడించు’ ఎంచుకోండి. · Tap Share, then Add to Home Screen." : "వెబ్‌సైట్‌ను మీ బ్రౌజర్‌లో తెరిచి, మూడు చుక్కల దగ్గర ‘యాప్ ఇన్‌స్టాల్’ లేదా ‘హోమ్ స్క్రీన్‌కు జోడించు’ ఎంచుకోండి. · Open the published site in your browser, then choose Install app or Add to Home screen from its menu."}
          </DialogDescription></DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Existing message alerts only; permission is requested exclusively by the home bell. */
export function MessagePhoneNotices({ userId }: { userId: string }) {
  useEffect(() => {
    if (typeof Notification === "undefined") return;
    const ch = supabase
      .channel(`push-${userId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, (p) => {
        // Matched alerts now use Firebase push; avoid duplicate phone banners.
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${userId}` }, async (p) => {
        const m = p.new as { body?: string; needs_admin?: boolean; is_auto?: boolean };
        if (Notification.permission !== "granted" || m.is_auto) return;
        const eligibility = await supabase.rpc('my_prime99');
        if (eligibility.error || !(eligibility.data as { alerts_ready?: boolean })?.alerts_ready) return;
        const preferences = await supabase.from('notification_preferences').select('enabled,timezone,quiet_start,quiet_end').eq('user_id',userId).maybeSingle();
        if (preferences.error || !pushPolicy(new Date(),preferences.data,false).allowed) return;
        const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
        if (isAdmin && !m.needs_admin) return; // admin is alerted only for money questions
        new Notification(isAdmin ? "💰 డబ్బు ప్రశ్న · Payment question" : "కొత్త మెసేజ్ · New message", { body: "గాయత్రి వన్‌లో కొత్త సందేశం ఉంది", icon: "/favicon.svg",silent:true });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);
  return null;
}

/** Resolves support by UUID, without exposing an admin phone. */
export function useAdminChatTarget() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    supabase.rpc("support_admin_id").then(({ data }) => setId(data ?? null));
  }, []);
  return id;
}
