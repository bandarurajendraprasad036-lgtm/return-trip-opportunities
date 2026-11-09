import { Link } from "@tanstack/react-router";
import { Headset } from "lucide-react";
import { useAdminChatTarget } from "@/components/AppHelpers";

export function AdminChatButton({ compact = false, labeled = false }: { compact?: boolean; labeled?: boolean }) {
  const adminId = useAdminChatTarget();
  const cls = labeled
    ? "support-action flex min-h-11 items-center gap-1.5 rounded-full border-2 px-3 text-xs font-bold"
    : compact ? 'gold-ring' : "support-action flex w-full items-center gap-3 rounded-xl border-2 p-4 font-bold";
  const body = (<><Headset className="size-5" />{labeled ? 'చాట్ · Chat' : !compact ? 'అడ్మిన్‌తో చాట్ · Chat with Admin' : null}</>);
  return adminId ? (
    <Link to="/chat/$userId" params={{ userId: adminId }} className={cls} aria-label="అడ్మిన్‌తో చాట్ · Chat with Admin" title="అడ్మిన్‌తో చాట్ · Chat with Admin">{body}</Link>
  ) : (
    <Link to="/chats" className={cls} aria-label="అడ్మిన్‌తో చాట్ · Chat with Admin" title="అడ్మిన్‌తో చాట్ · Chat with Admin">{body}</Link>
  );
}
