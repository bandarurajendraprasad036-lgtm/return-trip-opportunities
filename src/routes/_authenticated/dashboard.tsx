import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, Briefcase, Image, LogOut, PlusCircle, Sparkles, Users, MessageCircle, Bell } from "lucide-react";
import { AboutVideos } from '@/components/AboutVideos';
import { BELL_BOARD_LABELS, BELL_BOARD_SECTIONS } from '@/lib/bell-board';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/session";
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
import { DashboardChat } from '@/components/DashboardChatView';
import { DashboardChats } from '@/components/DashboardChatsView';
import { DashboardNotifications } from '@/components/DashboardNotificationsView';
import { CallManager } from '@/components/CallManager';
import { CommunicationSettings } from '@/components/CommunicationSettings';
import { IncomingBellList } from '@/components/IncomingBellList';
import { z } from 'zod';
import { DashboardGroups } from '@/components/DashboardGroups';

const MATA_IMAGES = [mataGold, mataGreen, mataIvory];

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: (s: Record<string, unknown>): { view?: 'chat' | 'chats' | 'notifications' | undefined; peer?: string | undefined; post?: string | undefined } => ({
    view: s['view'] === 'chat' || s['view'] === 'chats' || s['view'] === 'notifications' ? s['view'] : undefined,
    peer: z.string().uuid().safeParse(s['peer']).success ? String(s['peer']) : undefined,
    post: z.string().uuid().safeParse(s['post']).success ? String(s['post']) : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const identity = await supabase.auth.getUser();
    if (!identity.data.user) return;
    const role = await supabase.rpc('has_role', { _user_id: identity.data.user.id, _role: 'admin' });
    if (!role.error && role.data) throw redirect({ to: '/admin', search: {view:search.view==='chat'?'chat':search.view==='notifications'?'notifications':undefined,peer:search.peer} });
  },
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
  const { view, peer, post } = Route.useSearch();
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

  if (view) return <><CallManager /><div className="border-b p-3"><Button asChild variant="outline" data-subscription-exempt><Link to="/dashboard" search={{}}>నా పేజీ</Link></Button></div>{view === 'chat' && peer ? <DashboardChat key={`${peer}-${post}`} userId={peer} postId={post} /> : view === 'notifications' ? <DashboardNotifications /> : <DashboardChats />}</>;

  return (
    <div className="space-y-4 p-4">
      <CallManager />
      <DashboardGroups />
      <Button asChild variant="outline" size="icon" aria-label="సంభాషణలు తెరవండి" data-subscription-exempt><Link to="/dashboard" search={{ view: 'chats' }}><PlusCircle /></Link></Button>
      <div className="overflow-hidden rounded-xl border-2 border-primary shadow-card">
        <img src={mataImage} alt="గాయత్రీ అమ్మవారు · Gayatri Mata" className="h-40 w-full object-cover object-top" />
      </div>
      <div className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-card">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-accent text-2xl font-bold text-accent-foreground">{(me?.profile?.full_name || "?").charAt(0).toUpperCase()}</span>
        <div className="min-w-0 flex-1 break-words">
          <p className="text-xl font-bold">{me?.profile?.full_name || "—"}</p>
          <p className="text-sm text-muted-foreground">📞 {me?.profile?.phone} · 📍 {me?.profile?.location || "—"}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-auto min-h-14 min-w-0 w-full gap-1 px-2 py-2 whitespace-normal" onClick={async () => { await clearAccountSession(qc); await navigate({ to: "/auth", replace: true }); }}><LogOut className="shrink-0" /><span className="min-w-0 break-words leading-snug"><span className="block">లాగౌట్</span><span className="block text-xs">Logout</span></span></Button>
        <Button variant="outline" className="h-auto min-h-14 min-w-0 w-full gap-1 px-2 py-2 whitespace-normal" onClick={async () => { await clearAccountSession(qc); await navigate({ to: "/auth", replace: true }); }}><Users className="shrink-0" /><span className="min-w-0 break-words leading-snug"><span className="block">ఖాతా మార్చండి</span><span className="block text-xs">Switch account</span></span></Button>
      </div>
      {countsError && <div role="alert" className="rounded-xl border p-3"><p>మీ ఖాతా గణాంకాలు రాలేదు · Your account counts could not load</p><Button variant="outline" onClick={() => void refetchCounts()}>మళ్లీ ప్రయత్నించండి · Retry</Button></div>}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/my-posts" className={tile}><Briefcase className="size-7 text-primary" /><span className="text-2xl">{data?.posts ?? '—'}</span>నా పోస్ట్‌లు · My posts</Link>
        <Link to="/notifications" className={tile}><Inbox className="size-7 text-primary" /><span className="text-2xl">{data?.unread ?? '—'}</span>కొత్త అలర్ట్స్ · New alerts</Link>
        <Link to="/post/new" className={tile}><PlusCircle className="size-7 text-primary" />కొత్త పోస్ట్ · New post</Link>
        <Link to="/ai-match" className={tile}><Sparkles className="size-7 text-primary" />AI మ్యాచ్ · AI Match</Link>
        <Link to="/service-profile" className={tile}><Image className="size-7 text-primary" />నా ఫోటోలు · My photos</Link>
        <Link to="/chats" className={tile}><MessageCircle className="size-7 text-primary" />నా సంభాషణలు</Link>
      </div>
      <section className="space-y-3 border-y py-4"><h2 className="text-xl font-bold">గంట కొట్టిన వాళ్ళు</h2>{BELL_BOARD_SECTIONS.map(section => <details key={section}><summary className="cursor-pointer py-3 text-lg font-bold">{BELL_BOARD_LABELS[section]}</summary><IncomingBellList section={section} /></details>)}</section>
      <section className="space-y-3 border-b pb-4"><h2 className="text-xl font-bold">నిర్వాహకుల వీడియోలు</h2><AboutVideos /></section>
      <InstallButton />
      <AccountProfile />
      <Prime99Payment />
      <SharingImage />
      <ReferralVip />
      <NotificationSettings />
      <CommunicationSettings />

    </div>
  );
}
