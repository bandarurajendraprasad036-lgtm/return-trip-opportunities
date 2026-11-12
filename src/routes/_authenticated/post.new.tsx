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
import { useAccountProgram } from "@/lib/use-account-program";
import { AccountProfile } from "@/components/AccountProfile";
import { capacityInput } from "@/lib/vehicle-experience";
import { VEHICLE_TYPES, isCar } from '@/lib/vehicle-types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobSuggestionInput } from '@/components/JobSuggestionInput';
import { generalWorkValue, hasProhibitedJobWords, jobPostIdentity, WORK_SUGGESTIONS } from '@/lib/job-entry';
import { IndiaPlaceInput } from '@/components/IndiaPlaceInput';
import { RoutePointPicker } from '@/components/RoutePointPicker';
import type { Coordinates } from '@/lib/india-places';

function AiJobAd({ kind, onDraft, work }: { kind: "seeker" | "employer"; onDraft: (d: JobAdDraft) => void; work: string }) {
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
          <div className="space-y-1"><Label htmlFor="ad-experience">అనుభవం · Experience{work.trim() ? ` — ${work.trim()}` : ""}</Label><Input id="ad-experience" placeholder={work.trim() ? `${work.trim()} పనిలో ఎన్ని సంవత్సరాలు? · Years in ${work.trim()}` : undefined} value={experience} onChange={(e) => setExperience(e.target.value)} maxLength={100} disabled={busy} /></div>
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
  validateSearch: (search: Record<string, unknown>): { kind?: 'seeker' | 'employer' | undefined; loc?: string | undefined } => ({
    kind: search['kind'] === 'seeker' || search['kind'] === 'employer' ? search['kind'] : undefined,
    loc: typeof search['loc'] === 'string' ? search['loc'].trim().slice(0, 80) : undefined,
  }),
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
  { kind: "seeker", module: "job", te: "పని కావాలా?", en: "Need work?", icon: UserSearch, tone: "bg-job" },
  { kind: "employer", module: "job", te: "మనిషి కావాలా?", en: "Need a worker?", icon: Users, tone: "bg-job" },
  { kind: "owner", module: "vehicle", te: "ఖాళీ రిటర్న్ ట్రిప్ ఉంది", en: "Empty return trip", icon: Truck, tone: "bg-vehicle" },
  { kind: "business", module: "vehicle", te: "రిటర్న్ వాహనం కావాలి", en: "Need return vehicle", icon: Package, tone: "bg-vehicle" },
];

const txt = (max: number) => z.string().trim().min(1, "అవసరం / Required").max(max);

