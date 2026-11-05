import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import mata from "@/assets/gayatri-bell-daily.jpg";
import mataGreen from "@/assets/gayatri-bell-green-daily.jpg";
import mataIvory from "@/assets/gayatri-bell-ivory-daily.jpg";
import { dailyDevotionalIndex, devotionalFallback, indianDay } from "@/lib/daily-devotional";
import { DesignFooter } from "@/components/DesignFooter";
import { SharingImage } from "@/components/SharingImage";
import { InstallButton } from "@/components/AppHelpers";
import { BellJoin } from "@/components/BellJoin";
import { DailyWelcome } from "@/components/DailyWelcome";
import { ProfileNotice } from "@/components/ProfileNotice";
import { ResponsibilityNotice } from "@/components/ResponsibilityNotice";
import { AdminChatButton } from "@/components/AdminChatButton";
import { HomeListings } from "@/components/HomeListings";
import { ChittoorMap } from "@/components/ChittoorMap";

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




function Index() {
  const [devotional, setDevotional] = useState(0);
  const [day, setDay] = useState("");
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const update = () => {
      clearTimeout(timer);
      const now = new Date();
      setDevotional(dailyDevotionalIndex(now, 3)); setDay(indianDay(now));
      const midnight = Date.parse(`${indianDay(now)}T00:00:00+05:30`) + 86400000;
      timer = setTimeout(update, Math.max(1, midnight - now.getTime()));
    };
    update();
    const visible = () => { if (document.visibilityState === 'visible') update(); };
    document.addEventListener('visibilitychange', visible);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', visible); };
  }, []);
  const { data: video } = useQuery({
    queryKey: ["setting", "youtube_url"],
    queryFn: async () => (await supabase.from("app_settings").select("value").eq("key", "youtube_url").maybeSingle()).data?.value ?? "",
  });
  const ytId = video?.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/)?.[1];
  return (
    <div className="mx-auto min-h-screen max-w-[480px] overflow-x-hidden bg-royal">
      <section className="home-devotional bg-royal px-4 pb-6 pt-4 text-on-royal">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="truncate text-center text-lg font-extrabold text-gold">GAYATRI ONE</h1>
          <div className="flex gap-2">
            <AdminChatButton compact />
            <Link to="/notifications" className="gold-ring bg-gold text-royal" aria-label="అలర్ట్స్ · Alerts"><Bell className="size-6" /></Link>
            <Link to="/dashboard" className="gold-ring" aria-label="ప్రొఫైల్ · Profile"><User className="size-6" /></Link>
          </div>
        </div>
        <BellJoin>
          <img key={day} src={[mata, mataGreen, mataIvory][devotional]} alt="గాయత్రి మాత చెక్కిన బంగారు గుడి గంట · Gayatri Mata engraved gold temple bell" className="home-engraved-bell" width={768} height={768} onError={event => { const el = event.currentTarget; const tried = (el.dataset["tried"] ?? "").split("|").filter(Boolean); const next = devotionalFallback(el.src, [mata, mataGreen, mataIvory], devotional, tried); if (next) { el.dataset["tried"] = [...tried, el.src].join("|"); el.src = next; } else el.style.visibility = "hidden"; }} />
        </BellJoin>
        <p className="mt-2 text-center font-serif text-4xl font-extrabold text-gold">GAYATRI ONE</p>
        <p className="text-center text-base opacity-90">మన ఊరు · మన బండి · మన పని</p>
        <DailyWelcome />
      </section>
      <ProfileNotice />
      <section className="space-y-3 px-5 pb-8 pt-4">
        <HomeListings today={day} />
        <ChittoorMap />
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
