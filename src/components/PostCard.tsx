import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { MessageCircle, Bell, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, IndianRupee, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { freeWorkClientAction } from '@/lib/free-work-client';
import { ResponsibilityNotice } from '@/components/ResponsibilityNotice';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { jobIsVisible } from '@/lib/post-publication';
import { vehicleTypeLabel } from '@/lib/vehicle-types';
import { type PostDetails } from '@/lib/post-access';
import { VehicleDemandBell } from '@/components/VehicleDemandBell';
import { VEHICLE_DEMAND_SECTIONS } from '@/lib/vehicle-demand';
import { vehicleDemandCategory } from '@/lib/vehicle-demand';
import type { VehiclePageKind } from '@/lib/vehicle-page';
import { BellPaymentNotice } from '@/components/BellPaymentNotice';
import { PrivateBellDisplay } from '@/components/PrivateBellDisplay';
import { anonymousPostDetails } from '@/lib/display-privacy';
import { AdminBellRowAction } from '@/components/AdminBellRowAction';
import { bellErrorMessage, requireCompleteProfile, retryBell } from '@/lib/bell-request';
import { playTapBell } from '@/lib/bell';
import { IncomingBellList } from '@/components/IncomingBellList';

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
  const workAction = freeWorkClientAction;
  const section = post.service_type === 'service' ? post.kind === 'seeker' ? 'service-wanted' : 'service-providers' : post.kind === 'seeker' ? 'work-wanted' : 'work-offered';
  const nav = useNavigate();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [details, setDetails] = useState<PostDetails | null>(null);
  const [detailsBusy, setDetailsBusy] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [choicesOpen, setChoicesOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<VehiclePageKind | null>(null);
  const [sending, setSending] = useState(false);
  const { data: access = false } = useQuery({ queryKey: ['vehicle-display-access', meId], enabled: !!meId && !isJob, refetchInterval: 10000, queryFn: async () => { if (!meId) return false; const [paid, admin] = await Promise.all([supabase.rpc('has_paid_bell', { _user: meId }), supabase.rpc('has_role', { _user_id: meId, _role: 'admin' })]); if (paid.error || admin.error) throw paid.error || admin.error; return !!paid.data || !!admin.data; } });
  const vehicleUnlocked = access || post.user_id === meId;
  const checkAccess = async () => {
    await requireCompleteProfile();
    if (isJob) return true;
    if (vehicleUnlocked) return true;
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
      if (error) { if (error.message.includes('PAID_BELL_REQUIRED') || error.message.includes('GOODS_MEMBERSHIP_REQUIRED')) setUpgradeOpen(true); else toast.error('వివరాలు రాలేదు'); return; }
      setDetails(data ? anonymousPostDetails(data as PostDetails) : null); setDetailsOpen(true);
    } finally { setDetailsBusy(false); }
  };
  const openVehicle = async (chat: boolean) => {
    if (sending || (chat && post.user_id === meId)) return;
    setSending(true);
    try {
      if (!await checkAccess()) return;
      if (chat) {
        const result = await supabase.rpc('open_vehicle_chat', { _post: post.id });
        if (result.error) { toast.error('సంభాషణ ప్రారంభం కాలేదు'); return; }
        if (result.data) await nav({ to: '/chat/$userId', params: { userId: result.data }, search: { post: post.id } });
      } else { await openDetails(); }
    } catch (error) { toast.error(bellErrorMessage(error)); } finally { setSending(false); }
  };
  const contact = () => { void ring(); };
  const ring = async () => {
    if (sending) return;
    if (post.user_id === meId) return;
    playTapBell();
    setSending(true);
    try {
    await requireCompleteProfile();
    if (isJob) {
      const result = await workAction({ data: { action: 'ring', section, id: post.id, source: 'post' } });
      if (result.target) await nav({ to: '/chat/$userId', params: { userId: result.target }, search: { post: undefined } });
      return;
    }
    const { data } = await retryBell(() => supabase.rpc("ring_post", { _post_id: post.id }));
    if (data) nav({ to: "/chat/$userId", params: { userId: data }, search: { post: post.id } });
    } catch (error) { toast.error(bellErrorMessage(error)); } finally { setSending(false); }
  };
  return <article className={compact ? "home-post-row" : "space-y-2 rounded-lg border bg-card p-3"}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="break-words text-lg font-bold">{isJob ? post.skill || post.title : <Button variant="ghost" className="h-auto w-full justify-start whitespace-normal p-0 text-left text-lg font-bold" disabled={sending} onClick={()=>{setSelectedCategory(null);setChoicesOpen(true);}}>{post.vehicle_name || vehicleTypeLabel(post.vehicle_type) || 'వాహనం'}</Button>}</h3>
        <p className="flex min-w-0 items-start gap-1 text-sm"><MapPin className="size-4 shrink-0" /><span translate="no" className="min-w-0 whitespace-normal break-words">{isJob ? post.location : `${post.from_place || '…'} → ${post.to_place || '…'}`}</span></p>
        {!anonymousWork && (post.salary || (isJob && compact)) && <p translate="no" className="flex items-start gap-1 break-words text-sm font-semibold"><IndianRupee className="size-4 shrink-0" />{post.salary || 'జీతం ఇవ్వలేదు'}</p>}
      </div>
      {jobIsVisible(post) && (post.module === 'vehicle' ? <div className="flex shrink-0 gap-2"><Button variant="outline" size="icon" aria-label="చాట్" title="చాట్" disabled={sending} onClick={()=>void openVehicle(true)}><MessageCircle /></Button><VehicleDemandBell postId={post.id} ownerId={post.user_id} postRoute={post} /></div> : <Button type="button" variant="outline" size="icon" disabled={sending} className="shrink-0" onClick={contact} aria-label="గంట · Bell"><Bell /></Button>)}
    </div>
    <PrivateBellDisplay />
    {meId === post.user_id && <Button asChild variant="outline" data-subscription-exempt className="h-auto min-h-11 whitespace-normal"><Link to="/bell-board" search={{ section: isJob ? section : vehicleDemandCategory(post), post: post.id }}>గంట కొట్టిన వాళ్ళ జాబితా</Link></Button>}
    {isJob && meId === post.user_id && <IncomingBellList section={section} post={post.id} />}
    <AdminBellRowAction id={post.id} source="listing" section={isJob ? 'work' : 'vehicle'} />
    {anonymousWork && <Button variant="outline" onClick={contact} disabled={sending}><MessageCircle />చాట్</Button>}
    {isJob && <Button variant="outline" onClick={()=>void openDetails()} disabled={detailsBusy}><Info />వివరాలు</Button>}
    {!isJob && !hideDate && post.trip_date && <p translate="no" className="text-sm">{post.trip_date}</p>}
    {!isJob && <Button variant="outline" className="h-auto min-h-11 w-full whitespace-normal" onClick={()=>{setSelectedCategory(null);setChoicesOpen(true);}} disabled={sending}><Info />వాహన వివరాలు చూడండి</Button>}
    {!isJob && <Dialog open={choicesOpen} onOpenChange={setChoicesOpen}><DialogContent className="max-h-[85svh] overflow-y-auto" aria-describedby={undefined}><DialogTitle>వాహన వివరాలు</DialogTitle>
      {(Object.keys(VEHICLE_DEMAND_SECTIONS) as VehiclePageKind[]).map(kind => <Button key={kind} variant={selectedCategory === kind ? 'default' : 'outline'} className="h-auto w-full whitespace-normal text-left" onClick={() => setSelectedCategory(kind)}><Bell />{VEHICLE_DEMAND_SECTIONS[kind]}</Button>)}
      {selectedCategory && <div className="space-y-3 border-t pt-3"><p translate="no" className="break-all font-bold">గుర్తింపు: {post.id}</p><PrivateBellDisplay /><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={sending} onClick={() => { setChoicesOpen(false); void openVehicle(true); }}><MessageCircle />చాట్</Button><Button variant="outline" asChild><a href={`/bell-board?section=${selectedCategory}`}>గంట కొట్టిన వాళ్ళ జాబితా</a></Button><VehicleDemandBell postId={post.id} ownerId={post.user_id} postRoute={post} category={selectedCategory} /></div></div>}
    </DialogContent></Dialog>}
    
    <Dialog open={detailsOpen} onOpenChange={open => { setDetailsOpen(open); if (!open) setDetails(null); }}><DialogContent className="max-h-[85svh] overflow-y-auto"><DialogTitle>ప్రకటన వివరాలు · Post details</DialogTitle><DialogDescription>{isJob ? post.skill || 'ఉద్యోగం · Job' : vehicleTypeLabel(post.vehicle_type)}</DialogDescription><p translate="no" className="break-words">{isJob ? post.location : `${post.from_place || '…'} → ${post.to_place || '…'}`}</p>{post.salary && <p translate="no">{post.salary}</p>}{details?.description && <p translate="no" className="whitespace-pre-wrap break-words">{details.description}</p>}{details?.trip_date && <p translate="no">{details.trip_date}</p>}{details?.capacity_tons != null && <p>{details.capacity_tons} టన్నులు · tons</p>}{details?.public_photo && <img src={details.public_photo} alt="ప్రకటన ఫోటో" className="max-h-64 w-full object-contain" />}{details?.public_brand && <p translate="no">{details.public_brand}</p>}{details?.vehicle_name && <p translate="no">{details.vehicle_name}</p>}{details?.vehicle_number && <p translate="no">{details.vehicle_number}</p>}{details?.driver_name && <p translate="no">{details.driver_name}</p>}{details?.contact_phone && /^[6-9]\d{9}$/.test(details.contact_phone) && <Button asChild><a href={`tel:+91${details.contact_phone}`}><Phone /><span translate="no">{details.contact_phone}</span></a></Button>}</DialogContent></Dialog>
    {!isJob && <BellPaymentNotice open={upgradeOpen} onOpenChange={setUpgradeOpen} />}
    {actions && meId === post.user_id && <div className="flex flex-wrap gap-2">{actions}</div>}
    {!isJob && !compact && <ResponsibilityNotice />}
  </article>;
}

export const VEHICLE_WAIT_MESSAGE = 'ఈ రకమైన వాహనం ప్రస్తుతానికి అందుబాటులో లేదు. అందుబాటులోకి వచ్చాక మీకు నోటిఫికేషన్ వస్తుంది. ఇది బుకింగ్ నిర్ధారణ కాదు; సూచన అర్హత, అనుమతులు వర్తిస్తాయి.';
