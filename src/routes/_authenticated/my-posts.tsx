import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut, Trash2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PostCard, type Post } from "@/components/PostCard";
import { useMe } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/my-posts")({
  head: () => ({
    meta: [
      { title: "నా పోస్ట్‌లు · My Posts — Return Connect" },
      { name: "description", content: "Manage your job and vehicle posts." },
      { property: "og:title", content: "My Posts — Return Connect" },
      { property: "og:description", content: "Manage your job and vehicle posts." },
    ],
  }),
  component: MyPosts,
});

function MyPosts() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["my-posts", me?.id],
    enabled: !!me,
    queryFn: async () => {
      const { data, error } = await supabase.from("posts").select("*").eq("user_id", me!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Post[];
    },
  });
  const refresh = () => qc.invalidateQueries();
  const close = async (id: string) => {
    await supabase.from("posts").update({ status: "closed" }).eq("id", id);
    toast.success("పూర్తయింది · Marked done");
    refresh();
  };
  const del = async (id: string) => {
    if (!confirm("తొలగించాలా? Delete this post?")) return;
    await supabase.from("posts").delete().eq("id", id);
    refresh();
  };

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between rounded-xl bg-card p-4 shadow-card">
        <div>
          <p className="text-xl font-bold">{me?.profile?.full_name || "—"}</p>
          <p className="text-sm text-muted-foreground">📞 {me?.profile?.phone} · 📍 {me?.profile?.location || "—"}</p>
        </div>
        <Button variant="outline" size="icon" aria-label="Logout" onClick={() => supabase.auth.signOut()}>
          <LogOut />
        </Button>
      </div>
      <h2 className="text-2xl font-bold">నా పోస్ట్‌లు <span className="text-base font-normal text-muted-foreground">My posts</span></h2>
      {data.length === 0 && (
        <div className="rounded-xl border border-dashed bg-card p-8 text-center text-muted-foreground">
          పోస్ట్‌లు లేవు · No posts. <Link to="/post/new" className="text-primary underline">Post now</Link>
        </div>
      )}
      {data.map((p) => (
        <div key={p.id} className={p.status !== "active" ? "opacity-60" : ""}>
          <PostCard
            post={p}
            actions={
              <>
                {p.status === "active" ? (
                  <Button variant="outline" className="flex-1" onClick={() => close(p.id)}><CheckCircle2 />పూర్తి Done</Button>
                ) : (
                  <span className="flex-1 self-center text-sm font-semibold text-muted-foreground">మూసివేయబడింది · Closed</span>
                )}
                <Button variant="destructive" className="flex-1" onClick={() => del(p.id)}><Trash2 />తొలగించు</Button>
              </>
            }
          />
        </div>
      ))}
    </div>
  );
}
