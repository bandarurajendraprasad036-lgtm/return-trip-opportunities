import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { JOB_CATEGORIES } from "@/lib/jobs";
import { z } from "zod";
import { Briefcase, Truck, UserSearch, Users, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/lib/session";
import type { Kind } from "@/lib/match";
import { useServerFn } from "@tanstack/react-start";
import { checkPostText } from "@/lib/moderation.functions";
import { Sparkles } from "lucide-react";
import { draftJobAd, type JobAdDraft } from "@/lib/ai-job-ad.functions";
import { buildJobAdInput } from "@/lib/job-ad-input";

function AiJobAd({ kind, onDraft }: { kind: "seeker" | "employer"; onDraft: (d: JobAdDraft) => void }) {
  const run = useServerFn(draftJobAd);
  const [text, setText] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [salary, setSalary] = useState("");
  const [location, setLocation] = useState("");
  const [draft, setDraft] = useState<JobAdDraft | null>(null);
  const previewRef = useRef<HTMLElement>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (draft) previewRef.current?.scrollIntoView({ behavior: "auto", block: "center" });
  }, [draft]);
  const draftInput = kind === "seeker" ? buildJobAdInput({ text, skills, experience, salary, location }) : text.trim();
  const go = async () => {
    setBusy(true);
    try {
      const d = await run({ data: { text: draftInput, kind } });
      onDraft(d);
      setDraft(d);
      toast.success("AI ప్రకటన రెడీ! కింద చూసి సరిచేయండి · Ad ready, check below");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="space-y-3">
    <div className="space-y-2 rounded-xl border-2 border-dashed border-primary/40 bg-card p-3">
      <p className="font-bold">✨ AI తో ప్రకటన రాయండి · Write ad with AI</p>
      {kind === "seeker" && (
        <div className="grid min-w-0 gap-3">
          <div className="space-y-1"><Label htmlFor="ad-skills">నైపుణ్యాలు · Skills</Label><Input id="ad-skills" value={skills} onChange={(e) => setSkills(e.target.value)} maxLength={100} disabled={busy} /></div>
          <div className="space-y-1"><Label htmlFor="ad-experience">అనుభవం · Experience</Label><Input id="ad-experience" value={experience} onChange={(e) => setExperience(e.target.value)} maxLength={100} disabled={busy} /></div>
          <div className="space-y-1"><Label htmlFor="ad-salary">ఆశించిన జీతం · Expected salary</Label><Input id="ad-salary" value={salary} onChange={(e) => setSalary(e.target.value)} maxLength={40} disabled={busy} /></div>
          <div className="space-y-1"><Label htmlFor="ad-location">పని కావాల్సిన ప్రాంతం · Work location</Label><Input id="ad-location" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={80} disabled={busy} /></div>
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        {kind === "seeker"
          ? "మీ పని, అనుభవం, ఊరు, జీతం మీ మాటల్లో చెప్పండి · Describe your skills & wanted work"
          : "ఏ పనివాడు కావాలి, ఎక్కడ, జీతం చెప్పండి · Describe the worker you need"}
      </p>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} className="text-base" placeholder={kind === "seeker" ? "e.g. నేను 5 సంవత్సరాలు ట్రాక్టర్ డ్రైవర్, గుంటూరు దగ్గర పని కావాలి, రోజుకు 700" : "e.g. విజయవాడలో షాప్ కి హెల్పర్ కావాలి, నెలకు 12000"} />
      <Button type="button" className="h-auto min-h-12 w-full whitespace-normal px-2 py-2" size="lg" disabled={busy || draftInput.length < 3 || draftInput.length > 1000} onClick={go}>
        <Sparkles />{busy ? "రాస్తోంది... Writing..." : "ప్రకటన తయారు చేయి · Create ad"}
      </Button>
    </div>
    {draft && (
      <section ref={previewRef} aria-label="తయారైన ఉద్యోగ ప్రకటన" aria-live="polite" className="min-w-0 space-y-3 border-y border-primary/30 py-4">
        <h3 className="text-lg font-bold">తయారైన ప్రకటన · Ad preview</h3>
        <p className="break-words text-lg font-semibold">{draft.skill}</p>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
          {draft.location && <><dt className="text-muted-foreground">ప్రాంతం · Location</dt><dd className="min-w-0 break-words">{draft.location}</dd></>}
          {draft.salary && <><dt className="text-muted-foreground">జీతం · Salary</dt><dd className="min-w-0 break-words">{draft.salary}</dd></>}
        </dl>
        <p className="whitespace-pre-wrap break-words text-base leading-relaxed">{draft.description}</p>
      </section>
    )}
    </section>
  );
}

export const Route = createFileRoute("/_authenticated/post/new")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "కొత్త పోస్ట్ · New Post — గాయత్రి వన్ · Gayatri One" },
      { name: "description", content: "గాయత్రి వన్ · Gayatri One — Post a job need, worker need or return vehicle trip." },
      { property: "og:title", content: "New Post — గాయత్రి వన్ · Gayatri One" },
      { property: "og:description", content: "గాయత్రి వన్ · Gayatri One — Post a job need, worker need or return vehicle trip." },
    ],
  }),
  component: NewPost,
});

