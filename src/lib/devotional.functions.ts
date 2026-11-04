import { createServerFn } from "@tanstack/react-start";
import { indianDay } from "@/lib/daily-devotional";

/** Publishes only the scheduled devotional artwork, never arbitrary storage paths. */
export const getDailyArtwork = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const day = indianDay(new Date());
  const { data, error } = await supabaseAdmin.from("app_settings").select("value").eq("key", `devotional:${day}`).maybeSingle();
  if (error) throw error;
  const path = data?.value;
  if (!path || !/^artwork\/[a-f0-9-]+\.(jpg|png|webp)$/.test(path)) return null;
  const signed = await supabaseAdmin.storage.from("devotional-images").createSignedUrl(path, 3600);
  if (signed.error) throw signed.error;
  const browserOrigin = import.meta.env['VITE_SUPABASE_URL'];
  if (!browserOrigin) return null;
  const signedUrl = new URL(signed.data.signedUrl);
  return `${browserOrigin.replace(/\/$/, "")}${signedUrl.pathname}${signedUrl.search}`;
});