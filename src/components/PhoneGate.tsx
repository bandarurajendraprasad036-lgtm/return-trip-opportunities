import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { hasValidMobile } from "@/lib/phone";

/** Mandatory mobile number prompt for users (e.g. Google sign-in) without a phone in their profile. */
export function PhoneGate() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const has = hasValidMobile(me?.profile?.phone);
  if (!me || !me.profile || has) return null;

  const save = async () => {
    const p = phone.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(p)) { toast.error("సరైన 10 అంకెల నంబర్ ఇవ్వండి / Enter valid 10-digit mobile"); return; }
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ phone: p }).eq("id", me.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("నంబర్ సేవ్ అయింది / Saved");
    qc.invalidateQueries({ queryKey: ["me"] });
  };

  return (
    <Dialog open>
      <DialogContent className="max-w-sm [&>button:last-child]:hidden" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl">మొబైల్ నంబర్ ఇవ్వండి · Enter mobile number</DialogTitle>
          <DialogDescription>కొనసాగడానికి మీ మొబైల్ నంబర్ తప్పనిసరి · Required to continue</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <span className="flex h-12 items-center rounded-md border bg-muted px-3 text-lg">+91</span>
          <Input className="h-12 text-lg" inputMode="numeric" maxLength={14} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" />
        </div>
        <Button size="xl" variant="secondary" className="w-full" disabled={busy} onClick={save}>
          {busy ? "..." : "కొనసాగించండి · Continue"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
