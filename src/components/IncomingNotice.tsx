import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Inbox, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { playBell } from '@/lib/bell';
import { useBellSound } from '@/lib/use-bell-sound';
import { pushPolicy } from '@/lib/push-rules';
import { PrivateBellDisplay } from '@/components/PrivateBellDisplay';
import { listenForegroundPush } from '@/lib/firebase-push';
import { screenNoticeAllowed } from '@/lib/screen-notice-rules';
import { BELL_BOARD_REFRESH_MS } from '@/lib/bell-board-refresh';
import { readCommunicationChoices } from '@/lib/dashboard-communications';

export function IncomingNotice({ userId }: { userId: string }) {
  const [notice, setNotice] = useState<{ body: string; sender?: string | undefined; post?: string | undefined; payment?: boolean; id?: string; vehicleBell?: boolean } | null>(null);
  const { muted, change } = useBellSound();
  useEffect(() => {
    let active = true;
    let stopPush: (() => void) | undefined;
    const seen = new Set<string>();
    const startedAt = new Date().toISOString();
    let polling = false;
    const receive = async (next: NonNullable<typeof notice>) => {
      if (next.id && seen.has(next.id)) return;
      const eligibility = await supabase.rpc('my_prime99');
      const free = next.id ? await supabase.rpc('notification_delivery_allowed', { _user: userId, _notice: next.id }) : next.sender ? await supabase.rpc('free_work_chat', { _other: next.sender }) : null;
      const preferences = await supabase.from('notification_preferences').select('enabled,timezone,quiet_start,quiet_end').eq('user_id',userId).maybeSingle();
      if (preferences.error || !pushPolicy(new Date(),preferences.data,false).allowed) return;
      if (active && screenNoticeAllowed(!!next.id, !free?.error && free?.data === true, !eligibility.error && (eligibility.data as { alerts_ready?: boolean })?.alerts_ready === true)) {
        if (next.id) { if (seen.has(next.id)) return; seen.add(next.id); }
        setNotice(next);
      }
    };
    void listenForegroundPush(id => {
      // Ignore payload text: read only the authenticated owner's stored notice.
      void (async () => {
        const result = await supabase.from('notifications').select('id,message,vehicle_bell').eq('id', id).eq('user_id', userId).maybeSingle();
        if (active && !result.error && result.data) await receive({ id: result.data.id, body: result.data.message, vehicleBell: result.data.vehicle_bell === true });
      })().catch(() => {});
    }).then(stop => { if (active) stopPush = stop; else stop(); }).catch(() => {});
    const channel = supabase.channel(`screen-notice-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, payload => { void receive({ body: String(payload.new["message"] ?? "నోటిఫికేషన్"), id: String(payload.new['id']), vehicleBell: payload.new['vehicle_bell'] === true || String(payload.new['message']).includes(' → ') }); })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${userId}` }, payload => { if (payload.new['body'] === 'హాయ్ · Hi') return; const key = `message:${payload.new['id']}`; if (seen.has(key)) return; seen.add(key); void receive({ body: 'కొత్త సమాధానం', sender: String(payload.new["sender_id"]), payment: payload.new['needs_admin'] === true, post: typeof payload.new["post_id"] === "string" ? payload.new["post_id"] : undefined }); })
      .subscribe();
    // Realtime can be unavailable on another host/device. Read only owner-visible
    // new rows as a fallback; never replay historical notices after refresh.
    const timer = window.setInterval(() => {
      if (!active || polling || document.visibilityState !== 'visible') return;
      polling = true;
      void (async () => {
        const notices = await supabase.from('notifications').select('id,message,vehicle_bell').eq('user_id',userId).gt('created_at',startedAt).order('created_at').limit(100);
        for (const row of notices.data ?? []) { if (!active) return; await receive({ id: row.id, body: row.message, vehicleBell: row.vehicle_bell }); }
        const messages = await supabase.from('messages').select('id,sender_id,post_id,needs_admin').eq('receiver_id',userId).gt('created_at',startedAt).order('created_at').limit(100);
        for (const row of messages.data ?? []) {
          const key = `message:${row.id}`;
          if (!active || seen.has(key)) continue; seen.add(key);
          await receive({ body: 'కొత్త సమాధానం', sender: row.sender_id, post: row.post_id ?? undefined, payment: row.needs_admin });
        }
      })().catch(() => {}).finally(() => { polling = false; });
    }, BELL_BOARD_REFRESH_MS);
    return () => { active = false; clearInterval(timer); stopPush?.(); setNotice(null); void supabase.removeChannel(channel); };
  }, [userId]);
  useEffect(() => { if (notice && readCommunicationChoices(userId).bell) playBell(); }, [notice, userId]);
  const toggleSound=()=>change(muted);
  if (!notice) return null;
  return <aside role="status" className="fixed right-3 top-3 z-50 w-[min(320px,calc(100%-24px))] rounded-lg border border-secondary bg-card p-3 shadow-card">
    <div className="flex items-center gap-2"><Inbox className="size-5 shrink-0 text-primary" /><p className="min-w-0 flex-1 text-sm font-bold">నోటిఫికేషన్</p><Button variant="ghost" size="icon" aria-label="మూసివేయండి · Dismiss" onClick={() => setNotice(null)}><X /></Button></div>
    <p className="line-clamp-3 break-words py-2 text-sm">గాయత్రి వన్‌లో కొత్త సమాచారం ఉంది</p>
    {notice.vehicleBell && <PrivateBellDisplay />}
    <Button asChild size="sm" onClick={() => setNotice(null)}><Link to="/dashboard" search={{ view: "notifications" }}>నా పేజీలో చూడండి</Link></Button>
  </aside>;
}