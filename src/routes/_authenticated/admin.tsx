import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PostCard, type Post } from "@/components/PostCard";
import { useMe } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "అడ్మిన్ · Admin — గాయత్రి వన్ · Gayatri One" },
      { name: "description", content: "Admin dashboard for గాయత్రి వన్ · Gayatri One." },
      { property: "og:title", content: "Admin — గాయత్రి వన్ · Gayatri One" },
      { property: "og:description", content: "Admin dashboard for గాయత్రి వన్ · Gayatri One." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { data: me, isLoading } = useMe();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin"],
    enabled: !!me?.isAdmin,
    queryFn: async () => {
      const [{ data: posts }, { count: users }] = await Promise.all([
        supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(300),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      return { posts: (posts ?? []) as Post[], users: users ?? 0 };
    },
  });

  if (isLoading) return null;
  if (!me?.isAdmin) return <p className="p-8 text-center text-muted-foreground">అనుమతి లేదు · Admins only</p>;

  const posts = data?.posts ?? [];
  const count = (k: string) => posts.filter((p) => p.kind === k).length;
  const stats = [
    ["వినియోగదారులు", "Users", data?.users ?? 0],
    ["మొత్తం పోస్ట్‌లు", "Posts", posts.length],
    ["ఉద్యోగం కావాలి", "Job seekers", count("seeker")],
    ["యజమానులు", "Employers", count("employer")],
    ["వాహన యజమానులు", "Vehicle owners", count("owner")],
    ["వ్యాపారులు", "Businessmen", count("business")],
  ] as const;

  const del = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    await supabase.from("posts").delete().eq("id", id);
    qc.invalidateQueries();
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold">అడ్మిన్ డాష్‌బోర్డ్ <span className="text-base font-normal text-muted-foreground">Admin</span></h2>
      <div className="grid grid-cols-2 gap-3">
        {stats.map(([te, en, n]) => (
          <div key={en} className="rounded-xl bg-card p-3 shadow-card">
            <p className="font-display text-3xl font-extrabold text-primary">{n}</p>
            <p className="text-sm font-semibold">{te}</p>
            <p className="text-xs text-muted-foreground">{en}</p>
          </div>
        ))}
      </div>
      <h3 className="text-xl font-bold">అన్ని పోస్ట్‌లు · All posts</h3>
      {posts.map((p) => (
        <PostCard
          key={p.id}
          post={p}
          actions={
            <>
              <span className="flex-1 self-center text-xs text-muted-foreground">{p.status} · {new Date(p.created_at).toLocaleDateString("en-IN")}</span>
              <Button variant="destructive" onClick={() => del(p.id)}><Trash2 />Delete</Button>
            </>
          }
        />
      ))}
    </div>
  );
}