function NewPost() {
  const search = Route.useSearch();
  const { data: me } = useMe();
  const { data: program, isLoading: programLoading } = useAccountProgram(me?.id);
  const nav = useNavigate();
  const qc = useQueryClient();
  const [kind, setKind] = useState<Kind | null>(search.kind ?? null);
  const [f, setF] = useState<Record<string, string>>(search.loc ? { location: search.loc } : {});
  const [busy, setBusy] = useState(false);
  const [generalWork, setGeneralWork] = useState(false);
  const [contentError, setContentError] = useState('');
  const [fromPoint, setFromPoint] = useState<Coordinates | null>(null);
  const [toPoint, setToPoint] = useState<Coordinates | null>(null);
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

  if (programLoading) return <p className="p-4">వస్తున్నాయి · Loading…</p>;
  if (me && !program) return <div className="p-4"><AccountProfile /></div>;
  if (!kind) {
    return (
      <div className="space-y-3 p-4">
        <h2 className="text-2xl font-bold">మీకు ఏమి కావాలి?</h2>
        <p className="-mt-2 text-muted-foreground">What do you want to post?</p>
        {OPTIONS.map((o) => (
          <Button key={o.kind} variant="outline" onClick={() => setKind(o.kind)} className="h-auto min-h-20 w-full justify-start gap-4 whitespace-normal p-4 text-left shadow-card">
            <span className={`grid size-14 place-items-center rounded-xl text-foreground ${o.tone}`}><o.icon className="size-7" /></span>
            <span><span className="block text-lg font-bold">{o.te}</span><span className="text-muted-foreground">{o.en}</span></span>
          </Button>
        ))}
      </div>
    );
  }

  const opt = OPTIONS.find((o) => o.kind === kind);
  if (!opt) return null;
  const isJob = opt.module === "job";

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (busy) return;
    if (!me) return;
    if (!program) { toast.error("ముందుగా వివరాలు నింపండి · Complete profile first"); return; }
    const schema = isJob
      ? z.object({ location: txt(80), skill: txt(100), salary: z.string().trim().max(40).optional(), description: z.string().trim().max(500).optional(), contact_phone: z.string().trim().max(15).optional(), category: z.string().max(30).optional(), show_contact: z.string().optional() })
      : z.object({ from_place: txt(80), to_place: txt(80), trip_date: txt(10), ...(kind === "owner" ? { vehicle_type: txt(60), vehicle_name: z.string().trim().max(60).optional(), vehicle_number: z.string().trim().max(20).optional(), driver_name: z.string().trim().max(60).optional() } : { goods_type: txt(80) }), description: z.string().trim().max(500).optional(), contact_phone: z.string().trim().max(15).optional() });
    setContentError('');
    const { company_name: companyName = '', vacancies = '', ...fields } = f;
    const employerInfo = kind === 'employer' ? [companyName.trim() && `కంపెనీ · Company: ${companyName.trim()}`, vacancies.trim() && `ఖాళీలు · Vacancies: ${vacancies.trim()}`].filter(Boolean).join('\n') : '';
    const jobData = isJob ? { ...fields, ...(employerInfo ? { description: [employerInfo, fields['description']?.trim()].filter(Boolean).join('\n') } : {}), skill: generalWorkValue(f['skill'] ?? '', f['general_work'] ?? '', generalWork), ...(generalWork ? { category: 'other' } : {}) } : f;
    if (isJob && hasProhibitedJobWords(Object.values(jobData).join(' '))) {
      setContentError('అనుచిత పదాలు అనుమతించబడవు. ఊరు, పని, వివరాల్లో ఆ పదాలను తీసివేసి మళ్లీ పంపండి. · Remove prohibited words before posting.');
      // The authenticated moderation check must also inspect submitted prohibited content.
    }
    const r = schema.safeParse(jobData);
    if (!r.success) { const i = r.error.issues[0]; toast.error(`${String(i?.path[0] ?? "")}: ${i?.message ?? ""}`); return; }
    const capacity = !isJob && f["capacity_tons"] ? capacityInput.safeParse(f["capacity_tons"]) : null;
    if (capacity && !capacity.success) { toast.error("సరైన టన్నుల బరువు ఇవ్వండి · Enter a valid capacity"); return; }
    const { show_contact, ...v } = r.data as Record<string, string>;
    // Point 8: freeze the selected job kind before any asynchronous checks.
    const identity = kind === 'seeker' || kind === 'employer'
      ? jobPostIdentity(kind, v['skill'] ?? '')
      : { module: opt.module, kind, title: kind === 'owner' ? `${v['vehicle_type']} ఖాళీగా వస్తోంది` : `${v['goods_type']} కోసం వాహనం కావాలి` };
    const capturedPoints = { from: fromPoint, to: toPoint };
    setBusy(true);
    const mod = await checkText({ data: { text: Object.values(v).join(" \n ") } }).catch(() => ({ ok: false }));
    if (!mod.ok) { setBusy(false); await qc.invalidateQueries({queryKey:['me']}); setContentError('తనిఖీ పూర్తికాలేదు లేదా అనుమతించని విషయం ఉంది; ప్రకటన పంపలేదు. · Check unavailable or prohibited content; not submitted.'); return; }
    const { data: savedPost, error } = await supabase.from("posts").insert({ ...v, ...(!isJob ? { capacity_tons: capacity?.success ? capacity.data : null, vehicle_type: f["vehicle_type"]?.trim().slice(0, 60) || null } : {}), show_contact: false, user_id: me.id, ...identity }).select('id,visible_after').single();
    if (!error && savedPost && !isJob && capturedPoints.from && capturedPoints.to) {
      const registered = await supabase.rpc('save_vehicle_post_points', { _post: savedPost.id, _from_lat: capturedPoints.from.latitude, _from_lng: capturedPoints.from.longitude, _to_lat: capturedPoints.to.latitude, _to_lng: capturedPoints.to.longitude });
      if (registered.error) toast.error('ప్రకటన భద్రపడింది; పరిధి స్థానాలు భద్రపడలేదు · Post saved; radius coordinates not saved');
    }
    setBusy(false);
    if (error) { toast.error(error.message.includes('MONTHLY_THREE_POST_LIMIT') ? 'ఈ నెల మూడు ఉచిత పోస్టులు పూర్తయ్యాయి; అదనపు పోస్టుకు ₹49 చెల్లింపు ఆమోదం కావాలి' : error.message.includes('THREE_MONTHLY_JOBS_USED') ? 'ప్రకటన పరిమితి పూర్తయింది · Posting limit reached' : error.message.includes("MOBILE_REQUIRED") ? "ప్రకటనకు ముందు మొబైల్ నంబరు ఇవ్వండి · Mobile number required" : error.message.includes("BAD_CONTENT") ? "🚫 బూతులు, చెడు మాటలు, దేశ వ్యతిరేక విషయాలు పోస్ట్ చేయకూడదు · Abusive or anti-national content is not allowed" : error.message); return; }
    toast.success(savedPost?.visible_after&&Date.parse(savedPost.visible_after)>Date.now()?"మీ సమాచారం మాకు సమర్పించారు; మరో ఐదు గంటల్లో చూడవచ్చు · Submitted; visible after five hours":"మీ సమాచారం మాకు సమర్పించారు; మీ ప్రకటన ఇప్పుడు చూడవచ్చు · Submitted; now visible");
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
      <p>ఒక నెలలో ఉద్యోగం, వాహనం కలిపి మొత్తం మూడు పోస్టులు. · Three total job/vehicle posts per month.</p>
      <p className="text-sm">నెలకు మూడు పోస్టులు ఉచితం; తరువాత ఒక్కో పోస్టుకు ₹49. ఉచిత ప్రకటనలు ఐదు గంటల తరువాత కనిపిస్తాయి. చెల్లింపు ఆమోదం ఉంటే కొత్త ప్రకటన వెంటనే.</p>
      <div className={`flex items-center gap-3 rounded-xl border p-3 text-foreground ${opt.tone}`}>
        <opt.icon className="size-7" />
        <div><p className="text-lg font-bold">{opt.te}</p><p className="text-sm opacity-90">{opt.en}</p></div>
        <Button type="button" variant="ghost" disabled={busy} onClick={() => setKind(null)} className="ml-auto text-sm underline">మార్చు</Button>
      </div>
      {isJob ? (
        <>
          {/* Point 8: separately selectable job seeker/employer tabs. */}
          <Tabs value={kind} onValueChange={value => { if (!busy && (value === 'seeker' || value === 'employer')) { setKind(value); setContentError(''); } }}>
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1"><TabsTrigger disabled={busy} value="seeker" className="min-h-16 whitespace-normal text-base">పని కావాలా? · Need work?</TabsTrigger><TabsTrigger disabled={busy} value="employer" className="min-h-16 whitespace-normal text-base">మనిషి కావాలా? · Need a worker?</TabsTrigger></TabsList>
          </Tabs>
          <AiJobAd work={generalWork ? (f["general_work"] ?? "") : (f["skill"] ?? "")} kind={kind as "seeker" | "employer"} onDraft={(d) => setF((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(d).filter(([, v]) => v)) }))} />
          <div><Label htmlFor="job-location">ఊరు / ప్రాంతం · Location</Label><IndiaPlaceInput id="job-location" value={f['location'] ?? ''} maxLength={80} onChange={value => setF(prev => ({ ...prev, location: value }))} disabled={busy} /></div>
          {!generalWork && <JobSuggestionInput id="job-work" label="పని పేరు · Work" value={f['skill'] ?? ''} options={WORK_SUGGESTIONS} maxLength={100} onChange={value => setF(prev => ({ ...prev, skill: value }))} />}
          <label className="flex items-center gap-2"><input type="checkbox" checked={generalWork} onChange={event => setGeneralWork(event.target.checked)} />జాబితాలో లేని పని · Other work</label>
          {generalWork && <div className="space-y-1"><Label htmlFor="general-work">ఇతర పని పేరు · General work</Label><Input id="general-work" className="h-12 text-lg" value={f['general_work'] ?? ''} required maxLength={100} onChange={set('general_work')} /></div>}
          <div className="space-y-1">
            <Label className="text-base">పని రకం · Category</Label>
            <select className="h-12 w-full rounded-md border bg-card px-3 text-lg" value={f["category"] ?? ""} onChange={(e) => setF({ ...f, category: e.target.value })}>
              <option value="">—</option>
              {JOB_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.te} · {c.en}</option>)}
            </select>
          </div>
          {kind === "employer" && field("company_name", "కంపెనీ పేరు", "Company name", { maxLength: 80 })}
          {kind === "employer" && field("vacancies", "ఖాళీల సంఖ్య", "Vacancies", { type: "number", min: "1", max: "999", inputMode: "numeric", placeholder: "1, 2, 5" })}
          {field("salary", kind === "seeker" ? "ఆశించే జీతం" : "జీతం", kind === "seeker" ? "Expected salary" : "Salary", { placeholder: "e.g. 15000/month or 600/day" })}
        </>
      ) : (
        <>
          <div><Label htmlFor="post-from">నుండి · From</Label><IndiaPlaceInput id="post-from" value={f['from_place'] ?? ''} disabled={busy} maxLength={80} onChange={value => { setF(prev => ({ ...prev, from_place: value })); setFromPoint(null); }} onSelect={setFromPoint} /></div>
          <div><Label htmlFor="post-to">వరకు · To</Label><IndiaPlaceInput id="post-to" value={f['to_place'] ?? ''} disabled={busy} maxLength={80} onChange={value => { setF(prev => ({ ...prev, to_place: value })); setToPoint(null); }} onSelect={setToPoint} /></div>
          <RoutePointPicker from={fromPoint} to={toPoint} onFrom={setFromPoint} onTo={setToPoint} disabled={busy} />
          {(!fromPoint || !toPoint) && <p className="text-sm text-muted-foreground">రెండు స్థానాలు ఎంచుకోకపోతే పరిధి సూచనలు రావు; పేరుతో ఉన్న సరిపోలిక కొనసాగుతుంది · Without selected endpoints, approximate radius alerts are unavailable; name matching remains.</p>}
          {field("trip_date", "తేదీ", "Date", { type: "date" })}
          <div className="space-y-1"><Label className="text-base">వాహనం రకం · Vehicle type</Label><select aria-label="వాహనం రకం · Vehicle type" value={f["vehicle_type"] ?? ""} onChange={event => setF({ ...f, vehicle_type: event.target.value, capacity_tons: '' })} className="h-12 w-full rounded-md border bg-card px-3 text-lg" required><option value="">ఎంచుకోండి · Choose</option>{VEHICLE_TYPES.map(type => <option key={type.value} value={type.value}>{type.te} · {type.en}</option>)}</select></div>
          {!isCar(f['vehicle_type']) && field("capacity_tons", "బరువు సామర్థ్యం (టన్నులు)", "Capacity (tons)", { type: "number", min: "0.1", max: "100", step: "0.1", required: true })}
          {kind === "owner" && <>{field("vehicle_name", "వాహనం పేరు", "Vehicle name", { placeholder: "e.g. Tata Ace, Ashok Leyland" })}{field("vehicle_number", "వాహనం నంబర్", "Vehicle number", { placeholder: "TS 09 AB 1234" })}{field("driver_name", "డ్రైవర్ పేరు", "Driver name")}{field("contact_phone", "మొబైల్ నంబర్", "Mobile number", { inputMode: "numeric", maxLength: 10 })}</>}
          {kind === "business" && field("goods_type", "సరుకు రకం", "Goods type", { placeholder: "e.g. Rice bags, Cement" })}
        </>
      )}
      <div className="space-y-1">
        <Label className="text-base">వివరాలు · Details (optional)</Label>
        <Textarea value={f["description"] ?? ""} onChange={set("description")} maxLength={500} className="text-base" />
      </div>
      {contentError && <p role="alert" className="break-words border border-destructive bg-card p-3 text-destructive">{contentError}</p>}
      <Button type="submit" variant="secondary" size="xl" className="w-full" disabled={busy}>
        {busy ? "..." : "పోస్ట్ చేయండి · Post"}
      </Button>
    </form>
  );
}
