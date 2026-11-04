import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { indianDay } from "@/lib/daily-devotional";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { artworkFileError } from "@/lib/upload-rules";

export function AdminDevotional() {
  const [day, setDay] = useState(indianDay(new Date()));
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [fileError, setFileError] = useState("");
  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const schedule = useQuery({ queryKey: ["devotional-schedule"], queryFn: async () => {
    const { data, error } = await supabase.from("app_settings").select("key,value").like("key", "devotional:%").order("key");
    if (error) throw error;
    return Promise.all((data ?? []).filter(row => row.value).map(async row => {
      const signed = await supabase.storage.from("devotional-images").createSignedUrl(row.value, 3600);
      return { ...row, image: signed.data?.signedUrl };
    }));
  }});
  const selectedImage = schedule.data?.find(row => row.key === `devotional:${day}`)?.image;
  const selectedDate = new Date(`${day}T12:00:00`);
  const scheduledDates = (schedule.data ?? []).map(row => new Date(`${row.key.slice(11)}T12:00:00`));
  return <section className="space-y-3 border-y py-4">
    <h3 className="text-xl font-bold">అమ్మవారి చిత్రాల తేదీలు · Daily artwork</h3>
    <Calendar className="mx-auto max-w-full" mode="single" required selected={selectedDate} onSelect={date => { if (date) setDay(`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`); }} modifiers={{ scheduled: scheduledDates }} modifiersClassNames={{ scheduled: "font-bold underline text-primary" }} />
    <form className="space-y-3" onSubmit={async event => {
      event.preventDefault();
      if (!file || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
      const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as Record<string,string>)[file.type];
      const invalid = artworkFileError(file);
      if (!extension || invalid) { setFileError(invalid ?? "చిత్రం రకం సరైంది కాదు"); return; }
      setBusy(true);
      const path = `artwork/${crypto.randomUUID()}.${extension}`;
      try {
        const upload = await supabase.storage.from("devotional-images").upload(path, file, { contentType: file.type });
        if (upload.error) throw upload.error;
        const save = await supabase.from("app_settings").upsert({ key: `devotional:${day}`, value: path, updated_at: new Date().toISOString() });
        if (save.error) { await supabase.storage.from("devotional-images").remove([path]); throw save.error; }
        setFile(null);
        await qc.invalidateQueries({ queryKey: ["devotional-schedule"] });
        await qc.invalidateQueries({ queryKey: ["daily-artwork"] });
        toast.success("చిత్రం తేదీకి అమర్చాము · Scheduled");
      } catch { toast.error("చిత్రం అమరలేదు; మళ్లీ ప్రయత్నించండి · Could not schedule"); }
      finally { setBusy(false); }
    }}>
      <Label htmlFor="devotional-date">కనిపించే తేదీ · Date (India)</Label><Input id="devotional-date" type="date" value={day} onChange={event => setDay(event.target.value)} required />
      <Label htmlFor="devotional-file">గాయత్రి మాత చిత్రం · Artwork</Label><Input id="devotional-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => {
        const next = event.target.files?.[0] ?? null;
        const invalid = next ? artworkFileError(next) : null;
        setFileError(invalid ?? "");
        setFile(invalid ? null : next);
      }} required />
      {fileError && <p role="alert" className="text-destructive">{fileError}</p>}
      {(preview || selectedImage) && <figure className="space-y-2"><img src={preview || selectedImage} alt="ముందస్తు అమ్మవారి చిత్రం" className="mx-auto aspect-square w-full max-w-64 object-contain" onError={() => { setFileError("చిత్రం తెరుచుకోలేదు; మరో చిత్రం ఇవ్వండి · Unable to open image"); setFile(null); }} /><figcaption className="text-center text-sm">{day} · ముందస్తు వీక్షణ</figcaption></figure>}
      <Button disabled={busy || !file} type="submit" className="w-full">{busy ? "అమరుస్తున్నాము…" : "తేదీకి అమర్చండి · Schedule"}</Button>
    </form>
    {schedule.isError && <Button variant="outline" onClick={() => schedule.refetch()}>మళ్లీ చూడండి · Retry</Button>}
    {schedule.data?.map(row => <article key={row.key} className="flex items-center gap-3 border-b py-2">
      {row.image && <img src={row.image} alt="తేదీకి అమర్చిన అమ్మవారి చిత్రం" className="size-20 object-contain" />}
      <p className="flex-1">{row.key.slice(11)}</p>
      <Button variant="outline" disabled={busy} onClick={async () => {
        const { error } = await supabase.from("app_settings").update({ value: "" }).eq("key", row.key);
        if (error) { toast.error("తొలగించలేకపోయాము · Could not remove"); return; }
        await qc.invalidateQueries({ queryKey: ["devotional-schedule"] });
        await qc.invalidateQueries({ queryKey: ["daily-artwork"] });
      }}>తొలగించు · Remove</Button>
    </article>)}
  </section>;
}