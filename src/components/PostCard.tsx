import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, IndianRupee, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";
import { useState } from 'react';
import { ResponsibilityNotice } from '@/components/ResponsibilityNotice';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { jobIsVisible } from '@/lib/post-publication';
import { vehicleTypeLabel } from '@/lib/vehicle-types';
import { isGoodsPost, type PostDetails } from '@/lib/post-access';

export type Post = Database["public"]["Tables"]["posts"]["Row"];

export function PostCard({
  post,
  meId,
  highlight,
  actions,
  compact = false,
  hideDate = false,
}: {
  post: Post;
  meId?: string | undefined;
  highlight?: boolean;
  actions?: React.ReactNode;
  compact?: boolean;
  hideDate?: boolean;
}) {
  const isJob = post.module === "job";
  const nav = useNavigate();
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [details, setDetails] = useState<PostDetails | null>(null);
  const [detailsBusy, setDetailsBusy] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const goods = isGoodsPost(post);
  const checkAccess = async () => {
    if (!goods) return true;
    if (!meId) { nav({ to: '/auth' }); return false; }
    const { data, error } = await supabase.rpc('my_goods_membership');
    if (error) { toast.error('సభ్యత్వం తనిఖీ కాలేదు · Could not check membership'); return false; }
    if (!data) { setUpgradeOpen(true); return false; }
    return true;
  };
  const openDetails = async () => {
    if (detailsBusy) return;
    setDetailsBusy(true);
    try {
      if (!await checkAccess()) return;
      const { data, error } = await supabase.rpc('get_post_details', { _post: post.id });
      if (error) { if (error.message.includes('GOODS_MEMBERSHIP_REQUIRED')) setUpgradeOpen(true); else toast.error('వివరాలు రాలేదు · Could not load details'); return; }
      setDetails(data as PostDetails); setDetailsOpen(true);
    } finally { setDetailsBusy(false); }
  };
  const vehicleNotice = !isJob && <Dialog open={noticeOpen} onOpenChange={setNoticeOpen}>
    <DialogContent className="max-h-[85svh] overflow-y-auto">
      <DialogTitle>వాహనం సంప్రదించే ముందు · Before contacting the vehicle</DialogTitle>
      <DialogDescription>{vehicleTypeLabel(post.vehicle_type)} · {post.from_place} → {post.to_place}</DialogDescription>
      <ResponsibilityNotice prominent />
      <Button onClick={() => { setNoticeOpen(false); void ring(); }}><Bell />గంట కొట్టి చాట్ చేయండి · Ring and chat</Button>
    </DialogContent>
  </Dialog>;
  const contact = () => { if (!isJob && post.user_id !== meId) setNoticeOpen(true); else void ring(); };
  const ring = async () => {
    if (!meId) { nav({ to: "/auth" }); return; }
    if (!await checkAccess()) return;
    if (post.user_id === meId) {
      const { data, error } = await supabase.rpc("notify_matches", { _post_id: post.id });
      if (error?.message.includes('GOODS_MEMBERSHIP_REQUIRED')) setUpgradeOpen(true);
      else if (error) toast.error(error.message); else toast.success(data ? `${data} మందికి తెలియజేశాం · Notified ${data}` : "సరిపోయేవారు లేరు · No matching users yet");
      return;
    }
    const { data, error } = await supabase.rpc("ring_post", { _post_id: post.id });
    if (error) { if (error.message.includes('GOODS_MEMBERSHIP_REQUIRED')) setUpgradeOpen(true); else toast.error(error.message.includes("DAILY_ALERT_LIMIT") ? "అవతలి వ్యక్తి రోజువారీ సమాచార పరిమితి పూర్తయింది · Recipient's daily alert limit reached" : "సమాచారం పంపలేకపోయాం · Could not send interest"); return; }
    if (data) nav({ to: "/chat/$userId", params: { userId: data }, search: { post: post.id } });
  };
  return <article className={compact ? "home-post-row" : "space-y-2 rounded-lg border bg-card p-3"}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="break-words text-lg font-bold">{isJob ? post.skill || post.title : vehicleTypeLabel(post.vehicle_type) || 'వాహనం · Vehicle'}</h3>
        <p className="flex items-center gap-1 break-words text-sm"><MapPin className="size-4 shrink-0" />{isJob ? post.location : `${post.from_place || '…'} → ${post.to_place || '…'}`}</p>
        {post.salary && <p className="flex items-center gap-1 text-sm font-semibold"><IndianRupee className="size-4 shrink-0" />{post.salary}</p>}
      </div>
      {jobIsVisible(post) && <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={contact} aria-label="గంట కొట్టి చాట్ చేయండి · Ring and chat"><Bell /></Button>}
    </div>
    <Button variant="ghost" size="sm" disabled={detailsBusy} onClick={() => void openDetails()}><Info />వివరాలు · Details</Button>
    <Dialog open={detailsOpen} onOpenChange={open => { setDetailsOpen(open); if (!open) setDetails(null); }}><DialogContent className="max-h-[85svh] overflow-y-auto"><DialogTitle>ప్రకటన వివరాలు · Post details</DialogTitle><DialogDescription>{isJob ? post.skill || 'ఉద్యోగం · Job' : vehicleTypeLabel(post.vehicle_type)}</DialogDescription><p>{isJob ? post.location : `${post.from_place || '…'} → ${post.to_place || '…'}`}</p>{post.salary && <p>{post.salary}</p>}{details?.description && <p className="whitespace-pre-wrap break-words">{details.description}</p>}{details?.trip_date && <p>{details.trip_date}</p>}{details?.capacity_tons != null && <p>{details.capacity_tons} టన్నులు · tons</p>}{goods && details?.public_photo && /^https:\/\//.test(details.public_photo) && <img src={details.public_photo} alt="పంచుకున్న సరకు వాహనం · Shared goods vehicle" className="max-h-64 w-full object-contain" />}{goods && details?.public_brand && <p>{details.public_brand}</p>}{goods && details?.contact_phone && <p>{details.contact_phone}</p>}</DialogContent></Dialog>
    <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}><DialogContent><DialogTitle>సరకు వాహన సభ్యత్వం · Goods membership</DialogTitle><DialogDescription>సరకు వాహన వివరాలు, గంట, సంభాషణకు ఆమోదించిన ₹699 నెల సభ్యత్వం అవసరం. · Approved ₹699 monthly membership required.</DialogDescription><Button onClick={() => nav({ to: '/dashboard' })}>సభ్యత్వం · Membership</Button></DialogContent></Dialog>
    {actions && meId === post.user_id && <div className="flex flex-wrap gap-2">{actions}</div>}
    {vehicleNotice}
  </article>;
}
