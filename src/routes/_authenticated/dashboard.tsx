import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, Briefcase, Image, LogOut, PlusCircle, Sparkles, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/session";
import { AdminChatButton } from "@/components/AdminChatButton";
import { InstallButton } from "@/components/AppHelpers";
import { ReferralVip } from '@/components/ReferralVip';
import { AccountProfile } from '@/components/AccountProfile';
import { SharingImage } from '@/components/SharingImage';
import { NotificationSettings } from '@/components/NotificationSettings';
import { dailyDevotionalIndex } from '@/lib/daily-devotional';
import mataGold from '@/assets/gayatri-mata.jpg';
import mataGreen from '@/assets/gayatri-mata-green.jpg';
import mataIvory from '@/assets/gayatri-mata-ivory.jpg';
import { clearAccountSession } from '@/lib/sign-out';
import { Prime99Payment } from '@/components/Prime99Payment';

const MATA_IMAGES = [mataGold, mataGreen, mataIvory];

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
  const { data, isError: countsError, refetch: refetchCounts } = useQuery({
    queryKey: ["dashboard", me?.id],
    enabled: !!me,
    queryFn: async () => {
      if (!me) return { posts: 0, unread: 0 };
      const [postResult, notificationResult] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", me.id).eq("status", "active"),
        supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", me.id).eq("is_read", false),
      ]);
      if (postResult.error) throw postResult.error;
      if (notificationResult.error) throw notificationResult.error;
      return { posts: postResult.count ?? 0, unread: notificationResult.count ?? 0 };
    },
  });
  const tile = "flex flex-col items-center gap-1 rounded-xl border bg-card p-4 text-center font-semibold shadow-card";

  const mataImage = MATA_IMAGES[dailyDevotionalIndex(new Date(), MATA_IMAGES.length)];

  return (
    <div className="space-y-4 p-4">
      <div className="overflow-hidden rounded-xl border-2 border-primary shadow-card">
        <img src={mataImage} alt="గాయత్రీ అమ్మవారు · Gayatri Mata" className="h-40 w-full object-cover object-top" />
      </div>
      <div className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-card">
        <span className="grid size-14 place-items-center rounded-full bg-accent text-2xl font-bold text-accent-foreground">{(me?.profile?.full_name || "?").charAt(0).toUpperCase()}</span>
        <div className="flex-1">
          <p className="text-xl font-bold">{me?.profile?.full_name || "—"}</p>
          <p className="text-sm text-muted-foreground">📞 {me?.profile?.phone} · 📍 {me?.profile?.location || "—"}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={async () => { await clearAccountSession(qc); await navigate({ to: "/auth", replace: true }); }}><LogOut />లాగౌట్ · Logout</Button>
        <Button variant="outline" onClick={async () => { await clearAccountSession(qc); await navigate({ to: "/auth", replace: true }); }}><Users />ఖాతా మార్చండి · Switch account</Button>
      </div>
      {countsError && <div role="alert" className="rounded-xl border p-3"><p>మీ ఖాతా గణాంకాలు రాలేదు · Your account counts could not load</p><Button variant="outline" onClick={() => void refetchCounts()}>మళ్లీ ప్రయత్నించండి · Retry</Button></div>}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/my-posts" className={tile}><Briefcase className="size-7 text-primary" /><span className="text-2xl">{data?.posts ?? '—'}</span>నా పోస్ట్‌లు · My posts</Link>
        <Link to="/notifications" className={tile}><Inbox className="size-7 text-primary" /><span className="text-2xl">{data?.unread ?? '—'}</span>కొత్త అలర్ట్స్ · New alerts</Link>
        <Link to="/post/new" className={tile}><PlusCircle className="size-7 text-primary" />కొత్త పోస్ట్ · New post</Link>
        <Link to="/ai-match" className={tile}><Sparkles className="size-7 text-primary" />AI మ్యాచ్ · AI Match</Link>
        <Link to="/service-profile" className={tile}><Image className="size-7 text-primary" />నా ఫోటోలు · My photos</Link>
      </div>
      <AdminChatButton />
      <AccountProfile />
      <Prime99Payment />
      <SharingImage />
      <ReferralVip />
      <NotificationSettings />
      <InstallButton />
    </div>
  );
}
