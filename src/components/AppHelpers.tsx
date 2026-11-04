import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type InstallEvent = Event & { prompt: () => Promise<void> };

/** "Add to Home screen" button — appears only when the browser allows installing. */
export function InstallButton() {
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setEvt(e as InstallEvent); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);
  if (!evt) return null;
  return (
    <button onClick={() => { void evt.prompt(); setEvt(null); }} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-secondary bg-card p-3 font-bold">
      <Download className="size-5" />హోమ్ స్క్రీన్‌కు జోడించు · Add to Home screen
    </button>
  );
}

/** Asks for notification permission 5 seconds after sign-in, then shows phone alerts for new matches while the app is open. */
export function NotificationPermission({ userId }: { userId: string }) {
  const [ask, setAsk] = useState(false);
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
        if (Notification.permission === "granted") new Notification("గాయత్రి వన్ · Gayatri One", { body: String((p.new as { message?: string }).message ?? ""), icon: "/favicon.svg" });
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
        <button className="flex-1 rounded-lg bg-secondary py-2 font-bold text-secondary-foreground" onClick={() => { void Notification.requestPermission(); setAsk(false); }}>అవును · Allow</button>
        <button className="flex-1 rounded-lg border py-2" onClick={() => setAsk(false)}>తర్వాత · Later</button>
      </div>
    </div>
  );
}

/** Opens in-app chat with the admin if their account exists, otherwise WhatsApp. */
export function useAdminChatTarget(phone: string) {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    supabase.from("profiles").select("id").eq("phone", phone).maybeSingle().then(({ data }) => setId(data?.id ?? null));
  }, [phone]);
  return id;
}
