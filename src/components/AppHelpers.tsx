import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { permissionThanks } from '@/lib/friendly-notifications';
import { enableBellAudio,playBell } from '@/lib/bell';
import { permissionHelp, requestBrowserPermission } from '@/lib/browser-notifications';
import { enablePush, pushDeviceId, deviceSound } from '@/lib/firebase-push';
import { registerPushDevice } from '@/lib/push.functions';
import { useServerFn } from '@tanstack/react-start';

type InstallEvent = Event & { prompt: () => Promise<void> };

/** "Add to Home screen" button — appears only when the browser allows installing. */
export function InstallButton() {
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState(false);
  const [ios, setIos] = useState(false);
  useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && navigator.standalone === true));
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent));
    const h = (e: Event) => { e.preventDefault(); setEvt(e as InstallEvent); };
    const done = () => { setInstalled(true); setEvt(null); };
    window.addEventListener("beforeinstallprompt", h);
    window.addEventListener("appinstalled", done);
    return () => { window.removeEventListener("beforeinstallprompt", h); window.removeEventListener("appinstalled", done); };
  }, []);
  if (installed) return null;
  return (
    <>
      <Button variant="outline" className="h-auto min-h-14 w-full whitespace-normal border-2 border-secondary px-3 py-3" onClick={async () => {
        if (!evt) { setHelp(true); return; }
        try { await evt.prompt(); } catch { setHelp(true); } finally { setEvt(null); }
      }}>
        <Download className="size-5 shrink-0" /><span className="min-w-0"><span className="block">ఫోన్ తెరపై జోడించు</span><span className="block text-sm">Add to Home screen</span></span>
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

/** Asks for notification permission 5 seconds after sign-in, then shows phone alerts for new matches while the app is open. */
export function NotificationPermission({ userId }: { userId: string }) {
  const [ask, setAsk] = useState(false);
  const register = useServerFn(registerPushDevice);
  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "default") return;
    const t = setTimeout(() => setAsk(true), 5000);
    return () => clearTimeout(t);
  }, []);
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
        const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
        if (isAdmin && !m.needs_admin) return; // admin is alerted only for money questions
        new Notification(isAdmin ? "💰 డబ్బు ప్రశ్న · Payment question" : "కొత్త మెసేజ్ · New message", { body: String(m.body ?? "").slice(0, 120), icon: "/favicon.svg",silent:true });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);
  if (!ask) return null;
  return (
    <div className="fixed inset-x-3 bottom-24 z-30 mx-auto max-w-md rounded-xl border bg-card p-4 shadow-card">
      <p className="font-bold">🔔 మ్యాచ్ వస్తే ఫోన్‌కు అలర్ట్ కావాలా?</p>
      <p className="text-sm text-muted-foreground">Get alerts on your phone when a match comes?</p>
      <div className="mt-3 flex gap-2">
        <Button className="flex-1" onClick={async () => {
          enableBellAudio(); setAsk(false);
          try {
            const result = await enablePush();
            if (result.status === 'registered' && result.token) { await register({ data: { id: pushDeviceId(), token: result.token, sound: deviceSound() } }); const message=permissionThanks(true); if(message) toast.success(message,{duration:10000}); playBell(); }
            else toast.info(result.status === 'not-configured' ? 'వెబ్ సూచనల వివరాలు చేర్చాలి · Configure web push' : result.status === 'open-in-new-tab' ? permissionHelp['open-in-new-tab'] : result.status === 'denied' ? permissionHelp.denied : 'ఫోన్ సూచనలు ప్రారంభం కాలేదు · Phone registration unavailable');
          } catch { toast.error('ఫోన్ నమోదు కాలేదు · Device registration failed'); }
        }}>అవును · Allow</Button>
        <Button variant="outline" className="flex-1" onClick={() => setAsk(false)}>తర్వాత · Later</Button>
      </div>
    </div>
  );
}

/** Opens in-app chat with the admin if their account exists, otherwise WhatsApp. */
export function useAdminChatTarget(phone: string) {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    supabase.rpc("support_admin_id").then(({ data }) => setId(data ?? null));
  }, [phone]);
  return id;
}
