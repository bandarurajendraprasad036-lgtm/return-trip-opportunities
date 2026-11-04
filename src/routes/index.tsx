import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Briefcase, Truck, Bell, MessageCircle, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import mata from "@/assets/gayatri-mata.jpg";
import mataGreen from "@/assets/gayatri-mata-green.jpg";
import mataIvory from "@/assets/gayatri-mata-ivory.jpg";
import { dailyDevotionalIndex, indianDay } from "@/lib/daily-devotional";
import { getDailyArtwork } from "@/lib/devotional.functions";
import { useServerFn } from "@tanstack/react-start";
import { DesignFooter } from "@/components/DesignFooter";
import { SharingImage } from "@/components/SharingImage";
import { InstallButton } from "@/components/AppHelpers";
import { BellJoin } from "@/components/BellJoin";
import { DailyWelcome } from "@/components/DailyWelcome";
import { ProfileNotice } from "@/components/ProfileNotice";
import { ResponsibilityNotice } from "@/components/ResponsibilityNotice";
import { AdminChatButton } from "@/components/AdminChatButton";

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
  const [devotional, setDevotional] = useState(0);
  const [day, setDay] = useState("");
  const artwork = useServerFn(getDailyArtwork);
  const scheduled = useQuery({ queryKey: ["daily-artwork", day], enabled: !!day, queryFn: () => artwork(), refetchInterval: 1800000 });
  useEffect(() => {
    const update = () => { const now = new Date(); setDevotional(dailyDevotionalIndex(now, 3)); setDay(indianDay(now)); };
    update();
    const timer = window.setInterval(update, 60000);
    return () => window.clearInterval(timer);
  }, []);
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [place, setPlace] = useState("");
  useEffect(() => { setPlace(localStorage.getItem("home-location") ?? ""); }, []);
  const savePlace = (v: string) => { setPlace(v); localStorage.setItem("home-location", v); };
  const loc = place.trim() || undefined;
  const { data: stats } = useQuery({
    queryKey: ["public-stats"],
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("public_stats");
      if (error) throw error;
      return data as unknown as Stats;
    },
  });
  const { data: video } = useQuery({
    queryKey: ["setting", "youtube_url"],
    queryFn: async () => (await supabase.from("app_settings").select("value").eq("key", "youtube_url").maybeSingle()).data?.value ?? "",
  });
  const ytId = video?.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/)?.[1];
  const fmt = (n?: number) => (n ?? 0).toLocaleString("en-IN");
  const total = stats ? stats.jobs + stats.rides : undefined;

  const searchRides = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/feed", search: { module: "vehicle", from: from.trim() || undefined, to: to.trim() || undefined } });
  };

  const iconLink = "grid size-11 place-items-center rounded-full bg-primary-foreground/15";

  return (
    <div className="mx-auto min-h-screen max-w-md bg-royal">
      <section className="home-devotional bg-royal px-4 pb-6 pt-4 text-on-royal">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
          <Link to="/chats" className="gold-ring" aria-label="చాట్ · Chat"><MessageCircle className="size-6" /></Link>
          <h1 className="truncate text-center text-lg font-extrabold tracking-[0.25em] text-gold">GAYATRI ONE</h1>
          <div className="flex gap-2">
            <Link to="/my-posts" className="gold-ring" aria-label="ప్రొఫైల్ · Profile"><User className="size-6" /></Link>
            <Link to="/notifications" className="gold-ring bg-gold text-royal" aria-label="అలర్ట్స్ · Alerts"><Bell className="size-6" /></Link>
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 rounded-full border border-gold/50 px-3">
          <span aria-hidden>📍</span>
          <input value={place} onChange={e => savePlace(e.target.value)} placeholder="మీ ప్రాంతం · Your location" aria-label="మీ ప్రాంతం · Your location" className="h-11 min-w-0 flex-1 bg-transparent text-base text-on-royal placeholder:text-on-royal/60 outline-none" />
        </label>
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-gold/50 p-4">
          <Briefcase className="size-8 shrink-0 text-gold" />
          <div className="min-w-0 flex-1"><p className="text-lg font-bold text-gold">జాబ్ సర్వీస్ · Job service</p><p className="text-sm opacity-80">నాకు జాబ్ కావాలి · నేను జాబ్ ఇస్తా</p></div>
          <Link to="/feed" search={{ module: "job", loc }} className="shrink-0 rounded-full bg-gold px-4 py-2 font-bold text-royal">ఓపెన్ · Open</Link>
        </div>
        <div className="relative mx-auto mt-6 w-56">
          <svg viewBox="0 0 200 220" className="w-full drop-shadow-[0_0_24px_var(--gold)]" aria-hidden>
            <defs><linearGradient id="bellg" x1="0" x2="1"><stop offset="0" stopColor="var(--rose-gold)" /><stop offset=".5" stopColor="var(--bell-yellow)" /><stop offset="1" stopColor="var(--gold)" /></linearGradient></defs>
            <circle cx="100" cy="14" r="10" fill="none" stroke="url(#bellg)" strokeWidth="5" />
            <path d="M100 24c-46 0-62 44-64 100-2 30-14 44-26 56h180c-12-12-24-26-26-56-2-56-18-100-64-100z" fill="url(#bellg)" />
            <rect x="6" y="178" width="188" height="12" rx="6" fill="url(#bellg)" />
            <circle cx="100" cy="204" r="12" fill="url(#bellg)" />
          </svg>
          <img src={scheduled.data || [mata, mataGreen, mataIvory][devotional]} alt="గాయత్రి మాత · Gayatri Mata" className="absolute left-1/2 top-[30%] size-28 -translate-x-1/2 rounded-full border-4 border-gold object-cover" width={768} height={768} onError={event => { event.currentTarget.src = [mata, mataGreen, mataIvory][devotional] ?? mata; }} />
        </div>
        <BellJoin />
        <p className="mt-2 text-center font-serif text-4xl font-extrabold text-gold">GAYATRI ONE</p>
        <p className="text-center text-base opacity-90">మన ఊరు · మన బండి · మన పని</p>
        <div className="mx-auto mt-4 w-fit rounded-2xl border-2 border-gold px-8 py-3 text-center shadow-[0_0_20px_var(--gold)]">
          <p className="text-3xl font-extrabold text-gold">{fmt(stats?.users)}</p>
          <p className="text-sm">మంది మనతో ఉన్నారు · people with us</p>
        </div>
        <form onSubmit={searchRides} className="mt-4 space-y-2 rounded-2xl border border-gold/50 p-4">
          <p className="font-bold text-gold">వాహనం వెతకండి · Find a vehicle</p>
          <input value={from} onChange={e => setFrom(e.target.value)} placeholder="📍 ఎక్కడి నుండి · From" className="h-12 w-full rounded-full border border-gold/50 bg-transparent px-4 text-base outline-none placeholder:text-on-royal/60" />
          <input value={to} onChange={e => setTo(e.target.value)} placeholder="📍 ఎక్కడికి · To" className="h-12 w-full rounded-full border border-gold/50 bg-transparent px-4 text-base outline-none placeholder:text-on-royal/60" />
          <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold font-bold text-royal"><Search className="size-5" />వెతకండి · Search</button>
        </form>
        <p className="mt-2 text-center text-sm opacity-80">యాక్టివ్ పోస్ట్‌లు · Active posts: {fmt(total)}</p>
        <DailyWelcome />
      </section>
      <ProfileNotice />
      <section className="space-y-3 px-5 pb-8 pt-4">
        <div className="grid grid-cols-2 gap-2">
          <Button asChild size="xl" className="w-full"><Link to="/feed" search={{ module: "job", loc }}><Briefcase />ఉద్యోగాలు · Jobs</Link></Button>
          <Button asChild size="xl" variant="secondary" className="w-full"><Link to="/feed" search={{ module: "vehicle", loc }}><Truck />స్థానిక వాహనాలు · Local vehicles</Link></Button>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-card">
          <span className="grid size-12 place-items-center rounded-full bg-job text-primary-foreground"><Briefcase /></span>
          <div className="flex-1"><p className="text-lg font-bold">జాబ్ కనెక్ట్</p><p className="text-sm text-muted-foreground">{fmt(stats?.jobs)} jobs · Need job or worker</p></div>
          <Button asChild><Link to="/feed" search={{ module: "job", loc }}>తెరవండి Open</Link></Button>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-card">
          <span className="grid size-12 place-items-center rounded-full bg-vehicle text-primary-foreground"><Truck /></span>
          <div className="flex-1"><p className="text-lg font-bold">రిటర్న్ వాహనం</p><p className="text-sm text-muted-foreground">{fmt(stats?.rides)} trips · Empty trip or need vehicle</p></div>
          <Button asChild><Link to="/feed" search={{ module: "vehicle" }}>తెరవండి Open</Link></Button>
        </div>
        {ytId && (
          <div className="overflow-hidden rounded-xl border bg-card shadow-card">
            <p className="p-3 font-bold">🎬 మా గురించి · About us</p>
            <iframe className="aspect-video w-full" src={`https://www.youtube.com/embed/${ytId}`} title="About Gayatri One" allowFullScreen />
          </div>
        )}
        <InstallButton />
        <AdminChatButton />
        <SharingImage />
        <Button asChild variant="secondary" size="xl" className="w-full">
          <Link to="/auth">ప్రారంభించండి · Get Started</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link to="/feed">ఇప్పటికే అకౌంట్ ఉంది? Open app</Link>
        </Button>
      </section>
      <ResponsibilityNotice />
      <DesignFooter />
    </div>
  );
}
