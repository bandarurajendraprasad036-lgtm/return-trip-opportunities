import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Briefcase, Truck, UserSearch, Users, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/lib/session";
import type { Kind } from "@/lib/match";

export const Route = createFileRoute("/_authenticated/post/new")({
  head: () => ({
    meta: [
      { title: "కొత్త పోస్ట్ · New Post — Return Connect" },
      { name: "description", content: "Post a job need, worker need or return vehicle trip." },
      { property: "og:title", content: "New Post — Return Connect" },
      { property: "og:description", content: "Post a job need, worker need or return vehicle trip." },
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
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  if (!kind) {
    return (
      <div className="space-y-3 p-4">
        <h2 className="text-2xl font-bold">మీకు ఏమి కావాలి?</h2>
        <p className="-mt-2 text-muted-foreground">What do you want to post?</p>
        {OPTIONS.map((o) => (
          <button key={o.kind} onClick={() => { setKind(o.kind); setF({ location: me?.profile?.location ?? "", contact_phone: me?.profile?.phone ?? "" }); }} className="flex w-full items-center gap-4 rounded-xl border bg-card p-4 text-left shadow-card active:scale-[0.98]">
            <span className={`grid size-14 place-items-center rounded-xl text-primary-foreground ${o.tone}`}><o.icon className="size-7" /></span>
            <span><span className="block text-lg font-bold">{o.te}</span><span className="text-muted-foreground">{o.en}</span></span>
          </button>
        ))}
      </div>
    );
  }

  const opt = OPTIONS.find((o) => o.kind === kind)!;
  const isJob = opt.module === "job";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me) return;
    const schema = isJob
      ? z.object({ location: txt(80), skill: txt(100), salary: z.string().trim().max(40).optional(), description: z.string().trim().max(500).optional(), contact_phone: z.string().trim().max(15).optional() })
      : z.object({ from_place: txt(80), to_place: txt(80), trip_date: txt(10), ...(kind === "owner" ? { vehicle_type: txt(60) } : { goods_type: txt(80) }), description: z.string().trim().max(500).optional(), contact_phone: z.string().trim().max(15).optional() });
    const r = schema.safeParse(f);
    if (!r.success) return toast.error(`${r.error.issues[0].path[0]}: ${r.error.issues[0].message}`);
    const v = r.data as Record<string, string>;
    const title = isJob
      ? kind === "seeker" ? `${v.skill} పని కావాలి` : `${v.skill} కోసం పనివాడు కావాలి`
      : kind === "owner" ? `${v.vehicle_type} ఖాళీగా వస్తోంది` : `${v.goods_type} కోసం వాహనం కావాలి`;
    setBusy(true);
    const { error } = await supabase.from("posts").insert({ ...v, user_id: me.id, module: opt.module, kind, title });
    setBusy(false);
    if (error) return toast.error(error.message);
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
          {field("location", "ఊరు / ప్రాంతం", "Location", { placeholder: "e.g. Guntur" })}
          {field("skill", kind === "seeker" ? "మీ పని నైపుణ్యం" : "ఏ పని", kind === "seeker" ? "Skill" : "Work", { placeholder: "e.g. Driver, Mason, Farm work" })}
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
      {field("contact_phone", "ఫోన్", "Contact phone", { inputMode: "numeric", maxLength: 15 })}
      <div className="space-y-1">
        <Label className="text-base">వివరాలు · Details (optional)</Label>
        <Textarea value={f.description ?? ""} onChange={set("description")} maxLength={500} className="text-base" />
      </div>
      <Button type="submit" variant="secondary" size="xl" className="w-full" disabled={busy}>
        {busy ? "..." : "పోస్ట్ చేయండి · Post"}
      </Button>
    </form>
  );
}
