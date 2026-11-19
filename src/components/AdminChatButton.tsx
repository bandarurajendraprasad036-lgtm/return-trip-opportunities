import { useNavigate, useLocation } from "@tanstack/react-router";
import { Headset } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminChatTarget } from "@/components/AppHelpers";
import { Button } from '@/components/ui/button';
import { useMe } from '@/lib/session';

export function AdminChatButton({ compact = false, labeled = false }: { compact?: boolean; labeled?: boolean }) {
  const adminId = useAdminChatTarget();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const location = useLocation();
  const { data: me } = useMe();
  const cls = labeled
    ? "support-action flex min-h-11 items-center gap-1.5 rounded-full border-2 px-3 text-xs font-bold"
    : compact ? 'gold-ring' : "support-action flex w-full items-center gap-3 rounded-xl border-2 p-4 font-bold";
  const body = (<><Headset className="size-5 shrink-0" />{labeled || !compact ? 'నిర్వాహకుడితో మాట్లాడండి' : null}</>);
  const open = async () => {
    if (busy) return;
    setBusy(true);
    try {
      let target = adminId;
      if (!target) {
        const { data, error } = await supabase.rpc('support_admin_id');
        if (!error) target = data ?? null;
      }
      if (target) await navigate({ to: '/chat/$userId', params: { userId: target } });
      else await navigate({ to: '/chats' });
    } catch { await navigate({ to: '/chats' }); }
    finally { setBusy(false); }
  };
  if (!me || !['/dashboard', '/admin'].includes(location.pathname)) return null;
  return <Button data-subscription-exempt type="button" variant="outline" className={`${cls} h-auto whitespace-normal`} aria-label="నిర్వాహకుడితో మాట్లాడండి" title="నిర్వాహకుడితో మాట్లాడండి" aria-busy={busy} disabled={busy} onClick={() => void open()}>{body}</Button>;
}
