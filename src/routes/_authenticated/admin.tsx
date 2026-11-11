import { POST_LIST_COLUMNS } from '@/lib/post-access';
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PostCard, type Post } from "@/components/PostCard";
import { useMe } from "@/lib/session";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { AdminReferralCash } from "@/components/AdminReferralCash";
import { AdminPayments } from "@/components/AdminPayments";
import { AdminDevotional } from "@/components/AdminDevotional";
import { AdminSharingClaims } from '@/components/AdminSharingClaims';
import { PostEvidence } from '@/components/PostEvidence';
import { AdminMessages } from '@/components/AdminMessages';
import { AdminPrime99 } from '@/components/AdminPrime99';
import { AdminReferralEligibility } from '@/components/AdminReferralEligibility';

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: admin } = user ? await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }) : { data: false };
    if (!user || !admin) throw redirect({ to: '/admin-login', replace: true });
  },
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
  const { data, isError: postsError, refetch } = useQuery({
    queryKey: ["admin"],
    enabled: !!me?.isAdmin,
    queryFn: async () => {
      const posts: Post[] = [];
      for (let from = 0; ; from += 500) {
        const { data: page, error } = await supabase.from("posts").select(POST_LIST_COLUMNS).order("created_at", { ascending: false }).range(from, from + 499);
        if (error) throw error;
        posts.push(...((page ?? []) as Post[]));
        if (!page || page.length < 500) break;
      }
      const [{ count: users, error: usersError }, { data: people, error: peopleError }, { data: yt, error: settingsError }] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id, full_name, phone, is_prime").order("created_at", { ascending: false }).limit(200),
        supabase.from("app_settings").select("value").eq("key", "youtube_url").maybeSingle(),
      ]);
      if (usersError) throw usersError;
      if (peopleError) throw peopleError;
      if (settingsError) throw settingsError;
      return { posts, users: users ?? 0, people: people ?? [], yt: yt?.value ?? "" };
    },
  });

  const [yt, setYt] = useState<string | null>(null);
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

  const saveYt = async () => {
    const { error } = await supabase.from("app_settings").upsert({ key: "youtube_url", value: (yt ?? "").trim(), updated_at: new Date().toISOString() });
    if (error) toast.error(error.message); else { toast.success("సేవ్ అయ్యింది · Saved"); qc.invalidateQueries(); }
  };
  const togglePrime = async (id: string, v: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_prime: v }).eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries();
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-bold">అడ్మిన్ డాష్‌బోర్డ్ <span className="text-base font-normal text-muted-foreground">Admin</span></h2><Button asChild variant="outline"><Link to="/admin-settings">సెట్టింగులు · Settings</Link></Button></div>
      <AdminMessages />
      <AdminPrime99 />
      <AdminReferralEligibility />
      <section className="rounded-xl border bg-card p-3"><h3 className="text-xl font-bold">బుకింగులు · Bookings</h3><p>ఇంకా నిర్ధారించిన బుకింగ్ నమోదులు లేవు. అందుబాటు అభ్యర్థనలు లేదా గంట సంభాషణలు బుకింగులు కావు. · No confirmed booking records; requests and bell chats are not bookings.</p></section>
      <AdminReferralCash />
      <AdminDevotional />
      <AdminPayments />
      <AdminSharingClaims />
      <PostEvidence admin />
      <div className="grid grid-cols-2 gap-3">
        {stats.map(([te, en, n]) => (
          <div key={en} className="rounded-xl bg-card p-3 shadow-card">
            <p className="font-display text-3xl font-extrabold text-primary">{n}</p>
            <p className="text-sm font-semibold">{te}</p>
            <p className="text-xs text-muted-foreground">{en}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2 rounded-xl bg-card p-3 shadow-card">
        <p className="font-bold">🎬 YouTube About వీడియో లింక్ · About video URL</p>
        <div className="flex gap-2">
          <Input value={yt ?? data?.yt ?? ""} onChange={(e) => setYt(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="h-11" />
          <Button onClick={saveYt}>సేవ్ Save</Button>
        </div>
      </div>
      <div className="space-y-2 rounded-xl bg-card p-3 shadow-card">
        <p className="font-bold">⭐ Prime సభ్యులు · Prime members</p>
        {(data?.people ?? []).map((u) => (
          <label key={u.id} className="flex items-center gap-2 border-b py-1 text-sm last:border-0">
            <span className="flex-1">{u.full_name || "—"} · {u.phone}</span>
            <input type="checkbox" className="size-5" checked={u.is_prime} onChange={(e) => togglePrime(u.id, e.target.checked)} />
          </label>
        ))}
      </div>
      <h3 className="text-xl font-bold">అన్ని పోస్ట్‌లు · All posts</h3>
      {postsError && <div role="alert" className="space-y-2 rounded-xl border p-3"><p>పోస్టులు రాలేదు. మళ్లీ ప్రయత్నించండి. · Could not load posts.</p><Button variant="outline" onClick={() => void refetch()}>మళ్లీ ప్రయత్నించండి · Retry</Button></div>}
      {!postsError && posts.length === 0 && <p className="text-muted-foreground">ఇంకా పోస్టులు లేవు · No posts yet</p>}
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
