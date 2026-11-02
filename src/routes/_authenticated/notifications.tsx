import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { BellRing } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PostCard, type Post } from "@/components/PostCard";
import { useMe } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "అలర్ట్స్ · Alerts — Return Connect" },
      { name: "description", content: "Your match alerts for jobs and return vehicles." },
      { property: "og:title", content: "Alerts — Return Connect" },
      { property: "og:description", content: "Your match alerts for jobs and return vehicles." },
    ],
  }),
  component: Notifications,
});

function Notifications() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      const ids = [...new Set(data.map((n) => n.matched_post_id).filter(Boolean))] as string[];
      const { data: posts } = ids.length ? await supabase.from("posts").select("*").in("id", ids) : { data: [] as Post[] };
      return data.map((n) => ({ ...n, post: (posts ?? []).find((p) => p.id === n.matched_post_id) as Post | undefined }));
    },
  });

  useEffect(() => {
    if (!data.some((n) => !n.is_read)) return;
    supabase.from("notifications").update({ is_read: true }).eq("is_read", false).then(() => qc.invalidateQueries({ queryKey: ["unread"] }));
  }, [data, qc]);

  return (
    <div className="space-y-3 p-4">
      <h2 className="text-2xl font-bold">మ్యాచ్ అలర్ట్స్ <span className="text-base font-normal text-muted-foreground">Match alerts</span></h2>
      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {!isLoading && data.length === 0 && (
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
