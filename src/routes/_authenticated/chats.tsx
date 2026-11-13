import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { AdminChatButton } from "@/components/AdminChatButton";
import { replyGroupKey } from "@/lib/vehicle-experience";
import { Button } from "@/components/ui/button";
import { hidePaymentEvidence } from '@/lib/payment-status';

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
  const [opened, setOpened] = useState<string | null>(null);
  const { data = [], isPending, isError, refetch } = useQuery({
    queryKey: ["chats", me?.id],
    enabled: !!me,
    refetchInterval: 10000,
    queryFn: async () => {
      if (!me) return [];
      const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      const admin=await supabase.rpc('support_admin_id');if(admin.error)throw admin.error;
      for(const message of data){if(hidePaymentEvidence(message.body,message.sender_id===admin.data||message.receiver_id===admin.data,me.isAdmin)){message.body='చెల్లింపు పరిశీలనలో ఉంది';message.image_path='';}}
      const ids = [...new Set(data.map(m => m.sender_id === me.id ? m.receiver_id : m.sender_id))];
      const { data: profiles, error: profileError } = ids.length ? await supabase.from("service_profiles").select("user_id, display_name").eq("published", true).in("user_id", ids) : { data: [], error: null };
      if (profileError) throw profileError;
      const postIds = [...new Set(data.map(m => m.post_id).filter((id): id is string => !!id))];
      const { data: posts, error: postsError } = postIds.length ? await supabase.from("posts").select("id,title,from_place,to_place,vehicle_type,capacity_tons").in("id", postIds) : { data: [], error: null };
      if (postsError) throw postsError;
      const groups = new Map<string, typeof data>();
      for (const message of data) {
        const group = replyGroupKey(message, me.id);
        const existing = groups.get(group) ?? []; existing.push(message); groups.set(group, existing);
      }
      return [...groups.entries()].map(([id, messages]) => {
        const participants = [...new Set(messages.map(m => m.sender_id === me.id ? m.receiver_id : m.sender_id))];
        return { id, last: messages[0], post: posts?.find(p => p.id === id), participants: participants.map(userId => ({ id: userId, name: profiles?.find(p => p.user_id === userId)?.display_name || "సభ్యుడు · Member" })), messages };
      });
    },
  });

  return (
    <div className="space-y-2 p-4">
      <h2 className="text-2xl font-bold">చాట్స్ <span className="text-base font-normal text-muted-foreground">Chats</span></h2>
      <AdminChatButton />
      {isPending && <p className="text-sm text-muted-foreground">సమాధానాలు తెస్తున్నాం · Loading replies</p>}
      {isError && <Button variant="outline" onClick={() => refetch()}>మళ్లీ ప్రయత్నించండి · Retry</Button>}
      {!isPending && !isError && data.length === 0 && (
        <div className="rounded-xl border border-dashed bg-card p-8 text-center text-muted-foreground">
          <MessageCircle className="mx-auto mb-2 size-10" />ఫీడ్‌లో "చాట్" నొక్కండి<br />Tap "Chat" on any post to start
        </div>
      )}
      {data.map(c => <article key={c.id} className="space-y-3 rounded-lg border bg-card p-3">
        <Button variant="ghost" className="h-auto w-full justify-start whitespace-normal px-0 text-left" onClick={() => setOpened(opened === c.id ? null : c.id)}><MessageCircle className="size-5 shrink-0" /><span className="min-w-0"><span className="block font-bold">{c.post?.title || c.participants[0]?.name}</span>{c.post && <span className="block text-xs text-muted-foreground">{c.post.from_place} → {c.post.to_place} · {c.participants.length} మంది · replies</span>}<span className="block line-clamp-1 text-sm font-normal text-muted-foreground">{c.last?.body}</span></span></Button>
        {opened === c.id && <div className="space-y-3 border-t pt-3">
          {c.post && <p className="text-sm">{c.post.vehicle_type} {c.post.capacity_tons != null && `· ${c.post.capacity_tons} టన్నులు · tons`}</p>}
          <div className="max-h-72 space-y-2 overflow-y-auto">{[...c.messages].reverse().map(m => <div key={m.id} className="border-l-2 border-secondary pl-3 text-sm"><p className="font-bold">{m.sender_id === me?.id ? "మీరు · You" : c.participants.find(p => p.id === m.sender_id)?.name}</p><p className="whitespace-pre-wrap break-words">{m.body}</p></div>)}</div>
          {c.participants.map(person => <Button asChild key={person.id} variant="outline" className="h-auto min-h-11 w-full whitespace-normal"><Link to="/chat/$userId" params={{ userId: person.id }} search={{ post: c.post?.id }}> {person.name} · మాట్లాడండి</Link></Button>)}
        </div>}
      </article>)}
    </div>
  );
}
