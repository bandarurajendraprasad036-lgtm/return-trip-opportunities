import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { LanguageButton } from '@/components/LanguageButton';
import { Button } from "@/components/ui/button";
import { AboutVideos } from '@/components/AboutVideos';
import emblem from "@/assets/gayatri-one-emblem.jpg";
import mata from "@/assets/gayatri-bell-daily.jpg";
import mataGreen from "@/assets/gayatri-bell-green-daily.jpg";
import mataIvory from "@/assets/gayatri-bell-ivory-daily.jpg";
import { dailyDevotionalIndex, devotionalFallback, indianDay } from "@/lib/daily-devotional";
import { DesignFooter } from "@/components/DesignFooter";
import { SharingImage } from "@/components/SharingImage";
import { AdminChatButton } from "@/components/AdminChatButton";
import { BellJoin } from "@/components/BellJoin";
import { DailyWelcome } from "@/components/DailyWelcome";
import { ResponsibilityNotice } from "@/components/ResponsibilityNotice";
import { HomeListings } from "@/components/HomeListings";
import { ServiceDirectory } from "@/components/ServiceDirectory";
import { DEFAULT_HOME_SETTINGS, useHomeSettings } from "@/lib/home-settings";
import { ReferralBoard } from '@/components/ReferralBoard';
import { WeeklyWinners } from '@/components/WeeklyWinners';
import { GuestCategories, TopProfileBox, useProfileAccess } from '@/components/TopProfileBox';

import { ReelsFeed } from '@/components/ReelsFeed';

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "గాయత్రి వన్ · Gayatri One — ఉద్యోగాలు & రిటర్న్ వాహనాలు" },
      { name: "description", content: "గాయత్రి వన్ — Find jobs, workers and return vehicles in your area with twelve selectable Indian languages." },
      { property: "og:title", content: "గాయత్రి వన్ · Gayatri One — Jobs & Return Vehicles" },
      { property: "og:description", content: "Gayatri One — Jobs, workers and return vehicles, with twelve selectable Indian languages." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});




function Index() {
  const { ready: profileReady, me } = useProfileAccess();
  const { data: homeSettings = DEFAULT_HOME_SETTINGS } = useHomeSettings();
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
  return (
    <div className="mx-auto min-h-screen max-w-[480px] overflow-x-hidden bg-royal">
      <section className="home-devotional bg-royal px-4 pb-6 pt-4 text-on-royal">
        <div className="flex items-center justify-between gap-2">
          <h1 className="flex min-w-0 items-center gap-1 text-sm font-extrabold text-gold"><img src={emblem} alt="" width={28} height={28} className="size-7 shrink-0 object-contain" /><span>గాయత్రి వన్<span className="block text-xs">Gayatri One</span></span></h1>
          <div className="flex shrink-0 items-center gap-2">
            <LanguageButton />
            {me?.isAdmin === true && <Button asChild variant="outline" className="h-auto min-h-11 px-2"><Link to="/admin">నిర్వాహకులు</Link></Button>}
            <Button asChild variant="outline" className="h-auto min-h-11 gap-1 px-2" aria-label="మా గురించి"><Link to="/about"><Info className="size-5" />గురించి</Link></Button>
          </div>
        </div>
        <p className="mt-2 text-center font-serif text-4xl font-extrabold text-gold">GAYATRI ONE</p>
        {profileReady ? <BellJoin>
          <img key={day} src={[mata, mataGreen, mataIvory][devotional]} alt="గాయత్రి మాత చెక్కిన బంగారు గుడి గంట · Gayatri Mata engraved gold temple bell" className="home-engraved-bell" width={768} height={768} onError={event => { const el = event.currentTarget; const tried = (el.dataset["tried"] ?? "").split("|").filter(Boolean); const next = devotionalFallback(el.src, [mata, mataGreen, mataIvory], devotional, tried); if (next) { el.dataset["tried"] = [...tried, el.src].join("|"); el.src = next; } else el.style.visibility = "hidden"; }} />
        </BellJoin> : <img src={[mata, mataGreen, mataIvory][devotional]} alt="గాయత్రి మాత బంగారు గంట" className="home-engraved-bell" width={768} height={768} />}

        <TopProfileBox compact />

        <p className="text-center text-base opacity-90">మన ఊరు · మన బండి · మన పని</p>
        <DailyWelcome />
      </section>
      <section className="space-y-2 px-4 pb-6 pt-0">
        {profileReady ? <HomeListings today={day} settings={homeSettings} /> : <GuestCategories />}
        <AboutVideos />
        <ReelsFeed preview />
        {profileReady && <>{homeSettings.showSharing && <SharingImage />}<WeeklyWinners /><ReferralBoard /></>}
        <Button asChild variant="secondary" size="xl" className="w-full">
          <Link to="/auth">ప్రారంభించండి · Get Started</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link to="/feed">ఇప్పటికే అకౌంట్ ఉంది? Open app</Link>
        </Button>
      </section>
      <div className="px-4 py-3"><AdminChatButton /></div>
      <ResponsibilityNotice />
      <DesignFooter />
    </div>
  );
}
