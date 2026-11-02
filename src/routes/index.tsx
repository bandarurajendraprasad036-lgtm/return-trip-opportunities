import { Brand } from "@/components/Brand";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Briefcase, Truck, Bell, MessageCircle, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import hero from "@/assets/hero-village.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "గాయత్రి వన్ · Gayatri One — ఉద్యోగాలు & రిటర్న్ వాహనాలు" },
      { name: "description", content: "గాయత్రి వన్ · Gayatri One — Find jobs, workers and empty return trucks in your area. Telugu + English." },
      { property: "og:title", content: "గాయత్రి వన్ · Gayatri One — Jobs & Return Vehicles" },
      { property: "og:description", content: "గాయత్రి వన్ · Gayatri One — Find jobs, workers and empty return trucks in your area. Telugu + English." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Stats = { users: number; jobs: number; rides: number; matches: number };

function Index() {
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data: stats } = useQuery({
    queryKey: ["public-stats"],
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("public_stats");
      if (error) throw error;
      return data as unknown as Stats;
    },
  });
  const fmt = (n?: number) => (n ?? 0).toLocaleString("en-IN");
  const total = stats ? stats.jobs + stats.rides : undefined;

  const searchRides = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/feed", search: { module: "vehicle", from: from.trim() || undefined, to: to.trim() || undefined } });
  };

  const iconLink = "grid size-11 place-items-center rounded-full bg-primary-foreground/15";

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background">
      <section className="bg-hero px-5 pb-8 pt-6 text-primary-foreground">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-4xl font-extrabold leading-none">
            <Brand />
          </h1>
          <div className="flex gap-2">
            <Link to="/notifications" className={iconLink} aria-label="Notifications"><Bell className="size-5" /></Link>
            <Link to="/chats" className={iconLink} aria-label="Chats"><MessageCircle className="size-5" /></Link>
            <Link to="/my-posts" className={iconLink} aria-label="Profile"><User className="size-5" /></Link>
          </div>
        </div>
        <p className="mt-2 text-lg">మీ ఊరిలో పని & వాహనం — ఒకే చోట</p>
        <p className="text-sm opacity-80">Jobs & return vehicles near you</p>
        <div className="mt-4 rounded-xl bg-primary-foreground/15 p-3 text-center">
          <p className="text-3xl font-extrabold">{fmt(total)}</p>
          <p className="text-sm">యాక్టివ్ పోస్ట్‌లు · Active posts — {fmt(stats?.users)} యూజర్లు / users</p>
        </div>
        <img src={hero} alt="Village road with truck and workers" className="mt-4 aspect-[4/3] w-full rounded-2xl object-cover" width={1024} height={768} />
      </section>
      <section className="-mt-4 space-y-3 px-5 pb-8">
        <form onSubmit={searchRides} className="space-y-2 rounded-xl border bg-card p-4 shadow-card">
          <p className="font-bold">రిటర్న్ వాహనం వెతకండి · Find a ride</p>
          <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="ఎక్కడ నుండి · Where from" className="h-12 text-base" />
          <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="ఎక్కడికి · Where to" className="h-12 text-base" />
          <Button type="submit" size="xl" className="w-full"><Search />వెతకండి · Search</Button>
        </form>
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-card">
          <span className="grid size-12 place-items-center rounded-full bg-job text-primary-foreground"><Briefcase /></span>
          <div className="flex-1"><p className="text-lg font-bold">జాబ్ కనెక్ట్</p><p className="text-sm text-muted-foreground">{fmt(stats?.jobs)} jobs · Need job or worker</p></div>
          <Button asChild><Link to="/feed" search={{ module: "job" }}>తెరవండి Open</Link></Button>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-card">
          <span className="grid size-12 place-items-center rounded-full bg-vehicle text-primary-foreground"><Truck /></span>
          <div className="flex-1"><p className="text-lg font-bold">రిటర్న్ వాహనం</p><p className="text-sm text-muted-foreground">{fmt(stats?.rides)} trips · Empty trip or need vehicle</p></div>
          <Button asChild><Link to="/feed" search={{ module: "vehicle" }}>తెరవండి Open</Link></Button>
        </div>
        <Button asChild variant="secondary" size="xl" className="w-full">
          <Link to="/auth">ప్రారంభించండి · Get Started</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link to="/feed">ఇప్పటికే అకౌంట్ ఉంది? Open app</Link>
        </Button>
      </section>
    </div>
  );
}
