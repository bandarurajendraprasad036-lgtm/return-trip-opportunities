import { POST_LIST_COLUMNS } from '@/lib/post-access';
import { jobIsVisible } from '@/lib/post-publication';
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PostCard, type Post } from "@/components/PostCard";
import { useMe } from "@/lib/session";
import { toast } from "sonner";
import { AdminAboutVideos } from '@/components/AdminAboutVideos';
import { AdminScannerUpload, AdminNewPaymentAlert } from "@/components/AdminScannerUpload";
import { AdminReferralCash } from "@/components/AdminReferralCash";
import { AdminPayments } from "@/components/AdminPayments";
import { AdminDevotional } from "@/components/AdminDevotional";
import { AdminSharingClaims } from '@/components/AdminSharingClaims';
import { PostEvidence } from '@/components/PostEvidence';
import { AdminMessages } from '@/components/AdminMessages';
import { AdminPrime99 } from '@/components/AdminPrime99';
import { AdminReferralEligibility } from '@/components/AdminReferralEligibility';
import { ProviderContacts } from '@/components/ProviderContacts';
import { AdminOverview, adminOverviewQuery } from '@/components/AdminOverview';
import { AdminPhoneEntries } from '@/components/AdminPhoneEntries';
import { AdminPasswordResets } from '@/components/AdminPasswordResets';
import { AdminActivity, useAdminActivity } from '@/components/AdminActivity';
import { DashboardChat } from '@/components/DashboardChatView';
import { DashboardNotifications } from '@/components/DashboardNotificationsView';
import { CallManager } from '@/components/CallManager';
import { z } from 'zod';
import { IncomingBellList } from '@/components/IncomingBellList';
import { BELL_BOARD_LABELS, BELL_BOARD_SECTIONS } from '@/lib/bell-board';
import { AdminInbox } from '@/components/AdminInbox';
import { useEffect } from 'react';
import { dashboardCounts, parseDashboardList, postInList, DASHBOARD_LIST_LABELS, type DashboardList } from '@/lib/dashboard-counts';
import { DashboardCountCards, PublicListLink } from '@/components/DashboardCountCards';

