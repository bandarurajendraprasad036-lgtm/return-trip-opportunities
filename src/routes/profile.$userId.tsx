import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getServiceProfile, recordServiceView } from "@/lib/service-profile.functions";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Heart, Share2, Eye, Star } from "lucide-react";
import { Brand } from "@/components/Brand";
import { toast } from "sonner";
const profileQuery = (id: string) => queryOptions({ queryKey: ["service-profile", id], queryFn: () => getServiceProfile({ data: { id } }) });
export const Route = createFileRoute("/profile/$userId")({
  loader: ({ params, context }) => context.queryClient.ensureQueryData(profileQuery(params.userId)),
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.profile.display_name || "సేవల పరిచయం"} — గాయత్రి వన్` }, { name: "description", content: loaderData?.profile.service || "గాయత్రి వన్ సేవల పరిచయం" }, { property: "og:title", content: `${loaderData?.profile.display_name || "సేవల పరిచయం"} — గాయత్రి వన్` }, { property: "og:description", content: loaderData?.profile.service || "సేవలు, పనుల ఫోటోలు, అభిప్రాయాలు" }, { property: "og:type", content: "profile" }, { name: "twitter:card", content: "summary" }] }),
  errorComponent: () => <p role="alert" className="p-4">పరిచయం తెరుచుకోలేదు · Could not load profile</p>, notFoundComponent: () => <p>పరిచయం లేదు · Not found</p>, component: Profile,
});
function Profile() {
  const { userId } = Route.useParams(); const { data } = useSuspenseQuery(profileQuery(userId));
  const { data: me } = useMe(); const qc = useQueryClient(); const view = useServerFn(recordServiceView);
  const [body, setBody] = useState(""); const [rating, setRating] = useState(5); const [busy, setBusy] = useState(false);
  const { data: liked } = useQuery({ queryKey: ["service-like", userId, me?.id], enabled: !!me, queryFn: async () => !!(await supabase.from("service_likes").select("user_id").eq("profile_id", userId).eq("user_id", me?.id ?? "").maybeSingle()).data });
  useEffect(() => {
    if (!data) return;
    let visitor = localStorage.getItem("gayatri-viewer"); if (!visitor) { visitor = crypto.randomUUID(); localStorage.setItem("gayatri-viewer", visitor); }
    void crypto.subtle.digest("SHA-256", new TextEncoder().encode(visitor)).then((hash) => view({ data: { id: userId, visitor: Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("") } })).catch(() => {});
  }, [userId, view, data?.profile.user_id]);
  if (!data) return <main className="mx-auto max-w-md p-5"><Brand /><p className="mt-5">ఈ పరిచయం అందరికీ అందుబాటులో లేదు · Profile unavailable</p><Link to="/">ముఖ్య పేజీ · Home</Link></main>;
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["service-profile", userId] }); void qc.invalidateQueries({ queryKey: ["service-like", userId] }); };
  return <main className="mx-auto min-h-screen max-w-md space-y-5 bg-background p-4">
    <Link to="/"><Brand /></Link>
    <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">{data.photo ? <img className="size-20 rounded-full object-cover" src={data.photo} alt={data.profile.display_name} /> : <span className="grid size-20 place-items-center rounded-full bg-accent text-3xl">{data.profile.display_name.slice(0, 1)}</span>}<div className="min-w-0"><h1 className="break-words text-2xl font-bold">{data.profile.display_name}</h1><p className="break-words text-primary">{data.profile.service}</p></div></header>
    <p className="whitespace-pre-wrap break-words">{data.profile.bio}</p>
    <div className="flex items-center gap-4 text-sm"><span className="flex items-center gap-1"><Eye className="size-4" />{data.views} వీక్షణలు · Views</span><span className="flex items-center gap-1"><Heart className="size-4" />{data.likes} మెచ్చుకోలు · Likes</span></div>
    <Button className="h-auto min-h-12 w-full whitespace-normal py-3" onClick={() => { const text = `నా పరిచయం చూడండి. నేను చేసిన సేవలు, అభిప్రాయాలు చూడండి.\nView my profile, previous services and reviews.\n${window.location.origin}/profile/${userId}`; window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer"); }}><Share2 />వాట్సాప్‌లో పంచుకోండి · Share on WhatsApp</Button>
    {me ? <Button variant={liked ? "secondary" : "outline"} onClick={async () => { const result = liked ? await supabase.from("service_likes").delete().eq("profile_id", userId).eq("user_id", me.id) : await supabase.from("service_likes").insert({ profile_id: userId, user_id: me.id }); if (result.error) { toast.error("మెచ్చుకోలు సేవ్ కాలేదు"); return; } refresh(); }}><Heart />{liked ? "మెచ్చుకున్నారు · Liked" : "మెచ్చుకోండి · Like"}</Button> : <Button asChild variant="outline"><Link to="/auth">మెచ్చుకోడానికి నమోదు · Sign in to like</Link></Button>}
    {data.photos.length > 0 && <section><h2 className="mb-3 text-xl font-bold">చేసిన పనులు · Work photos</h2><div className="grid grid-cols-2 gap-2">{data.photos.map((p) => <figure key={p.id}>{p.url && <img src={p.url} alt={p.caption || "చేసిన పని"} className="aspect-square w-full rounded-lg object-cover" />}<figcaption className="break-words text-sm">{p.caption}</figcaption></figure>)}</div></section>}
    <section className="space-y-3 border-t pt-4"><h2 className="text-xl font-bold">అభిప్రాయాలు · Reviews</h2>{data.reviews.length === 0 && <p className="text-muted-foreground">ఇంకా అభిప్రాయాలు లేవు · No reviews yet</p>}{data.reviews.map((r) => <article key={r.id} className="border-b py-3"><p className="flex gap-1 text-primary">{Array.from({ length: r.rating }, (_, i) => <Star key={i} className="size-4" />)}</p><p className="mt-2 whitespace-pre-wrap break-words">{r.body}</p><time className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-IN")}</time></article>)}</section>
    {me && me.id !== userId ? <form className="space-y-3 border-t pt-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const r = await supabase.from("service_reviews").upsert({ profile_id: userId, author_id: me.id, rating, body: body.trim() }, { onConflict: "profile_id,author_id" }); setBusy(false); if (r.error) { toast.error("అభిప్రాయం సేవ్ కాలేదు"); return; } setBody(""); refresh(); toast.success("అభిప్రాయం సేవ్ అయింది · Review saved"); }}><Label htmlFor="rating">మీ అంచనా · Rating</Label><select id="rating" className="h-11 w-full rounded-md border bg-card px-3" value={rating} onChange={(e) => setRating(Number(e.target.value))}>{[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v} ★</option>)}</select><Label htmlFor="review">మీ సేవ అనుభవం · Your experience</Label><Textarea id="review" required minLength={3} maxLength={1000} value={body} onChange={(e) => setBody(e.target.value)} /><Button disabled={busy} type="submit">అభిప్రాయం ఇవ్వండి · Submit review</Button></form> : !me && <Button asChild variant="outline"><Link to="/auth">అభిప్రాయం ఇవ్వడానికి నమోదు · Sign in to review</Link></Button>}
    {me?.id === userId && <Button asChild variant="outline"><Link to="/service-profile">నా వివరాలు మార్చు · Edit profile</Link></Button>}
  </main>;
}