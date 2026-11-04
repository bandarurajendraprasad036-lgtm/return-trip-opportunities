import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, BellOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function IncomingNotice({ userId }: { userId: string }) {
  const [notice, setNotice] = useState<{ body: string; sender?: string; post?: string } | null>(null);
  const [muted, setMuted] = useState(false);
  useEffect(() => { try { setMuted(localStorage.getItem("gayatri-notices-muted") === "yes"); } catch { /* Optional. */ } }, []);
  useEffect(() => {
    if (muted) return;
    const channel = supabase.channel(`screen-notice-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, payload => setNotice({ body: String(payload.new["message"] ?? "కొత్త సమాచారం · New alert") }))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${userId}` }, payload => setNotice({ body: String(payload.new["body"] ?? "కొత్త సమాధానం · New reply"), sender: String(payload.new["sender_id"]), post: typeof payload.new["post_id"] === "string" ? payload.new["post_id"] : undefined }))
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId, muted]);
  if (muted) return <Button variant="outline" size="icon" aria-label="సమాచారం మళ్లీ చూపించండి · Unmute alerts" className="fixed right-3 top-28 z-40" onClick={() => { setMuted(false); try { localStorage.removeItem("gayatri-notices-muted"); } catch { /* Optional. */ } }}><BellOff /></Button>;
  if (!notice) return null;
  return <aside role="status" className="fixed inset-x-3 top-3 z-50 mx-auto max-w-md rounded-lg border border-secondary bg-card p-3 shadow-card">
    <div className="flex items-center gap-2"><Bell className="size-5 shrink-0 text-primary" /><p className="min-w-0 flex-1 text-sm font-bold">కొత్త సమాచారం · New information</p><Button variant="ghost" size="icon" aria-label="తాత్కాలికంగా ఆపండి · Mute" onClick={() => { setMuted(true); setNotice(null); try { localStorage.setItem("gayatri-notices-muted", "yes"); } catch { /* Optional. */ } }}><BellOff /></Button><Button variant="ghost" size="icon" aria-label="మూసివేయండి · Dismiss" onClick={() => setNotice(null)}><X /></Button></div>
    <p className="line-clamp-3 break-words py-2 text-sm">{notice.body}</p>
    <Button asChild size="sm" onClick={() => setNotice(null)}>{notice.sender ? <Link to="/chat/$userId" params={{ userId: notice.sender }} search={{ post: notice.post }}>సమాధానం చూడండి · View reply</Link> : <Link to="/notifications">సమాచారం చూడండి · View alert</Link>}</Button>
  </aside>;
}