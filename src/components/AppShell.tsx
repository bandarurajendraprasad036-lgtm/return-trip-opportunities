import { Brand } from "@/components/Brand";
import { useEffect, type ReactNode } from "react";
import { ClientOnly, Link, useLocation } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Home, FilePenLine, User, Info } from "lucide-react";
import { Button } from '@/components/ui/button';
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { MessagePhoneNotices } from "@/components/AppHelpers";
import { DesignFooter } from "@/components/DesignFooter";
import { ResponsibilityNotice } from "@/components/ResponsibilityNotice";
import { LanguageButton } from '@/components/LanguageButton';
import { AdminChatButton } from '@/components/AdminChatButton';

export function AppShell({ children, hideTopActions = false }: { children: ReactNode; hideTopActions?: boolean }) {
  const location = useLocation();
  const vehicleSurface = location.pathname === '/vehicles' || location.pathname === '/vehicle-demands' || (location.pathname === '/bell-board' && ['goods', 'returns', 'cars'].includes(new URLSearchParams(location.searchStr).get('section') ?? 'goods'));
  const conversationSurface = location.pathname.startsWith('/chat/');
  const { data: me } = useMe();
  const qc = useQueryClient();
  const { data: unread = 0 } = useQuery({
    queryKey: ["unread", me?.id],
    refetchInterval: me?.isAdmin ? 3000 : false,
    enabled: !!me,
    queryFn: async () => {
      const { count } = await supabase
        .from(me?.isAdmin ? 'admin_activity_notices' : "notifications")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);
      return count ?? 0;
    },
  });

  useEffect(() => {
    if (!me) return;
    const ch = supabase
      .channel(`notif-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${me.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["unread"] });
          qc.invalidateQueries({ queryKey: ["notifications"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [me, qc]);

  const tab = "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs text-muted-foreground";
  const active = { className: `${tab} text-primary font-semibold` };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <header className="sticky top-0 z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b bg-background px-3 py-3 text-foreground">
        <Link to="/feed" className="min-w-0 font-display text-lg font-extrabold leading-none">
          <Brand />
        </Link>
        <div className="flex shrink-0 items-center gap-1"><LanguageButton />{!hideTopActions && <Button asChild variant="outline" size="icon" aria-label="మా గురించి" title="మా గురించి"><Link to="/about"><Info className="size-5" /></Link></Button>}{me && <Button asChild data-subscription-exempt variant="outline" size="icon" className="relative" aria-label="నా పేజీలో తెలియజేతలు">{me.isAdmin ? <Link to="/" hash="admin-notices"><Bell className="size-5" /><ClientOnly>{unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-xs text-primary-foreground">{unread}</span>}</ClientOnly></Link> : <Link to="/dashboard" search={{ view: 'notifications' }}><Bell className="size-5" /><ClientOnly>{unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-xs text-primary-foreground">{unread}</span>}</ClientOnly></Link>}</Button>}</div>
      </header>
      <main className="flex-1 pb-24">{location.pathname === '/dashboard' && !location.searchStr.includes('view=chat') && <div className="px-4 pt-4"><AdminChatButton /></div>}{children}<ResponsibilityNotice /><DesignFooter /></main>
      {me && <MessagePhoneNotices userId={me.id} />}
      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md border-t bg-card">
        <Link to="/feed" className={tab} activeProps={active}>
          <Home className="size-6" />
          హోమ్ Home
        </Link>
        <Link to="/post/new" className="-mt-5 flex flex-1 flex-col items-center gap-0.5 text-xs font-semibold">
          <span className="grid size-14 place-items-center rounded-full border-4 border-card bg-secondary text-secondary-foreground shadow-card">
            <FilePenLine className="size-7" />
          </span>
          పోస్ట్ Post
        </Link>
        <Link to={me?.isAdmin ? "/admin" : "/dashboard"} className={tab} activeProps={active}>
          <User className="size-6" />
          {me?.isAdmin ? "నిర్వాహక పేజీ" : "నా పేజీ"}
        </Link>
      </nav>
    </div>
  );
}
