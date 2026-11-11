import { useState } from 'react';
import { toast } from 'sonner';
import { Inbox, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { Post } from '@/components/PostCard';
import { indianDay } from '@/lib/daily-devotional';

export function VehicleAlertActions({ post, meId }: { post: Post; meId?: string | undefined }) {
  const [busy, setBusy] = useState(false);
  if (post.module !== 'vehicle' || !meId) return null;
  const own = meId === post.user_id;
  const availableToday = own && post.kind === 'owner' && post.trip_date === indianDay(new Date());
  return <div className="space-y-2 border-t pt-2">
    {!own && <Button variant="outline" className="w-full whitespace-normal" disabled={busy} onClick={async () => {
      setBusy(true); const result = await supabase.rpc('follow_vehicle_route', { _post: post.id }); setBusy(false);
      if (result.error) toast.error('ఈ ప్రకటనకు స్థానాలు లేవు లేదా మార్గం భద్రపడలేదు · Selected route coordinates unavailable');
      else toast.success('ఈ మార్గానికి కొత్త సూచనలు కోరారు · Following this route');
    }}><MapPin />ఈ మార్గం మళ్లీ కావాలి · Follow route</Button>}
    {!own && post.kind === 'owner' && <Button variant="outline" className="w-full whitespace-normal" disabled={busy} onClick={async () => {
      setBusy(true); const result = await supabase.rpc('request_vehicle_availability', { _post: post.id }); setBusy(false);
      if (result.error) toast.error('అభ్యర్థన భద్రపడలేదు · Request failed');
      else toast.success('అందుబాటు సూచన కోరారు; ఇది బుకింగ్ కాదు · Availability requested; not a booking');
    }}><Inbox />అందుబాటులోకి రాగానే సూచన · Availability alert</Button>}
    {availableToday && <Button variant="outline" className="w-full whitespace-normal" disabled={busy} onClick={async () => {
      setBusy(true); const result = await supabase.rpc('set_vehicle_available', { _post: post.id }); setBusy(false);
      if (result.error) toast.error('అందుబాటు భద్రపడలేదు · Availability not saved');
      else toast.success('మీరు అందుబాటులో ఉందని తెలిపారు · Owner availability recorded');
    }}><Inbox />వాహనం ఇప్పుడు అందుబాటులో ఉంది · Mark available now</Button>}
  </div>;
}