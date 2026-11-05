import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SavedVehicleRoutes() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
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
    <p className="text-sm text-muted-foreground">మీకు మాత్రమే కనిపిస్తాయి. పరిధి సూచనలు ఇంకా ప్రారంభం కాలేదు. · Private routes; radius alerts are not active yet.</p>
    <form className="space-y-3" onSubmit={async event => {
      event.preventDefault(); if (busy) return;
      setBusy(true);
      const result = await supabase.rpc('save_vehicle_route', { _from: from.trim(), _to: to.trim() });
      setBusy(false);
      if (result.error) { toast.error('మార్గం భద్రపడలేదు · Could not save route'); return; }
      setFrom(''); setTo(''); await qc.invalidateQueries({ queryKey: ['saved-vehicle-routes', me.id] });
      toast.success('మార్గం భద్రపరిచాం · Route saved');
    }}>
      <div className="grid grid-cols-2 gap-2">
        <label className="min-w-0 text-sm" htmlFor="saved-route-from">నుండి · From<Input id="saved-route-from" value={from} onChange={e => setFrom(e.target.value)} required maxLength={120} disabled={busy} /></label>
        <label className="min-w-0 text-sm" htmlFor="saved-route-to">వరకు · To<Input id="saved-route-to" value={to} onChange={e => setTo(e.target.value)} required maxLength={120} disabled={busy} /></label>
      </div>
      <Button type="submit" disabled={busy}>మార్గం భద్రపరచండి · Save route</Button>
    </form>
    {isError && <p role="alert">మార్గాలు రాలేదు · Could not load routes</p>}
    {routes.map(route => <div key={route.id} className="flex items-center justify-between gap-2 border-b py-2"><p className="min-w-0 break-words">{route.from_place} → {route.to_place}</p><Button variant="ghost" size="icon" aria-label={`మార్గం తొలగించండి · Delete route: ${route.from_place} → ${route.to_place}`} disabled={busy} onClick={async () => { setBusy(true); const result = await supabase.from('vehicle_route_preferences').delete().eq('id', route.id).eq('user_id', me.id); setBusy(false); if (result.error) toast.error('తొలగించలేకపోయాం · Could not delete'); else await qc.invalidateQueries({ queryKey: ['saved-vehicle-routes', me.id] }); }}><Trash2 /></Button></div>)}
  </section>;
}