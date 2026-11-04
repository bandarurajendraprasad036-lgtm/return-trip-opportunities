import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";

export function GoogleSignIn() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  return <Button size="xl" className="h-auto min-h-16 w-full whitespace-normal py-3" disabled={busy} onClick={async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) { toast.error("ప్రవేశం జరగలేదు. మళ్లీ ప్రయత్నించండి · Please try Google sign-in again"); return; }
      if (result.redirected) return;
      await navigate({ to: "/feed" });
    } catch { toast.error("ప్రవేశం జరగలేదు. మళ్లీ ప్రయత్నించండి · Please try again"); }
    finally { setBusy(false); }
  }}><LogIn className="size-5 shrink-0" /><span className="min-w-0"><span className="block">{busy ? "తెరుస్తున్నాము…" : "గూగుల్‌తో కొనసాగండి"}</span><span className="block text-sm">Continue with Google</span></span></Button>;
}