import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { BellRing } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PostCard, type Post } from "@/components/PostCard";
import { useMe } from "@/lib/session";
import { FREE_DAILY_ALERTS, PRIME_PRICE } from "@/lib/jobs";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "అలర్ట్స్ · Alerts — గాయత్రి వన్ · Gayatri One" },
      { name: "description", content: "గాయత్రి వన్ · Gayatri One — Your match alerts for jobs and return vehicles." },
      { property: "og:title", content: "Alerts — గాయత్రి వన్ · Gayatri One" },
      { property: "og:description", content: "గాయత్రి వన్ · Gayatri One — Your match alerts for jobs and return vehicles." },
    ],
  }),
  component: Notifications,
});

function Notifications() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["notifications", me?.id],
    enabled: !!me?.id,
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
      const { data: posts } = ids.length ? await supabase.from("posts").select("*").in("id", ids) : { data: [] as Post[] };
      return data.map((n) => ({ ...n, post: (posts ?? []).find((p) => p.id === (n.matched_post_id || n.post_id)) as Post | undefined }));
    },
  });

  const today = new Date().toDateString();
  const todayCount = data.filter((n) => new Date(n.created_at).toDateString() === today).length;
  const capped = !me?.profile?.is_prime && todayCount >= FREE_DAILY_ALERTS;
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
      <h2 className="text-2xl font-bold">మ్యాచ్ అలర్ట్స్ <span className="text-base font-normal text-muted-foreground">Match alerts</span></h2>
      {capped && (
        <div className="rounded-xl border-2 border-secondary bg-secondary/20 p-4">
          <p className="font-bold">⚠️ ఈ రోజు {FREE_DAILY_ALERTS} ఉచిత అలర్ట్స్ పూర్తయ్యాయి</p>
          <p className="text-sm">ఉచిత వినియోగదారులకు రోజుకు {FREE_DAILY_ALERTS} అలర్ట్స్ మాత్రమే. అపరిమిత అలర్ట్స్ కోసం నెలకు ₹{PRIME_PRICE} Prime తీసుకోండి.</p>
          <p className="text-xs text-muted-foreground">Free users get up to {FREE_DAILY_ALERTS} alerts a day. Upgrade to the ₹{PRIME_PRICE}/month plan for unlimited alerts.</p>
          <Link to="/dashboard" className="mt-2 inline-block rounded-lg bg-secondary px-4 py-2 font-bold text-secondary-foreground">⭐ Prime · ₹{PRIME_PRICE}/నెల</Link>
        </div>
      )}
      {(isLoading || !me) && !isError && <p className="text-muted-foreground">లోడ్ అవుతోంది... Loading</p>}
      {isError && (
        <button onClick={() => refetch()} className="w-full rounded-xl border bg-card p-4 font-semibold text-primary">
          లోడ్ కాలేదు — మళ్ళీ ప్రయత్నించండి · Tap to retry
        </button>
      )}
      {me && !isLoading && !isError && data.length === 0 && (
        <div className="rounded-xl border border-dashed bg-card p-8 text-center text-muted-foreground">
          <BellRing className="mx-auto mb-2 size-10" />
          ఇంకా మ్యాచ్‌లు లేవు. పోస్ట్ చేయండి!<br />No matches yet. <Link to="/post/new" className="text-primary underline">Create a post</Link>
        </div>
      )}
      {data.map((n) => (
        <div key={n.id} className={`space-y-2 rounded-xl p-2 ${n.is_read ? "" : "bg-secondary/30"}`}>
          <p className="flex items-start gap-2 px-1 font-semibold">
            <BellRing className="mt-0.5 size-5 shrink-0 text-vehicle" />{n.message}
          </p>
          <p className="px-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("en-IN")}</p>
          {n.post && <PostCard post={n.post} meId={me?.id} highlight />}
        </div>
      ))}
    </div>
  );
}
