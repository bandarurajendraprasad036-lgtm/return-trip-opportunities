import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const profileSchema = z.object({ user_id: z.string(), display_name: z.string(), service: z.string(), bio: z.string(), photo_path: z.string(), published: z.boolean() });
const payloadSchema = z.object({ profile: profileSchema, photos: z.array(z.object({ id: z.string(), path: z.string(), caption: z.string() })), reviews: z.array(z.object({ id: z.string(), rating: z.number(), body: z.string(), created_at: z.string(), author_name: z.string(), author_photo: z.string(), author_public_id: z.string().nullable() })), likes: z.number(), views: z.number() });
export const getServiceProfile = createServerFn({ method: "GET" }).inputValidator((data: { id: string }) => ({ id: z.string().uuid().parse(data.id) })).handler(async ({ data }) => {
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']!;
  const client = createClient(process.env['SUPABASE_URL']!, key, { auth: { persistSession: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers); if (headers.get("Authorization") === `Bearer ${key}` && key.startsWith("sb_")) headers.delete("Authorization"); headers.set("apikey", key); return fetch(input, { ...init, headers });
  } } });
  const result = await client.rpc("service_profile_data", { _id: data.id });
  if (result.error) throw new Error("పరిచయం తెరుచుకోలేదు · Could not load profile");
  if (!result.data) return null;
  const value = payloadSchema.parse(result.data);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const image = async (path: string, owner = data.id) => {
    if (!path.startsWith(`${owner}/`)) return "";
    const { data: signed } = await supabaseAdmin.storage.from("service-photos").createSignedUrl(path, 300);
    if (!signed) return "";
    return signed.signedUrl.replace(process.env['SUPABASE_URL']!, import.meta.env['VITE_SUPABASE_URL']);
  };
  return { ...value, photo: await image(value.profile.photo_path), photos: await Promise.all(value.photos.map(async (p) => ({ ...p, url: await image(p.path) }))), reviews: await Promise.all(value.reviews.map(async (r) => ({ ...r, author_photo: r.author_public_id ? await image(r.author_photo, r.author_public_id) : "" }))) };
});

export const recordServiceView = createServerFn({ method: "POST" }).inputValidator((d: { id: string; visitor: string }) => ({ id: z.string().uuid().parse(d.id), visitor: z.string().regex(/^[a-f0-9]{64}$/).parse(d.visitor) })).handler(async ({ data }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.rpc("record_service_view", { _id: data.id, _visitor: data.visitor });
  if (error) throw new Error("వీక్షణ లెక్క సేవ్ కాలేదు");
  return true;
});

export const saveServiceProfile = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d: { name: string; service: string; bio: string; photo: string; published: boolean }) => z.object({ name: z.string().trim().min(1).max(80), service: z.string().trim().min(1).max(100), bio: z.string().max(1000), photo: z.string().max(200), published: z.boolean() }).parse(d)).handler(async ({ data, context }) => {
  const { error } = await context.supabase.rpc("save_service_profile", { _name: data.name, _service: data.service, _bio: data.bio, _photo: data.photo, _published: data.published });
  if (error) throw new Error("పరిచయం సేవ్ కాలేదు · Could not save profile");
  return true;
});