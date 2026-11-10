import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { googleAuthHelp } from "@/lib/google-auth-errors";

export function GoogleSignIn({ destination = '/feed', redirectPath = '/' }: { destination?: '/feed' | '/admin-login'; redirectPath?: '/' | '/admin-login' }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const reason = query.get("error_description") || query.get("error") || hash.get("error_description") || hash.get("error");
    if (reason) setError(googleAuthHelp(reason));
  }, []);
  return <div className="space-y-3"><Button size="xl" className="h-auto min-h-16 w-full whitespace-normal py-3" disabled={busy} onClick={async () => {
    setError("");
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}${redirectPath}` });
      if (result.error) { setError(googleAuthHelp(result.error.message)); return; }
      if (result.redirected) return;
      await navigate({ to: destination });
    } catch (reason) { setError(googleAuthHelp(reason instanceof Error ? reason.message : "")); }
    finally { setBusy(false); }
  }}><LogIn className="size-5 shrink-0" /><span className="min-w-0"><span className="block">{busy ? "తెరుస్తున్నాము…" : error ? "మళ్లీ గూగుల్‌తో ప్రయత్నించండి" : "గూగుల్‌తో కొనసాగండి"}</span><span className="block text-sm">Continue with Google</span></span></Button>{error && <p role="alert" className="break-words text-base text-destructive">{error}</p>}</div>;
}