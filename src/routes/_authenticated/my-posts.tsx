import { POST_LIST_COLUMNS } from '@/lib/post-access';
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut, Trash2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PostCard, type Post } from "@/components/PostCard";
import { useMe } from "@/lib/session";
import { jobIsVisible } from '@/lib/post-publication';
import { PostEvidence } from '@/components/PostEvidence';

export const Route = createFileRoute("/_authenticated/my-posts")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "నా పోస్ట్‌లు · My Posts — గాయత్రి వన్ · Gayatri One" },
      { name: "description", content: "గాయత్రి వన్ · Gayatri One — Manage your job and vehicle posts." },
      { property: "og:title", content: "My Posts — గాయత్రి వన్ · Gayatri One" },
      { property: "og:description", content: "గాయత్రి వన్ · Gayatri One — Manage your job and vehicle posts." },
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
      if (!me) return [];
      const { data, error } = await supabase.from("posts").select(POST_LIST_COLUMNS).eq("user_id", me.id).order("created_at", { ascending: false });
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
          {p.visible_after && Date.parse(p.visible_after)>Date.now()&&<p role="status" className="py-3 font-semibold">మీ సమాచారం మాకు సమర్పించారు; ఐదు గంటల తర్వాత చూడవచ్చు. · Submitted; visible after five hours.<br/>ప్రచురణ సమయం · Available: {new Date(p.visible_after).toLocaleString('te-IN',{timeZone:'Asia/Kolkata'})}</p>}
          <PostCard
            post={p}
            actions={
              <>
                {jobIsVisible(p) ? (
                  <Button variant="outline" className="flex-1" onClick={() => close(p.id)}><CheckCircle2 />పూర్తి Done</Button>
                ) : (
                  <span className="flex-1 self-center text-sm font-semibold text-muted-foreground">{p.status === 'active' ? p.visible_after&&Date.parse(p.visible_after)>Date.now()?'ప్రచురణ కోసం వేచి ఉంది · Awaiting publication':'గడువు ముగిసింది · Expired' : 'మూసివేయబడింది · Closed'}</span>
                )}
                <Button variant="destructive" className="flex-1" onClick={() => del(p.id)}><Trash2 />తొలగించు</Button>
              </>
            }
          />
          <PostEvidence postId={p.id}/>
        </div>
      ))}
    </div>
  );
}
