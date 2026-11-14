import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { IndiaPlaceInput } from '@/components/IndiaPlaceInput';
import { BellPaymentNotice } from '@/components/BellPaymentNotice';
import { useMe } from '@/lib/session';
import { SERVICE_CATEGORIES, serviceLabel } from '@/lib/service-categories';
import { useMasterArea } from '@/lib/master-area';
import { AddCategoryBox, useAddedCategories } from '@/components/AddCategoryBox';
import { categoryNames } from '@/lib/discovery-categories';
import { WorkAreaInput } from '@/components/WorkAreaInput';

export const Route = createFileRoute('/services')({
  validateSearch: (search: Record<string, unknown>): { view: 'providers' | 'requests'; area: string } => ({ view: search['view'] === 'requests' ? 'requests' : 'providers', area: typeof search['area'] === 'string' ? search['area'].slice(0, 80) : '' }),
  head: ({ match }) => {
    const title = match.search.view === 'requests' ? 'సేవల అభ్యర్థనలు — గాయత్రి వన్' : 'సేవలు అందించేవారు — గాయత్రి వన్';
    const description = 'ప్రాంతం వారీగా సేవలు, పేర్లు లేని నిజమైన అభ్యర్థనలు.';
    return { meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] };
  },
  component: () => <AppShell hideTopActions><ServicesPage /></AppShell>,
});

function ServicesPage() {
  const { view, area: initialArea } = Route.useSearch();
  const [area, setArea] = useMasterArea(initialArea);
  const [busy, setBusy] = useState(false);
  const section = view === 'providers' ? 'service-providers' : 'service-wanted';
  const { data: categories = [] } = useAddedCategories(section);
  const names = categoryNames(SERVICE_CATEGORIES.map(category => category.key), categories);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const { data: me } = useMe();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: requests = [], isPending, isError } = useQuery({
    queryKey: ['service-requests', area.trim()], enabled: view === 'requests' && !!area.trim(), refetchInterval: 10000,
    queryFn: async () => { const result = await supabase.rpc('public_service_requests', { _area: area.trim() }); if (result.error) throw result.error; return result.data; },
  });
  const ring = async (service?: string, request?: string) => {
    if (!me) { setPaymentOpen(true); return; }
    if (!area.trim()) { toast.error('మీ ప్రాంతం పేరు రాయండి'); return; }
    setBusy(true);
    try {
      if (request) {
        const result = await supabase.rpc('respond_service_request', { _request: request });
        if (result.error) throw result.error;
        if (result.data) await nav({ to: '/chat/$userId', params: { userId: result.data }, search: { post: undefined } });
      } else if (service) {
        const result = await supabase.rpc('request_service', { _service: service, _area: area.trim() });
        if (result.error) throw result.error;
        await qc.invalidateQueries({ queryKey: ['service-requests'] });
      }
    } catch (error) { if (error && typeof error === 'object' && 'message' in error && String(error.message).includes('PAID_BELL_REQUIRED')) setPaymentOpen(true); else toast.error('సంభాషణ ప్రారంభం కాలేదు'); }
    finally { setBusy(false); }
  };
  return <section className="space-y-4 py-3">
    <h1 className="text-2xl font-bold">{view === 'providers' ? 'నేను సర్వీస్ ప్రొవైడర్ ను' : 'నీడ్ సర్వీస్ ప్రొవైడర్స్'}</h1>
    <WorkAreaInput id="service-page-area" value={area} onChange={setArea} />
    {view === 'providers' ? <>
      <div className="divide-y divide-border">{names.map(name => <div key={name} className="flex min-h-16 items-center justify-between gap-3 py-3"><span className="text-lg font-bold" translate="no">{serviceLabel(name)}</span><Button variant="outline" size="icon" aria-label="గంట" disabled={busy} onClick={() => void ring(name)}><Bell /></Button></div>)}</div>
      
    </> : <div className="divide-y divide-border">
      <div className="divide-y divide-border">{names.map(name => <div key={name} className="flex min-h-16 items-center justify-between gap-3 py-3"><span className="text-lg font-bold" translate="no">{serviceLabel(name)}</span><Button variant="outline" size="icon" aria-label="గంట" disabled={busy} onClick={() => void ring(name)}><Bell /></Button></div>)}</div>
      {area.trim() && (isPending ? <p role="status">వస్తున్నాయి</p> : isError ? <p role="alert">వివరాలు రాలేదు</p> : requests.length === 0 ? <p>ఈ ప్రాంతంలో ఇంకా అభ్యర్థనలు లేవు</p> : requests.map(request => <article key={request.id} className="flex min-h-16 items-center justify-between gap-3 py-3"><div className="min-w-0"><h2 className="text-lg font-bold">{serviceLabel(request.service)}</h2><p translate="no">{request.area}</p></div><div className="flex shrink-0 gap-2"><Button variant="outline" size="icon" aria-label="గంట" disabled={busy} onClick={() => void ring(undefined, request.id)}><Bell /></Button><Button variant="outline" size="icon" aria-label="చాట్" disabled={busy} onClick={() => void ring(undefined, request.id)}><MessageCircle /></Button></div></article>))}
    </div>}
    <AddCategoryBox label="కేటగిరి చేర్చండి" section={section} />
    <BellPaymentNotice open={paymentOpen} onOpenChange={setPaymentOpen} />
  </section>;
}