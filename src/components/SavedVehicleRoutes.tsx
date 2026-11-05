import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IndiaPlaceInput } from '@/components/IndiaPlaceInput';
import { RoutePointPicker } from '@/components/RoutePointPicker';
import type { Coordinates } from '@/lib/india-places';

export function SavedVehicleRoutes() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fromPoint, setFromPoint] = useState<Coordinates | null>(null);
  const [toPoint, setToPoint] = useState<Coordinates | null>(null);
  const [busy, setBusy] = useState(false);
  const { data: routes = [], isError } = useQuery({
    queryKey: ['saved-vehicle-routes', me?.id], enabled: Boolean(me),
    queryFn: async () => {
      if (!me) return [];
      const result = await supabase.from('vehicle_route_preferences').select('id,from_place,to_place').eq('user_id', me.id).order('created_at');
      if (result.error) throw result.error;
      return result.data;
    },
  });
  if (!me) return null;
  return <section className="space-y-3 border-y py-4" aria-label="నా వాహన మార్గాలు · My vehicle routes">
    <h2 className="text-xl font-bold">నా వాహన మార్గాలు · My vehicle routes</h2>
    <p className="text-sm text-muted-foreground">మీకు మాత్రమే కనిపిస్తాయి. రెండు స్థానాలు ఎంచుకుని భద్రపరిస్తే ఉజ్జాయింపు 20% పరిధిలో కొత్త వాహన సూచనలకు అంగీకారం. ఉచిత ఖాతాకు ఆమోదించిన సంబంధిత పంచుకున్న ఆధారం అవసరం. · Private; saving selected endpoints opts into approximate route alerts, subject to preferences and approved free-account evidence.</p>
    <form className="space-y-3" onSubmit={async event => {
      event.preventDefault(); if (busy) return;
      if (!fromPoint || !toPoint) { toast.error('రెండు ప్రాంతాలను జాబితాలో లేదా పటంలో ఎంచుకోండి · Select both endpoints'); return; }
      setBusy(true);
      const result = await supabase.rpc('save_vehicle_route_points', { _from: from.trim(), _to: to.trim(), _from_lat: fromPoint.latitude, _from_lng: fromPoint.longitude, _to_lat: toPoint.latitude, _to_lng: toPoint.longitude });
      setBusy(false);
      if (result.error) { toast.error('మార్గం భద్రపడలేదు · Could not save route'); return; }
      setFrom(''); setTo(''); setFromPoint(null); setToPoint(null); await qc.invalidateQueries({ queryKey: ['saved-vehicle-routes', me.id] });
      toast.success('మార్గం భద్రపరిచాం · Route saved');
    }}>
      <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0 text-sm"><label htmlFor="saved-route-from">నుండి · From</label><IndiaPlaceInput id="saved-route-from" value={from} onChange={v => { setFrom(v); setFromPoint(null); }} onSelect={setFromPoint} disabled={busy} /></div>
        <div className="min-w-0 text-sm"><label htmlFor="saved-route-to">వరకు · To</label><IndiaPlaceInput id="saved-route-to" value={to} onChange={v => { setTo(v); setToPoint(null); }} onSelect={setToPoint} disabled={busy} /></div>
      </div>
      <RoutePointPicker from={fromPoint} to={toPoint} onFrom={setFromPoint} onTo={setToPoint} disabled={busy} />
      <Button type="submit" disabled={busy}>మార్గం భద్రపరచండి · Save route</Button>
    </form>
    {isError && <p role="alert">మార్గాలు రాలేదు · Could not load routes</p>}
    {routes.map(route => <div key={route.id} className="flex items-center justify-between gap-2 border-b py-2"><p className="min-w-0 break-words">{route.from_place} → {route.to_place}</p><Button variant="ghost" size="icon" aria-label={`మార్గం తొలగించండి · Delete route: ${route.from_place} → ${route.to_place}`} disabled={busy} onClick={async () => { setBusy(true); const result = await supabase.from('vehicle_route_preferences').delete().eq('id', route.id).eq('user_id', me.id); setBusy(false); if (result.error) toast.error('తొలగించలేకపోయాం · Could not delete'); else await qc.invalidateQueries({ queryKey: ['saved-vehicle-routes', me.id] }); }}><Trash2 /></Button></div>)}
  </section>;
}