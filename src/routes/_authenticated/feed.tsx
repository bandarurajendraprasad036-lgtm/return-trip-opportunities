import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Briefcase, Truck, LayoutGrid } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { PostCard, type Post } from "@/components/PostCard";
import { useMe } from "@/lib/session";
import { isMatch } from "@/lib/match";

type FeedSearch = { module?: "all" | "job" | "vehicle" | undefined; from?: string | undefined; to?: string | undefined };

export const Route = createFileRoute("/_authenticated/feed")({
  validateSearch: (s: Record<string, unknown>): FeedSearch => ({
    module: s["module"] === "job" || s["module"] === "vehicle" ? s["module"] : undefined,
    from: typeof s["from"] === "string" && s["from"] ? s["from"] : undefined,
    to: typeof s["to"] === "string" && s["to"] ? s["to"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "ఫీడ్ · Feed — Return Connect" },
      { name: "description", content: "Latest jobs and return vehicle posts near you." },
      { property: "og:title", content: "Feed — Return Connect" },
      { property: "og:description", content: "Latest jobs and return vehicle posts near you." },
    ],
  }),
  component: Feed,
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
  const [initialised, setInit] = useState(false);
  if (!initialised && me?.profile?.location && !search.from && !search.to) { setQ(me.profile.location); setInit(true); }
  const fromT = search.from?.trim().toLowerCase();
  const toT = search.to?.trim().toLowerCase();

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
      (!term || [p.location, p.from_place, p.to_place, p.title, p.skill].some((v) => v?.toLowerCase().includes(term))),
  );

  return (
    <div>
      <div className="space-y-3 bg-primary px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ఊరు వెతకండి · Search location" className="h-12 bg-card pl-10 text-base" />
        </div>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex flex-1 items-center justify-center gap-1 rounded-full py-2 text-sm font-semibold ${filter === f.id ? "bg-secondary text-secondary-foreground" : "bg-primary-foreground/15 text-primary-foreground"}`}
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
        {term && <p className="text-sm text-muted-foreground">"{q}" — {shown.length} పోస్ట్‌లు / posts</p>}
        {isLoading && <p className="text-center text-muted-foreground">లోడ్ అవుతోంది... Loading</p>}
        {!isLoading && shown.length === 0 && (
          <div className="rounded-xl border border-dashed bg-card p-8 text-center text-muted-foreground">
            ఇక్కడ పోస్ట్‌లు లేవు<br />No posts here yet. Try another location.
          </div>
        )}
        {shown.map((p) => (
          <PostCard key={p.id} post={p} meId={me?.id} highlight={mine.some((m) => isMatch(m, p))} />
        ))}
      </div>
    </div>
  );
}