export const Route = createFileRoute("/_authenticated/admin")({
  validateSearch: (s:Record<string,unknown>):{view?:'chat'|'notifications'|undefined;peer?:string|undefined;list?:DashboardList|undefined}=>({view:s['view']==='chat'||s['view']==='notifications'?s['view']:undefined,peer:z.string().uuid().safeParse(s['peer']).success?String(s['peer']):undefined,list:parseDashboardList(s['list'])}),
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: admin } = user ? await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }) : { data: false };
    if (!user || !admin) throw redirect({ to: '/admin-login', replace: true });
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(adminOverviewQuery),
  errorComponent: () => <div role="alert" className="space-y-3 p-4"><p>నిర్వాహకుల వివరాలు రాలేదు. అనుమతి ఉన్న ఖాతాతో మళ్లీ తెరవండి.</p><Button asChild variant="outline"><Link to="/admin-login">నిర్వాహక ప్రవేశం</Link></Button></div>,
  notFoundComponent: () => <p className="p-4">నిర్వాహకుల పేజీ కనిపించలేదు.</p>,
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
  const {view,peer,list}=Route.useSearch();
  
  const {data:activity}=useAdminActivity();
  const { data: me, isLoading } = useMe();
  const qc = useQueryClient();
  const { data, isError: postsError, refetch } = useQuery({
    queryKey: ["admin"],
    refetchInterval:5000,
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

  const loaded = !!data;
  useEffect(() => { if (list && loaded) { const t = window.setTimeout(() => document.getElementById('admin-posts')?.scrollIntoView({ block: 'start' }), 150); return () => window.clearTimeout(t); } return undefined; }, [list, loaded]);
  if (isLoading) return null;
  if (!me?.isAdmin) return <p className="p-8 text-center text-muted-foreground">అనుమతి లేదు · Admins only</p>;

  if(view)return <><CallManager/><Button asChild variant="outline" data-subscription-exempt className="m-3"><Link to="/admin" search={{}}>నిర్వాహక పేజీ</Link></Button>{view==='chat'&&peer?<DashboardChat key={peer} userId={peer}/>:<AdminInbox/>}</>;
  const posts = data?.posts ?? [];
  const counts = data ? dashboardCounts(posts) : undefined;
  const shown = list ? posts.filter(p => postInList(p, list)) : posts;
  const stats = [
    ["వినియోగదారులు", "Users", data?.users ?? '—'],
    ["మొత్తం పోస్ట్‌లు", "Posts", data ? posts.length : '—'],
    ["వ్యాపారులు", "Businessmen", data ? posts.filter(p => p.kind === 'business').length : '—'],
    ["వాహన యజమానులు", "Vehicle owners", data ? posts.filter(p => p.kind === 'owner').length : '—'],
  ] as const;

  const del = async (id: string) => {
    if (!confirm("ఈ ప్రకటన తొలగించాలా?")) return;
    const result = await supabase.from("posts").delete().eq("id", id).select('id');
    if (result.error || !result.data?.some(row => row.id === id)) { toast.error('ప్రకటన తొలగించలేదు; మళ్లీ ప్రయత్నించండి.'); return; }
    toast.success('ప్రకటన తొలగించారు.');
    await qc.invalidateQueries();
  };

  const togglePrime = async (id: string, v: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_prime: v }).eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries();
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-bold">అడ్మిన్ డాష్‌బోర్డ్ <span className="text-base font-normal text-muted-foreground">Admin</span></h2><Button asChild variant="outline"><Link to="/admin-settings">సెట్టింగులు · Settings</Link></Button></div>
      <AdminNewPaymentAlert />
      <section id="my-bells" className="scroll-mt-4 space-y-3 border-y py-4"><h2 className="text-xl font-bold">గంట కొట్టిన వాళ్ళు</h2>{BELL_BOARD_SECTIONS.map(section => <details key={section} open><summary className="cursor-pointer py-3 text-lg font-bold">{BELL_BOARD_LABELS[section]}</summary><IncomingBellList section={section} hideEmpty /></details>)}</section>
      <h3 className="text-xl font-bold">నిజమైన నమోదుల లెక్కలు</h3>
      <p className="text-sm text-muted-foreground">పెద్ద సంఖ్య = నమోదైన మొత్తం (గడువు ముగిసినవి కూడా). కింద = ఇప్పుడు జాబితాలో కనిపించేవి. నొక్కితే ఆ ప్రకటనలు కింద కనిపిస్తాయి.</p>
      <DashboardCountCards counts={counts} to="/admin" active={list} />
      <CallManager />
      <AdminOverview />
      <AdminActivity />
      <AdminPhoneEntries />
      <AdminPasswordResets />
      <AdminMessages />
      <AdminPrime99 />
      <ProviderContacts admin />
      <AdminReferralEligibility />
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
      <AdminAboutVideos />
      <div className="space-y-2 rounded-xl bg-card p-3 shadow-card">
        <p className="font-bold">⭐ Prime సభ్యులు · Prime members</p>
        {(data?.people ?? []).map((u) => (
          <label key={u.id} className="flex items-center gap-2 border-b py-1 text-sm last:border-0">
            <span className="flex-1">{u.full_name || "—"} · {u.phone}</span>
            <input type="checkbox" className="size-5" checked={u.is_prime} onChange={(e) => togglePrime(u.id, e.target.checked)} />
          </label>
        ))}
      </div>
      <AdminScannerUpload />
      <h3 id="admin-posts" className="scroll-mt-4 text-xl font-bold">{list ? `${DASHBOARD_LIST_LABELS[list]} (${shown.length})` : 'అన్ని పోస్ట్‌లు · All posts'}</h3>
      {list && <div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link to="/admin" search={{}}>అన్ని పోస్ట్‌లు చూపండి</Link></Button><PublicListLink list={list} /></div>}
      {postsError && <div role="alert" className="space-y-2 rounded-xl border p-3"><p>పోస్టులు రాలేదు. మళ్లీ ప్రయత్నించండి. · Could not load posts.</p><Button variant="outline" onClick={() => void refetch()}>మళ్లీ ప్రయత్నించండి · Retry</Button></div>}
      {!postsError && data && shown.length === 0 && <p className="text-muted-foreground">ఈ జాబితాలో ఇంకా ప్రకటనలు లేవు</p>}
      {shown.map((p) => <div key={p.id} className="space-y-2"><p className="break-words font-semibold" translate="no">{data?.people.find(u=>u.id===p.user_id)?.full_name||'సభ్యుడు'} · గంట కొట్టినవారు: {activity?.bells.find(b=>b.post_id===p.id)?.count??0}</p>
        <PostCard
          key={p.id}
          post={p}
          actions={
            <>
              <span className="flex-1 self-center text-xs text-muted-foreground">{jobIsVisible(p) ? 'ఇప్పుడు కనిపిస్తోంది' : p.status === 'active' ? 'గడువు ముగిసింది / వేచి ఉంది' : 'మూసివేశారు'} · {new Date(p.created_at).toLocaleDateString("en-IN")}</span>
              <Button variant="destructive" onClick={() => del(p.id)}><Trash2 />Delete</Button>
            </>
          }
        /></div>)}
    </div>
  );
}
