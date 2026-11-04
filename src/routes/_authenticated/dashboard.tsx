import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Briefcase, LogOut, PlusCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/session";
import { AdminChatButton } from "@/components/AdminChatButton";
import { InstallButton } from "@/components/AppHelpers";
import { MembershipPayment } from "@/components/MembershipPayment";
import { RewardMembership } from '@/components/RewardMembership';
import { NotificationSettings } from '@/components/NotificationSettings';

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "నా పేజీ · My Dashboard — గాయత్రి వన్ · Gayatri One" },
      { name: "description", content: "Your profile, posts, alerts and quick actions on గాయత్రి వన్ · Gayatri One." },
      { property: "og:title", content: "My Dashboard — గాయత్రి వన్ · Gayatri One" },
      { property: "og:description", content: "Your profile, posts, alerts and quick actions on గాయత్రి వన్ · Gayatri One." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { data } = useQuery({
    queryKey: ["dashboard", me?.id],
    enabled: !!me,
    queryFn: async () => {
      if (!me) return { posts: 0, unread: 0 };
      const [{ count: posts }, { count: unread }] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", me.id).eq("status", "active"),
        supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", me.id).eq("is_read", false),
      ]);
      return { posts: posts ?? 0, unread: unread ?? 0 };
    },
  });
  const prime = !!me?.profile?.is_prime;
  const tile = "flex flex-col items-center gap-1 rounded-xl border bg-card p-4 text-center font-semibold shadow-card";

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-card">
        <span className="grid size-14 place-items-center rounded-full bg-accent text-2xl font-bold text-accent-foreground">{(me?.profile?.full_name || "?").charAt(0).toUpperCase()}</span>
        <div className="flex-1">
          <p className="text-xl font-bold">{me?.profile?.full_name || "—"}</p>
          <p className="text-sm text-muted-foreground">📞 {me?.profile?.phone} · 📍 {me?.profile?.location || "—"}</p>
          <p className="text-sm font-semibold">{prime ? "⭐ Prime సభ్యుడు · Prime member" : "ఉచిత ప్లాన్ · Free plan"}</p>
        </div>
        <Button variant="outline" size="icon" aria-label="బయటకు రండి · Sign out" onClick={async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); await navigate({ to: "/auth", replace: true }); }}><LogOut /></Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Link to="/my-posts" className={tile}><Briefcase className="size-7 text-primary" /><span className="text-2xl">{data?.posts ?? 0}</span>నా పోస్ట్‌లు · My posts</Link>
        <Link to="/notifications" className={tile}><Bell className="size-7 text-primary" /><span className="text-2xl">{data?.unread ?? 0}</span>కొత్త అలర్ట్స్ · New alerts</Link>
        <Link to="/post/new" className={tile}><PlusCircle className="size-7 text-primary" />కొత్త పోస్ట్ · New post</Link>
        <Link to="/ai-match" className={tile}><Sparkles className="size-7 text-primary" />AI మ్యాచ్ · AI Match</Link>
      </div>
      <AdminChatButton />
      <MembershipPayment />
      <RewardMembership />
      <NotificationSettings />
      <InstallButton />
    </div>
  );
}
