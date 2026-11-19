import { POST_LIST_COLUMNS } from '@/lib/post-access';
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PostCard, type Post } from "@/components/PostCard";
import { useMe } from "@/lib/session";
import { FREE_DAILY_ALERTS } from "@/lib/jobs";
import { usePrime99 } from '@/lib/prime99';
import { Button } from '@/components/ui/button';
import { ReferralBoard } from '@/components/ReferralBoard';
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { freeWorkLabel } from "@/lib/free-work";
import { PrivateBellDisplay } from '@/components/PrivateBellDisplay';

// A bell notice opens the ringer's work and area (never private identity) with a chat button.
function BellNoticeDetails({ notice }: { notice: { ringer: string; category: string; area: string } }) {
  const [open, setOpen] = useState(false); const nav = useNavigate();
  if (!open) return <Button className="h-auto min-h-12 w-full whitespace-normal" onClick={() => setOpen(true)}>గంట కొట్టిన వారి వివరాలు చూడండి</Button>;
  return <div className="space-y-2 rounded-lg border border-primary p-3"><PrivateBellDisplay /><p translate="no" className="break-words font-bold">{freeWorkLabel(notice.category)}</p><p translate="no" className="break-words">{notice.area}</p><Button className="h-auto min-h-12 w-full" onClick={() => void nav({ to: "/chat/$userId", params: { userId: notice.ringer }, search: { post: undefined } })}><MessageCircle />Chat</Button></div>;
}

export function DashboardNotifications() {
  const { data: me } = useMe();
  const { data: prime } = usePrime99(me?.id);
  const qc = useQueryClient();
  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["notifications", me?.id],
    enabled: Boolean(me?.id),
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
    retry: 3,
    queryFn: async () => {
      if (!me) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", me.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const ids = [...new Set(data.map((n) => n.matched_post_id || n.post_id).filter(Boolean))] as string[];
      const { data: posts } = ids.length ? await supabase.from("posts").select(POST_LIST_COLUMNS).in("id", ids) : { data: [] as Post[] };
      return data.map((n) => ({ ...n, post: (posts ?? []).find((p) => p.id === (n.matched_post_id || n.post_id)) as Post | undefined }));
    },
  });

  const { data: bells = [] } = useQuery({ queryKey: ["free-work-bell-notices", me?.id], enabled: Boolean(me?.id), refetchInterval: 20000, queryFn: async () => { const r = await supabase.rpc("my_free_work_bell_notices"); if (r.error) throw r.error; return r.data; } });
  const today = new Date().toDateString();
  const todayCount = data.filter((n) => new Date(n.created_at).toDateString() === today).length;
  const capped = todayCount >= FREE_DAILY_ALERTS;
  const hasUnread = data.some((n) => !n.is_read);
  useEffect(() => {
    if (!hasUnread || !me?.id) return;
    const t = setTimeout(() => {
      supabase.from("notifications").update({ is_read: true }).eq("user_id", me.id).eq("is_read", false)
        .then(() => qc.invalidateQueries({ queryKey: ["unread"] }));
    }, 1500);
    return () => clearTimeout(t);
  }, [hasUnread, me?.id, qc]);

  return (
    <div className="space-y-3 p-4">
      <h2 className="text-2xl font-bold">{me?.isAdmin ? 'నిర్వాహక సూచనలు' : 'కొత్త సూచనలు'}</h2>
      {!me?.isAdmin && !prime?.alerts_ready && data.length === 0 && <div className="space-y-2"><p>సాధారణ సూచనలకు ఆమోదించిన ₹100 / మూడు నెలల చందా అవసరం.</p><Button asChild variant="outline"><Link to="/dashboard">నా చెల్లింపు స్థితి</Link></Button></div>}
      {!me?.isAdmin && capped && (
        <div className="rounded-xl border-2 border-secondary bg-secondary/20 p-4">
          <p className="font-bold">⚠️ ఈ రోజు {FREE_DAILY_ALERTS} అలర్ట్స్ పూర్తయ్యాయి</p>
          <p className="text-sm">రోజుకు గరిష్టం ఐదు; మీ సమాచార ఎంపికలు, నిశ్శబ్ద సమయం వర్తిస్తాయి. · Maximum five daily, preferences and quiet hours apply.</p>
        </div>
      )}
      {(isLoading || !me) && !isError && <p className="text-muted-foreground">లోడ్ అవుతోంది... Loading</p>}
      {isError && (
        <Button onClick={() => void refetch()} variant="outline" className="h-auto w-full whitespace-normal p-4 font-semibold">
          లోడ్ కాలేదు — మళ్ళీ ప్రయత్నించండి · Tap to retry
        </Button>
      )}
      {me && (me.isAdmin || prime?.alerts_ready) && !isLoading && !isError && data.length === 0 && (
        <div className="rounded-xl border border-dashed bg-card p-8 text-center text-muted-foreground">
          <Inbox className="mx-auto mb-2 size-10" />
          ఇంకా కొత్త సూచనలు లేవు.
        </div>
      )}
      {prime?.alerts_ready && <ReferralBoard />}
      {(prime?.alerts_ready || data.length > 0) && (["job", "vehicle", "other"] as const).map((section) => { const items = data.filter((n) => (n.post?.module === "job" || n.post?.module === "vehicle" ? n.post.module : "other") === section); if (!items.length) return null; return <section key={section} className="space-y-2"><h3 className="border-b pt-2 text-xl font-bold">{section === "job" ? "ఉద్యోగ అలర్ట్స్ · Job alerts" : section === "vehicle" ? "వాహన అలర్ట్స్ · Vehicle alerts" : "ఇతర అలర్ట్స్ · Other alerts"}</h3>{items.map((n) => (
        <div key={n.id} className={`space-y-2 rounded-xl p-2 ${n.is_read ? "" : "bg-secondary/30"}`}>
          <p className="flex items-start gap-2 px-1 font-semibold">
            <Inbox className="mt-0.5 size-5 shrink-0 text-vehicle" />{n.post?.module === 'vehicle' ? `${n.post.from_place || '…'} → ${n.post.to_place || '…'}` : n.message}
          </p>
          <p className="px-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("en-IN")}</p>
          {(n.vehicle_bell || n.post?.module === 'vehicle' || n.message.includes(' → ')) && <PrivateBellDisplay />}
          {n.post && n.post.module !== 'vehicle' && <PostCard post={n.post} meId={me?.id} highlight />}
          {(() => { const bell = bells.find(b => b.notification_id === n.id); return bell ? <BellNoticeDetails notice={bell} /> : null; })()}
        </div>
      ))}</section>; })}
    </div>
  );
}

