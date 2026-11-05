import { Link } from "@tanstack/react-router";
import { Headset } from "lucide-react";
import { useAdminChatTarget } from "@/components/AppHelpers";

export function AdminChatButton({ compact = false, labeled = false }: { compact?: boolean; labeled?: boolean }) {
  const adminId = useAdminChatTarget();
  const cls = labeled
    ? "flex min-h-11 items-center gap-1.5 rounded-full border-2 border-primary bg-card px-3 text-xs font-bold text-primary"
    : compact ? 'gold-ring' : "flex w-full items-center gap-3 rounded-xl border-2 border-primary bg-card p-4 font-bold text-primary";
  const body = (<><Headset className="size-5" />{labeled ? 'చాట్ · Chat' : !compact ? 'అడ్మిన్‌తో చాట్ · Chat with Admin' : null}</>);
  return adminId ? (
    <Link to="/chat/$userId" params={{ userId: adminId }} className={cls} aria-label="అడ్మిన్‌తో చాట్ · Chat with Admin" title="అడ్మిన్‌తో చాట్ · Chat with Admin">{body}</Link>
  ) : (
    <Link to="/chats" className={cls} aria-label="అడ్మిన్‌తో చాట్ · Chat with Admin" title="అడ్మిన్‌తో చాట్ · Chat with Admin">{body}</Link>
  );
}