const OPTIONS: { kind: Kind; module: "job" | "vehicle"; te: string; en: string; icon: typeof Briefcase; tone: string }[] = [
  { kind: "seeker", module: "job", te: "నాకు ఉద్యోగం కావాలి", en: "I need a job", icon: UserSearch, tone: "bg-job" },
  { kind: "employer", module: "job", te: "నాకు పనివాడు కావాలి", en: "I need an employee", icon: Users, tone: "bg-job" },
  { kind: "owner", module: "vehicle", te: "ఖాళీ రిటర్న్ ట్రిప్ ఉంది", en: "Empty return trip", icon: Truck, tone: "bg-vehicle" },
  { kind: "business", module: "vehicle", te: "రిటర్న్ వాహనం కావాలి", en: "Need return vehicle", icon: Package, tone: "bg-vehicle" },
];

const txt = (max: number) => z.string().trim().min(1, "అవసరం / Required").max(max);

function NewPost() {
  const { data: me } = useMe();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [kind, setKind] = useState<Kind | null>(null);
  const [f, setF] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const checkText = useServerFn(checkPostText);
  useEffect(() => {
    const profile = me?.profile;
    if (!profile) return;
    setF((prev) => ({
      ...prev,
      location: prev["location"] || profile.location,
      contact_phone: prev["contact_phone"] || profile.phone,
    }));
  }, [me, kind]);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  if (!kind) {
    return (
      <div className="space-y-3 p-4">
        <h2 className="text-2xl font-bold">మీకు ఏమి కావాలి?</h2>
        <p className="-mt-2 text-muted-foreground">What do you want to post?</p>
        {OPTIONS.map((o) => (
          <button key={o.kind} onClick={() => setKind(o.kind)} className="flex w-full items-center gap-4 rounded-xl border bg-card p-4 text-left shadow-card active:scale-[0.98]">
            <span className={`grid size-14 place-items-center rounded-xl text-primary-foreground ${o.tone}`}><o.icon className="size-7" /></span>
            <span><span className="block text-lg font-bold">{o.te}</span><span className="text-muted-foreground">{o.en}</span></span>
          </button>
        ))}
      </div>
    );
  }

  const opt = OPTIONS.find((o) => o.kind === kind);
  if (!opt) return null;
  const isJob = opt.module === "job";

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!me) return;
    const schema = isJob
      ? z.object({ location: txt(80), skill: txt(100), salary: z.string().trim().max(40).optional(), description: z.string().trim().max(500).optional(), contact_phone: z.string().trim().max(15).optional(), category: z.string().max(30).optional(), show_contact: z.string().optional() })
      : z.object({ from_place: txt(80), to_place: txt(80), trip_date: txt(10), ...(kind === "owner" ? { vehicle_type: txt(60) } : { goods_type: txt(80) }), description: z.string().trim().max(500).optional(), contact_phone: z.string().trim().max(15).optional() });
    const r = schema.safeParse(f);
    if (!r.success) { const i = r.error.issues[0]; toast.error(`${String(i?.path[0] ?? "")}: ${i?.message ?? ""}`); return; }
    const { show_contact, ...v } = r.data as Record<string, string>;
    const title = isJob
      ? kind === "seeker" ? `${v["skill"]} పని కావాలి` : `${v["skill"]} కోసం పనివాడు కావాలి`
      : kind === "owner" ? `${v["vehicle_type"]} ఖాళీగా వస్తోంది` : `${v["goods_type"]} కోసం వాహనం కావాలి`;
    setBusy(true);
    const mod = await checkText({ data: { text: Object.values(v).join(" \n ") } }).catch(() => ({ ok: true }));
    if (!mod.ok) { setBusy(false); toast.error("🚫 బూతులు, చెడు మాటలు, దేశ వ్యతిరేక విషయాలు పోస్ట్ చేయకూడదు · Abusive or anti-national content is not allowed"); return; }
    const { error } = await supabase.from("posts").insert({ ...v, show_contact: show_contact === "1", user_id: me.id, module: opt.module, kind, title });
    setBusy(false);
    if (error) { toast.error(error.message.includes("BAD_CONTENT") ? "🚫 బూతులు, చెడు మాటలు, దేశ వ్యతిరేక విషయాలు పోస్ట్ చేయకూడదు · Abusive or anti-national content is not allowed" : error.message); return; }
    toast.success("పోస్ట్ అయ్యింది! మ్యాచ్ వస్తే అలర్ట్ వస్తుంది · Posted! You'll be alerted on a match");
    qc.invalidateQueries();
    nav({ to: "/my-posts" });
  };

  const field = (k: string, te: string, en: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="space-y-1">
      <Label className="text-base">{te} · {en}</Label>
      <Input className="h-12 text-lg" value={f[k] ?? ""} onChange={set(k)} maxLength={100} {...props} />
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4 p-4">
      <div className={`flex items-center gap-3 rounded-xl p-3 text-primary-foreground ${opt.tone}`}>
        <opt.icon className="size-7" />
        <div><p className="text-lg font-bold">{opt.te}</p><p className="text-sm opacity-90">{opt.en}</p></div>
        <button type="button" onClick={() => setKind(null)} className="ml-auto text-sm underline">మార్చు</button>
      </div>
      {isJob ? (
        <>
          <AiJobAd kind={kind as "seeker" | "employer"} onDraft={(d) => setF((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(d).filter(([, v]) => v)) }))} />
          {field("location", "ఊరు / ప్రాంతం", "Location", { placeholder: "e.g. Guntur" })}
          {field("skill", kind === "seeker" ? "మీ పని నైపుణ్యం" : "ఏ పని", kind === "seeker" ? "Skill" : "Work", { placeholder: "e.g. Driver, Mason, Farm work" })}
          <div className="space-y-1">
            <Label className="text-base">పని రకం · Category</Label>
            <select className="h-12 w-full rounded-md border bg-card px-3 text-lg" value={f["category"] ?? ""} onChange={(e) => setF({ ...f, category: e.target.value })}>
              <option value="">—</option>
              {JOB_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.te} · {c.en}</option>)}
            </select>
          </div>
          {field("salary", kind === "seeker" ? "ఆశించే జీతం" : "జీతం", kind === "seeker" ? "Expected salary" : "Salary", { placeholder: "e.g. 15000/month or 600/day" })}
        </>
      ) : (
        <>
          {field("from_place", "ఎక్కడి నుండి", "From", { placeholder: "e.g. Hyderabad" })}
          {field("to_place", "ఎక్కడికి", "To", { placeholder: "e.g. Warangal" })}
          {field("trip_date", "తేదీ", "Date", { type: "date" })}
          {kind === "owner"
            ? field("vehicle_type", "వాహనం రకం", "Vehicle type", { placeholder: "e.g. Tata Ace, Lorry 10 ton, Tractor" })
            : field("goods_type", "సరుకు రకం", "Goods type", { placeholder: "e.g. Rice bags, Cement" })}
        </>
      )}
      {isJob && (
        <label className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm">
          <input type="checkbox" className="mt-1 size-5" disabled={!me?.profile?.is_prime} checked={f["show_contact"] === "1"} onChange={(e) => setF({ ...f, show_contact: e.target.checked ? "1" : "" })} />
          <span>⭐ ఫోన్ నంబర్ చూపించు (Prime మాత్రమే) · Show my phone (Prime only).<br /><span className="text-muted-foreground">ఉచిత పోస్ట్‌లో పేరు, ఫోన్ దాచబడతాయి · Free posts hide name & phone.</span></span>
        </label>
      )}
      {(!isJob || f["show_contact"] === "1") && field("contact_phone", "ఫోన్", "Contact phone", { inputMode: "numeric", maxLength: 15 })}
      <div className="space-y-1">
        <Label className="text-base">వివరాలు · Details (optional)</Label>
        <Textarea value={f["description"] ?? ""} onChange={set("description")} maxLength={500} className="text-base" />
      </div>
      <Button type="submit" variant="secondary" size="xl" className="w-full" disabled={busy}>
        {busy ? "..." : "పోస్ట్ చేయండి · Post"}
      </Button>
    </form>
  );
}
