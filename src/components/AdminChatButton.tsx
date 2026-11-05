import { Link } from "@tanstack/react-router";
import { Headset } from "lucide-react";
import { useAdminChatTarget } from "@/components/AppHelpers";

export function AdminChatButton({ compact = false }: { compact?: boolean }) {
  const adminId = useAdminChatTarget();
  const cls = compact ? 'gold-ring' : "flex w-full items-center gap-3 rounded-xl border-2 border-primary bg-card p-4 font-bold text-primary";
  const body = (<><Headset className="size-6" />{!compact && 'అడ్మిన్‌తో చాట్ · Chat with Admin'}</>);
  return adminId ? (
    <Link to="/chat/$userId" params={{ userId: adminId }} className={cls} aria-label="అడ్మిన్‌తో చాట్ · Chat with Admin" title="అడ్మిన్‌తో చాట్ · Chat with Admin">{body}</Link>
  ) : (
    <Link to="/chats" className={cls} aria-label="అడ్మిన్‌తో చాట్ · Chat with Admin" title="అడ్మిన్‌తో చాట్ · Chat with Admin">{body}</Link>
  );
}
