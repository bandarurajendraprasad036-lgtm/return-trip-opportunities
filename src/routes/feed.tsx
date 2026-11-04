import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Briefcase, Truck, LayoutGrid } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { PostCard, type Post } from "@/components/PostCard";
import { useMe } from "@/lib/session";
import { isMatch } from "@/lib/match";
import { AppShell } from "@/components/AppShell";
import { CITIES, JOB_CATEGORIES, ANYWHERE, DEFAULT_CITY, locationMatches } from "@/lib/jobs";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { indianDay } from "@/lib/daily-devotional";

type FeedSearch = { module?: "all" | "job" | "vehicle" | undefined; from?: string | undefined; to?: string | undefined; loc?: string | undefined };

export const Route = createFileRoute("/feed")({
  validateSearch: (s: Record<string, unknown>): FeedSearch => ({
    module: s["module"] === "job" || s["module"] === "vehicle" ? s["module"] : undefined,
    from: typeof s["from"] === "string" && s["from"] ? s["from"] : undefined,
    to: typeof s["to"] === "string" && s["to"] ? s["to"] : undefined,
    loc: typeof s["loc"] === "string" && s["loc"] ? s["loc"] : undefined,
  }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "ఫీడ్ · Feed — గాయత్రి వన్ · Gayatri One" },
      { name: "description", content: "గాయత్రి వన్ · Gayatri One — Latest jobs and return vehicle posts near you." },
      { property: "og:title", content: "Feed — గాయత్రి వన్ · Gayatri One" },
      { property: "og:description", content: "గాయత్రి వన్ · Gayatri One — Latest jobs and return vehicle posts near you." },
    ],
  }),
  component: () => <AppShell><Feed /></AppShell>,
});

const FILTERS = [
  { id: "all", te: "అన్నీ", en: "All", icon: LayoutGrid },
  { id: "job", te: "ఉద్యోగాలు", en: "Jobs", icon: Briefcase },
  { id: "vehicle", te: "వాహనాలు", en: "Vehicles", icon: Truck },
] as const;

function Feed() {
  const { data: me } = useMe();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const filter = search.module ?? (search.from || search.to ? "vehicle" : "all");
  const setFilter = (m: "all" | "job" | "vehicle") => navigate({ search: (p) => ({ ...p, module: m === "all" ? undefined : m }) });
  const [q, setQ] = useState("");
  const [city, setCity] = useState(search.loc || DEFAULT_CITY);
  const [cat, setCat] = useState("");
  const fromT = search.from?.trim().toLowerCase();
  const toT = search.to?.trim().toLowerCase();
  const locT = search.loc?.trim().toLowerCase();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("posts").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data as Post[];
    },
  });
  const mine = posts.filter((p) => p.user_id === me?.id);
  const term = q.trim().toLowerCase();
  const shown = posts.filter(
    (p) =>
      (filter === "all" || p.module === filter) &&
      (!fromT || p.from_place?.toLowerCase().includes(fromT)) &&
      (!toT || p.to_place?.toLowerCase().includes(toT)) &&
      (p.module !== "vehicle" || !locT || [p.from_place, p.to_place, p.location].some((v) => v?.toLowerCase().includes(locT))) &&
      (p.module !== "job" || (locationMatches(p.location, city) && (!cat || p.category === cat))) &&
      (!term || [p.location, p.from_place, p.to_place, p.title, p.skill].some((v) => v?.toLowerCase().includes(term))),
  );
  const today = indianDay(new Date());
  const sections = [
    { title: "తిరిగి వచ్చే వాహనాలు · Return vehicles", posts: shown.filter(p => p.module === "vehicle" && (!p.trip_date || p.trip_date <= today)) },
    { title: "తిరిగి వచ్చే వాహనాలు ముందస్తు · Advance returns", posts: shown.filter(p => p.module === "vehicle" && !!p.trip_date && p.trip_date > today) },
    { title: "ఉద్యోగాలు · Jobs", posts: shown.filter(p => p.module === "job") },
  ];

  return (
    <div>
      <div className="space-y-3 bg-background px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ఉద్యోగం / ఊరు వెతకండి · Search job or place" className="h-12 bg-card pl-10 text-base" />
        </div>
        {filter !== "vehicle" && (
          <div className="flex gap-2">
            <input list="cities" value={city === ANYWHERE ? "" : city} onChange={(e) => setCity(e.target.value || ANYWHERE)} placeholder="🇮🇳 భారత్ అంతా · Anywhere in India" aria-label="City, district or state" className="h-11 min-w-0 flex-1 rounded-md bg-card px-3 text-base" />
            <datalist id="cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist>
            <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Job category" className="h-11 rounded-md bg-card px-2 text-base">
              <option value="">అన్ని పనులు · All</option>
              {JOB_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.te} · {c.en}</option>)}
            </select>
          </div>
        )}
        {filter !== "vehicle" && city !== ANYWHERE && (
          <button onClick={() => setCity(ANYWHERE)} className="text-sm font-semibold text-foreground underline">🇮🇳 భారత్ అంతా చూపించు · Show anywhere in India</button>
        )}
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex flex-1 items-center justify-center gap-1 rounded-full border py-2 text-sm font-semibold ${filter === f.id ? "bg-secondary text-secondary-foreground" : "bg-background text-foreground"}`}
            >
              <f.icon className="size-4" />{f.te}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3 p-4">
        <Link to="/ai-match" className="flex items-center gap-3 rounded-xl border-2 border-secondary bg-card p-4 font-bold">✨ మీ అవసరం చెప్పండి — AI వెతుకుతుంది<span className="ml-auto text-sm font-normal text-muted-foreground">AI Match →</span></Link>
        {(fromT || toT) && (
          <div className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
            <span>{search.from || "?"} → {search.to || "?"} · {shown.length} రైడ్స్ / rides</span>
            <button className="font-semibold text-primary" onClick={() => navigate({ search: {} })}>✕ క్లియర్</button>
          </div>
        )}
        {locT && filter === "vehicle" && (
          <div className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
            <span>📍 {search.loc} · స్థానిక వాహనాలు · Local vehicles: {shown.length}</span>
            <button className="font-semibold text-primary" onClick={() => navigate({ search: (p) => ({ ...p, loc: undefined }) })}>✕ క్లియర్</button>
          </div>
        )}
        {term && <p className="text-sm text-muted-foreground">"{q}" — {shown.length} పోస్ట్‌లు / posts</p>}
        {isLoading && <p className="text-center text-muted-foreground">లోడ్ అవుతోంది... Loading</p>}
         {!isLoading && shown.length === 0 && (
          <div className="rounded-xl border border-dashed bg-card p-8 text-center text-muted-foreground">
            ఇక్కడ పోస్ట్‌లు లేవు<br />No posts here yet. Try another location.
          </div>
        )}
        {sections.filter(section => section.posts.length > 0).map(section => <section key={section.title} className="space-y-3 border-t pt-4"><h2 className="text-xl font-bold">{section.title}</h2>{section.posts.map(p => <PostCard key={p.id} post={p} meId={me?.id} highlight={mine.some(m => isMatch(m, p))} />)}</section>)}
      </div>
    </div>
  );
}
