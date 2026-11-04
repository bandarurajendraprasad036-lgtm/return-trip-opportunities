import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { saveServiceProfile } from "@/lib/service-profile.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Upload } from "lucide-react";

const editorQuery = queryOptions({ queryKey: ["service-editor"], queryFn: async () => {
  const { data: auth } = await supabase.auth.getUser(); if (!auth.user) throw new Error("నమోదు అవసరం");
  const [profile, photos] = await Promise.all([supabase.from("service_profiles").select("*").eq("user_id", auth.user.id).maybeSingle(), supabase.from("service_photos").select("*").eq("user_id", auth.user.id)]);
  if (profile.error || photos.error) throw new Error("వివరాలు తెరుచుకోలేదు");
  return { id: auth.user.id, profile: profile.data, photos: photos.data ?? [] };
} });
export const Route = createFileRoute("/_authenticated/service-profile")({
  loader: ({ context }) => context.queryClient.ensureQueryData(editorQuery),
  head: () => ({ meta: [{ title: "నా సేవల పరిచయం — గాయత్రి వన్" }, { name: "description", content: "మీ సేవలు, ఫోటోలు, పంచుకునే పరిచయం సిద్ధం చేయండి." }, { property: "og:title", content: "నా సేవల పరిచయం — గాయత్రి వన్" }, { property: "og:description", content: "గాయత్రి వన్ సేవల పరిచయ వివరాలు." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  errorComponent: () => <p role="alert" className="p-4">వివరాలు తెరుచుకోలేదు · Could not load</p>, notFoundComponent: () => <p>పరిచయం లేదు · Not found</p>, component: Editor,
});
function Editor() {
  const { data } = useSuspenseQuery(editorQuery);
  const queryClient = useQueryClient();
  const [name, setName] = useState(data.profile?.display_name ?? "");
  const [service, setService] = useState(data.profile?.service ?? "");
  const [bio, setBio] = useState(data.profile?.bio ?? "");
  const [photo, setPhoto] = useState(data.profile?.photo_path ?? "");
  const [published, setPublished] = useState(data.profile?.published ?? false);
  const [consent, setConsent] = useState(false);
  const [photos, setPhotos] = useState(data.photos);
  const [busy, setBusy] = useState(false);
  const save = useServerFn(saveServiceProfile);
  const store = async () => { await save({ data: { name, service, bio, photo, published } }); await queryClient.invalidateQueries({ queryKey: ["service-editor"] }); };
  const upload = async (file: File | undefined, avatar: boolean) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) { toast.error("5 మెగాబైట్లలోపు ఫోటో ఇవ్వండి · JPEG, PNG or WebP under 5MB"); return; }
    if (!consent) { toast.error("ఫోటో అనుమతి ఎంచుకోండి · Confirm photo permission"); return; }
    setBusy(true);
    const path = `${data.id}/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
    try {
      await store();
      const result = await supabase.storage.from("service-photos").upload(path, file, { contentType: file.type }); if (result.error) throw result.error;
      if (avatar) { await save({ data: { name, service, bio, photo: path, published } }); setPhoto(path); }
      else { const row = await supabase.from("service_photos").insert({ user_id: data.id, path, caption: "" }).select().single(); if (row.error) throw row.error; setPhotos((p) => [...p, row.data]); }
      toast.success("ఫోటో సేవ్ అయింది · Photo saved");
    } catch { toast.error("ఫోటో సేవ్ కాలేదు · Upload failed"); } finally { setBusy(false); }
  };
  return <form className="space-y-4 p-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); try { await store(); toast.success("పరిచయం సేవ్ అయింది · Profile saved"); } catch { toast.error("పరిచయం సేవ్ కాలేదు"); } finally { setBusy(false); } }}>
    <h1 className="text-2xl font-bold">నా సేవల పరిచయం · My services</h1>
    <div><Label htmlFor="profile-name">పేరు · Name</Label><Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required /></div>
    <div><Label htmlFor="profile-service">సేవలు · Services</Label><Input id="profile-service" value={service} onChange={(e) => setService(e.target.value)} maxLength={100} required /></div>
    <div><Label htmlFor="profile-bio">చేసిన పనుల వివరాలు · Work history</Label><Textarea id="profile-bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={1000} /></div>
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />ఫోటోలు పెట్టడానికి నాకు అనుమతి ఉంది · I have permission to publish these photos</label>
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />ఈ పరిచయాన్ని అందరికీ చూపించండి · Make this service profile public</label>
    <div className="grid gap-3"><Label className="flex items-center gap-2"><Upload />నా ఫోటో · Profile photo<Input aria-label="నా ఫోటో" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => void upload(e.target.files?.[0], true)} /></Label>
    <Label className="flex items-center gap-2"><Upload />పని ఫోటో · Work photo<Input aria-label="పని ఫోటో" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => void upload(e.target.files?.[0], false)} /></Label></div>
    {photos.map((p, i) => <div key={p.id} className="flex items-center justify-between border-b py-2"><span>పని ఫోటో · Work photo {i + 1}</span><Button type="button" variant="ghost" size="icon" aria-label="ఫోటో తొలగించు" onClick={async () => { const r = await supabase.from("service_photos").delete().eq("id", p.id); if (r.error) { toast.error("తొలగించలేదు"); return; } await supabase.storage.from("service-photos").remove([p.path]); setPhotos((v) => v.filter((f) => f.id !== p.id)); }}><Trash2 /></Button></div>)}
    <Button className="w-full" disabled={busy} type="submit">సేవ్ చేయండి · Save</Button>
    {published && <Button asChild variant="outline" className="w-full"><Link to="/profile/$userId" params={{ userId: data.id }}>నా పరిచయం చూడండి · View profile</Link></Button>}
  </form>;
}