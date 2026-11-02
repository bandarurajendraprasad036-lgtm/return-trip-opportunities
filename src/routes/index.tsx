import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, Truck, Bell, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero-village.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Return Connect — ఉద్యోగాలు & రిటర్న్ వాహనాలు" },
      { name: "description", content: "Find jobs, workers and empty return trucks in your area. Telugu + English." },
      { property: "og:title", content: "Return Connect — Jobs & Return Vehicles" },
      { property: "og:description", content: "Find jobs, workers and empty return trucks in your area. Telugu + English." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-background">
      <section className="bg-hero px-5 pb-8 pt-6 text-primary-foreground">
        <h1 className="text-4xl font-extrabold leading-none">
          Return<span className="text-secondary">Connect</span>
        </h1>
        <p className="mt-2 text-lg">మీ ఊరిలో పని & వాహనం — ఒకే చోట</p>
        <p className="text-sm opacity-80">Jobs & return vehicles near you</p>
        <img src={hero} alt="Village road with truck and workers" className="mt-5 aspect-[4/3] w-full rounded-2xl object-cover" width={1024} height={768} />
      </section>
      <section className="-mt-4 space-y-3 px-5">
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-card">
          <span className="grid size-12 place-items-center rounded-full bg-job text-primary-foreground"><Briefcase /></span>
          <div><p className="text-lg font-bold">జాబ్ కనెక్ట్</p><p className="text-sm text-muted-foreground">Need job or need worker</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-card">
          <span className="grid size-12 place-items-center rounded-full bg-vehicle text-primary-foreground"><Truck /></span>
          <div><p className="text-lg font-bold">రిటర్న్ వాహనం</p><p className="text-sm text-muted-foreground">Empty trip or need a vehicle</p></div>
        </div>
        <div className="flex gap-4 py-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Bell className="size-4" />Instant match alerts</span>
          <span className="flex items-center gap-1"><MessageCircle className="size-4" />Direct chat</span>
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
