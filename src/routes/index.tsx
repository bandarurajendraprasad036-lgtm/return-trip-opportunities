import { Brand } from "@/components/Brand";
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
    <div className="mx-auto min-h-screen max-w-md bg-background">
      <section className="home-devotional bg-royal px-5 pb-6 pt-4 text-on-royal">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="min-w-0 font-extrabold leading-none">
            <Brand />
          </h1>
          <div className="flex gap-2">
            <Link to="/notifications" className={iconLink} aria-label="సమాచారాలు · Notifications"><Bell className="size-5" /></Link>
            <Link to="/chats" className={iconLink} aria-label="సంభాషణలు · Chats"><MessageCircle className="size-5" /></Link>
            <Link to="/my-posts" className={iconLink} aria-label="నా వివరాలు · Profile"><User className="size-5" /></Link>
          </div>
        </div>
        <p className="mt-3 text-center text-lg text-gold">మన ప్రాంత సమాచారం మన గుప్పెట్లో</p>
        <img src={scheduled.data || [mata, mataGreen, mataIvory][devotional]} alt="గాయత్రి మాత" className="home-mata mx-auto mt-3 aspect-square w-full max-w-80 object-contain" width={768} height={768} onError={event => { event.currentTarget.src = [mata, mataGreen, mataIvory][devotional] ?? mata; }} />
        <BellJoin />
        <DailyWelcome />
        <p className="mt-2 text-center text-sm opacity-80">యాక్టివ్ పోస్ట్‌లు · Active posts: {fmt(total)}</p>
      </section>
      <ProfileNotice />
      <section className="space-y-3 px-5 pb-8 pt-4">
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
