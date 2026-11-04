import { Link } from "@tanstack/react-router";
import { Headset } from "lucide-react";
import { ADMIN_PHONE } from "@/lib/jobs";
import { useAdminChatTarget } from "@/components/AppHelpers";

export function AdminChatButton() {
  const adminId = useAdminChatTarget(ADMIN_PHONE);
  const cls = "flex w-full items-center gap-3 rounded-xl border-2 border-primary bg-card p-4 font-bold text-primary";
  const body = (<><Headset className="size-6" />అడ్మిన్‌తో చాట్ · Chat with Admin<span className="ml-auto text-sm font-normal text-muted-foreground">{ADMIN_PHONE}</span></>);
  return adminId ? (
    <Link to="/chat/$userId" params={{ userId: adminId }} className={cls}>{body}</Link>
  ) : (
    <a href={`https://wa.me/91${ADMIN_PHONE}`} target="_blank" rel="noreferrer" className={cls}>{body}</a>
  );
}
