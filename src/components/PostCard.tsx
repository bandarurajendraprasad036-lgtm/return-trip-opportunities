import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, Calendar, MapPin, MessageCircle, Phone, Truck, IndianRupee, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KIND_LABEL, type Kind } from "@/lib/match";
import type { Database } from "@/integrations/supabase/types";

export type Post = Database["public"]["Tables"]["posts"]["Row"];

export function PostCard({
  post,
  meId,
  highlight,
  actions,
}: {
  post: Post;
  meId?: string | undefined;
  highlight?: boolean;
  actions?: React.ReactNode;
}) {
  const label = KIND_LABEL[post.kind as Kind];
  const isJob = post.module === "job";
  const nav = useNavigate();
  const showPhone = !isJob || post.show_contact;
  const ring = async () => {
    if (!meId) { nav({ to: "/auth" }); return; }
    if (post.user_id === meId) {
      const { data, error } = await supabase.rpc("notify_matches", { _post_id: post.id });
      if (error) toast.error(error.message); else toast.success(data ? `${data} మందికి తెలియజేశాం · Notified ${data}` : "సరిపోయేవారు లేరు · No matching users yet");
      return;
    }
    const { data, error } = await supabase.rpc("ring_post", { _post_id: post.id });
    if (error) { toast.error(error.message.includes("DAILY_ALERT_LIMIT") ? "అవతలి వ్యక్తి రోజువారీ సమాచార పరిమితి పూర్తయింది · Recipient's daily alert limit reached" : "సమాచారం పంపలేకపోయాం · Could not send interest"); return; }
    if (data) nav({ to: "/chat/$userId", params: { userId: data }, search: { post: post.id } });
  };
  return (
    <article
      className={`overflow-hidden rounded-xl border bg-card shadow-card ${highlight ? "ring-2 ring-secondary" : ""}`}
    >
      <div className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold text-primary-foreground ${isJob ? "bg-job" : "bg-vehicle"}`}>
        {isJob ? <Briefcase className="size-4" /> : <Truck className="size-4" />}
        {label.te} · {label.en}
        {highlight && (
          <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
            మ్యాచ్ Match
          </span>
        )}
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-start gap-2">
          <h3 className="flex-1 text-xl font-bold leading-tight">{post.title}</h3>
          {post.status === "active" && (
            <Button type="button" variant="secondary" size="icon" onClick={ring} aria-label="గంట కొట్టి చాట్ చేయండి · Ring and chat"><Bell className="size-5" /></Button>
          )}
        </div>
        {isJob ? (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span className="flex items-center gap-1"><MapPin className="size-4 text-accent" />{post.location}</span>
            {post.salary && (
              <span className="flex items-center gap-1 font-semibold text-success"><IndianRupee className="size-4" />{post.salary}</span>
            )}
          </div>
        ) : (
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2 text-base font-semibold">
              <MapPin className="size-4 text-accent" />
              {post.from_place} <ArrowRight className="size-4" /> {post.to_place}
            </div>
            <div className="flex flex-wrap gap-x-4 text-muted-foreground">
              {post.trip_date && (
                <span className="flex items-center gap-1"><Calendar className="size-4" />{new Date(post.trip_date).toLocaleDateString("en-IN")}</span>
              )}
              {post.vehicle_type && <span>🚚 {post.vehicle_type}</span>}
              {post.capacity_tons != null && <span>{post.capacity_tons} టన్నులు · tons</span>}
              {post.goods_type && <span>📦 {post.goods_type}</span>}
            </div>
          </div>
        )}
        {post.description && <p className="text-sm text-muted-foreground">{post.description}</p>}
        <div className="flex gap-2 pt-1">
          {actions ??
            (meId !== post.user_id && (
              <>
                {showPhone && post.contact_phone && (
                  <Button asChild variant="outline" className="flex-1">
                    <a href={`tel:${post.contact_phone}`}><Phone />కాల్ Call</a>
                  </Button>
                )}
                <Button asChild className="flex-1">
                  <Link to="/chat/$userId" params={{ userId: post.user_id }} search={{ post: post.id }}>
                    <MessageCircle />చాట్ Chat
                  </Link>
                </Button>
              </>
            ))}
        </div>
      </div>
    </article>
  );
}
