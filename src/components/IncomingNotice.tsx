import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Inbox, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { playBell } from '@/lib/bell';
import { useBellSound } from '@/lib/use-bell-sound';
import { pushPolicy } from '@/lib/push-rules';

export function IncomingNotice({ userId }: { userId: string }) {
  const [notice, setNotice] = useState<{ body: string; sender?: string | undefined; post?: string | undefined; payment?: boolean } | null>(null);
  const { muted, change } = useBellSound();
  useEffect(() => {
    let active = true;
    const receive = async (next: NonNullable<typeof notice>) => {
      const eligibility = await supabase.rpc('my_prime99');
      const preferences = await supabase.from('notification_preferences').select('enabled,timezone,quiet_start,quiet_end').eq('user_id',userId).maybeSingle();
      if (preferences.error || !pushPolicy(new Date(),preferences.data,false).allowed) return;
      if (active && !eligibility.error && (eligibility.data as { alerts_ready?: boolean })?.alerts_ready) setNotice(next);
    };
    const channel = supabase.channel(`screen-notice-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, payload => { void receive({ body: String(payload.new["message"] ?? "కొత్త సమాచారం · New alert") }); })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${userId}` }, payload => { void receive({ body: String(payload.new["body"] ?? "కొత్త సమాధానం · New reply"), sender: String(payload.new["sender_id"]), payment: payload.new['needs_admin'] === true, post: typeof payload.new["post_id"] === "string" ? payload.new["post_id"] : undefined }); })
      .subscribe();
    return () => { active = false; setNotice(null); void supabase.removeChannel(channel); };
  }, [userId]);
  useEffect(() => { if (notice) playBell(); }, [notice]);
  const toggleSound=()=>change(muted);
  if (!notice) return null;
  return <aside role="status" className="fixed inset-x-3 top-3 z-50 mx-auto max-w-md rounded-lg border border-secondary bg-card p-3 shadow-card">
    <div className="flex items-center gap-2"><Inbox className="size-5 shrink-0 text-primary" /><p className="min-w-0 flex-1 text-sm font-bold">{notice.payment ? 'చెల్లింపు వివరాల సందేశం · Payment support message' : 'కొత్త సమాచారం · New information'}</p><Button variant="ghost" size="icon" aria-label={muted?'గంట శబ్దం ఆన్ · Enable bell sound':'గంట శబ్దం ఆఫ్ · Mute bell sound'} onClick={toggleSound}>{muted?<VolumeX/>:<Volume2/>}</Button><Button variant="ghost" size="icon" aria-label="మూసివేయండి · Dismiss" onClick={() => setNotice(null)}><X /></Button></div>
    <p className="line-clamp-3 break-words py-2 text-sm">{notice.body}</p>
    <Button asChild size="sm" onClick={() => setNotice(null)}>{notice.sender ? <Link to="/chat/$userId" params={{ userId: notice.sender }} search={{ post: notice.post }}>సమాధానం చూడండి · View reply</Link> : <Link to="/notifications">సమాచారం చూడండి · View alert</Link>}</Button>
  </aside>;
}