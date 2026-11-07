import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const REF_KEY = "g1_ref";
/** Capture own-code referrals after sign-in; no unsolicited old-offer popups. */
export function Referral() {
  const { data: me } = useMe();
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('ref');
    if (code && /^[A-Za-z0-9]{4,40}$/.test(code)) localStorage.setItem(REF_KEY, code.toUpperCase());
  }, []);
  useEffect(() => {
    if (!me?.id) return;
    const code = localStorage.getItem(REF_KEY); if (!code) return;
    void supabase.rpc('apply_referral', { _code: code }).then(result => { if (!result.error) localStorage.removeItem(REF_KEY); });
  }, [me?.id]);
  return null;
}
