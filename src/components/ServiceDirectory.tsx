import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { filterServiceListings, type ServiceListing } from '@/lib/service-directory';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useMe } from '@/lib/session';

export function ServiceDirectory() {
  const [town, setTown] = useState('All');
  const [category, setCategory] = useState('All');
  const nav = useNavigate(); const { data: me } = useMe(); const [busy, setBusy] = useState(false);
  const contact = async (owner: string) => {
    if (!me) { void nav({ to: '/auth' }); return; }
    setBusy(true); const result = await supabase.rpc('ring_service', { _owner: owner }); setBusy(false);
    if (result.error) { if (result.error.message.includes('PAID_CHAT_REQUIRED')) { toast.info('గంట, సంభాషణకు చెల్లింపు ఆమోదం అవసరం'); void nav({ to: '/dashboard' }); } else toast.error('సంభాషణ ప్రారంభం కాలేదు'); return; }
    if (result.data) void nav({ to: '/chat/$userId', params: { userId: result.data }, search: { post: undefined } });
  };
  const { data: rows = [], isPending, isError } = useQuery({
    queryKey: ['service-directory'], refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('public_service_directory');
      if (error) throw error;
      return (Array.isArray(data) ? data : []) as ServiceListing[];
    },
  });
  const filtered = filterServiceListings(rows, town, category);
  return <section className="home-market-section" aria-labelledby="service-directory-title">
    <h2 id="service-directory-title" className="home-section-title">సేవలు అందించేవారు · Service providers</h2>
    <div className="grid grid-cols-2 gap-2">
      <div><Label htmlFor="service-town-filter">ఊరు · Town</Label><Input id="service-town-filter" value={town} onChange={event => setTown(event.target.value)} placeholder="అన్నీ · All" /></div>
      <div><Label htmlFor="service-category-filter">వర్గం · Category</Label><Input id="service-category-filter" className="min-w-0" value={category === 'All' ? '' : category} list="service-categories" placeholder="మీ కేటగిరి యాడ్ చేసుకోండి" onChange={event => setCategory(event.target.value || 'All')} /><datalist id="service-categories">{['Electrician','Plumber','Technician','Driver','Carpenter','Welder','Painter','Mechanic','Mason','Tailor',...rows.map(row => row.category || row.service)].filter((v,i,a) => v && a.indexOf(v) === i).map(value => <option key={value} value={value} />)}</datalist></div>
    </div>
    <p className="text-sm">వ్యక్తిగత వివరాలు దాచబడతాయి; గంట, చాట్‌కు ఆమోదించిన సభ్యత్వం అవసరం.</p>
    {isPending ? <p role="status">సేవల వివరాలు వస్తున్నాయి · Loading services</p> : isError ? <p role="alert">సేవల వివరాలు రాలేదు · Could not load services</p> : filtered.length === 0 ? <p className="py-4">ఈ ఎంపికకు సేవల నమోదు ఇంకా లేదు · No published services for this selection</p> : <ul className="divide-y">{filtered.map(row => <li key={row.user_id} className="flex items-center justify-between gap-3 py-4"><div className="min-w-0 break-words"><p className="font-bold">{row.service}</p><p>{row.town || 'ఊరు ఇవ్వలేదు · Town not supplied'}</p></div><Button size="icon" variant="outline" aria-label="గంట · Bell" disabled={busy} onClick={() => void contact(row.user_id)}><Bell /></Button></li>)}</ul>}
  </section>;
}