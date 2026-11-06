import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, ImagePlus, X, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMe } from "@/lib/session";
import { useServerFn } from "@tanstack/react-start";
import { sendSupportMessage } from "@/lib/support.functions";
import { z } from "zod";
import { PostEvidence } from '@/components/PostEvidence';
import { sendChatEntry, viewChatImage } from '@/lib/chat-upload.functions';
import { CHAT_IMAGE_LIMIT, chatEntrySchema } from '@/lib/chat-rules';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

export const Route = createFileRoute("/_authenticated/chat/$userId")({
  validateSearch: (search: Record<string, unknown>): { post?: string | undefined } => ({ post: typeof search["post"] === "string" && z.string().uuid().safeParse(search["post"]).success ? search["post"] : undefined }),
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
  const { post: postId } = Route.useSearch();
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [sendError, setSendError] = useState("");
  const [phone,setPhone] = useState('');
  const [image,setImage] = useState<File | null>(null);
  const [imageUrl,setImageUrl] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const sendEntry = useServerFn(sendChatEntry);
  const showImage = useServerFn(viewChatImage);
  const {data:chatAllowed} = useQuery({queryKey:['chat-allowed',me?.id,userId,postId],enabled:!!me,queryFn:async()=>{
    const result=await supabase.rpc('can_post_chat',{...(postId ? {_post:postId} : {}),_other:userId});
    if(result.error)throw result.error;return result.data;
  }});
  const { data: contextPost } = useQuery({ queryKey: ["chat-post", postId], enabled: !!postId, queryFn: async () => {
    if (!postId) return null;
    const { data, error } = await supabase.from("posts").select("id,title,module,from_place,to_place,trip_date,vehicle_type,capacity_tons,location").eq("id", postId).maybeSingle();
    if (error) throw error; return data;
  }});

  const key = ["chat", userId, postId];
  const { data: msgs = [] } = useQuery({
    queryKey: key,
    enabled: !!me,
    queryFn: async () => {
      if (!me) return [];
      let query = supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${me.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${me.id})`);
      if (postId) query = query.eq("post_id", postId);
      const { data, error } = await query.order("created_at");
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
  }, [me, userId, postId]);

  useEffect(() => bottom.current?.scrollIntoView(), [msgs.length]);

  const sendSupport = useServerFn(sendSupportMessage);
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim().slice(0, 1000);
    if ((!body && !phone && !image) || !me || busy || !chatAllowed) return;
    setBusy(true); setSendError("");
    try {
      chatEntrySchema.parse({receiver:userId,post:postId || null,body,phone});
      if (postId || phone || image) {
        const form=new FormData();form.set('receiver',userId);form.set('post',postId || '');form.set('body',body);form.set('phone',phone);if(image)form.set('image',image);
        await sendEntry({data:form});
      } else await sendSupport({ data: { adminId: userId, body } });
      setText('');setPhone('');setImage(null);if(fileInput.current)fileInput.current.value='';
      await qc.invalidateQueries({ queryKey: key });
      await qc.invalidateQueries({ queryKey: ["chats"] });
    } catch { setSendError("సందేశం పంపలేకపోయాం. మళ్లీ ప్రయత్నించండి · Could not send. Please retry."); }
    finally { setBusy(false); }
  };

  return (
    <div className="flex h-[calc(100svh-12rem)] min-h-80 flex-col">
      <div className="flex items-center gap-3 border-b bg-card px-3 py-2">
        <Link to="/chats" aria-label="Back"><ArrowLeft /></Link>
        <div className="flex-1">
          <p className="font-bold">{"సభ్యుడు · Member"}</p>
        </div>
      </div>
      {contextPost && <section className="space-y-1 border-b bg-muted px-3 py-3 text-sm" aria-label="ప్రయాణ వివరాలు · Route details"><p className="font-bold">{contextPost.title}</p>{contextPost.module === "vehicle" ? <><p>{contextPost.from_place} → {contextPost.to_place}</p><p>{contextPost.vehicle_type} {contextPost.capacity_tons != null && `· ${contextPost.capacity_tons} టన్నులు · tons`} · {contextPost.trip_date}</p></> : <p>{contextPost.location}</p>}</section>}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {postId && <PostEvidence postId={postId} admin={!!me?.isAdmin}/>}
        {msgs.length === 0 && <p className="pt-10 text-center text-muted-foreground">నమస్కారం చెప్పండి 🙏 Say hello</p>}
        {msgs.map((m) => {
          const mine = m.sender_id === me?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] space-y-2 break-words rounded-2xl px-3 py-2 text-base ${mine ? "bg-primary text-primary-foreground" : "bg-card shadow-card"}`}>
                <p className="whitespace-pre-wrap">{m.body.replace(/\/chat\/[0-9a-f-]{36}/g,'ప్రకటన గంట నొక్కండి · Ring listing bell')}</p>
                {m.chat_phone && <p className="flex items-center gap-1"><Phone className="size-4" />{m.chat_phone}</p>}
                {m.image_path && <Button variant="outline" onClick={async()=>{try{const result=await showImage({data:{message:m.id}});setImageUrl(result.url);}catch{setSendError('చిత్రం తెరవలేకపోయాం · Image unavailable');}}}><ImagePlus />ఫోటో చూడండి · View image</Button>}
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      {sendError && <p role="alert" className="px-3 py-2 text-sm text-destructive">{sendError}</p>}
      {chatAllowed===false && <p role="alert" className="px-3 py-2">ముందుగా ప్రకటన గంట నొక్కండి · Ring the post bell first</p>}
      <form onSubmit={send} className="space-y-2 border-t bg-card p-2">
        <Input type="tel" inputMode="numeric" aria-label="ఫోన్ నంబరు · Phone number" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,''))} maxLength={10} placeholder="ఫోన్ నంబరు · Phone number" disabled={busy || !chatAllowed} />
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e=>{const file=e.target.files?.[0];if(file && (file.size>CHAT_IMAGE_LIMIT || !['image/jpeg','image/png','image/webp'].includes(file.type))){setSendError('ఐదు మెగాబైట్ల లోపు చిత్రం ఎంచుకోండి · Choose an image under 5MB');e.target.value='';return;}setImage(file || null);setSendError('');}} />
        {image && <div className="flex items-center gap-2 text-sm"><span className="min-w-0 flex-1 truncate">{image.name}</span><Button type="button" variant="ghost" size="icon" aria-label="చిత్రం తీసేయండి · Remove image" onClick={()=>{setImage(null);if(fileInput.current)fileInput.current.value='';}}><X /></Button></div>}
        <div className="flex gap-2"><Button type="button" variant="outline" size="icon" aria-label="వాట్సాప్ చిత్రం పంపండి · Upload WhatsApp screenshot" disabled={busy || !chatAllowed} onClick={()=>fileInput.current?.click()}><ImagePlus /></Button><Input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="మీ సమాచారం · Your message" className="h-12 min-w-0 text-base" disabled={busy || !chatAllowed} /><Button type="submit" disabled={busy || !chatAllowed || (!text.trim() && !phone && !image)} size="icon" className="size-12 shrink-0" aria-label="పంపండి · Send"><Send /></Button></div>
      </form>
      <Dialog open={!!imageUrl} onOpenChange={open=>{if(!open)setImageUrl('');}}><DialogContent><DialogTitle>వ్యక్తిగత చిత్రం · Private image</DialogTitle>{imageUrl && <img src={imageUrl} alt="సంభాషణ చిత్రం · Chat image" className="max-h-[70svh] w-full object-contain" />}</DialogContent></Dialog>
    </div>
  );
}
