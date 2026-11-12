import { Brand } from "@/components/Brand";
import { useEffect, type ReactNode } from "react";
import { ClientOnly, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, Home, MessageCircle, PlusCircle, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { MessagePhoneNotices } from "@/components/AppHelpers";
import { DesignFooter } from "@/components/DesignFooter";
import { IncomingNotice } from "@/components/IncomingNotice";
import { ResponsibilityNotice } from "@/components/ResponsibilityNotice";
import { LanguageButton } from '@/components/LanguageButton';

export function AppShell({ children, hideTopActions = false }: { children: ReactNode; hideTopActions?: boolean }) {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const { data: unread = 0 } = useQuery({
    queryKey: ["unread", me?.id],
    enabled: !!me,
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
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
        <div className="flex shrink-0 items-center gap-1"><LanguageButton />{!hideTopActions && <Link to="/chats" className="grid size-11 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground" aria-label="సందేశాలు · Messages"><MessageCircle className="size-5" /><ClientOnly>{unread > 0 && <span className="sr-only">{unread}</span>}</ClientOnly></Link>}</div>
      </header>
      <main className="flex-1 pb-24">{children}<ResponsibilityNotice /><DesignFooter /></main>
      {me && <IncomingNotice userId={me.id} />}
      {me && <MessagePhoneNotices userId={me.id} />}
      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md border-t bg-card">
        <Link to="/feed" className={tab} activeProps={active}>
          <Home className="size-6" />
          హోమ్ Home
        </Link>
        <Link to="/chats" className={tab} activeProps={active}>
          <MessageCircle className="size-6" />
          చాట్ Chat
        </Link>
        <Link to="/post/new" className="-mt-5 flex flex-1 flex-col items-center gap-0.5 text-xs font-semibold">
          <span className="grid size-14 place-items-center rounded-full border-4 border-card bg-secondary text-secondary-foreground shadow-card">
            <PlusCircle className="size-7" />
          </span>
          పోస్ట్ Post
        </Link>
        <Link to="/dashboard" className={tab} activeProps={active}>
          <User className="size-6" />
          నా పేజీ
        </Link>
        <Link to="/notifications" className={tab} activeProps={active}>
          <Inbox className="size-6" />
          అలర్ట్స్
        </Link>
      </nav>
    </div>
  );
}
