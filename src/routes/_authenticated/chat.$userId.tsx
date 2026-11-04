import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMe } from "@/lib/session";
import { useServerFn } from "@tanstack/react-start";
import { sendSupportMessage } from "@/lib/support.functions";

export const Route = createFileRoute("/_authenticated/chat/$userId")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "చాట్ · Chat — గాయత్రి వన్ · Gayatri One" },
      { name: "description", content: "Chat directly with a గాయత్రి వన్ · Gayatri One member." },
      { property: "og:title", content: "Chat — గాయత్రి వన్ · Gayatri One" },
      { property: "og:description", content: "Chat directly with a గాయత్రి వన్ · Gayatri One member." },
    ],
  }),
  component: Chat,
});

function Chat() {
  const { userId } = Route.useParams();
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  const { data: other } = useQuery({
    queryKey: ["chat-public-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_profiles").select("display_name").eq("user_id", userId).eq("published", true).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const key = ["chat", userId];
  const { data: msgs = [] } = useQuery({
    queryKey: key,
    enabled: !!me,
    queryFn: async () => {
      if (!me) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${me.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${me.id})`)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!me) return;
    const ch = supabase
      .channel(`chat-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${me.id}` }, () =>
        qc.invalidateQueries({ queryKey: key }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, userId]);

  useEffect(() => bottom.current?.scrollIntoView(), [msgs.length]);

  const sendSupport = useServerFn(sendSupportMessage);
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim().slice(0, 1000);
    if (!body || !me) return;
    setText("");
    try { await sendSupport({ data: { adminId: userId, body } }); }
    catch { await supabase.from("messages").insert({ sender_id: me.id, receiver_id: userId, body }); }
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ["chats"] });
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col">
      <div className="flex items-center gap-3 border-b bg-card px-3 py-2">
        <Link to="/chats" aria-label="Back"><ArrowLeft /></Link>
        <div className="flex-1">
          <p className="font-bold">{other?.display_name || "సభ్యుడు · Member"}</p>
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {msgs.length === 0 && <p className="pt-10 text-center text-muted-foreground">నమస్కారం చెప్పండి 🙏 Say hello</p>}
        {msgs.map((m) => {
          const mine = m.sender_id === me?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <p className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-base ${mine ? "bg-primary text-primary-foreground" : "bg-card shadow-card"}`}>
                {m.body.split(/(\/chat\/[0-9a-f-]{36})/).map((part, i) => {
                  const id = part.match(/^\/chat\/([0-9a-f-]{36})$/)?.[1];
                  return id
                    ? <Link key={i} to="/chat/$userId" params={{ userId: id }} className="font-bold text-primary underline">💬 చాట్ చేయండి · Chat</Link>
                    : <span key={i}>{part}</span>;
                })}
              </p>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t bg-card p-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="సందేశం · Message" className="h-12 text-base" />
        <Button type="submit" size="icon" className="size-12" aria-label="Send"><Send /></Button>
      </form>
    </div>
  );
}
