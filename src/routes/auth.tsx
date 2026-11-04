import { Brand } from "@/components/Brand";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { phoneToEmail } from "@/lib/match";
import { AuthGuide } from "@/components/AuthGuide";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "లాగిన్ · Login — గాయత్రి వన్ · Gayatri One" },
      { name: "description", content: "Login to గాయత్రి వన్ · Gayatri One with your phone number." },
      { property: "og:title", content: "Login — గాయత్రి వన్ · Gayatri One" },
      { property: "og:description", content: "Login to గాయత్రి వన్ · Gayatri One with your phone number." },
    ],
  }),
  component: AuthPage,
});

const phoneSchema = z.string().transform((v) => v.replace(/\D/g, "").slice(-10)).pipe(z.string().regex(/^[6-9]\d{9}$/, "సరైన 10 అంకెల నంబర్ ఇవ్వండి / Enter valid 10-digit mobile"));

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const p = phoneSchema.safeParse(phone);
    if (!p.success) { toast.error(p.error.issues[0]?.message ?? "Invalid phone"); return; }
    if (pin.length < 6) { toast.error("పాస్‌వర్డ్ కనీసం 6 అక్షరాలు / Password min 6 characters"); return; }
    setBusy(true);
    const email = phoneToEmail(p.data);
    if (mode === "signup") {
      if (!name.trim()) { setBusy(false); toast.error("పేరు ఇవ్వండి / Enter name"); return; }
      const rc = ref.trim().toUpperCase();
      if (/^[A-Z0-9]{4,16}$/.test(rc)) localStorage.setItem("g1_ref", rc);
      const { error } = await supabase.auth.signUp({
        email,
        password: pin,
        options: { data: { full_name: name.trim().slice(0, 80), phone: p.data, location: location.trim().slice(0, 80) } },
      });
      setBusy(false);
      if (error) { toast.error(error.message.includes("registered") ? "ఈ నంబర్ ఇప్పటికే ఉంది. లాగిన్ చేయండి / Number already registered" : error.message); return; }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pin });
      setBusy(false);
      if (error) { toast.error("నంబర్ లేదా పాస్‌వర్డ్ తప్పు / Wrong number or password"); return; }
    }
    nav({ to: "/feed" });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <div className="bg-hero px-5 pb-10 pt-8 text-primary-foreground">
        <h1 className="text-4xl font-extrabold"><Brand /></h1>
        <p className="mt-1 text-lg">{mode === "login" ? "ఫోన్ నంబర్‌తో లాగిన్" : "కొత్త అకౌంట్"}</p>
        <p className="text-sm opacity-80">{mode === "login" ? "Login with phone" : "Create account"}</p>
      </div>
      <form onSubmit={submit} className="-mt-6 mx-4 space-y-4 rounded-2xl border bg-card p-5 shadow-card">
        {mode === "signup" && (
          <div className="space-y-1">
            <Label className="text-base">పేరు · Name</Label>
            <Input className="h-12 text-lg" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-base">ఫోన్ నంబర్ · Phone</Label>
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
            <span className="flex h-12 shrink-0 items-center gap-1 rounded-md border bg-muted px-3 text-lg"><Phone className="size-4" />+91</span>
            <Input className="h-12 min-w-0 text-lg" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={14} placeholder="98765 43210" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-base">పాస్‌వర్డ్ · Password</Label>
          <Input className="h-12 text-lg" type="password" value={pin} onChange={(e) => setPin(e.target.value)} maxLength={64} placeholder="min 6" />
        </div>
        {mode === "signup" && (
          <div className="space-y-1">
            <Label className="text-base">మీ ఊరు · Your village/town</Label>
            <Input className="h-12 text-lg" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={80} />
          </div>
        )}
        {mode === "signup" && (
          <div className="space-y-1">
            <Label className="text-base">రిఫరల్ కోడ్ (ఉంటే) · Referral code (optional)</Label>
            <Input className="h-12 text-lg uppercase" value={ref} onChange={(e) => setRef(e.target.value)} maxLength={16} />
          </div>
        )}
        <Button type="submit" variant="secondary" size="xl" className="w-full" disabled={busy}>
          {busy ? "..." : mode === "login" ? "లాగిన్ · Login" : "రిజిస్టర్ · Register"}
        </Button>
        <button type="button" className="w-full text-center text-base text-primary underline" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "కొత్తవారా? రిజిస్టర్ చేయండి · New? Register" : "అకౌంట్ ఉందా? లాగిన్ · Have account? Login"}
        </button>
        <div className="text-center text-sm text-muted-foreground">లేదా · or</div>
        <Button type="button" variant="outline" size="xl" className="h-20 w-full min-w-0 flex-col gap-1 whitespace-normal px-2 text-base leading-normal" disabled={busy} onClick={async () => {
          const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
          if (r.error) { toast.error(String(r.error.message ?? r.error)); return; }
          if (r.redirected) return;
          nav({ to: "/feed" });
        }}>
          <span className="max-w-full">గూగుల్‌తో కొనసాగండి</span>
          <span className="max-w-full text-sm font-medium">Continue with Google</span>
        </Button>
      </form>
      <AuthGuide mode={mode} />
    </div>
  );
}
