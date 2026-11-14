import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { MessageCircle, Bell, Phone } from "lucide-react";
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
import { BellPaymentNotice } from '@/components/BellPaymentNotice';
import { VehicleDemandBell } from '@/components/VehicleDemandBell';

export type Post = Database["public"]["Tables"]["posts"]["Row"];

export function PostCard({
  post,
  meId,
  highlight,
  actions,
  compact = false,
  hideDate = false,
  anonymousWork = false,
}: {
  post: Post;
  meId?: string | undefined;
  highlight?: boolean;
  actions?: React.ReactNode;
  compact?: boolean;
  hideDate?: boolean;
  anonymousWork?: boolean;
}) {
  const isJob = post.module === "job";
  const nav = useNavigate();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [details, setDetails] = useState<PostDetails | null>(null);
  const [detailsBusy, setDetailsBusy] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const checkAccess = async () => {
    if (!meId) { setUpgradeOpen(true); return false; }
    const { data, error } = await supabase.rpc('has_paid_bell', { _user: meId });
    if (error) { toast.error('ప్రవేశం తనిఖీ కాలేదు · Could not check access'); return false; }
    if (!data) { setUpgradeOpen(true); return false; }
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
  const openVehicle = async (chat: boolean) => {
    if (post.user_id === meId || sending) return;
    setSending(true);
    try {
      if (!await checkAccess()) return;
      if (chat) {
        const result = await supabase.rpc('open_vehicle_chat', { _post: post.id });
        if (result.error) { toast.error('సంభాషణ ప్రారంభం కాలేదు'); return; }
        if (result.data) await nav({ to: '/chat/$userId', params: { userId: result.data }, search: { post: post.id } });
      } else { await openDetails(); }
    } finally { setSending(false); }
  };
  const contact = () => { void ring(); };
  const ring = async () => {
    if (sending) return;
    if (post.user_id === meId) {
      return;
    }
    setSending(true);
    try {
    if (!await checkAccess()) return;
    const { data, error } = await supabase.rpc("ring_post", { _post_id: post.id });
    if (error) { if (error.message.includes('PAID_BELL_REQUIRED')) setUpgradeOpen(true); else toast.error("సమాచారం పంపలేకపోయాం · Could not send interest"); return; }
    if (data) nav({ to: "/chat/$userId", params: { userId: data }, search: { post: post.id } });
    } finally { setSending(false); }
  };
  return <article className={compact ? "home-post-row" : "space-y-2 rounded-lg border bg-card p-3"}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="break-words text-lg font-bold">{isJob ? post.skill || post.title : <Button variant="ghost" className="h-auto w-full justify-start whitespace-normal p-0 text-left text-lg font-bold" disabled={sending} onClick={()=>void openVehicle(false)}>{vehicleTypeLabel(post.vehicle_type) || 'వాహనం · Vehicle'}</Button>}</h3>
        <p className="flex min-w-0 items-start gap-1 text-sm"><MapPin className="size-4 shrink-0" /><span translate="no" className="min-w-0 whitespace-normal break-words">{isJob ? post.location : `${post.from_place || '…'} → ${post.to_place || '…'}`}</span></p>
        {!anonymousWork && (post.salary || (isJob && compact)) && <p translate="no" className="flex items-start gap-1 break-words text-sm font-semibold"><IndianRupee className="size-4 shrink-0" />{post.salary || 'జీతం ఇవ్వలేదు'}</p>}
      </div>
      {jobIsVisible(post) && (post.module === 'vehicle' ? <div className="flex shrink-0 gap-2"><Button variant="outline" size="icon" aria-label="చాట్" title="చాట్" disabled={sending} onClick={()=>void openVehicle(true)}><MessageCircle /></Button><VehicleDemandBell postId={post.id} /></div> : <Button type="button" variant="outline" size="icon" disabled={sending} className="shrink-0" onClick={contact} aria-label="గంట · Bell"><Bell /></Button>)}
    </div>
    {anonymousWork && <Button variant="outline" onClick={contact} disabled={sending}><MessageCircle />చాట్</Button>}
    {isJob && compact && !anonymousWork && <p className="break-words text-xs text-muted-foreground">పేరు: దాచబడింది · మొబైల్ నంబరు: దాచబడింది · ఫోటో: దాచబడింది · షాప్ పేరు: దాచబడింది</p>}
    
    <Dialog open={detailsOpen} onOpenChange={open => { setDetailsOpen(open); if (!open) setDetails(null); }}><DialogContent className="max-h-[85svh] overflow-y-auto"><DialogTitle>ప్రకటన వివరాలు · Post details</DialogTitle><DialogDescription>{isJob ? post.skill || 'ఉద్యోగం · Job' : vehicleTypeLabel(post.vehicle_type)}</DialogDescription><p translate="no" className="break-words">{isJob ? post.location : `${post.from_place || '…'} → ${post.to_place || '…'}`}</p>{post.salary && <p translate="no">{post.salary}</p>}{details?.description && <p translate="no" className="whitespace-pre-wrap break-words">{details.description}</p>}{details?.trip_date && <p translate="no">{details.trip_date}</p>}{details?.capacity_tons != null && <p>{details.capacity_tons} టన్నులు · tons</p>}{!isJob && details?.contact_phone && /^[6-9]\d{9}$/.test(details.contact_phone) && <Button asChild><a href={`tel:+91${details.contact_phone}`}><Phone /><span translate="no">{details.contact_phone}</span></a></Button>}</DialogContent></Dialog>
    {isJob ? <BellPaymentNotice open={upgradeOpen} onOpenChange={setUpgradeOpen} /> : <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}><DialogContent><DialogTitle>₹100 పే చేయండి</DialogTitle><DialogDescription>₹100 పే చేయండి - ఇందులో ఉన్న వ్యక్తులతో చాట్ చేయవచ్చు మరియు మొబైల్ నెంబర్ తీసుకోవచ్చు, మీరు వాళ్లతో మాట్లాడుకోవచ్చు</DialogDescription><Button onClick={()=>void nav({to:'/dashboard'})}>₹100 చెల్లింపు</Button></DialogContent></Dialog>}
    {actions && meId === post.user_id && <div className="flex flex-wrap gap-2">{actions}</div>}
    {!isJob && !compact && <ResponsibilityNotice />}
  </article>;
}

export const VEHICLE_WAIT_MESSAGE = 'ఈ రకమైన వాహనం ప్రస్తుతానికి అందుబాటులో లేదు. అందుబాటులోకి వచ్చాక మీకు నోటిఫికేషన్ వస్తుంది. ఇది బుకింగ్ నిర్ధారణ కాదు; సూచన అర్హత, అనుమతులు వర్తిస్తాయి.';
