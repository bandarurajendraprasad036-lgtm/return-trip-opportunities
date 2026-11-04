import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { AdminChatButton } from "@/components/AdminChatButton";

export const Route = createFileRoute("/_authenticated/chats")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "చాట్స్ · Chats — గాయత్రి వన్ · Gayatri One" },
      { name: "description", content: "Your conversations on గాయత్రి వన్ · Gayatri One." },
      { property: "og:title", content: "Chats — గాయత్రి వన్ · Gayatri One" },
      { property: "og:description", content: "Your conversations on గాయత్రి వన్ · Gayatri One." },
    ],
  }),
  component: Chats,
});

function Chats() {
  const { data: me } = useMe();
  const { data = [] } = useQuery({
    queryKey: ["chats", me?.id],
    enabled: !!me,
    queryFn: async () => {
      if (!me) return [];
      const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      const latest = new Map<string, (typeof data)[number]>();
      for (const m of data) {
        const other = m.sender_id === me.id ? m.receiver_id : m.sender_id;
        if (!latest.has(other)) latest.set(other, m);
      }
      const ids = [...latest.keys()];
      const { data: profiles, error: profileError } = ids.length ? await supabase.from("service_profiles").select("user_id, display_name").eq("published", true).in("user_id", ids) : { data: [], error: null };
      if (profileError) throw profileError;
      return [...latest.entries()].map(([id, last]) => ({ id, last, profile: profiles?.find((p) => p.user_id === id) }));
    },
  });

  return (
    <div className="space-y-2 p-4">
      <h2 className="text-2xl font-bold">చాట్స్ <span className="text-base font-normal text-muted-foreground">Chats</span></h2>
      <AdminChatButton />
      {data.length === 0 && (
        <div className="rounded-xl border border-dashed bg-card p-8 text-center text-muted-foreground">
          <MessageCircle className="mx-auto mb-2 size-10" />ఫీడ్‌లో "చాట్" నొక్కండి<br />Tap "Chat" on any post to start
        </div>
      )}
      {data.map((c) => (
        <Link key={c.id} to="/chat/$userId" params={{ userId: c.id }} className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-card">
          <span className="grid size-12 place-items-center rounded-full bg-accent text-lg font-bold text-accent-foreground">
            {(c.profile?.display_name || "?").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">{c.profile?.display_name || "సభ్యుడు · Member"}</p>
            <p className="truncate text-sm text-muted-foreground">{c.last.body}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
