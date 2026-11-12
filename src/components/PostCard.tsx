import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { MessageCircle, Bell } from "lucide-react";
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
import { useAccountProgram } from '@/lib/use-account-program';
import { ProfileRequest } from '@/components/ProfileRequest';
import { useMe } from '@/lib/session';
import { markAccountBellActivated, shouldShowProfileRequest } from '@/lib/bell-activation';
import { useQueryClient } from '@tanstack/react-query';

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
  const { data: program } = useAccountProgram(meId);
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const [profileOpen, setProfileOpen] = useState(false);
  const checkAccess = async () => {
    if (!meId) { nav({ to: '/auth' }); return false; }
    const { data, error } = await supabase.rpc('my_prime99');
    if (error) { toast.error('ప్రవేశం తనిఖీ కాలేదు · Could not check access'); return false; }
    if (!(data as { active?: boolean })?.active) { setUpgradeOpen(true); return false; }
    return true;
  };
  const openDetails = async () => {
    if (detailsBusy) return;
    setDetailsBusy(true);
    try {
      const { data, error } = await supabase.rpc('get_post_details', { _post: post.id });
      if (error) { if (error.message.includes('GOODS_MEMBERSHIP_REQUIRED')) setUpgradeOpen(true); else toast.error('వివరాలు రాలేదు · Could not load details'); return; }
      setDetails(data as PostDetails); setDetailsOpen(true);
    } finally { setDetailsBusy(false); }
  };
  const vehicleNotice = !isJob && <Dialog open={noticeOpen} onOpenChange={setNoticeOpen}>
    <DialogContent className="max-h-[85svh] overflow-y-auto">
      <DialogTitle>వాహనం సంప్రదించే ముందు · Before contacting the vehicle</DialogTitle>
      <DialogDescription>{vehicleTypeLabel(post.vehicle_type)} · {post.from_place} → {post.to_place}</DialogDescription>
      <p role="status" className="rounded-lg border p-3 font-bold">ఈ రకమైన వాహనం ప్రస్తుతానికి అందుబాటులో లేదు. అందుబాటులోకి వచ్చాక మీకు నోటిఫికేషన్ వస్తుంది. సూచనలకు చెల్లింపు అర్హత, మీ గంట ఎంపిక అవసరం; అందుబాటు ఇంకా నిర్ధారణ కాలేదు.</p>
      <ResponsibilityNotice prominent />
      <Button onClick={() => { setNoticeOpen(false); void ring(); }}><MessageCircle />సంప్రదించండి · Contact</Button>
    </DialogContent>
  </Dialog>;
  const contact = () => { if (!isJob && post.user_id !== meId) setNoticeOpen(true); else void ring(); };
  const ring = async () => {
    if (!meId) { nav({ to: "/auth" }); return; }
    if (!me?.profile?.bell_activated_at) {
      void markAccountBellActivated(meId).then(() => queryClient.invalidateQueries({ queryKey: ['me'] }));
    }
    if (!await checkAccess()) return;
    if (!program) {
      if (shouldShowProfileRequest(false, me?.profile?.bell_activated_at)) setProfileOpen(true);
      else nav({ to: '/dashboard' });
      return;
    }
    if (post.user_id === meId) {
      const { data, error } = await supabase.rpc("notify_matches", { _post_id: post.id });
      if (error?.message.includes('GOODS_MEMBERSHIP_REQUIRED')) setUpgradeOpen(true);
      else if (error) toast.error(error.message); else toast.success(data ? `${data} మందికి సూచన నమోదు అయింది · Queued for ${data}` : "సరిపోయేవారు లేరు · No matching users yet");
      return;
    }
    const { data, error } = await supabase.rpc("ring_post", { _post_id: post.id });
    if (error) { if (error.message.includes('PAID_CHAT_REQUIRED') || error.message.includes('GOODS_MEMBERSHIP_REQUIRED')) setUpgradeOpen(true); else toast.error(error.message.includes("DAILY_ALERT_LIMIT") ? "అవతలి వ్యక్తి రోజువారీ సమాచార పరిమితి పూర్తయింది · Recipient's daily alert limit reached" : "సమాచారం పంపలేకపోయాం · Could not send interest"); return; }
    if (!isJob) { toast.info(VEHICLE_WAIT_MESSAGE, { duration: 8000 }); void supabase.rpc('notify_nearby_vehicles', { _post: post.id }); }
    if (data) nav({ to: "/chat/$userId", params: { userId: data }, search: { post: post.id } });
  };
  return <article className={compact ? "home-post-row" : "space-y-2 rounded-lg border bg-card p-3"}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="break-words text-lg font-bold">{isJob ? post.skill || post.title : vehicleTypeLabel(post.vehicle_type) || 'వాహనం · Vehicle'}</h3>
        <p className="flex min-w-0 items-start gap-1 text-sm"><MapPin className="size-4 shrink-0" /><span translate="no" className="min-w-0 whitespace-normal break-words">{isJob ? post.location : `${post.from_place || '…'} → ${post.to_place || '…'}`}</span></p>
        {post.salary && <p className="flex items-center gap-1 text-sm font-semibold"><IndianRupee className="size-4 shrink-0" />{post.salary}</p>}
      </div>
      {jobIsVisible(post) && <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={contact} aria-label="గంట · Bell"><Bell /></Button>}
    </div>
    {!compact && <Button variant="ghost" size="sm" disabled={detailsBusy} onClick={() => void openDetails()}><Info />వివరాలు · Details</Button>}
    <Dialog open={detailsOpen} onOpenChange={open => { setDetailsOpen(open); if (!open) setDetails(null); }}><DialogContent className="max-h-[85svh] overflow-y-auto"><DialogTitle>ప్రకటన వివరాలు · Post details</DialogTitle><DialogDescription>{isJob ? post.skill || 'ఉద్యోగం · Job' : vehicleTypeLabel(post.vehicle_type)}</DialogDescription><p translate="no" className="break-words">{isJob ? post.location : `${post.from_place || '…'} → ${post.to_place || '…'}`}</p>{post.salary && <p translate="no">{post.salary}</p>}{details?.description && <p translate="no" className="whitespace-pre-wrap break-words">{details.description}</p>}{details?.trip_date && <p translate="no">{details.trip_date}</p>}{details?.capacity_tons != null && <p>{details.capacity_tons} టన్నులు · tons</p>}</DialogContent></Dialog>
    <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}><DialogContent><DialogTitle>గంట, సంభాషణకు చెల్లింపు · Paid contact</DialogTitle><DialogDescription>చూడటం ఉచితం. గంట ద్వారా చాట్‌కు ₹100 సభ్యత్వ చెల్లింపు ఆమోదం కావాలి; అర్హమైన నంబర్ల తగ్గింపు ₹49. వ్యక్తిగత పేరు, ఫోటో, మొబైల్ వివరాల్లో కనిపించవు.</DialogDescription><Button onClick={() => nav({ to: '/dashboard' })}>చెల్లింపు వివరాలు · Payment</Button></DialogContent></Dialog>
    {actions && meId === post.user_id && <div className="flex flex-wrap gap-2">{actions}</div>}
    {vehicleNotice}
    <ProfileRequest open={profileOpen} onOpenChange={setProfileOpen} />
  </article>;
}

export const VEHICLE_WAIT_MESSAGE = 'ఈ రకమైన వాహనం ప్రస్తుతానికి అందుబాటులో లేదు. అందుబాటులోకి వచ్చాక మీకు నోటిఫికేషన్ వస్తుంది. ఇది బుకింగ్ నిర్ధారణ కాదు; సూచన అర్హత, అనుమతులు వర్తిస్తాయి.';
